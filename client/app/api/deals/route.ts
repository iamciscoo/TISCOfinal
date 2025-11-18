import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const offsetParam = url.searchParams.get('offset')
    
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam)), 1000) : 100
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam)) : 0
    
    console.log('[Deals API] Fetching deals from database...', { limit, offset })
    
    // Get total count of deals
    const { count: totalDeals, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_deal', true)
      .eq('is_active', true)
    
    if (countError) {
      console.error('[Deals API] Error counting deals:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }
    
    // Get paginated deals data
    const { data: dealProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(
          categories(id, name)
        ),
        product_images(url, is_main, sort_order)
      `)
      .eq('is_deal', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Deals API] Error fetching deals:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[Deals API] Found', dealProducts?.length || 0, 'deal products')
    if (dealProducts && dealProducts.length > 0) {
      console.log('[Deals API] Sample product:', {
        id: dealProducts[0].id,
        name: dealProducts[0].name,
        is_deal: dealProducts[0].is_deal,
        product_categories: dealProducts[0].product_categories,
        category_id: dealProducts[0].category_id
      })
    }

    // Transform the data to include discount percentage and proper image handling
    const transformedDeals = dealProducts?.map(product => {
      const discountPercentage = product.original_price && product.deal_price 
        ? Math.round(((product.original_price - product.deal_price) / product.original_price) * 100)
        : 0

      // Get main image or first image
      const mainImage = product.product_images?.find((img: { is_main: boolean; url: string }) => img.is_main) || product.product_images?.[0]
      const imageUrl = mainImage?.url || product.image_url || '/circular.svg'

      // Get category from product_categories relation
      const categoryData = product.product_categories?.[0]?.categories
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        originalPrice: product.original_price || product.price,
        dealPrice: product.deal_price || product.price,
        currentPrice: product.deal_price || product.price,
        discount: discountPercentage,
        image_url: imageUrl,
        category: categoryData?.name || 'General',
        category_id: categoryData?.id || product.category_id,
        brands: product.brands || [],
        rating: product.rating ?? null,
        reviews_count: product.reviews_count ?? null,
        stock_quantity: product.stock_quantity,
        view_count: product.view_count || 0,
        is_featured: product.is_featured,
        is_new: product.is_new,
        slug: product.slug,
        tags: product.tags || [],
        created_at: product.created_at
      }
    }) || []

    console.log('[Deals API] Transformed', transformedDeals.length, 'deals')
    if (transformedDeals.length > 0) {
      console.log('[Deals API] Sample transformed deal:', {
        id: transformedDeals[0].id,
        name: transformedDeals[0].name,
        category: transformedDeals[0].category,
        category_id: transformedDeals[0].category_id,
        discount: transformedDeals[0].discount
      })
    }

    return NextResponse.json({ 
      success: true,
      deals: transformedDeals,
      pagination: {
        total: totalDeals || 0,
        count: transformedDeals.length,
        limit,
        offset,
        hasMore: (offset + transformedDeals.length) < (totalDeals || 0)
      },
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Deals fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}
