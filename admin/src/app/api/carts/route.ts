import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // active, abandoned, all
    const userId = searchParams.get('user_id')
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('cart_items')
      .select(`
        *,
        products(id, name, price, image_url),
        users(id, first_name, last_name, email)
      `, { count: 'exact' })

    // Filter by user if specified
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Filter by status (use created_at for compatibility when updated_at may not exist)
    if (status === 'abandoned') {
      const abandonedCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      query = query.lt('created_at', abandonedCutoff)
    } else if (status === 'active') {
      const activeCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', activeCutoff)
    }

    const { data: cartItems, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group cart items by user
    const cartsByUser = new Map()
    
    cartItems?.forEach(item => {
      const userId = item.user_id
      if (!cartsByUser.has(userId)) {
        cartsByUser.set(userId, {
          user_id: userId,
          user: item.users,
          items: [],
          total_items: 0,
          total_value: 0,
          last_updated: item.updated_at || item.created_at,
          created_at: item.created_at
        })
      }
      
      const cart = cartsByUser.get(userId)
      const unitPrice = item.unit_price ?? item.products?.price ?? 0
      const lastUpdated = item.updated_at || item.created_at
      cart.items.push({
        id: item.id,
        product: item.products,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: item.quantity * unitPrice,
        created_at: item.created_at,
        updated_at: lastUpdated
      })
      
      cart.total_items += item.quantity
      cart.total_value += item.quantity * unitPrice
      
      // Update last_updated to most recent item update
      if (new Date(lastUpdated) > new Date(cart.last_updated)) {
        cart.last_updated = lastUpdated
      }
    })

    const carts = Array.from(cartsByUser.values())

    return NextResponse.json({
      carts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Admin cart fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch carts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, user_id, cart_item_ids } = await req.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    switch (action) {
      case 'clear_cart':
        if (!user_id) {
          return NextResponse.json({ error: 'User ID required for clear_cart' }, { status: 400 })
        }

        const { error: clearError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user_id)

        if (clearError) {
          return NextResponse.json({ error: clearError.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Cart cleared successfully' }, { status: 200 })

      case 'remove_items':
        if (!cart_item_ids || !Array.isArray(cart_item_ids)) {
          return NextResponse.json({ error: 'Cart item IDs required for remove_items' }, { status: 400 })
        }

        const { error: removeError } = await supabase
          .from('cart_items')
          .delete()
          .in('id', cart_item_ids)

        if (removeError) {
          return NextResponse.json({ error: removeError.message }, { status: 500 })
        }

        return NextResponse.json({ message: `Removed ${cart_item_ids.length} items` }, { status: 200 })

      case 'send_abandonment_email':
        if (!user_id) {
          return NextResponse.json({ error: 'User ID required for send_abandonment_email' }, { status: 400 })
        }

        // TODO: Implement email service integration
        // For now, just log the action
        await supabase
          .from('cart_abandonment_emails')
          .insert({
            user_id,
            sent_at: new Date().toISOString(),
            email_type: 'abandonment_reminder'
          })

        return NextResponse.json({ message: 'Abandonment email queued' }, { status: 200 })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

  } catch (error: unknown) {
    console.error('Admin cart action error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to perform cart action' },
      { status: 500 }
    )
  }
}
