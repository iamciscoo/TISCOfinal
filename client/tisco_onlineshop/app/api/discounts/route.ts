import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
    }

    // Check if discount code exists and is valid
    const { data: discount, error: discountError } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (discountError || !discount) {
      return NextResponse.json({ error: 'Invalid or expired discount code' }, { status: 404 })
    }

    // Check if discount is within valid date range
    const now = new Date()
    const startDate = new Date(discount.start_date)
    const endDate = discount.end_date ? new Date(discount.end_date) : null

    if (now < startDate || (endDate && now > endDate)) {
      return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 })
    }

    // Check usage limits
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return NextResponse.json({ error: 'Discount code usage limit exceeded' }, { status: 400 })
    }

    // Check per-user usage limits
    if (discount.per_user_limit) {
      const { count } = await supabase
        .from('discount_usage')
        .select('*', { count: 'exact' })
        .eq('discount_id', discount.id)
        .eq('user_id', user.id)

      if ((count ?? 0) >= discount.per_user_limit) {
        return NextResponse.json({ error: 'You have already used this discount code' }, { status: 400 })
      }
    }

    // Get cart items to calculate discount
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(id, price, categories(id, name))
      `)
      .eq('user_id', user.id)

    if (cartError) {
      return NextResponse.json({ error: cartError.message }, { status: 500 })
    }

    // Calculate discount
    let discountAmount = 0
    let subtotal = 0
    const eligibleItems = []

    for (const item of cartItems) {
      const unitPrice = item.products?.price ?? 0
      const itemTotal = item.quantity * unitPrice
      subtotal += itemTotal

      // Check if item is eligible for discount
      let isEligible = true

      // Check minimum order amount
      if (discount.min_order_amount && subtotal < discount.min_order_amount) {
        isEligible = false
      }

      // Check category restrictions
      if (discount.eligible_categories && discount.eligible_categories.length > 0) {
        const categoryId = item.products?.categories?.id
        if (!categoryId || !discount.eligible_categories.includes(categoryId)) {
          isEligible = false
        }
      }

      // Check product restrictions
      if (discount.eligible_products && discount.eligible_products.length > 0) {
        if (!discount.eligible_products.includes(item.product_id)) {
          isEligible = false
        }
      }

      if (isEligible) {
        eligibleItems.push({
          cart_item_id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          current_unit_price: unitPrice,
          item_total: itemTotal
        })
      }
    }

    // Check minimum order amount after calculating subtotal
    if (discount.min_order_amount && subtotal < discount.min_order_amount) {
      return NextResponse.json({ 
        error: `Minimum order amount of $${discount.min_order_amount} required` 
      }, { status: 400 })
    }

    // Calculate discount amount
    const eligibleTotal = eligibleItems.reduce((sum, item) => sum + item.item_total, 0)

    if (discount.type === 'percentage') {
      discountAmount = (eligibleTotal * discount.value) / 100
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(discount.value, eligibleTotal)
    } else if (discount.type === 'free_shipping') {
      discountAmount = 0 // Handle shipping separately
    }

    // Apply maximum discount limit
    if (discount.max_discount_amount) {
      discountAmount = Math.min(discountAmount, discount.max_discount_amount)
    }

    return NextResponse.json({
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description
      },
      discount_amount: Math.round(discountAmount * 100) / 100,
      eligible_items: eligibleItems,
      subtotal: Math.round(subtotal * 100) / 100,
      free_shipping: discount.type === 'free_shipping'
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Discount validation error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to validate discount' },
      { status: 500 }
    )
  }
}
