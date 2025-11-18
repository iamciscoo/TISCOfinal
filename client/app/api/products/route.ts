/**
 * Products API Route
 * 
 * Handles product-related operations including fetching products with filters,
 * pagination, and category associations. This route provides optimized queries
 * with proper indexing and graceful error handling.
 * 
 * Features:
 * - Paginated product listing with configurable limits
 * - Category filtering via UUID
 * - Featured products filtering
 * - Product images and category data inclusion
 * - Graceful fallback for database schema changes
 * - Comprehensive error handling and validation
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withValidation, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

// Run on Node.js runtime for access to secure environment variables
export const runtime = 'nodejs'

/**
 * Initialize Supabase client with service role for server-side operations
 * 
 * Service role provides elevated permissions for server-side data access
 * while maintaining security by keeping the key server-side only.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,   // Public Supabase URL (safe to expose)
  process.env.SUPABASE_SERVICE_ROLE!   // Service role key (server-side only)
)

/**
 * Request validation schema for GET /api/products endpoint
 * 
 * Defines the structure and constraints for query parameters to ensure
 * data integrity and prevent invalid requests from reaching the database.
 * 
 * Note: URL query parameters are strings, so we use coercion to convert them.
 */
const getProductsSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).optional().default(50),   // Maximum items per page (1-1000, default: 50)
  offset: z.coerce.number().min(0).optional().default(0),             // Starting position for pagination (0+, default: 0)
  category: z.string().uuid().optional(),                              // Category UUID filter (optional)
  featured: z.coerce.boolean().optional()                              // Filter for featured products only (optional)
}).strip()  // Strip unknown keys (like cache-busting _t parameter)

/**
 * Optimized product query builder with schema-aware fallback handling
 * 
 * This function constructs a complex Supabase query that includes product data,
 * associated images, and category information. It implements graceful fallback
 * to handle potential database schema changes (e.g., missing slug column).
 * 
 * @param params - Validated query parameters from the request
 * @returns Promise<Product[]> - Array of product objects with nested relations
 */
async function getProductsQuery(params: z.infer<typeof getProductsSchema>) {
  /**
   * Build query function with conditional slug field inclusion
   * 
   * @param withSlug - Whether to include slug field in categories selection
   * @returns Configured Supabase query builder
   */
  const buildQuery = (withSlug: boolean) => {
    // Define comprehensive SELECT clause including all product fields and relations
    const select = `
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
      view_count,
      brands,
      slug,
      created_at,
      updated_at,
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
    `

    // Initialize base query with product selection and pagination
    let q = supabase
      .from('products')                                                     // Target products table
      .select(select)                                                       // Apply comprehensive field selection
      .eq('is_active', true)                                               // **OPTIMIZATION: Only show active products (uses idx_products_active_stock_created)**
      .limit(params.limit)                                                  // Limit results per page
      .range(params.offset, params.offset + params.limit - 1)              // Apply pagination range

    // Apply category filter if specified
    if (params.category) {
      q = q.eq('category_id', params.category)                             // Filter by category UUID (uses idx_products_category_id)
    }

    // Apply featured products filter if specified
    if (params.featured) {
      q = q.eq('is_featured', true)                                        // Show only featured products (uses idx_products_featured_order_nulls_created)
    }

    // **OPTIMIZATION: Apply ordering strategy based on filters to use appropriate indexes**
    if (params.featured) {
      // For featured products, use manual order first (idx_products_featured_order_nulls_created)
      q = q
        .order('featured_order', { ascending: true, nullsFirst: false })   // Manual order (1, 2, 3...), NULLs last
        .order('created_at', { ascending: false })                         // Newest for products without manual order
    } else {
      // For general products, prioritize in-stock items (idx_products_active_stock_created)
      q = q
        .order('is_featured', { ascending: false })                        // Featured first
        .order('created_at', { ascending: false })                         // Then newest
    }

    // **OPTIMIZATION: Order product images to show main image first (idx_product_images_product_main_fast)**
    q = q
      .order('is_main', { foreignTable: 'product_images', ascending: false })
      .order('sort_order', { foreignTable: 'product_images', ascending: true })

    return q // Return configured query builder
  }

  // Execute query with full schema including slug field
  const { data, error } = await buildQuery(true)

  // Throw any errors for proper error handling middleware
  if (error) throw error
  
  return data // Return successfully fetched products
}

/**
 * GET /api/products endpoint handler
 * 
 * Retrieves a paginated list of products with optional filtering by category
 * and featured status. Supports comprehensive product data including images
 * and category information.
 * 
 * Query Parameters:
 * - limit (optional): Number of products to return (1-200, default: 50)
 * - offset (optional): Starting position for pagination (default: 0)
 * - category (optional): Category UUID to filter by
 * - featured (optional): Boolean to show only featured products
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": Product[],
 *   "pagination": {
 *     "total": 170,
 *     "count": 50,
 *     "limit": 50,
 *     "offset": 0,
 *     "hasMore": true
 *   },
 *   "message": "Products retrieved successfully"
 * }
 * 
 * Error Handling:
 * - 400: Invalid query parameters
 * - 500: Database or server errors
 * 
 * Caching:
 * - Products are cached for 30 seconds with stale-while-revalidate
 * - Cache key includes all query parameters for accurate caching
 */
export const GET = withMiddleware(
  withValidation(getProductsSchema),    // Validate and parse query parameters
  withErrorHandler                      // Handle errors and format responses
)(async (req: NextRequest, validatedData: z.infer<typeof getProductsSchema>) => {
  // Debug logging
  console.log('[Products API] Request received with params:', {
    limit: validatedData.limit,
    offset: validatedData.offset,
    category: validatedData.category,
    featured: validatedData.featured
  })
  // Build count query with same filters as data query
  let countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })  // Get count only, no data
    .eq('is_active', true)                         // Same filter as main query
  
  // Apply same filters to count query
  if (validatedData.category) {
    countQuery = countQuery.eq('category_id', validatedData.category)
  }
  if (validatedData.featured) {
    countQuery = countQuery.eq('is_featured', true)
  }
  
  // Execute count and data queries in parallel for performance
  const [{ count: total, error: countError }, products] = await Promise.all([
    countQuery,
    getProductsQuery(validatedData)
  ])
  
  // Handle count query error
  if (countError) {
    console.error('[Products API] Count query failed:', countError)
    throw countError
  }
  
  // Calculate pagination metadata
  const totalCount = total || 0
  const returnedCount = products.length
  const hasMore = (validatedData.offset + returnedCount) < totalCount
  
  // Return successful response with products data and pagination metadata
  const successResponse = createSuccessResponse(products, 'Products retrieved successfully')
  // Add pagination metadata to response
  const responseWithPagination = {
    ...successResponse,
    pagination: {
      total: totalCount,
      count: returnedCount,
      limit: validatedData.limit,
      offset: validatedData.offset,
      hasMore
    }
  }
  const response = Response.json(responseWithPagination)
  
  // Smart caching: 30 seconds fresh, serve stale for 60s while revalidating in background
  // This provides instant responses while staying relatively up-to-date
  response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
  response.headers.set('CDN-Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
  response.headers.set('Vary', 'Accept-Encoding')
  
  return response
})
