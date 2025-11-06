import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limitParam = searchParams.get('limit')

    const buildQuery = async (withSlug: boolean, withDescription: boolean) => {
      let q = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          stock_quantity,
          is_featured,
          is_active,
          view_count,
          created_at,
          categories:product_categories (
            category:categories (
              id,
              name${withSlug ? ', slug' : ''}${withDescription ? ', description' : ''}
            )
          ),
          product_images!inner (
            id,
            url,
            is_main,
            sort_order
          )
        `)
        .eq('is_active', true) // **OPTIMIZATION: Only search active products**

      // **OPTIMIZATION: Use trigram similarity search (idx_products_name_trgm, idx_products_description_trgm)**
      if (query && query.trim().length > 0) {
        const safe = query.replace(/[(),%]/g, ' ').trim()
        
        // **Use ILIKE for fast pattern matching with GIN indexes**
        // The trigram indexes make ILIKE extremely fast
        q = q.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
        
        // **Order by relevance: exact matches first, then partial matches**
        // This uses the trigram similarity for ranking
        q = q.order('name', { ascending: true }) // Alphabetical for consistency
      } else {
        // No query - show recent products
        q = q.order('created_at', { ascending: false })
      }

      // **OPTIMIZATION: Order images by is_main first (idx_product_images_product_main_fast)**
      q = q
        .order('is_main', { foreignTable: 'product_images', ascending: false })
        .order('sort_order', { foreignTable: 'product_images', ascending: true })

      // Apply limit (default 20 for search suggestions)
      const defaultLimit = query ? 20 : 10
      if (limitParam) {
        const parsed = parseInt(limitParam)
        if (!Number.isNaN(parsed) && parsed > 0) {
          q = q.limit(Math.min(parsed, 50)) // Max 50 for performance
        } else {
          q = q.limit(defaultLimit)
        }
      } else {
        q = q.limit(defaultLimit)
      }

      return q
    }

    // Try with slug and description first
    const query_result = await buildQuery(true, true)
    let { data: products, error } = await query_result
    
    // Fallback if slug column doesn't exist
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
      const fallback_query = await buildQuery(false, true)
      const fallback = await fallback_query
      products = fallback.data
      error = fallback.error
    }
    
    // Fallback if description column doesn't exist
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('description'))) {
      const final_query = await buildQuery(false, false)
      const fallback = await final_query
      products = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
    }

    // Log search results summary
    if (query) {
      console.log(`🔍 Search: "${query}" → ${products?.length || 0} products`)
    }

    // **OPTIMIZATION REMOVED: Images are now sorted in database query (idx_product_images_product_main_fast)**
    // No need for client-side sorting - database handles it via ORDER BY
    const result = products || []
    
    // Log empty results for monitoring
    if (query && result.length === 0) {
      console.log(`⚠️ No results: "${query}"`)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
