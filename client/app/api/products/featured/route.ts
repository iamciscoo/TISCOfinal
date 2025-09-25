import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withValidation, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const getFeaturedProductsSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(9)
})

// GET /api/products/featured
export const GET = withMiddleware(
  withValidation(getFeaturedProductsSchema),
  withErrorHandler
)(async (req: NextRequest, validatedData: z.infer<typeof getFeaturedProductsSchema>) => {
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
        is_on_sale,
        sale_price,
        is_deal,
        deal_price,
        original_price,
        rating,
        reviews_count,
        slug,
        created_at,
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
      .eq('is_featured', true)
      .limit(validatedData.limit)
      .order('created_at', { ascending: false })
      .order('is_main', { foreignTable: 'product_images', ascending: false })
      .order('sort_order', { foreignTable: 'product_images', ascending: true })

  let { data, error } = await buildQuery(true)
  if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
    const fallback = await buildQuery(false)
    data = fallback.data
    error = fallback.error
  }

  if (error) throw error

  return Response.json(createSuccessResponse(data))
})
