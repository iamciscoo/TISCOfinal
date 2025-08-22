import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all cart items with product data
    const { data: cartItems, error: fetchError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(
          id,
          name,
          price,
          stock_quantity,
          is_active
        )
      `)
      .eq('user_id', user.id)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const validationResults = []
    const updates = []
    let hasChanges = false

    for (const item of cartItems) {
      const validation = {
        cart_item_id: item.id,
        product_id: item.product_id,
        original_quantity: item.quantity,
        original_price: item.products?.price,
        issues: [] as string[]
      }

      // Check if product still exists and is active
      if (!item.products || !item.products.is_active) {
        validation.issues.push('Product no longer available')
        // Mark for deletion
        updates.push({
          action: 'delete',
          cart_item_id: item.id
        })
        hasChanges = true
      } else {
        // Note: We no longer track stored unit prices in cart_items. We only surface current product price.

        // Check stock availability
        if (item.quantity > item.products.stock_quantity) {
          const availableQuantity = Math.max(0, item.products.stock_quantity)
          validation.issues.push(`Insufficient stock. Reduced from ${item.quantity} to ${availableQuantity}`)
          
          if (availableQuantity === 0) {
            updates.push({
              action: 'delete',
              cart_item_id: item.id
            })
          } else {
            updates.push({
              action: 'update_quantity',
              cart_item_id: item.id,
              new_quantity: availableQuantity
            })
          }
          hasChanges = true
        }
      }

      validationResults.push(validation)
    }

    // Apply updates if any
    if (hasChanges) {
      for (const update of updates) {
        if (update.action === 'delete') {
          await supabase
            .from('cart_items')
            .delete()
            .eq('id', update.cart_item_id)
        } else if (update.action === 'update_quantity') {
          await supabase
            .from('cart_items')
            .update({
              quantity: update.new_quantity
            })
            .eq('id', update.cart_item_id)
        }
      }
    }

    return NextResponse.json({
      validation_results: validationResults,
      has_changes: hasChanges,
      updates_applied: updates.length
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Cart validation error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to validate cart' },
      { status: 500 }
    )
  }
}
