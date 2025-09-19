/**
 * Admin API Optimization Utilities
 * 
 * Provides performance optimization utilities specifically for admin panel operations,
 * including batch operations, connection pooling, and query optimization.
 */

import { supabase } from './supabase'

/**
 * Batch operation configuration
 */
interface BatchConfig {
  batchSize: number
  delayMs: number
  maxRetries: number
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 100,
  delayMs: 50,
  maxRetries: 3
}

/**
 * Execute operations in batches to prevent overwhelming the database
 */
export async function executeBatch<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  config: Partial<BatchConfig> = {}
): Promise<R[]> {
  const { batchSize, delayMs, maxRetries } = { ...DEFAULT_BATCH_CONFIG, ...config }
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    let attempts = 0
    
    while (attempts < maxRetries) {
      try {
        const batchResults = await operation(batch)
        results.push(...batchResults)
        break
      } catch (error) {
        attempts++
        if (attempts >= maxRetries) {
          console.error(`Batch operation failed after ${maxRetries} attempts:`, error)
          throw error
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempts)))
      }
    }
    
    // Small delay between batches to prevent overwhelming the database
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
}

/**
 * Optimized bulk product update
 */
export async function bulkUpdateProducts(updates: Array<{ id: string; data: Record<string, unknown> }>) {
  return executeBatch(
    updates,
    async (batch) => {
      const promises = batch.map(({ id, data }) =>
        supabase
          .from('products')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('id')
          .single()
      )
      
      const results = await Promise.allSettled(promises)
      return results
        .filter((result): result is PromiseFulfilledResult<unknown> => result.status === 'fulfilled')
        .map(result => result.value)
    },
    { batchSize: 50, delayMs: 100 }
  )
}

/**
 * Optimized bulk order status update
 */
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: string,
  additionalData?: Record<string, unknown>
) {
  return executeBatch(
    orderIds,
    async (batch) => {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }
      
      const promises = batch.map(id =>
        supabase
          .from('orders')
          .update(updateData)
          .eq('id', id)
          .select('id, status')
          .single()
      )
      
      const results = await Promise.allSettled(promises)
      return results
        .filter((result): result is PromiseFulfilledResult<unknown> => result.status === 'fulfilled')
        .map(result => result.value)
    },
    { batchSize: 25, delayMs: 75 }
  )
}

/**
 * Get admin dashboard data with optimized queries
 */
export async function getOptimizedDashboardStats() {
  // Use Promise.allSettled to prevent one failing query from breaking all stats
  const [
    productsResult,
    ordersResult,
    usersResult,
    revenueResult,
    lowStockResult
  ] = await Promise.allSettled([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('products')
      .select('id, name, stock_quantity')
      .lt('stock_quantity', 10)
      .eq('is_active', true)
  ])
  
  // Calculate totals with fallbacks
  const totalProducts = productsResult.status === 'fulfilled' ? (productsResult.value.count || 0) : 0
  const totalOrders = ordersResult.status === 'fulfilled' ? (ordersResult.value.count || 0) : 0
  const totalUsers = usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0
  
  const monthlyRevenue = revenueResult.status === 'fulfilled' 
    ? (revenueResult.value.data || []).reduce((sum, order: { total_amount: number }) => 
        sum + (Number(order.total_amount) || 0), 0)
    : 0
    
  const lowStockProducts = lowStockResult.status === 'fulfilled' 
    ? (lowStockResult.value.data || []).length 
    : 0
  
  return {
    totalProducts,
    totalOrders,
    totalUsers,
    monthlyRevenue,
    lowStockCount: lowStockProducts,
    errors: [
      productsResult.status === 'rejected' ? `Products: ${productsResult.reason}` : null,
      ordersResult.status === 'rejected' ? `Orders: ${ordersResult.reason}` : null,
      usersResult.status === 'rejected' ? `Users: ${usersResult.reason}` : null,
      revenueResult.status === 'rejected' ? `Revenue: ${revenueResult.reason}` : null,
      lowStockResult.status === 'rejected' ? `Low Stock: ${lowStockResult.reason}` : null,
    ].filter(Boolean)
  }
}

/**
 * Search products with optimized full-text search
 */
export async function optimizedProductSearch(
  query: string,
  filters: {
    category?: string
    priceMin?: number
    priceMax?: number
    inStock?: boolean
    featured?: boolean
  } = {},
  limit = 20
) {
  let supabaseQuery = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      image_url,
      stock_quantity,
      is_featured,
      is_active,
      categories (
        id,
        name
      ),
      product_images (
        id,
        url,
        is_main
      )
    `)
    .eq('is_active', true)
    .limit(limit)
  
  // Apply text search with better indexing
  if (query.trim()) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }
  
  // Apply filters
  if (filters.category) {
    supabaseQuery = supabaseQuery.eq('category_id', filters.category)
  }
  
  if (filters.priceMin !== undefined) {
    supabaseQuery = supabaseQuery.gte('price', filters.priceMin)
  }
  
  if (filters.priceMax !== undefined) {
    supabaseQuery = supabaseQuery.lte('price', filters.priceMax)
  }
  
  if (filters.inStock) {
    supabaseQuery = supabaseQuery.gt('stock_quantity', 0)
  }
  
  if (filters.featured) {
    supabaseQuery = supabaseQuery.eq('is_featured', true)
  }
  
  // Optimize ordering
  supabaseQuery = supabaseQuery
    .order('is_featured', { ascending: false })
    .order('stock_quantity', { ascending: false })
    .order('created_at', { ascending: false })
  
  const { data, error } = await supabaseQuery
  
  if (error) throw error
  return data || []
}

/**
 * Cache-aware query executor
 */
const queryCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs = 5 * 60 * 1000 // 5 minutes
): Promise<T> {
  const cached = queryCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T
  }
  
  const data = await queryFn()
  queryCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
  
  // Clean up expired entries periodically
  if (queryCache.size > 100) {
    const now = Date.now()
    for (const [cacheKey, entry] of queryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        queryCache.delete(cacheKey)
      }
    }
  }
  
  return data
}

/**
 * Performance monitoring for slow queries
 */
export async function monitoredQuery<T>(
  name: string,
  queryFn: () => Promise<T>,
  slowThresholdMs = 1000
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await queryFn()
    const duration = Date.now() - startTime
    
    if (duration > slowThresholdMs) {
      console.warn(`Slow query detected: ${name} took ${duration}ms`)
    }
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Query failed: ${name} failed after ${duration}ms`, error)
    throw error
  }
}
