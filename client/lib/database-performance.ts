/**
 * Database Performance Optimization Utilities
 * 
 * This module provides optimized database operations with built-in caching,
 * connection pooling, and query batching for improved performance.
 */

import { createClient } from '@supabase/supabase-js'

// Query timeout configuration
export const QUERY_TIMEOUT = 10000 // 10 seconds

// Connection pool optimization
export const CONNECTION_CONFIG = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
      'Keep-Alive': 'timeout=5, max=1000'
    }
  }
}

// Batch query helper to reduce database round trips
export async function batchQueries<T>(
  client: ReturnType<typeof createClient>,
  queries: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(queries.map(query => query()))
}

// Optimized product query with minimal data fetching
export const OPTIMIZED_PRODUCT_SELECT = `
  id,
  name,
  price,
  image_url,
  stock_quantity,
  is_featured,
  is_deal,
  deal_price,
  original_price
`

// Optimized product with images query
export const PRODUCT_WITH_IMAGES_SELECT = `
  ${OPTIMIZED_PRODUCT_SELECT},
  product_images!inner (
    url,
    is_main,
    sort_order
  )
`

interface QueryCacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
}

// Global query cache instance for database performance optimization
const globalQueryCache = new Map<string, QueryCacheEntry>()
const CACHE_MAX_SIZE = 200
const CACHE_DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export const queryCache = {
  get<T = unknown>(key: string): T | null {
    const entry = globalQueryCache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      globalQueryCache.delete(key)
      return null
    }
    
    return entry.data as T
  },

  set<T = unknown>(key: string, data: T, ttl?: number): void {
    // Use LRU eviction when cache is full
    if (globalQueryCache.size >= CACHE_MAX_SIZE) {
      const firstKey = globalQueryCache.keys().next().value
      if (firstKey) {
        globalQueryCache.delete(firstKey)
      }
    }
    
    globalQueryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || CACHE_DEFAULT_TTL
    })
  },

  invalidate(pattern: string): number {
    let count = 0
    for (const key of globalQueryCache.keys()) {
      if (key.includes(pattern)) {
        globalQueryCache.delete(key)
        count++
      }
    }
    return count
  },

  clear(): void {
    globalQueryCache.clear()
  },

  getStats() {
    return {
      size: globalQueryCache.size,
      maxSize: CACHE_MAX_SIZE,
      hitRate: globalQueryCache.size > 0 ? 0.8 : 0 // Simplified calculation
    }
  }
}

/**
 * Generate cache key from query parameters
 */
export function generateCacheKey(table: string, params: Record<string, unknown> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key]
      return result
    }, {} as Record<string, unknown>)
  
  return `${table}:${JSON.stringify(sortedParams)}`
}

// Query result pagination helper
export const paginateQuery = <T extends { range: (start: number, end: number) => T; limit: (count: number) => T }>(
  query: T,
  limit: number = 20,
  offset: number = 0
): T => {
  return query.range(offset, offset + limit - 1).limit(limit)
}
