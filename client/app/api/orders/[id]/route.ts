import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { revalidateTag, unstable_cache } from 'next/cache'

export const runtime = 'nodejs'

// Server-side Supabase client using service role (same as main orders route)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const resolvedParams = await params
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fresh/no-cache mode when requested
    const url = new URL(req.url)
    const fresh = url.searchParams.get('fresh') === '1'
      || /no-store|no-cache/i.test(req.headers.get('cache-control') || '')
      || req.headers.get('x-no-cache') === '1'

    if (fresh) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(id, name, price, image_url, product_images(*))
          )
        `)
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data || data.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      return NextResponse.json({ order: data[0] }, { status: 200 })
    }

    const getOrderCached = unstable_cache(
      async (id: string, uid: string) => {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(
              *,
              products(id, name, price, image_url, product_images(*))
            )
          `)
          .eq('id', id)
          .eq('user_id', uid)

        if (error) throw new Error(error.message)
        if (!data || data.length === 0) return null
        return data[0]
      },
      ['order-by-id', resolvedParams.id, user.id],
      { tags: ['orders', `order:${resolvedParams.id}`, `user-orders:${user.id}`] }
    )

    const order = await getOrderCached(resolvedParams.id, user.id)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    return NextResponse.json({ order }, { status: 200 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const resolvedParams = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}) as Record<string, unknown>)
    const allowedFields = [
      'shipping_address',
      'notes'
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Only allow updates to pending orders
    const { data: existingOrderData } = await supabase
      .from('orders')
      .select('status, user_id')
      .eq('id', resolvedParams.id)
    
    const existingOrder = existingOrderData?.[0]

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (existingOrder.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (existingOrder.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending orders can be modified' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Revalidate caches for this order and user's orders list
    try {
      revalidateTag('orders')
      revalidateTag(`order:${resolvedParams.id}`)
      revalidateTag(`user-orders:${user.id}`)
    } catch (e) {
      console.warn('Revalidation error (non-fatal):', e)
    }

    return NextResponse.json({ order: data?.[0] }, { status: 200 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
