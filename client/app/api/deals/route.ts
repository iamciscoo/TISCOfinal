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
    
    const requestedLimit = limitParam ? Math.max(1, parseInt(limitParam)) : 100
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam)) : 0
    
    console.log('[Deals API] Fetching deals from database...', { requestedLimit, offset })
    
    // Get total count of deals
    const { count: totalDeals, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_deal', true)
      .eq('is_active', true)

    if (countError) {
      console.error('[Deals API] Error counting deals:', countError)
      return NextResponse.json({ error: 'Failed to count deals' }, { status: 500 })
    }

    const totalCount = totalDeals || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let deals: Record<string, any>[] = []
    
    // Fetch ALL deals if requested limit >= total and total > 1000 (Supabase hard limit)
    if (requestedLimit >= totalCount && totalCount > 1000) {
      console.log(`[Deals API] Fetching ${totalCount} deals in batches...`)
      const batchSize = 1000
      
      for (let batchOffset = 0; batchOffset < totalCount; batchOffset += batchSize) {
        console.log(`[Deals API] Batch: offset=${batchOffset}, limit=${batchSize}`)
        
        const { data: batchDeals, error: batchError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            price,
            deal_price,
            original_price,
            image_url,
            stock_quantity,
            rating,
            reviews_count,
            view_count,
            brands,
            slug,
            created_at,
            categories:product_categories(category:categories(id, name)),
            product_images(url, is_main, sort_order)
          `)
          .eq('is_deal', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(batchOffset, batchOffset + batchSize - 1)
        
        if (batchError) {
          console.error(`[Deals API] Batch error at offset ${batchOffset}:`, batchError)
          return NextResponse.json({ error: 'Failed to fetch deals batch' }, { status: 500 })
        }
        
        if (batchDeals) deals.push(...batchDeals)
      }
      
      console.log(`[Deals API] Fetched ${deals.length} total deals in batches`)
    } else {
      // Normal single fetch (limit <= 1000)
      const limit = Math.min(requestedLimit, 1000)
      const { data: fetchedDeals, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          deal_price,
          original_price,
          image_url,
          stock_quantity,
          rating,
          reviews_count,
          view_count,
          brands,
          slug,
          created_at,
          categories:product_categories(category:categories(id, name)),
          product_images(url, is_main, sort_order)
        `)
        .eq('is_deal', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      deals = fetchedDeals || []
      
      if (error) {
        console.error('[Deals API] Error fetching deals:', error)
        return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
      }
    }
    
    console.log('[Deals API] Found', deals?.length || 0, 'deal products')
    if (deals && deals.length > 0) {
      console.log('[Deals API] Sample product:', {
        id: deals[0].id,
        name: deals[0].name,
        is_deal: deals[0].is_deal,
        product_categories: deals[0].product_categories,
        category_id: deals[0].category_id
      })
    }

    // Transform the data to include discount percentage and proper image handling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedDeals = deals?.map((product: Record<string, any>) => {
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
        total: totalCount,
        count: transformedDeals.length,
        limit: requestedLimit,
        offset,
        hasMore: (offset + transformedDeals.length) < totalCount
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
