import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withValidation, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

// Run on Node.js runtime for access to secure env vars
export const runtime = 'nodejs'

// Initialize Supabase client (service role on server)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// Validation schemas
const getProductsSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  category: z.string().uuid().optional(),
  featured: z.boolean().optional()
})

// Optimized product query with proper indexing and graceful fallback if categories.slug doesn't exist
async function getProductsQuery(params: z.infer<typeof getProductsSchema>) {
  const buildQuery = (withSlug: boolean) => {
    const select = `
      id,
      name,
      description,
      price,
      image_url,
      stock_quantity,
      is_featured,
      is_on_sale,
      sale_price,
      is_deal,
      deal_price,
      original_price,
      rating,
      reviews_count,
      slug,
      created_at,
      updated_at,
      product_images (
        url,
        is_main,
        sort_order
      ),
      categories (
        id,
        name${withSlug ? ', slug' : ''}
      )
    `

    let q = supabase
      .from('products')
      .select(select)
      .limit(params.limit)
      .range(params.offset, params.offset + params.limit - 1)

    if (params.category) {
      q = q.eq('category_id', params.category)
    }

    if (params.featured) {
      q = q.eq('is_featured', true)
    }

    // Order by featured first, then by creation date; and image ordering in nested table
    q = q
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .order('is_main', { foreignTable: 'product_images', ascending: false })
      .order('sort_order', { foreignTable: 'product_images', ascending: true })

    return q
  }

  // Try with slug first
  let { data, error } = await buildQuery(true)
  
  // If the categories.slug column doesn't exist, retry without it
  if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
    const fallback = await buildQuery(false)
    data = fallback.data
    error = fallback.error
  }

  if (error) throw error
  return data
}

// GET /api/products
export const GET = withMiddleware(
  withValidation(getProductsSchema),
  withErrorHandler
)(async (req: NextRequest, validatedData: z.infer<typeof getProductsSchema>) => {
  const products = await getProductsQuery(validatedData)
  
  return Response.json(createSuccessResponse(products))
})
