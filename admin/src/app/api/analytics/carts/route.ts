import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)
    const startDateISO = startDate.toISOString()

    // Cart abandonment analytics
    const { data: abandonmentData, error: abandonmentError } = await supabase
      .rpc('get_cart_abandonment_analytics', {
        start_date: startDateISO,
        end_date: new Date().toISOString()
      })

    if (abandonmentError) {
      console.error('Cart abandonment analytics error:', abandonmentError)
    }

    // Most abandoned products
    const { data: abandonedProducts, error: productsError } = await supabase
      .from('cart_items')
      .select(`
        product_id,
        products(id, name, price, image_url),
        quantity
      `)
      .gte('created_at', startDateISO)
      .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (productsError) {
      console.error('Abandoned products error:', productsError)
    }

    // Group and count abandoned products
    const productCounts = new Map()
    abandonedProducts?.forEach(item => {
      const productId = item.product_id
      if (!productCounts.has(productId)) {
        productCounts.set(productId, {
          product: item.products,
          total_abandoned: 0,
          total_quantity: 0
        })
      }
      const product = productCounts.get(productId)
      product.total_abandoned += 1
      product.total_quantity += item.quantity
    })

    const topAbandonedProducts = Array.from(productCounts.values())
      .sort((a, b) => b.total_abandoned - a.total_abandoned)
      .slice(0, 10)

    // Cart conversion rates
    const { data: conversionData, error: conversionError } = await supabase
      .from('cart_conversions')
      .select('*')
      .gte('conversion_date', startDateISO)

    if (conversionError) {
      console.error('Conversion data error:', conversionError)
    }

    // Calculate conversion statistics
    const totalGuestCarts = conversionData?.reduce((sum, conv) => sum + conv.guest_items_count, 0) || 0
    const totalConverted = conversionData?.reduce((sum, conv) => sum + conv.items_added + conv.items_updated, 0) || 0
    const conversionRate = totalGuestCarts > 0 ? (totalConverted / totalGuestCarts) * 100 : 0

    // Current active carts
    const { data: activeCarts, error: activeError } = await supabase
      .from('cart_items')
      .select('user_id, quantity, unit_price', { count: 'exact' })
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (activeError) {
      console.error('Active carts error:', activeError)
    }

    // Group active carts by user
    const activeCartsByUser = new Map()
    activeCarts?.forEach(item => {
      const userId = item.user_id
      if (!activeCartsByUser.has(userId)) {
        activeCartsByUser.set(userId, { items: 0, value: 0 })
      }
      const cart = activeCartsByUser.get(userId)
      cart.items += item.quantity
      cart.value += item.quantity * item.unit_price
    })

    const activeCartsCount = activeCartsByUser.size
    const averageCartValue = activeCartsCount > 0 
      ? Array.from(activeCartsByUser.values()).reduce((sum, cart) => sum + cart.value, 0) / activeCartsCount 
      : 0

    return NextResponse.json({
      summary: {
        period_days: periodDays,
        active_carts: activeCartsCount,
        average_cart_value: Math.round(averageCartValue * 100) / 100,
        abandonment_rate: abandonmentData?.[0]?.abandonment_rate || 0,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        total_abandoned_items: abandonedProducts?.length || 0
      },
      top_abandoned_products: topAbandonedProducts,
      conversion_stats: {
        total_guest_carts: totalGuestCarts,
        total_converted: totalConverted,
        conversion_rate: conversionRate
      },
      abandonment_data: abandonmentData || []
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Cart analytics error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch cart analytics' },
      { status: 500 }
    )
  }
}
