import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
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

    const { guest_cart } = await req.json()

    if (!guest_cart || !Array.isArray(guest_cart)) {
      return NextResponse.json({ error: 'Invalid guest cart data' }, { status: 400 })
    }

    const mergeResults = []
    let itemsAdded = 0
    let itemsUpdated = 0
    let itemsSkipped = 0

    // Get existing cart items for user
    const { data: existingItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('user_id', user.id)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const existingProductMap = new Map()
    existingItems?.forEach(item => {
      existingProductMap.set(item.product_id, item.quantity)
    })

    for (const guestItem of guest_cart) {
      const { id: product_id, quantity, price } = guestItem

      if (!product_id || !quantity || quantity < 1) {
        itemsSkipped++
        continue
      }

      // Verify product exists and get current price
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, price, stock_quantity, is_active')
        .eq('id', product_id)
        .single()

      if (productError || !product || !product.is_active) {
        mergeResults.push({
          product_id,
          action: 'skipped',
          reason: 'Product not found or inactive'
        })
        itemsSkipped++
        continue
      }

      // Check stock availability
      const existingQuantity = existingProductMap.get(product_id) || 0
      const totalQuantity = existingQuantity + quantity

      if (totalQuantity > product.stock_quantity) {
        const availableQuantity = Math.max(0, product.stock_quantity - existingQuantity)
        
        if (availableQuantity === 0) {
          mergeResults.push({
            product_id,
            action: 'skipped',
            reason: 'Insufficient stock'
          })
          itemsSkipped++
          continue
        }
        
        // Reduce quantity to available amount
        quantity = availableQuantity
      }

      if (existingQuantity > 0) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: existingQuantity + quantity,
            unit_price: product.price,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('product_id', product_id)

        if (updateError) {
          mergeResults.push({
            product_id,
            action: 'error',
            reason: updateError.message
          })
          continue
        }

        mergeResults.push({
          product_id,
          action: 'updated',
          old_quantity: existingQuantity,
          new_quantity: existingQuantity + quantity
        })
        itemsUpdated++
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id,
            quantity,
            unit_price: product.price
          })

        if (insertError) {
          mergeResults.push({
            product_id,
            action: 'error',
            reason: insertError.message
          })
          continue
        }

        mergeResults.push({
          product_id,
          action: 'added',
          quantity
        })
        itemsAdded++
      }
    }

    // Log cart conversion for analytics
    await supabase
      .from('cart_conversions')
      .insert({
        user_id: user.id,
        guest_items_count: guest_cart.length,
        items_added: itemsAdded,
        items_updated: itemsUpdated,
        items_skipped: itemsSkipped,
        conversion_date: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      summary: {
        items_added: itemsAdded,
        items_updated: itemsUpdated,
        items_skipped: itemsSkipped,
        total_processed: guest_cart.length
      },
      details: mergeResults
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Guest cart conversion error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to convert guest cart' },
      { status: 500 }
    )
  }
}

// Get abandoned carts for recovery
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get cart items that haven't been converted to orders
    const { data: abandonedItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(id, name, price, image_url, product_images(url, is_main))
      `)
      .eq('user_id', user.id)
      .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours ago

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      abandoned_items: abandonedItems || [],
      count: abandonedItems?.length || 0
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Abandoned cart fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch abandoned cart' },
      { status: 500 }
    )
  }
}
