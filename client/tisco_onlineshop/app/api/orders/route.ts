import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      items,
      shipping_address,
      payment_method,
      currency = 'TZS',
      notes
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!shipping_address) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }

    // Calculate total amount
    const total_amount = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    )

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount,
        currency,
        payment_method,
        shipping_address,
        notes,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback order if order items creation fails
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Update product stock quantities
    for (const item of items) {
      await supabase.rpc('update_product_stock', {
        product_id: item.product_id,
        quantity_sold: item.quantity
      })
    }

    return NextResponse.json({ 
      order: {
        ...order,
        items: orderItems
      }
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          products(id, name, price, image_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders: data }, { status: 200 })

  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
