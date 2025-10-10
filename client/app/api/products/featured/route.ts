import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withValidation, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

const getFeaturedProductsSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(9)
})

// GET /api/products/featured
export const GET = withMiddleware(
  withValidation(getFeaturedProductsSchema),
  withErrorHandler
)(async (req: NextRequest, validatedData: z.infer<typeof getFeaturedProductsSchema>) => {
  const getFeaturedProductsQuery = async () => {
    const buildQuery = (withSlug: boolean) =>
      supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          stock_quantity,
          is_featured,
          is_new,
          is_deal,
          deal_price,
          original_price,
          rating,
          reviews_count,
          slug,
          created_at,
          featured_order,
          product_images (
            url,
            is_main,
            sort_order
          ),
          categories:product_categories!fk_product_categories_product_id (
            category:categories (
              id,
              name${withSlug ? ', slug' : ''}
            )
          )
        `)
        .eq('is_featured', true)                                          // **Uses idx_products_featured_order_nulls_created**
        .eq('is_active', true)                                            // **OPTIMIZATION: Only show active products**
        .gte('stock_quantity', 0)                                         // **OPTIMIZATION: Only show products with stock info**
        .limit(validatedData.limit)
        .order('featured_order', { ascending: true, nullsFirst: false })  // **Manual order first (1, 2, 3...), NULLs last**
        .order('created_at', { ascending: false })                        // **Then by newest for products without manual order**
        .order('is_main', { foreignTable: 'product_images', ascending: false })  // **Main images first**
        .order('sort_order', { foreignTable: 'product_images', ascending: true }) // **Then by sort order**

    let { data, error } = await buildQuery(true)
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
      const fallback = await buildQuery(false)
      data = fallback.data
      error = fallback.error
    }

    if (error) throw error
    return data
  }

  // **CACHING DISABLED FOR REAL-TIME UPDATES**
  // Always fetch fresh data for instant admin updates
  console.log('🔄 Fetching fresh featured products (caching disabled for real-time updates)')
  const data = await getFeaturedProductsQuery()

  const response = Response.json(createSuccessResponse(data))
  
  // Set no-cache headers to ensure fresh data always
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('CDN-Cache-Control', 'no-cache')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Vary', 'Accept-Encoding')
  
  return response
})
