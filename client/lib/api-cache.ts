/**
 * API Response Caching System
 * 
 * Provides intelligent caching for API responses to improve performance
 * and reduce database load. Supports TTL-based expiration, cache invalidation,
 * and memory-efficient storage.
 */

interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  key: string
}

interface CacheConfig {
  defaultTTL: number // Default TTL in milliseconds
  maxSize: number    // Maximum number of cached entries
  cleanupInterval: number // Cleanup interval in milliseconds
}

class APICache {
  private cache = new Map<string, CacheEntry>()
  private config: CacheConfig
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000,      // 5 minutes default
      maxSize: 1000,                   // Max 1000 entries
      cleanupInterval: 10 * 60 * 1000, // Cleanup every 10 minutes
      ...config
    }
    
    this.startCleanupTimer()
  }

  /**
   * Generate cache key from URL and parameters
   */
  private generateKey(url: string, params?: Record<string, unknown>): string {
    const paramStr = params ? JSON.stringify(params) : ''
    return `${url}:${paramStr}`
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Get cached data if available and not expired
   */
  get<T = unknown>(url: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(url, params)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T = unknown>(url: string, data: T, params?: Record<string, unknown>, ttl?: number): void {
    const key = this.generateKey(url, params)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    }
    
    // Enforce max size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }
    
    this.cache.set(key, entry)
  }

  /**
   * Remove specific cache entry
   */
  delete(url: string, params?: Record<string, unknown>): boolean {
    const key = this.generateKey(url, params)
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries matching pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern)
    
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    
    return count
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: this.isExpired(entry)
      }))
    }
  }

  /**
   * Evict oldest entry when cache is full
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Stop cleanup timer and clear cache
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.clear()
  }
}

// Global cache instance
const apiCache = new APICache({
  defaultTTL: 5 * 60 * 1000,      // 5 minutes for most API calls
  maxSize: 500,                    // Reasonable limit for memory usage
  cleanupInterval: 5 * 60 * 1000   // Cleanup every 5 minutes
})

/**
 * Cache configuration for different API endpoints
 */
export const CACHE_CONFIGS = {
  products: { ttl: 10 * 60 * 1000 },        // 10 minutes - products don't change often
  categories: { ttl: 30 * 60 * 1000 },      // 30 minutes - categories change rarely
  cart: { ttl: 30 * 1000 },                 // 30 seconds - cart changes frequently
  user: { ttl: 5 * 60 * 1000 },             // 5 minutes - user data changes occasionally
  orders: { ttl: 2 * 60 * 1000 },           // 2 minutes - orders updated frequently
  reviews: { ttl: 15 * 60 * 1000 },         // 15 minutes - reviews don't change often
  services: { ttl: 20 * 60 * 1000 },        // 20 minutes - services change rarely
} as const

/**
 * Enhanced fetch with caching support
 */
export async function cachedFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  cacheConfig?: { ttl?: number; params?: Record<string, unknown>; bypassCache?: boolean }
): Promise<T> {
  const { ttl, params, bypassCache = false } = cacheConfig || {}
  
  // Skip cache for non-GET requests or when bypassed
  if (options.method && options.method !== 'GET' || bypassCache) {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json()
  }
  
  // Try to get from cache first
  const cachedData = apiCache.get<T>(url, params)
  if (cachedData !== null) {
    return cachedData
  }
  
  // Fetch from API
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data = await response.json()
  
  // Cache the response
  apiCache.set(url, data, params, ttl)
  
  return data
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string): number {
  return apiCache.invalidatePattern(pattern)
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(url: string, params?: Record<string, unknown>): boolean {
  return apiCache.delete(url, params)
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return apiCache.getStats()
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  apiCache.clear()
}

export default apiCache
