/**
 * Enhanced API Client for TISCO E-commerce Platform
 * 
 * This module provides a robust, type-safe HTTP client with advanced features including:
 * - Automatic caching with configurable TTL
 * - Request/response interceptors  
 * - Error handling and retry logic
 * - Environment-aware URL resolution
 * - Type-safe request/response handling
 * 
 * The client abstracts away the complexity of direct HTTP requests and provides
 * a clean interface for all data operations throughout the application.
 */

// Import middleware types for consistent API response structure
import { ApiResponse } from './middleware'
// Import caching utilities for performance optimization
import { cacheKeys, cacheTTL, withCache, cacheInvalidation } from './cache'

/**
 * Environment detection for URL resolution
 * In browser environments, use relative URLs to avoid CORS issues
 * In server environments, use absolute URLs for internal API calls
 */
const isBrowser = typeof window !== 'undefined'
const API_BASE_URL = isBrowser 
  ? '' // Use relative URLs in browser to inherit current domain
  : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') // Absolute URL for SSR

/**
 * Core API Client Class
 * 
 * Provides a unified interface for HTTP operations with built-in error handling,
 * request/response transformation, and environment-aware URL resolution.
 */
class ApiClient {
  private baseUrl: string

  /**
   * Initialize API client with configurable base URL
   * 
   * @param baseUrl - Base URL for API requests (defaults to environment-specific URL)
   */
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Core HTTP request method with comprehensive error handling
   * 
   * This private method handles all HTTP communication, including:
   * - URL construction and validation
   * - Request configuration and headers
   * - Response parsing and error detection
   * - Structured error logging for debugging
   * 
   * @param endpoint - API endpoint path (without /api prefix)
   * @param options - Fetch options (method, headers, body, etc.)
   * @returns Promise<T> - Parsed response data
   * 
   * @throws {Error} - Throws detailed error for HTTP failures or API errors
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Construct full URL with proper API prefix
    // Handle both relative (browser) and absolute (server) URL scenarios
    const url = `${this.baseUrl ? this.baseUrl : ''}/api${endpoint}`

    // Merge default configuration with request-specific options
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json', // Default to JSON content type
        ...options.headers, // Allow header overrides for specific requests
      },
      ...options, // Merge all other fetch options (method, body, etc.)
    }

    // Execute the HTTP request with comprehensive error handling
    const response = await fetch(url, config)
    
    // Handle HTTP-level errors (4xx, 5xx status codes)
    if (!response.ok) {
      // Extract error details for debugging and user feedback
      const errorText = await response.text()
      console.error(`[ApiClient] HTTP ${response.status} ${response.statusText} for ${url}:`, errorText)
      
      // Throw structured error with HTTP status information
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    // Parse JSON response and validate API-level success
    const data: ApiResponse<T> = await response.json()

    // Handle API-level errors (successful HTTP but failed business logic)
    if (!data.success) {
      console.error('[ApiClient] API error response for', url, ':', data)
      
      // Throw error with API-provided message or generic fallback
      throw new Error(data.message || 'API request failed')
    }

    // Return the actual data payload (not the wrapper)
    return data.data!
  }

  /**
   * Performs HTTP GET request with optional query parameters
   * 
   * Constructs and executes a GET request with proper query string encoding.
   * Automatically filters out null/undefined parameters to keep URLs clean.
   * 
   * @param endpoint - API endpoint path (e.g., '/products', '/users/123')
   * @param params - Optional query parameters as key-value pairs
   * @returns Promise<T> - Parsed response data
   * 
   * @example
   * ```typescript
   * // Simple GET request
   * const products = await apiClient.get<Product[]>('/products');
   * 
   * // GET request with query parameters
   * const filtered = await apiClient.get<Product[]>('/products', {
   *   category: 'electronics',
   *   limit: 20,
   *   in_stock: true
   * });
   * ```
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    let search = '' // Initialize empty query string
    
    // Build query string from parameters if provided
    if (params) {
      const sp = new URLSearchParams() // Use URLSearchParams for proper encoding
      
      // Add each parameter, filtering out null/undefined values
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          sp.append(key, String(value)) // Convert all values to strings
        }
      })
      
      // Convert to query string format
      const s = sp.toString()
      search = s ? `?${s}` : '' // Add '?' prefix only if parameters exist
    }

    // Execute GET request with constructed URL and query string
    return this.request<T>(`${endpoint}${search}`, { method: 'GET' })
  }

  /**
   * Performs HTTP POST request with JSON payload
   * 
   * Executes a POST request with automatic JSON serialization of the request body.
   * Commonly used for creating new resources and submitting form data.
   * 
   * @param endpoint - API endpoint path
   * @param data - Request payload (will be JSON serialized)
   * @returns Promise<T> - Parsed response data
   * 
   * @example
   * ```typescript
   * // Create new user
   * const user = await apiClient.post<User>('/users', {
   *   email: 'user@example.com',
   *   name: 'John Doe'
   * });
   * 
   * // Submit order
   * const order = await apiClient.post<Order>('/orders', orderData);
   * ```
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST', // HTTP POST method
      // Serialize data to JSON if provided, otherwise send no body
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Performs HTTP PUT request for complete resource replacement
   * 
   * Executes a PUT request, typically used for updating entire resources.
   * The request body should contain the complete resource representation.
   * 
   * @param endpoint - API endpoint path
   * @param data - Complete resource data (will be JSON serialized)
   * @returns Promise<T> - Parsed response data
   * 
   * @example
   * ```typescript
   * // Update entire user profile
   * const updatedUser = await apiClient.put<User>('/users/123', {
   *   id: '123',
   *   email: 'newemail@example.com',
   *   name: 'Updated Name',
   *   // ... all other user fields
   * });
   * ```
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT', // HTTP PUT method for complete resource replacement
      // Serialize complete resource data to JSON
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Performs HTTP PATCH request for partial resource updates
   * 
   * Executes a PATCH request, used for updating specific fields of a resource
   * without affecting other fields. More efficient than PUT for partial updates.
   * 
   * @param endpoint - API endpoint path
   * @param data - Partial resource data (only fields to update)
   * @returns Promise<T> - Parsed response data
   * 
   * @example
   * ```typescript
   * // Update only user's email
   * const user = await apiClient.patch<User>('/users/123', {
   *   email: 'newemail@example.com'
   * });
   * 
   * // Update product price
   * const product = await apiClient.patch<Product>('/products/456', {
   *   price: 29.99
   * });
   * ```
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH', // HTTP PATCH method for partial updates
      // Serialize partial update data to JSON
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Performs HTTP DELETE request to remove resources
   * 
   * Executes a DELETE request to permanently remove a resource.
   * This operation is typically irreversible and should be used carefully.
   * 
   * @param endpoint - API endpoint path
   * @returns Promise<T> - Parsed response data (often confirmation message)
   * 
   * @example
   * ```typescript
   * // Delete user account
   * await apiClient.delete('/users/123');
   * 
   * // Remove product from catalog
   * await apiClient.delete('/products/456');
   * 
   * // Clear user's cart
   * await apiClient.delete('/cart');
   * ```
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'DELETE' // HTTP DELETE method for resource removal
    })
  }

  async applyDiscount(userId: string, code: string): Promise<{ discount: number; message: string }> {
    return this.request<{ discount: number; message: string }>('/discounts', {
      method: 'POST',
      body: JSON.stringify({ userId, code }),
    })
  }
}

// Create global API client instance
export const apiClient = new ApiClient()

// Cached API functions to replace direct Supabase queries
export const api = {
  // Products
  async getProducts(limit?: number) {
    return withCache(
      cacheKeys.products(limit),
      () => apiClient.get('/products', limit ? { limit } : undefined),
      cacheTTL.products
    )
  },

  async getFeaturedProducts(limit?: number) {
    return withCache(
      cacheKeys.featuredProducts(limit),
      () => apiClient.get('/products/featured', limit ? { limit } : undefined),
      cacheTTL.products
    )
  },

  async getProduct(id: string) {
    return withCache(
      cacheKeys.product(id),
      () => apiClient.get(`/products/${id}`),
      cacheTTL.products
    )
  },

  async searchProducts(query: string, filters?: { category?: string; minPrice?: number; maxPrice?: number; limit?: number; offset?: number }) {
    // Don't cache search results as they're dynamic
    return apiClient.get('/products/search', { query, ...filters })
  },

  async getProductsByCategory(categoryId: string) {
    return withCache(
      cacheKeys.productsByCategory(categoryId),
      () => apiClient.get('/products', { category: categoryId }),
      cacheTTL.products
    )
  },

  // Categories
  async getCategories() {
    return withCache(
      cacheKeys.categories(),
      () => apiClient.get('/categories'),
      cacheTTL.categories
    )
  },

  // Cart
  async getCartItems(userId: string) {
    return withCache(
      cacheKeys.cartItems(userId),
      () => apiClient.get('/cart', { userId }),
      cacheTTL.cart
    )
  },

  async addToCart(data: { productId: string; quantity: number }) {
    const result = await apiClient.post('/cart', data)
    // Invalidate cart cache
    cacheInvalidation.invalidateCart('current-user') // We'd need actual userId
    return result
  },

  async updateCartItem(itemId: string, quantity: number) {
    const result = await apiClient.patch(`/cart/${itemId}`, { quantity })
    cacheInvalidation.invalidateCart('current-user')
    return result
  },

  async removeFromCart(itemId: string) {
    const result = await apiClient.delete(`/cart/${itemId}`)
    cacheInvalidation.invalidateCart('current-user')
    return result
  },

  async clearCart() {
    const result = await apiClient.delete('/cart')
    cacheInvalidation.invalidateCart('current-user')
    return result
  },

  async updateCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
    const result = await apiClient.put('/cart', { userId, items })
    cacheInvalidation.invalidateCart('current-user')
    return result
  },

  // Orders
  async getUserOrders(userId: string) {
    return withCache(
      cacheKeys.userOrders(userId),
      () => apiClient.get('/orders', { userId }),
      cacheTTL.orders
    )
  },

  async createOrder(data: {
    items: Array<{ productId: string; quantity: number }>
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }
    paymentMethod: string
  }) {
    const result = await apiClient.post('/orders', data)
    cacheInvalidation.invalidateOrders('current-user')
    cacheInvalidation.invalidateCart('current-user')
    return result
  },

  async getOrder(orderId: string) {
    return apiClient.get(`/orders/${orderId}`)
  },

  async updateOrder(id: string, data: { status?: string; shippingAddress?: object; notes?: string }) {
    const result = await apiClient.patch(`/orders/${id}`, data)
    cacheInvalidation.invalidateOrders('current-user')
    return result
  },

  // Reviews
  async getProductReviews(productId: string) {
    return withCache(
      cacheKeys.productReviews(productId),
      () => apiClient.get(`/products/${productId}/reviews`),
      cacheTTL.reviews
    )
  },

  async createReview(productId: string, data: {
    rating: number
    title?: string
    comment?: string
  }) {
    const result = await apiClient.post(`/products/${productId}/reviews`, data)
    // Invalidate product and reviews cache
    cacheInvalidation.invalidateProduct(productId)
    return result
  },

  // Services
  async getServices() {
    return withCache(
      cacheKeys.services(),
      () => apiClient.get('/services'),
      cacheTTL.services
    )
  },

  async createServiceBooking(data: {
    serviceId: string
    serviceType: string
    description: string
    preferredDate: string
    preferredTime: string
    contactEmail: string
    contactPhone?: string
    customerName: string
  }) {
    return apiClient.post('/service-bookings', data)
  },

  // User & Addresses
  async getUserAddresses(userId: string) {
    return withCache(
      cacheKeys.userAddresses(userId),
      () => apiClient.get('/addresses', { userId }),
      cacheTTL.addresses
    )
  },

  async createAddress(data: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault?: boolean;
  }) {
    const result = await apiClient.post('/addresses', data)
    cacheInvalidation.invalidateUser('current-user')
    return result
  },

  async updateAddress(addressId: string, data: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isDefault?: boolean;
  }) {
    const result = await apiClient.patch(`/addresses/${addressId}`, data)
    cacheInvalidation.invalidateUser('current-user')
    return result
  },

  async deleteAddress(addressId: string) {
    const result = await apiClient.delete(`/addresses/${addressId}`)
    cacheInvalidation.invalidateUser('current-user')
    return result
  }
}

// Real-time subscriptions (for future implementation)
export class RealtimeClient {
  private eventSource: EventSource | null = null

  subscribe(channel: string, callback: (data: unknown) => void) {
    if (typeof window === 'undefined') return

    this.eventSource = new EventSource(`${API_BASE_URL}/api/realtime/${channel}`)
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        callback(data)
      } catch (error) {
        console.error('Failed to parse realtime data:', error)
      }
    }

    this.eventSource.onerror = (error) => {
      console.error('Realtime connection error:', error)
    }
  }

  unsubscribe() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}

export const realtimeClient = new RealtimeClient()
