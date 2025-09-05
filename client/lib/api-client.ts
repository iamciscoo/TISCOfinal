import { ApiResponse } from './middleware'
import { cacheKeys, cacheTTL, withCache, cacheInvalidation } from './cache'

// Base API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// Generic API client
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    const data: ApiResponse<T> = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'API request failed')
    }

    return data.data!
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${this.baseUrl}/api${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return this.request<T>(endpoint + url.search, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
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
