import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import type { Address } from '@/lib/types'
import { revalidateTag, unstable_cache } from 'next/cache'

type SupabaseErrorLike = {
  message?: string
  details?: string
  hint?: string
  code?: string
}

function errInfo(err: unknown): SupabaseErrorLike {
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>
    return {
      message: typeof obj.message === 'string' ? obj.message : undefined,
      details: typeof obj.details === 'string' ? obj.details : undefined,
      hint: typeof obj.hint === 'string' ? obj.hint : undefined,
      code: typeof obj.code === 'string' ? obj.code : undefined,
    }
  }
  return { message: String(err) }
}

// Server-side Supabase client using service role (RLS bypass is acceptable here as we enforce Clerk auth and explicit filters)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

type OrderItemInput = {
  product_id?: string
  productId?: string
  quantity: number
  price: number
}

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
    
    // Optional structured delivery fields from checkout for syncing user profile
    const contact_phone: string | undefined = body?.contact_phone
    const address_line_1_input: string | undefined = typeof body?.address_line_1 === 'string' ? body.address_line_1.trim() : undefined
    const city_input: string | undefined = typeof body?.city === 'string' ? body.city.trim() : undefined
    const email_input: string | undefined = typeof body?.email === 'string' ? body.email.trim() : undefined
    const place_input: string | undefined = typeof body?.place === 'string' ? body.place.trim() : undefined
    const first_name_input: string | undefined = typeof body?.first_name === 'string' ? body.first_name.trim() : undefined
    const last_name_input: string | undefined = typeof body?.last_name === 'string' ? body.last_name.trim() : undefined
    const country_input: string | undefined = typeof body?.country === 'string' ? body.country.trim() : undefined
    const address_line_1_value = address_line_1_input || place_input

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    // Determine shipping address: accept provided string, or compose from structured inputs, otherwise fallback to default address
    let shippingAddressStr: string | null = shipping_address ?? null
    if (!shippingAddressStr && (address_line_1_value || city_input)) {
      const parts = [address_line_1_value, city_input].filter(Boolean) as string[]
      shippingAddressStr = parts.join(', ')
    }
    if (!shippingAddressStr) {
      // Try to fetch user's default shipping address
      const { data: addresses, error: addrErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'shipping')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (!addrErr && Array.isArray(addresses) && addresses.length) {
        const a = addresses[0] as Partial<Address>
        const parts = [
          a.address_line_1,
          a.address_line_2,
          a.city,
          a.state,
          a.postal_code,
          a.country,
        ].filter(Boolean)
        shippingAddressStr = parts.join(', ')
      } else if (addrErr) {
        console.error('Fetch default address error:', errInfo(addrErr))
      }
    }

    if (!shippingAddressStr) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }

    // Calculate total amount using current product prices from DB and validate stock/availability
    const typedItems: OrderItemInput[] = items
    const allHaveIds = typedItems.every(i => Boolean(i.product_id || i.productId))
    if (!allHaveIds) {
      return NextResponse.json({ error: 'Invalid order items' }, { status: 400 })
    }
    const productIds = Array.from(new Set(
      typedItems.map(i => (i.product_id ?? i.productId) as string)
    ))
      .filter(Boolean)

    const { data: productsData, error: productsErr } = await supabase
      .from('products')
      .select('id, price, stock_quantity')
      .in('id', productIds)

    if (productsErr) {
      return NextResponse.json({ error: productsErr.message }, { status: 500 })
    }

    type ProductRow = { id: string; price: number; stock_quantity: number | null }
    const productsDataTyped = (productsData || []) as ProductRow[]
    const productMap = new Map<string, { id: string; price: number; stock_quantity?: number | null }>()
    for (const p of productsDataTyped) {
      productMap.set(p.id, {
        id: p.id,
        price: Number(p.price) || 0,
        stock_quantity: p.stock_quantity ?? null,
      })
    }

    // Validate each item, compute server-side totals, and prepare order_items payload with server price
    const validatedItems = [] as Array<{ order_id?: string; product_id: string; quantity: number; price: number }>
    let total_amount = 0
    for (const it of typedItems) {
      const pid = (it.product_id ?? it.productId) as string
      const prod = productMap.get(pid)
      if (!prod) {
        return NextResponse.json({ error: 'One or more products not found' }, { status: 409 })
      }
      // Note: is_active column doesn't exist in current schema, so we skip this validation
      if (typeof prod.stock_quantity === 'number' && prod.stock_quantity < it.quantity) {
        return NextResponse.json({ error: 'Insufficient stock for one or more items' }, { status: 409 })
      }
      const serverPrice = prod.price
      total_amount += serverPrice * it.quantity
      validatedItems.push({ product_id: pid, quantity: it.quantity, price: serverPrice })
    }

    // Ensure user exists in users table (FK safety) and sync address fields for admin visibility
    const clerkEmail = user.emailAddresses?.[0]?.emailAddress || undefined
    const emailValue = clerkEmail || email_input
    
    console.log('DEBUG - User sync data:', {
      user_id: user.id,
      email: emailValue,
      first_name: user.firstName ?? first_name_input ?? null,
      last_name: user.lastName ?? last_name_input ?? null,
      phone: contact_phone ?? user.phoneNumbers?.[0]?.phoneNumber ?? null,
      address_line_1: address_line_1_value ?? null,
      city: city_input ?? null,
      country: country_input ?? null,
    })
    
    if (emailValue) {
      const { error: userUpsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: emailValue,
          first_name: user.firstName ?? first_name_input ?? null,
          last_name: user.lastName ?? last_name_input ?? null,
          phone: contact_phone ?? user.phoneNumbers?.[0]?.phoneNumber ?? null,
          avatar_url: user.imageUrl ?? null,
          // Sync address fields for admin visibility
          address_line_1: address_line_1_value ?? null,
          city: city_input ?? null,
          country: country_input ?? null,
        }, { onConflict: 'id' })
      
      if (userUpsertError) {
        console.error('User upsert error:', errInfo(userUpsertError))
      } else {
        console.log('User upserted successfully')
      }
    } else {
      console.warn('Skipping users upsert: missing email from Clerk and request body')
    }

    // Sync user's default shipping address for admin visibility
    if (address_line_1_value || city_input || contact_phone) {
      const { data: found, error: findErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'shipping')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (findErr) {
        console.error('Find default address error:', errInfo(findErr))
      }

      const existing = Array.isArray(found) && found.length ? found[0] : null
      if (existing) {
        const addrUpdates: Partial<Address> = {}
        if (address_line_1_value) addrUpdates.address_line_1 = address_line_1_value
        if (city_input) addrUpdates.city = city_input
        if (contact_phone) addrUpdates.phone = contact_phone
        if (first_name_input) addrUpdates.first_name = first_name_input
        if (last_name_input) addrUpdates.last_name = last_name_input
        if (country_input) addrUpdates.country = country_input
        const { error: updErr } = await supabase
          .from('addresses')
          .update(addrUpdates)
          .eq('id', existing.id)
        if (updErr) console.error('Update default address error:', errInfo(updErr))
      } else {
        // Only insert a new default address if both address_line_1 and city are provided
        const canInsertDefaultAddress = Boolean(address_line_1_value && city_input)
        if (!canInsertDefaultAddress) {
          console.warn('Skipping insert of default shipping address: missing address_line_1 or city')
        } else {
          const insertPayload: Partial<Address> & { user_id: string; type: 'shipping' | 'billing'; is_default: boolean } = {
            user_id: user.id,
            type: 'shipping',
            is_default: true,
            address_line_1: address_line_1_value!,
            city: city_input!,
            phone: contact_phone ?? undefined,
            ...(first_name_input ? { first_name: first_name_input } : {}),
            ...(last_name_input ? { last_name: last_name_input } : {}),
            ...(country_input ? { country: country_input } : {}),
          }
          const { error: insErr } = await supabase
            .from('addresses')
            .insert(insertPayload)
          if (insErr) console.error('Insert default address error:', errInfo(insErr))
        }
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount,
        currency,
        payment_method,
        shipping_address: shippingAddressStr,
        notes,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Create order items with server-verified prices
    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback order if order items creation fails
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Inventory policy: do not decrement stock at order creation.
    // Stock will be decremented when the order is marked as 'delivered'.

    // Invalidate caches for this user's orders and this order
    try {
      revalidateTag('orders')
      revalidateTag(`user-orders:${user.id}`)
      revalidateTag(`order:${order.id}`)
    } catch (e) {
      console.warn('Revalidation error (non-fatal):', e)
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

export async function GET(req: Request) {
  try {
    const user = await currentUser()
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
            products(id, name, price, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ orders: data || [] }, { status: 200 })
    }

    // Cached mode (tagged for webhook/admin revalidation)
    const getUserOrdersCached = unstable_cache(
      async (uid: string) => {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(
              *,
              products(id, name, price, image_url)
            )
          `)
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
        if (error) throw new Error(error.message)
        return data || []
      },
      ['orders-by-user', user.id],
      { tags: ['orders', `user-orders:${user.id}`] }
    )

    const data = await getUserOrdersCached(user.id)

    return NextResponse.json({ orders: data }, { status: 200 })

  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
