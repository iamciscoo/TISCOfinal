import { NextRequest, NextResponse } from 'next/server'

// Lazy Supabase client creator
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/**
 * Debug endpoint for testing product-specific notifications
 * GET /api/debug/product-notifications
 * 
 * Query parameters:
 * - simulate=order_id  : Simulate notification for existing order
 * - product_ids=id1,id2 : Test with specific product IDs
 */
export async function GET(req: NextRequest) {
  try {
    const sb = await getSupabase()
    if (!sb) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const simulateOrderId = searchParams.get('simulate')
    const testProductIds = searchParams.get('product_ids')?.split(',').map(id => id.trim()).filter(Boolean) || []

    const debug = {
      timestamp: new Date().toISOString(),
      recipients: [],
      products: [],
      orders: [],
      simulation: null as any
    }

    // 1. Fetch all notification recipients
    const { data: recipients, error: recipientsError } = await sb
      .from('notification_recipients')
      .select('*')
      .order('created_at', { ascending: false })

    if (recipientsError) {
      return NextResponse.json({ error: 'Failed to fetch recipients', details: recipientsError }, { status: 500 })
    }

    debug.recipients = recipients || []

    // 2. Fetch sample products
    const { data: products, error: productsError } = await sb
      .from('products')
      .select('id, name, price')
      .limit(20)

    if (!productsError) {
      debug.products = products || []
    }

    // 3. Fetch recent orders
    const { data: orders, error: ordersError } = await sb
      .from('orders')
      .select(`
        id,
        total_amount,
        currency,
        created_at,
        order_items(
          product_id,
          quantity,
          price,
          products(id, name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!ordersError) {
      debug.orders = orders || []
    }

    // 4. Simulation logic
    if (simulateOrderId || testProductIds.length > 0) {
      let simulationProductIds: string[] = []
      let simulationOrder: any = null

      if (simulateOrderId) {
        // Find specific order
        simulationOrder = debug.orders.find(o => o.id === simulateOrderId)
        if (simulationOrder) {
          simulationProductIds = simulationOrder.order_items?.map((item: any) => item.product_id) || []
        }
      } else if (testProductIds.length > 0) {
        // Use provided product IDs
        simulationProductIds = testProductIds
      }

      if (simulationProductIds.length > 0) {
        // Simulate product-specific filtering logic
        const recipientsWithProducts = recipients?.filter(r => 
          r.assigned_product_ids && r.assigned_product_ids.length > 0
        ) || []

        const recipientsWithoutProducts = recipients?.filter(r => 
          !r.assigned_product_ids || r.assigned_product_ids.length === 0
        ) || []

        // Find matching recipients
        const productMatches = recipientsWithProducts.filter(recipient => {
          return simulationProductIds.some(productId => 
            recipient.assigned_product_ids?.includes(productId)
          )
        })

        // Category-based fallback
        const categoryMatches = recipientsWithoutProducts.filter(recipient => {
          const categories = recipient.notification_categories || ['all']
          
          if (categories.includes('all')) return true
          
          const orderCategories = ['order_created', 'orders', 'admin_order_created']
          return categories.some((category: string) => orderCategories.includes(category))
        })

        debug.simulation = {
          test_product_ids: simulationProductIds,
          order_used: simulationOrder?.id || null,
          recipients_with_products: recipientsWithProducts.length,
          recipients_without_products: recipientsWithoutProducts.length,
          product_matches: productMatches.map(r => ({
            email: r.email,
            assigned_products: r.assigned_product_ids,
            matching_products: r.assigned_product_ids?.filter(pid => simulationProductIds.includes(pid)) || []
          })),
          category_matches: categoryMatches.map(r => ({
            email: r.email,
            categories: r.notification_categories || ['all']
          })),
          final_strategy: productMatches.length > 0 ? 'PRODUCT_SPECIFIC' : 'CATEGORY_BASED',
          final_recipients: productMatches.length > 0 ? productMatches.length : categoryMatches.length,
          would_send_to: (productMatches.length > 0 ? productMatches : categoryMatches).map(r => r.email)
        }
      }
    }

    // 5. Analysis
    const analysis = {
      total_recipients: recipients?.length || 0,
      active_recipients: recipients?.filter(r => r.is_active).length || 0,
      recipients_with_product_assignments: recipients?.filter(r => r.assigned_product_ids && r.assigned_product_ids.length > 0).length || 0,
      recipients_with_categories_only: recipients?.filter(r => !r.assigned_product_ids || r.assigned_product_ids.length === 0).length || 0,
      total_products: products?.length || 0,
      recent_orders: orders?.length || 0
    }

    return NextResponse.json({
      debug,
      analysis,
      usage: {
        simulate_existing_order: '/api/debug/product-notifications?simulate=ORDER_ID',
        test_with_product_ids: '/api/debug/product-notifications?product_ids=prod1,prod2,prod3'
      }
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Debug endpoint failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

/**
 * Test notification sending for specific products
 * POST /api/debug/product-notifications
 * 
 * Body: {
 *   product_ids: string[],
 *   customer_email: string,
 *   customer_name?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const sb = await getSupabase()
    if (!sb) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await req.json()
    const { product_ids, customer_email, customer_name = 'Test Customer' } = body

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({ error: 'product_ids array is required' }, { status: 400 })
    }

    if (!customer_email) {
      return NextResponse.json({ error: 'customer_email is required' }, { status: 400 })
    }

    // Create a test order data structure
    const testOrderData = {
      order_id: `TEST_${Date.now()}`,
      customer_email,
      customer_name,
      total_amount: '100000',
      currency: 'TZS',
      payment_method: 'Test',
      payment_status: 'pending',
      items_count: product_ids.length,
      items: product_ids.map((product_id: string) => ({
        product_id,
        name: `Test Product ${product_id}`,
        quantity: 1,
        price: '10000'
      }))
    }

    console.log('🧪 Testing product-specific notifications with data:', testOrderData)

    // Import and call the notification service
    const { notifyAdminOrderCreated } = await import('@/lib/notifications/service')
    const result = await notifyAdminOrderCreated(testOrderData)

    return NextResponse.json({
      success: true,
      test_data: testOrderData,
      notification_result: result,
      message: 'Test notifications sent successfully'
    })

  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json({ 
      error: 'Test notification failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
