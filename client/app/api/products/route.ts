import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withValidation, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// Validation schemas
const getProductsSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  category: z.string().uuid().optional(),
  featured: z.boolean().optional()
})

// Optimized product query with proper indexing
async function getProductsQuery(params: z.infer<typeof getProductsSchema>) {
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
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
      product_images!inner (
        url,
        is_main,
        sort_order
      ),
      categories (
        id,
        name
      )
    `)
    .limit(params.limit)
    .range(params.offset, params.offset + params.limit - 1)

  if (params.category) {
    query = query.eq('category_id', params.category)
  }

  if (params.featured) {
    query = query.eq('is_featured', true)
  }

  // Order by featured first, then by creation date
  query = query
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .order('is_main', { foreignTable: 'product_images', ascending: false })
    .order('sort_order', { foreignTable: 'product_images', ascending: true })

  const { data, error } = await query

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
