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
  process.env.SUPABASE_SERVICE_ROLE!       // Service role key (server-side only)
)

/**
 * Request validation schema for GET /api/products endpoint
 * 
 * Defines the structure and constraints for query parameters to ensure
 * data integrity and prevent invalid requests from reaching the database.
 */
const getProductsSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),    // Maximum items per page (1-100, default: 20)
  offset: z.number().min(0).optional().default(0),             // Starting position for pagination (0+, default: 0)
  category: z.string().uuid().optional(),                      // Category UUID filter (optional)
  featured: z.boolean().optional()                             // Filter for featured products only (optional)
})

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

    // Initialize base query with product selection and pagination
    let q = supabase
      .from('products')                                                     // Target products table
      .select(select)                                                       // Apply comprehensive field selection
      .limit(params.limit)                                                  // Limit results per page
      .range(params.offset, params.offset + params.limit - 1)              // Apply pagination range

    // Apply category filter if specified
    if (params.category) {
      q = q.eq('category_id', params.category)                             // Filter by category UUID
    }

    // Apply featured products filter if specified
    if (params.featured) {
      q = q.eq('is_featured', true)                                        // Show only featured products
    }

    // Apply optimized ordering for consistent results and better cache utilization
    q = q
      .order('is_featured', { ascending: false })                          // Featured products first
      .order('created_at', { ascending: false })                           // Newest products second

    return q // Return configured query builder
  }

  // Attempt query with full schema including slug field
  let { data, error } = await buildQuery(true)
  
  /**
   * Graceful fallback for schema compatibility
   * 
   * If the categories.slug column doesn't exist (error code 42703 or slug-related error),
   * retry the query without the slug field to maintain backward compatibility.
   */
  if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
    console.warn('[Products API] Categories.slug column not found, using fallback query without slug')
    const fallback = await buildQuery(false)  // Retry without slug field
    data = fallback.data                      // Use fallback data
    error = fallback.error                    // Use fallback error state
  }

  // Throw any remaining errors for proper error handling middleware
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
 * - limit (optional): Number of products to return (1-100, default: 20)
 * - offset (optional): Starting position for pagination (default: 0)
 * - category (optional): Category UUID to filter by
 * - featured (optional): Boolean to show only featured products
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": Product[],
 *   "message": "Products retrieved successfully"
 * }
 * 
 * Error Handling:
 * - 400: Invalid query parameters
 * - 500: Database or server errors
 * 
 * Caching:
 * - Products are cached for 10 minutes to reduce database load
 * - Cache key includes all query parameters for accurate caching
 */
export const GET = withMiddleware(
  withValidation(getProductsSchema),    // Validate and parse query parameters
  withErrorHandler                      // Handle errors and format responses
)(async (req: NextRequest, validatedData: z.infer<typeof getProductsSchema>) => {
  // Execute optimized product query with validated parameters
  const products = await getProductsQuery(validatedData)
  
  // Return successful response with products data and cache headers
  const response = Response.json(createSuccessResponse(products))
  
  // Add cache headers for CDN and browser caching
  response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300')
  response.headers.set('CDN-Cache-Control', 'public, s-maxage=600')
  response.headers.set('Vary', 'Accept-Encoding')
  
  return response
})
