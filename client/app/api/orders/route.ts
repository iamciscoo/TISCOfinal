/**
 * Orders API Route
 * 
 * Handles order creation and retrieval with comprehensive business logic including:
 * - User authentication and profile synchronization
 * - Product validation and stock checking
 * - Address management and shipping address resolution
 * - Order confirmation email notifications
 * - Cart cleanup and cache invalidation
 * - Optimized queries with caching strategies
 * 
 * Security Features:
 * - User authentication required for all operations
 * - Server-side price validation to prevent tampering
 * - Stock quantity validation before order creation
 * - Transactional order creation with rollback on failures
 */

import { NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import type { Address } from '@/lib/types'
import { revalidateTag, unstable_cache } from 'next/cache'

// Use Node.js runtime for access to secure environment variables and notification services
export const runtime = 'nodejs'

/**
 * Type definition for Supabase error information extraction
 * Provides structured error handling for database operations
 */
type SupabaseErrorLike = {
  message?: string   // Error message
  details?: string   // Detailed error information
  hint?: string     // Suggested resolution hint
  code?: string     // Error code identifier
}

/**
 * Extract structured error information from unknown error objects
 * 
 * Safely extracts error details from Supabase errors or other exceptions
 * to provide consistent error reporting throughout the application.
 * 
 * @param err - Unknown error object to extract information from
 * @returns SupabaseErrorLike - Structured error information
 */
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

/**
 * Server-side Supabase client with service role permissions
 * 
 * Uses service role to bypass RLS policies for server operations.
 * This is secure because we enforce authentication checks and explicit
 * user ID filters in all database queries.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,   // Public Supabase URL
  process.env.SUPABASE_SERVICE_ROLE!       // Service role key for elevated permissions
)

/**
 * Type definition for order item input from client requests
 * 
 * Supports both product_id and productId for backward compatibility
 * with different client implementations.
 */
type OrderItemInput = {
  product_id?: string   // Product ID (preferred field name)
  productId?: string    // Alternative product ID field name
  quantity: number      // Quantity of product ordered
  price: number         // Client-provided price (will be validated server-side)
}

/**
 * POST /api/orders - Create New Order
 * 
 * Creates a new order with comprehensive validation, user synchronization,
 * and notification handling. This endpoint handles the complete order creation
 * workflow from authentication to confirmation email.
 * 
 * Request Body:
 * {
 *   items: OrderItemInput[],           // Array of products and quantities
 *   shipping_address?: string,         // Shipping address (optional if structured fields provided)
 *   payment_method: string,            // Payment method identifier
 *   currency?: string,                 // Currency code (default: 'TZS')
 *   notes?: string,                    // Order notes/special instructions
 *   // Optional structured delivery fields for profile sync:
 *   contact_phone?: string,
 *   address_line_1?: string,
 *   city?: string,
 *   email?: string,
 *   place?: string,
 *   first_name?: string,
 *   last_name?: string,
 *   country?: string
 * }
 * 
 * Response:
 * - 201: Order created successfully with order details
 * - 400: Invalid request data or missing required fields
 * - 401: User not authenticated
 * - 409: Product not found or insufficient stock
 * - 500: Server error during order creation
 */
export async function POST(req: Request) {
  console.log('=== ORDER CREATION START ===')
  try {
    // Authenticate user - all order operations require authentication
    const user = await getUser()
    console.log('User authentication result:', user ? `User ID: ${user.id}` : 'No user found')
    if (!user) {
      console.log('Order creation failed: Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const {
      items,                      // Array of order items with product IDs and quantities
      shipping_address,           // Complete shipping address string (optional)
      payment_method,             // Payment method identifier
      currency = 'TZS',          // Currency code (default: Tanzanian Shilling)
      notes                       // Optional order notes or special instructions
    } = body
    
    /**
     * Extract optional structured delivery fields from checkout form
     * These fields are used for user profile synchronization and address management
     */
    const contact_phone: string | undefined = body?.contact_phone
    const address_line_1_input: string | undefined = typeof body?.address_line_1 === 'string' ? body.address_line_1.trim() : undefined
    const city_input: string | undefined = typeof body?.city === 'string' ? body.city.trim() : undefined
    const email_input: string | undefined = typeof body?.email === 'string' ? body.email.trim() : undefined
    const place_input: string | undefined = typeof body?.place === 'string' ? body.place.trim() : undefined
    const first_name_input: string | undefined = typeof body?.first_name === 'string' ? body.first_name.trim() : undefined
    const last_name_input: string | undefined = typeof body?.last_name === 'string' ? body.last_name.trim() : undefined
    const country_input: string | undefined = typeof body?.country === 'string' ? body.country.trim() : undefined
    
    // Use address_line_1 or fall back to place field for address composition
    const address_line_1_value = address_line_1_input || place_input

    console.log('Order request body:', { 
      items: items?.length, 
      payment_method, 
      currency, 
      shipping_address,
      user_id: user.id 
    })
    
    // Validate that order contains at least one item
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Order creation failed: No items provided')
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
      .select('id, name, price, stock_quantity')
      .in('id', productIds)

    if (productsErr) {
      return NextResponse.json({ error: productsErr.message }, { status: 500 })
    }

    type ProductRow = { id: string; name: string; price: number; stock_quantity: number | null }
    const productsDataTyped = (productsData || []) as ProductRow[]
    const productMap = new Map<string, { id: string; name: string; price: number; stock_quantity?: number | null }>()
    for (const p of productsDataTyped) {
      productMap.set(p.id, {
        id: p.id,
        name: p.name,
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

    // Get user profile from our database for proper user data
    const userProfile = await getUserProfile(user.id)
    const emailValue = userProfile?.email || user.email || email_input
    
    console.log('DEBUG - User sync data:', {
      user_id: user.id,
      email: emailValue,
      first_name: userProfile?.first_name ?? first_name_input ?? null,
      last_name: userProfile?.last_name ?? last_name_input ?? null,
      phone: contact_phone ?? userProfile?.phone ?? null,
      address_line_1: address_line_1_value ?? null,
      city: city_input ?? null,
      country: country_input ?? null,
    })
    
    if (emailValue) {
      const { error: userUpsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          auth_user_id: user.id,
          email: emailValue,
          first_name: userProfile?.first_name ?? first_name_input ?? null,
          last_name: userProfile?.last_name ?? last_name_input ?? null,
          phone: contact_phone ?? userProfile?.phone ?? null,
          avatar_url: userProfile?.avatar_url ?? null,
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
      console.warn('Skipping users upsert: missing email from user and request body')
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
    console.log('Creating order with data:', {
      user_id: user.id,
      total_amount,
      currency,
      payment_method,
      shipping_address: shippingAddressStr,
      items_count: validatedItems.length
    })
    
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
      console.error('Order creation failed:', errInfo(orderError))
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }
    
    console.log('Order created successfully:', order.id)

    // Create order items with server-verified prices
    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }))

    console.log('Creating order items:', orderItems.length)
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation failed:', errInfo(itemsError))
      // Rollback order if order items creation fails
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
    
    console.log('Order items created successfully')

    // Clear user's cart in the database to keep client and server in sync
    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
    } catch (e) {
      console.warn('Non-fatal: failed to clear user cart after order creation', errInfo(e))
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

    // Return the created order with items
    const orderWithItems = {
      ...order,
      order_items: orderItems.map((item, index) => ({
        ...item,
        product: validatedItems[index]
      }))
    }

    // Send order confirmation notification
    try {
      const customerName = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : first_name_input && last_name_input ? `${first_name_input} ${last_name_input}` : 'Customer'

      console.log('=== SENDING ORDER CONFIRMATION EMAIL ===')
      console.log('Customer email:', emailValue)
      console.log('Customer name:', customerName)
      console.log('Order ID:', order.id)

      // Import notification service directly to avoid external HTTP dependency
      const { notifyOrderCreated } = await import('@/lib/notifications/service')
      await notifyOrderCreated({
        order_id: order.id,
        customer_email: emailValue!,
        customer_name: customerName || 'Customer',
        total_amount: total_amount.toString(),
        currency,
        items: validatedItems.map(item => {
          const product = productMap.get(item.product_id)
          return {
            name: product?.name || `Product ${item.product_id}`,
            quantity: item.quantity,
            price: item.price.toString()
          }
        }),
        order_date: new Date().toLocaleDateString(),
        payment_method,
        shipping_address: shippingAddressStr
      })
      console.log('✅ Order confirmation email sent successfully')

      // Send admin notification for all orders (including "Pay at Office")
      // This ensures office payments get admin notifications just like mobile payments do via webhooks
      console.log('=== SENDING ADMIN ORDER NOTIFICATION ===')
      try {
        const { notifyAdminOrderCreated } = await import('@/lib/notifications/service')
        await notifyAdminOrderCreated({
          order_id: order.id,
          customer_email: emailValue!,
          customer_name: customerName || 'Customer',
          total_amount: total_amount.toString(),
          currency,
          payment_method,
          payment_status: payment_method === 'Mobile Money' ? 'paid' : 'pending',
          items_count: validatedItems.length,
          items: validatedItems.map(item => {
            const product = productMap.get(item.product_id)
            return {
              product_id: item.product_id,
              name: product?.name || `Product ${item.product_id}`,
              quantity: item.quantity,
              price: item.price.toString()
            }
          })
        })
        console.log('✅ Admin order notification sent successfully')
      } catch (adminEmailError) {
        console.error('❌ Failed to send admin order notification:', adminEmailError)
        // Continue without failing the order creation
      }
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation email:', emailError)
      // Don't fail the order creation if email fails
    }
    console.log('=== ORDER CREATION SUCCESS ===', order.id)
    return NextResponse.json({ order: orderWithItems }, { status: 201 })
  } catch (error: unknown) {
    console.error('=== ORDER CREATION ERROR ===', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  console.log('=== GET /api/orders START ===')
  try {
    console.log('Getting user...')
    const user = await getUser()
    console.log('User result:', user ? `User ID: ${user.id}` : 'No user found')
    if (!user) {
      console.log('No user, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fresh/no-cache mode when requested
    const url = new URL(req.url)
    const fresh = url.searchParams.get('fresh') === '1'
      || /no-store|no-cache/i.test(req.headers.get('cache-control') || '')
      || req.headers.get('x-no-cache') === '1'

    if (fresh) {
      console.log('Fresh mode - fetching orders directly from DB for user:', user.id)
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
      
      console.log('Orders query result:', { data: data?.length || 0, error: error?.message })
      if (error) {
        console.error('Orders fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      console.log('Returning fresh orders:', data?.length || 0)
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
    console.error('=== GET /api/orders ERROR ===', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
