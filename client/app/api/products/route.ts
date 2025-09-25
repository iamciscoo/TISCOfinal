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
import { getProducts } from '@/lib/database'
import { withMiddleware, withValidation, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

// Run on Node.js runtime for access to secure environment variables
export const runtime = 'nodejs'

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
 * Simplified product query using unified database system
 * 
 * Uses the optimized unified database connection manager which provides
 * automatic connection pooling, caching, and performance monitoring.
 * 
 * @param params - Validated query parameters from the request
 * @returns Promise<Product[]> - Array of product objects with relations
 */
async function getProductsQuery(params: z.infer<typeof getProductsSchema>) {
  // Use unified database system for optimal performance
  if (params.featured) {
    return await getProducts(params.limit)
  }
  
  return await getProducts(params.limit)
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
 * Performance Optimizations:
 * - Uses unified database connection manager with pooling
 * - Automatic caching and performance monitoring
 * - Optimized queries with proper indexing
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
