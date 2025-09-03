import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withValidation, withErrorHandler, createSuccessResponse, ApiError, API_ERROR_CODES } from '@/lib/middleware'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// GET /api/products/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  
  return withMiddleware(
    withValidation(z.object({ id: z.string().uuid() })),
    withErrorHandler
  )(async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          url,
          is_main,
          sort_order
        ),
        categories (
          id,
          name
        )
      `)
      .eq('id', resolvedParams.id)
      .order('is_main', { foreignTable: 'product_images', ascending: false })
      .order('sort_order', { foreignTable: 'product_images', ascending: true })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND, 'Product not found', 404)
      }
      throw error
    }

    return Response.json(createSuccessResponse(data))
  })(req, { id: resolvedParams.id })
}
