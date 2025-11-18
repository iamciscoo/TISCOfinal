/**
 * Optimized Supabase Query Utilities
 * 
 * Provides performant query patterns for different use cases:
 * - List views: Fetch only main images and essential data
 * - Detail views: Fetch complete product info with all images
 * - Admin views: Efficient data loading with proper pagination
 */

/**
 * SELECT fragment for product list views (e.g., shop, deals, search)
 * Only fetches the main product image to minimize data transfer
 */
export const PRODUCT_LIST_SELECT = `
  id,
  name,
  slug,
  price,
  deal_price,
  original_price,
  is_deal,
  is_featured,
  is_new,
  stock_quantity,
  rating,
  reviews_count,
  view_count,
  brands,
  category_id,
  created_at,
  product_images!inner(
    url,
    is_main
  )
`

/**
 * SELECT fragment for product detail views
 * Fetches complete product data including all images for gallery
 */
export const PRODUCT_DETAIL_SELECT = `
  *,
  product_images(
    id,
    url,
    path,
    is_main,
    sort_order,
    created_at
  ),
  product_categories(
    category:categories(
      id,
      name,
      slug,
      description
    )
  )
`

/**
 * SELECT fragment for cart items
 * Minimal data needed for cart display
 */
export const CART_PRODUCT_SELECT = `
  id,
  name,
  price,
  image_url,
  stock_quantity,
  product_images!inner(
    url,
    is_main
  )
`

/**
 * SELECT fragment for admin product management
 * Includes all fields needed for editing
 */
export const ADMIN_PRODUCT_SELECT = `
  *,
  product_images(
    id,
    url,
    path,
    is_main,
    sort_order,
    created_at,
    updated_at
  ),
  product_categories(
    id,
    category:categories(*)
  )
`

/**
 * Optimized ordering for product_images to ensure main image comes first
 * Use this consistently across all queries
 */
export const PRODUCT_IMAGES_ORDER = {
  foreignTable: 'product_images',
  column: 'is_main',
  ascending: false
} as const

export const PRODUCT_IMAGES_SORT_ORDER = {
  foreignTable: 'product_images',
  column: 'sort_order',
  ascending: true
} as const

/**
 * Helper to build optimized product list query
 * Usage: Use this for shop, deals, search result pages
 */
export function applyListOptimizations<T>(query: T) {
  return query
    // @ts-ignore - Generic query type
    .order('is_main', PRODUCT_IMAGES_ORDER)
    // @ts-ignore
    .order('sort_order', PRODUCT_IMAGES_SORT_ORDER)
}

/**
 * Helper to build optimized product detail query
 * Usage: Use this for individual product pages
 */
export function applyDetailOptimizations<T>(query: T) {
  return query
    // @ts-ignore - Generic query type
    .order('is_main', PRODUCT_IMAGES_ORDER)
    // @ts-ignore
    .order('sort_order', PRODUCT_IMAGES_SORT_ORDER)
    // @ts-ignore
    .order('created_at', { foreignTable: 'product_images', ascending: true })
}

/**
 * Helper to filter products by active status and stock
 * Improves performance by reducing result set size
 */
export function applyActiveFilters<T>(query: T) {
  return query
    // @ts-ignore
    .eq('is_active', true)
    // @ts-ignore
    .gte('stock_quantity', 0)
}

/**
 * Pagination helper with proper limits
 */
export const PAGINATION_LIMITS = {
  list: 50,        // Default for list pages (increased from 20)
  search: 20,      // Search suggestions (increased from 10)
  featured: 30,    // Homepage featured products (6 rows × 5 products)
  admin: 150,      // Admin dashboard (increased from 50)
  infinite: 30     // Infinite scroll increment (increased from 24)
} as const
