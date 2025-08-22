import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(
          id,
          name,
          price,
          image_url,
          stock_quantity,
          product_images(url, is_main, sort_order)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: cartItems || [] }, { status: 200 })
  } catch (error: unknown) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { product_id, quantity } = await req.json()

    if (!product_id || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid product or quantity' }, { status: 400 })
    }

    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock_quantity, price')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.stock_quantity < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity
      
      if (newQuantity > product.stock_quantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity
        })
        .eq('id', existingItem.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ item: updatedItem }, { status: 200 })
    } else {
      // Create new cart item
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id,
          quantity
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ item: newItem }, { status: 201 })
    }
  } catch (error: unknown) {
    console.error('Cart add error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Cart cleared' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Cart clear error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
