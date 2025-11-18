import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withValidation, withErrorHandler, createSuccessResponse } from '@/lib/middleware'
import { PAGINATION_LIMITS, applyListOptimizations } from '@/lib/optimized-queries'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

const getFeaturedProductsSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(PAGINATION_LIMITS.featured),
  _t: z.number().optional() // Cache-busting timestamp
}).passthrough() // Allow other query params

// GET /api/products/featured
export const GET = withMiddleware(
  withValidation(getFeaturedProductsSchema),
  withErrorHandler
)(async (req: NextRequest, validatedData: z.infer<typeof getFeaturedProductsSchema>) => {
  const getFeaturedProductsQuery = async () => {
    const buildQuery = (withSlug: boolean) => {
      const query = supabase
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
          brands,
          slug,
          created_at,
          featured_order,
          product_images(
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
        .eq('is_featured', true)        // **ONLY featured products**
        .eq('is_active', true)          // **OPTIMIZATION: Only show active products**
        .gte('stock_quantity', 0)       // **OPTIMIZATION: Only show products with stock info**
      
      // **OPTIMIZATION: Order product images by main first**
      const queryWithImageOrder = query
        .order('is_main', { foreignTable: 'product_images', ascending: false })
        .order('sort_order', { foreignTable: 'product_images', ascending: true })
      
      // Apply optimized ordering using helper
      return applyListOptimizations(queryWithImageOrder)
    }

    let { data, error } = await buildQuery(true)
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
      const fallback = await buildQuery(false)
      data = fallback.data
      error = fallback.error
    }

    if (error) throw error
    return data || []
  }

  // **CACHING DISABLED FOR REAL-TIME UPDATES**
  // Always fetch fresh data for instant admin updates
  console.log('🔄 Fetching fresh featured products (caching disabled for real-time updates)')
  const allFeaturedProducts = await getFeaturedProductsQuery()
  
  // **SPARSE POSITIONING LOGIC**
  // 1. Separate products with explicit positions from those without
  type FeaturedProduct = typeof allFeaturedProducts[number]
  const productsWithPosition = allFeaturedProducts.filter((p: FeaturedProduct) => p.featured_order != null)
  const productsWithoutPosition = allFeaturedProducts.filter((p: FeaturedProduct) => p.featured_order == null)
  
  // 2. Create sparse array with exact positions (1-20)
  type ProductOrNull = FeaturedProduct | null
  const positionedArray: ProductOrNull[] = new Array(validatedData.limit).fill(null)
  
  // 3. Place products at their exact positions
  productsWithPosition.forEach((product: FeaturedProduct) => {
    const position = product.featured_order! - 1 // Convert to 0-indexed
    if (position >= 0 && position < validatedData.limit) {
      positionedArray[position] = product
    }
  })
  
  // 4. Find empty slots
  const emptySlots: number[] = []
  for (let i = 0; i < validatedData.limit; i++) {
    if (positionedArray[i] === null) {
      emptySlots.push(i)
    }
  }
  
  // 5. Randomly assign products without explicit positions to empty slots
  const shuffledProducts = [...productsWithoutPosition].sort(() => Math.random() - 0.5)
  shuffledProducts.forEach((product, index) => {
    if (index < emptySlots.length) {
      positionedArray[emptySlots[index]] = product
    }
  })
  
  // 6. Filter out null values for return (keep sparse structure)
  const data = positionedArray

  const response = Response.json(createSuccessResponse(data))
  
  // Set no-cache headers to ensure fresh data always
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('CDN-Cache-Control', 'no-cache')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Vary', 'Accept-Encoding')
  
  return response
})
