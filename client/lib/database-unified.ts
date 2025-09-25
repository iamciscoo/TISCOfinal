/**
 * Unified Database Connection Manager
 * 
 * This module provides a centralized database connection manager that consolidates
 * all Supabase client patterns into a single, optimized system. It replaces the
 * fragmented approach of using multiple separate clients throughout the codebase.
 * 
 * The system provides a unified interface for all database operations while maintaining
 * optimized system that provides:
 * - Connection pooling and reuse
 * - Performance monitoring and caching
 * - Consistent error handling
 * - Type-safe operations
 * - Environment-aware configuration
 * - Automatic fallback mechanisms
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { performanceMonitor } from './performance-monitor'
import { withCache, cacheKeys, cacheTTL, cacheInvalidation } from './cache'
import type { Product, Category, User, Address, Review, ServiceBooking, Service, CartItem, Order } from './types'

// Connection pool configuration
interface ConnectionConfig {
  maxConnections: number
  connectionTimeout: number
  queryTimeout: number
  retryAttempts: number
  enablePerformanceMonitoring: boolean
}

const DEFAULT_CONFIG: ConnectionConfig = {
  maxConnections: 10,
  connectionTimeout: 10000,  // 10 seconds
  queryTimeout: 30000,       // 30 seconds
  retryAttempts: 3,
  enablePerformanceMonitoring: true
}

/**
 * Unified Database Connection Manager
 * Manages all database connections with connection pooling and performance monitoring
 */
class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager
  private clientConnections: Map<string, SupabaseClient> = new Map()
  private serverConnections: Map<string, SupabaseClient> = new Map()
  private config: ConnectionConfig
  private env: {
    supabaseUrl: string
    supabaseAnonKey: string
    supabaseServiceKey?: string
  }

  private constructor(config: ConnectionConfig = DEFAULT_CONFIG) {
    this.config = config
    this.env = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE
    }
    
    if (!this.env.supabaseUrl || !this.env.supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables')
    }
  }

  static getInstance(config?: ConnectionConfig): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager(config)
    }
    return DatabaseConnectionManager.instance
  }

  /**
   * Get optimized client-side Supabase connection
   */
  getClientConnection(key: string = 'default'): SupabaseClient {
    if (!this.clientConnections.has(key)) {
      const client = createClient(
        this.env.supabaseUrl,
        this.env.supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'Connection': 'keep-alive',
              'Keep-Alive': 'timeout=5, max=1000'
            },
            fetch: (url, options = {}) => {
              return fetch(url, {
                ...options,
                signal: AbortSignal.timeout(this.config.queryTimeout),
              })
            }
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        }
      )
      this.clientConnections.set(key, client)
    }
    return this.clientConnections.get(key)!
  }

  /**
   * Get optimized server-side Supabase connection
   * Note: Server-side functionality disabled for client compatibility
   */
  async getServerConnection(key: string = 'default'): Promise<SupabaseClient> {
    // Return client connection for now - server-side functionality disabled
    return this.getClientConnection(key)
  }

  /**
   * Get service role client for admin operations
   */
  getServiceRoleConnection(): SupabaseClient {
    const key = 'service-role'
    if (!this.serverConnections.has(key)) {
      if (!process.env.SUPABASE_SERVICE_ROLE) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE environment variable')
      }
      
      const client = createClient(
        this.env.supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              'Connection': 'keep-alive',
              'Keep-Alive': 'timeout=5, max=1000'
            }
          }
        }
      )
      this.serverConnections.set(key, client)
    }
    return this.serverConnections.get(key)!
  }

  /**
   * Execute database operation with performance monitoring and retry logic
   */
  async executeWithMonitoring<T>(
    operation: string,
    fn: () => Promise<T>,
    options: {
      retryCount?: number
      cacheKey?: string
      cacheTTL?: number
      tableName?: string
      queryType?: 'select' | 'insert' | 'update' | 'delete'
    } = {}
  ): Promise<T> {
    const { retryCount = this.config.retryAttempts, cacheKey, cacheTTL, tableName, queryType } = options

    if (cacheKey && cacheTTL && queryType === 'select') {
      return withCache(cacheKey, fn, cacheTTL)
    }

    return performanceMonitor.timeOperation(
      operation,
      async () => {
        let lastError: Error | null = null
        
        for (let attempt = 0; attempt <= retryCount; attempt++) {
          try {
            const result = await fn()
            return result
          } catch (error) {
            lastError = error as Error
            
            // Check if error is retryable
            const isRetryable = (
              error instanceof Error && (
                error.message?.includes('fetch failed') ||
                error.message?.includes('timeout') ||
                error.message?.includes('ECONNRESET') ||
                error.message?.includes('ENOTFOUND')
              )
            )
            
            if (attempt < retryCount && isRetryable) {
              const backoffTime = Math.min(1000 * Math.pow(2, attempt), 5000)
              await new Promise(resolve => setTimeout(resolve, backoffTime))
              continue
            }
            
            throw error
          }
        }
        
        throw lastError
      },
      {
        tableName,
        queryType,
        cacheHit: cacheKey ? false : undefined
      }
    )
  }

  /**
   * Clear connection pools (useful for cleanup or testing)
   */
  clearConnections() {
    this.clientConnections.clear()
    this.serverConnections.clear()
  }
}

// Global database manager instance
const dbManager = DatabaseConnectionManager.getInstance()

/**
 * Unified Database API
 * Provides a clean, consistent interface for all database operations
 */
export class UnifiedDatabase {
  private manager: DatabaseConnectionManager

  constructor(manager: DatabaseConnectionManager = dbManager) {
    this.manager = manager
  }

  // =========================================================================
  // PRODUCT OPERATIONS
  // =========================================================================

  async getProducts(limit: number = 20): Promise<Product[]> {
    return this.manager.executeWithMonitoring(
      'getProducts',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('products')
          .select(`
            *,
            product_images (
              url,
              is_main,
              sort_order
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        return data as Product[] || []
      },
      {
        cacheKey: cacheKeys.products(limit),
        cacheTTL: cacheTTL.products,
        tableName: 'products',
        queryType: 'select'
      }
    )
  }

  async getFeaturedProducts(limit: number = 9): Promise<Product[]> {
    return this.manager.executeWithMonitoring(
      'getFeaturedProducts',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('products')
          .select(`
            *,
            product_images (
              url,
              is_main,
              sort_order
            )
          `)
          .eq('is_featured', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        return data as Product[] || []
      },
      {
        cacheKey: cacheKeys.featuredProducts(limit),
        cacheTTL: cacheTTL.products,
        tableName: 'products',
        queryType: 'select'
      }
    )
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.manager.executeWithMonitoring(
      'getProductById',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('products')
          .select(`
            *,
            product_images (
              url,
              is_main,
              sort_order
            ),
            categories (
              id,
              name,
              slug
            )
          `)
          .eq('id', id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') return null // Not found
          throw error
        }
        return data as Product
      },
      {
        cacheKey: cacheKeys.product(id),
        cacheTTL: cacheTTL.products,
        tableName: 'products',
        queryType: 'select'
      }
    )
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return this.manager.executeWithMonitoring(
      'getProductsByCategory',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('products')
          .select(`
            *,
            product_images (
              url,
              is_main,
              sort_order
            )
          `)
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data as Product[] || []
      },
      {
        cacheKey: cacheKeys.productsByCategory(categoryId),
        cacheTTL: cacheTTL.products,
        tableName: 'products',
        queryType: 'select'
      }
    )
  }

  // =========================================================================
  // CATEGORY OPERATIONS
  // =========================================================================

  async getCategories(): Promise<Category[]> {
    return this.manager.executeWithMonitoring(
      'getCategories',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('categories')
          .select('*')
          .order('name', { ascending: true })

        if (error) throw error
        return data as Category[] || []
      },
      {
        cacheKey: cacheKeys.categories(),
        cacheTTL: cacheTTL.categories,
        tableName: 'categories',
        queryType: 'select'
      }
    )
  }

  // =========================================================================
  // CART OPERATIONS (Real-time, no cache)
  // =========================================================================

  async addToCart(userId: string, productId: string, quantity: number = 1): Promise<{ id: string; user_id: string; product_id: string; quantity: number; created_at: string }[]> {
    return this.manager.executeWithMonitoring(
      'addToCart',
      async () => {
        const client = this.manager.getClientConnection()
        
        // Check existing item
        const { data: existingItem } = await client
          .from('cart_items')
          .select('*')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .single()

        if (existingItem) {
          const { data, error } = await client
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id)
            .select()

          if (error) throw error
          cacheInvalidation.invalidateCart(userId)
          return data
        } else {
          const { data, error } = await client
            .from('cart_items')
            .insert({ user_id: userId, product_id: productId, quantity })
            .select()

          if (error) throw error
          cacheInvalidation.invalidateCart(userId)
          return data
        }
      },
      {
        tableName: 'cart_items',
        queryType: 'insert'
      }
    )
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    return this.manager.executeWithMonitoring(
      'getCartItems',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('cart_items')
          .select(`
            *,
            products (
              id,
              name,
              price,
              image_url,
              product_images (
                url,
                is_main,
                sort_order
              ),
              stock_quantity,
              is_active
            )
          `)
          .eq('user_id', userId)
          .order('is_main', { ascending: false, foreignTable: 'products.product_images' })
          .order('sort_order', { ascending: true, foreignTable: 'products.product_images' })

        if (error) throw error
        return data || []
      },
      {
        tableName: 'cart_items',
        queryType: 'select'
      }
    )
  }

  async updateCartItemQuantity(cartItemId: string, quantity: number): Promise<{ id: string; user_id: string; product_id: string; quantity: number; created_at: string }[]> {
    return this.manager.executeWithMonitoring(
      'updateCartItemQuantity',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('cart_items')
          .update({ quantity })
          .eq('id', cartItemId)
          .select()

        if (error) throw error
        return data
      },
      {
        tableName: 'cart_items',
        queryType: 'update'
      }
    )
  }

  async removeFromCart(cartItemId: string): Promise<void> {
    return this.manager.executeWithMonitoring(
      'removeFromCart',
      async () => {
        const client = this.manager.getClientConnection()
        const { error } = await client
          .from('cart_items')
          .delete()
          .eq('id', cartItemId)

        if (error) throw error
      },
      {
        tableName: 'cart_items',
        queryType: 'delete'
      }
    )
  }

  // =========================================================================
  // ORDER OPERATIONS
  // =========================================================================

  async createOrder(userId: string, totalAmount: number, shippingAddress: string): Promise<{ id: string; user_id: string; total_amount: number; shipping_address: string; status: string; created_at: string }> {
    return this.manager.executeWithMonitoring(
      'createOrder',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('orders')
          .insert({
            user_id: userId,
            total_amount: totalAmount,
            shipping_address: shippingAddress,
            status: 'pending'
          })
          .select()
          .single()

        if (error) throw error
        cacheInvalidation.invalidateOrders(userId)
        return data
      },
      {
        tableName: 'orders',
        queryType: 'insert'
      }
    )
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.manager.executeWithMonitoring(
      'getUserOrders',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (
                id,
                name,
                image_url,
                product_images (
                  url,
                  is_main,
                  sort_order
                )
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('is_main', { ascending: false, foreignTable: 'order_items.products.product_images' })
          .order('sort_order', { ascending: true, foreignTable: 'order_items.products.product_images' })

        if (error) throw error
        return data || []
      },
      {
        cacheKey: cacheKeys.userOrders(userId),
        cacheTTL: cacheTTL.orders,
        tableName: 'orders',
        queryType: 'select'
      }
    )
  }

  // =========================================================================
  // USER OPERATIONS
  // =========================================================================

  async createUser(userData: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
    return this.manager.executeWithMonitoring(
      'createUser',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('users')
          .insert(userData)
          .select()
          .single()

        if (error) throw error
        return data
      },
      {
        tableName: 'users',
        queryType: 'insert'
      }
    )
  }

  async getUser(userId: string): Promise<User> {
    return this.manager.executeWithMonitoring(
      'getUser',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        return data
      },
      {
        tableName: 'users',
        queryType: 'select'
      }
    )
  }

  // =========================================================================
  // ADDRESS OPERATIONS
  // =========================================================================

  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.manager.executeWithMonitoring(
      'getUserAddresses',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false })

        if (error) throw error
        return data as Address[] || []
      },
      {
        cacheKey: cacheKeys.userAddresses(userId),
        cacheTTL: cacheTTL.addresses,
        tableName: 'addresses',
        queryType: 'select'
      }
    )
  }

  async createAddress(addressData: Omit<Address, 'id' | 'created_at'>): Promise<Address> {
    return this.manager.executeWithMonitoring(
      'createAddress',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('addresses')
          .insert(addressData)
          .select()
          .single()

        if (error) throw error
        if (addressData.user_id) {
          cacheInvalidation.invalidateUser(addressData.user_id.toString())
        }
        return data
      },
      {
        tableName: 'addresses',
        queryType: 'insert'
      }
    )
  }

  // =========================================================================
  // REVIEW OPERATIONS
  // =========================================================================

  async getProductReviews(productId: string): Promise<Review[]> {
    return this.manager.executeWithMonitoring(
      'getProductReviews',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('reviews')
          .select(`
            *,
            users (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('product_id', productId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data as Review[] || []
      },
      {
        cacheKey: cacheKeys.productReviews(productId),
        cacheTTL: cacheTTL.reviews,
        tableName: 'reviews',
        queryType: 'select'
      }
    )
  }

  async createReview(reviewData: {
    product_id: string
    user_id: string
    rating: number
    title?: string
    comment?: string
  }): Promise<Review> {
    return this.manager.executeWithMonitoring(
      'createReview',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('reviews')
          .insert(reviewData)
          .select()
          .single()

        if (error) throw error
        cacheInvalidation.invalidateProduct(reviewData.product_id)
        return data
      },
      {
        tableName: 'reviews',
        queryType: 'insert'
      }
    )
  }

  // =========================================================================
  // SERVICE OPERATIONS
  // =========================================================================

  async getServices(): Promise<Service[]> {
    return this.manager.executeWithMonitoring(
      'getServices',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('services')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data as Service[] || []
      },
      {
        cacheKey: cacheKeys.services(),
        cacheTTL: cacheTTL.services,
        tableName: 'services',
        queryType: 'select'
      }
    )
  }

  async createServiceBooking(bookingData: {
    service_id: string
    user_id: string
    service_type: string
    description: string
    preferred_date: string
    preferred_time: string
    contact_email: string
    contact_phone?: string
    customer_name: string
  }): Promise<ServiceBooking> {
    return this.manager.executeWithMonitoring(
      'createServiceBooking',
      async () => {
        const client = this.manager.getClientConnection()
        const { data, error } = await client
          .from('service_bookings')
          .insert(bookingData)
          .select()
          .single()

        if (error) throw error
        return data
      },
      {
        tableName: 'service_bookings',
        queryType: 'insert'
      }
    )
  }
}

// Create unified database instance
export const db = new UnifiedDatabase()

// Export individual functions for backward compatibility
export const {
  getProducts,
  getFeaturedProducts,
  getProductById,
  getProductsByCategory,
  getCategories,
  addToCart,
  getCartItems,
  updateCartItemQuantity,
  removeFromCart,
  createOrder,
  getUserOrders,
  createUser,
  getUser,
  getUserAddresses,
  createAddress,
  getProductReviews,
  createReview,
  getServices,
  createServiceBooking
} = db

// Export connection manager for advanced usage
export { DatabaseConnectionManager, dbManager }

// Export types
export type { ConnectionConfig }
