import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!,
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

    // Compute distinct carts (users) with last activity in chunks
    const chunkSize = 500
    let position = 0
    const userActivity = new Map<string, { user_id: string; last_updated: string; created_at: string }>()
    while (true) {
      let base = supabase
        .from('cart_items')
        .select('user_id, created_at')
        .order('created_at', { ascending: false })
        .range(position, position + chunkSize - 1)
      if (userId) base = base.eq('user_id', userId)
      const { data, error } = await base
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data || data.length === 0) break
      for (const row of data as Array<{ user_id: string; created_at: string }>) {
        const uid = row.user_id
        if (!uid) continue
        const last = row.created_at
        const existing = userActivity.get(uid)
        if (!existing) {
          userActivity.set(uid, { user_id: uid, last_updated: last, created_at: row.created_at })
        } else {
          if (new Date(last) > new Date(existing.last_updated)) {
            existing.last_updated = last
          }
        }
      }
      position += data.length
      if (data.length < chunkSize) break
    }

    // Apply status filter at the user level - 7 days for abandoned carts
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    let groups = Array.from(userActivity.values())
    if (status === 'abandoned') {
      groups = groups.filter(g => new Date(g.last_updated) < cutoff)
    } else if (status === 'active') {
      groups = groups.filter(g => new Date(g.last_updated) >= cutoff)
    }
    // Sort by last activity desc
    groups.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())

    const totalDistinct = groups.length
    const pageGroups = groups.slice(offset, offset + limit)
    const pageUserIds = pageGroups.map(g => g.user_id)

    if (pageUserIds.length === 0) {
      return NextResponse.json({
        carts: [],
        pagination: {
          page,
          limit,
          total: totalDistinct,
          pages: Math.max(1, Math.ceil(totalDistinct / limit))
        }
      }, { status: 200 })
    }

    // Fetch all items for the paginated users
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(id, name, price, image_url)
      `)
      .in('user_id', pageUserIds)
      .order('created_at', { ascending: false })

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Fetch user profiles for the paginated users
    let userMap = new Map<string, { id: string; first_name: string | null; last_name: string | null; email: string | null }>()
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', pageUserIds)
    if (usersError) {
      console.error('Admin cart fetch: users lookup error:', usersError)
    } else if (usersData) {
      userMap = new Map(usersData.map((u: { id: string; first_name: string | null; last_name: string | null; email: string | null }) => [u.id, u]))
    }

    // Build carts for the paginated users
    const cartsByUser = new Map<string, { user_id: string; user: { id: string; first_name: string | null; last_name: string | null; email: string | null }; items: Array<{ id: string; product: { id: string; name: string; price: number; image_url?: string } | null; quantity: number; unit_price: number; total_price: number; created_at: string; updated_at: string }>; total_items: number; total_value: number; last_updated: string; created_at: string }>()
    const orderIndex = new Map<string, number>()
    pageGroups.forEach((g, idx) => orderIndex.set(g.user_id, idx))

    cartItems?.forEach((item: { id: string; user_id: string; quantity: number; created_at: string; updated_at?: string; products?: { id: string; name: string; price: number; image_url?: string } | null }) => {
      const uid = item.user_id
      if (!cartsByUser.has(uid)) {
        cartsByUser.set(uid, {
          user_id: uid,
          user: userMap.get(uid) || { id: uid, first_name: 'Unknown', last_name: '', email: '' },
          items: [],
          total_items: 0,
          total_value: 0,
          last_updated: item.updated_at || item.created_at,
          created_at: item.created_at
        })
      }
      const cart = cartsByUser.get(uid)
      const unitPrice = item.products?.price ?? 0
      const lastUpdated = item.updated_at || item.created_at
      cart?.items.push({
        id: item.id,
        product: item.products,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: item.quantity * unitPrice,
        created_at: item.created_at,
        updated_at: lastUpdated
      })
      if (cart) {
        cart.total_items += item.quantity
        cart.total_value += item.quantity * unitPrice
        if (new Date(lastUpdated) > new Date(cart.last_updated)) {
          cart.last_updated = lastUpdated
        }
      }
    })

    const carts = Array.from(cartsByUser.values())
    // Ensure the carts are ordered by the computed order
    carts.sort((a, b) => (orderIndex.get(a.user_id) ?? 0) - (orderIndex.get(b.user_id) ?? 0))

    return NextResponse.json({
      carts,
      pagination: {
        page,
        limit,
        total: totalDistinct,
        pages: Math.max(1, Math.ceil(totalDistinct / limit))
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
