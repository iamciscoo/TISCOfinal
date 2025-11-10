/**
 * Optimized Admin Query Utilities
 * 
 * Provides efficient query patterns for admin dashboard operations:
 * - Fast product listing with pagination
 * - Efficient product editing with proper data loading
 * - Image management optimizations
 */

/**
 * SELECT fragment for admin product list (dashboard view)
 * Optimized for displaying product table with essential info
 */
export const ADMIN_PRODUCT_LIST_SELECT = `
  id,
  name,
  slug,
  price,
  deal_price,
  stock_quantity,
  is_active,
  is_featured,
  is_deal,
  is_new,
  rating,
  reviews_count,
  view_count,
  created_at,
  updated_at,
  product_images!inner(
    id,
    url,
    is_main
  )
`

/**
 * SELECT fragment for admin product editing
 * Includes all necessary fields and relations for product management
 */
export const ADMIN_PRODUCT_EDIT_SELECT = `
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
    category_id,
    category:categories(
      id,
      name,
      slug,
      description
    )
  )
`

/**
 * SELECT fragment for image management
 * Minimal data needed for image gallery/sorting operations
 */
export const ADMIN_IMAGE_MANAGEMENT_SELECT = `
  id,
  url,
  path,
  is_main,
  sort_order,
  product_id,
  created_at
`

/**
 * Optimized query builder for admin product list
 * Includes proper ordering and filtering
 */
export function buildAdminListQuery<T>(query: T) {
  return query
    // @ts-ignore
    .order('is_featured', { ascending: false })
    // @ts-ignore
    .order('created_at', { ascending: false })
    // @ts-ignore
    .order('is_main', { foreignTable: 'product_images', ascending: false })
    // @ts-ignore
    .order('sort_order', { foreignTable: 'product_images', ascending: true })
}

/**
 * Optimized query builder for admin product edit
 * Ensures proper image ordering for editing
 */
export function buildAdminEditQuery<T>(query: T) {
  return query
    // @ts-ignore
    .order('is_main', { foreignTable: 'product_images', ascending: false })
    // @ts-ignore
    .order('sort_order', { foreignTable: 'product_images', ascending: true })
    // @ts-ignore
    .order('created_at', { foreignTable: 'product_images', ascending: true })
}

/**
 * Admin pagination limits
 */
export const ADMIN_PAGINATION = {
  products: 50,
  orders: 30,
  users: 50,
  images: 100
} as const

/**
 * Helper to apply admin-specific filters
 */
export function applyAdminFilters<T>(
  query: T,
  filters?: {
    isActive?: boolean
    isFeatured?: boolean
    isDeal?: boolean
    category?: string
    search?: string
  }
) {
  let q = query

  if (filters?.isActive !== undefined) {
    // @ts-ignore
    q = q.eq('is_active', filters.isActive)
  }

  if (filters?.isFeatured !== undefined) {
    // @ts-ignore
    q = q.eq('is_featured', filters.isFeatured)
  }

  if (filters?.isDeal !== undefined) {
    // @ts-ignore
    q = q.eq('is_deal', filters.isDeal)
  }

  if (filters?.category) {
    // @ts-ignore
    q = q.eq('category_id', filters.category)
  }

  if (filters?.search) {
    // @ts-ignore
    q = q.ilike('name', `%${filters.search}%`)
  }

  return q
}

/**
 * Bulk update helper for efficient image reordering
 * Use this when updating multiple image sort_orders
 */
export async function bulkUpdateImageOrder(
  supabase: any,
  updates: Array<{ id: string; sort_order: number }>
) {
  const promises = updates.map(({ id, sort_order }) =>
    supabase
      .from('product_images')
      .update({ sort_order })
      .eq('id', id)
  )

  return Promise.all(promises)
}

/**
 * Efficient main image switcher
 * Handles unsetting old main and setting new main in optimized way
 */
export async function switchMainImage(
  supabase: any,
  productId: string,
  newMainImageId: string
) {
  // Unset all main images for product
  await supabase
    .from('product_images')
    .update({ is_main: false })
    .eq('product_id', productId)

  // Set new main image
  const { data, error } = await supabase
    .from('product_images')
    .update({ is_main: true })
    .eq('id', newMainImageId)
    .select('url')
    .single()

  if (error) throw error

  // Update product's image_url for backward compatibility
  if (data?.url) {
    await supabase
      .from('products')
      .update({ image_url: data.url })
      .eq('id', productId)
  }

  return data
}
