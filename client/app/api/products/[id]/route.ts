import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withErrorHandler, createSuccessResponse, ApiError, API_ERROR_CODES } from '@/lib/middleware'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// GET /api/products/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  
  // Validate the ID parameter
  const idSchema = z.string().uuid()
  const validationResult = idSchema.safeParse(resolvedParams.id)
  
  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid product ID format',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    )
  }
  
  return withMiddleware(
    withErrorHandler
  )(async () => {
    const buildQuery = (withSlug: boolean) =>
      supabase
        .from('products')
        .select(`
          *,
          product_images (
            url,
            is_main,
            sort_order
          ),
          categories:product_categories (
            category:categories (
              id,
              name${withSlug ? ', slug' : ''}
            )
          )
        `)
        .eq('id', resolvedParams.id)
        .order('is_main', { foreignTable: 'product_images', ascending: false })
        .order('sort_order', { foreignTable: 'product_images', ascending: true })
        .single()

    let { data, error } = await buildQuery(true)
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
      const fallback = await buildQuery(false)
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND, 'Product not found', 404)
      }
      throw error
    }

    return Response.json(createSuccessResponse(data))
  })(req)
}
