
// Cache interface
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// In-memory cache implementation
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  products: (limit?: number) => `products:${limit || 'all'}`,
  product: (id: string) => `product:${id}`,
  featuredProducts: (limit?: number) => `featured:${limit || 'all'}`,
  categories: () => 'categories',
  productsByCategory: (categoryId: string) => `products:category:${categoryId}`,
  userOrders: (userId: string) => `orders:user:${userId}`,
  cartItems: (userId: string) => `cart:${userId}`,
  productReviews: (productId: string) => `reviews:${productId}`,
  services: () => 'services',
  userAddresses: (userId: string) => `addresses:${userId}`
}

// Cache TTL constants (in seconds)
export const cacheTTL = {
  products: 300, // 5 minutes
  categories: 600, // 10 minutes
  orders: 60, // 1 minute
  cart: 30, // 30 seconds
  reviews: 180, // 3 minutes
  services: 600, // 10 minutes
  addresses: 300 // 5 minutes
}

// Cache wrapper function
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache first
      const cached = cache.get<T>(key)
      if (cached !== null) {
        resolve(cached)
        return
      }

      // Fetch fresh data
      const data = await fetcher()
      
      // Store in cache
      cache.set(key, data, ttlSeconds)
      
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate product-related caches
  invalidateProduct: (productId: string) => {
    cache.delete(cacheKeys.product(productId))
    cache.delete(cacheKeys.products())
    cache.delete(cacheKeys.featuredProducts())
    cache.delete(cacheKeys.productReviews(productId))
    // Also invalidate category-specific caches (we'd need product data to know which category)
  },

  // Invalidate category-related caches
  invalidateCategory: (categoryId: string) => {
    cache.delete(cacheKeys.categories())
    cache.delete(cacheKeys.productsByCategory(categoryId))
  },

  // Invalidate user-specific caches
  invalidateUser: (userId: string) => {
    cache.delete(cacheKeys.userOrders(userId))
    cache.delete(cacheKeys.cartItems(userId))
    cache.delete(cacheKeys.userAddresses(userId))
  },

  // Invalidate cart
  invalidateCart: (userId: string) => {
    cache.delete(cacheKeys.cartItems(userId))
  },

  // Invalidate orders
  invalidateOrders: (userId: string) => {
    cache.delete(cacheKeys.userOrders(userId))
  }
}

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}
