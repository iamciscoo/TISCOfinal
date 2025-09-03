// Database Migration Helper
// This file helps transition from direct Supabase queries to API-based approach

import { api } from './api-client'
import { supabase } from './supabase'

// Migration flags to control the transition
const USE_API_LAYER = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_API_LAYER === 'true'

// Wrapper functions that can switch between direct DB and API calls
export const databaseService = {
  // Products
  async getProducts(limit?: number) {
    if (USE_API_LAYER) {
      return api.getProducts(limit)
    }
    // Fallback to direct query during migration
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (url, is_main, sort_order),
        categories (id, name)
      `)
      .limit(limit || 20)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getFeaturedProducts(limit?: number) {
    if (USE_API_LAYER) {
      return api.getFeaturedProducts(limit)
    }
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (url, is_main, sort_order),
        categories (id, name)
      `)
      .eq('is_featured', true)
      .limit(limit || 9)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getProduct(id: string) {
    if (USE_API_LAYER) {
      return api.getProduct(id)
    }
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (url, is_main, sort_order),
        categories (id, name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Categories
  async getCategories() {
    if (USE_API_LAYER) {
      return api.getCategories()
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Cart operations
  async getCartItems(userId: string) {
    if (USE_API_LAYER) {
      return api.getCartItems(userId)
    }
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id, name, price, image_url, stock_quantity,
          product_images(url, is_main, sort_order)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async addToCart(productId: string, quantity: number) {
    if (USE_API_LAYER) {
      return api.addToCart({ productId, quantity })
    }
    // Direct implementation for fallback
    throw new Error('Direct cart operations not implemented in migration mode')
  }
}

// Migration utilities
export const migrationUtils = {
  // Check if API layer is available
  async testApiConnection(): Promise<boolean> {
    try {
      await fetch('/api/categories')
      return true
    } catch {
      return false
    }
  },

  // Enable API layer
  enableApiLayer() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('use_api_layer', 'true')
    }
  },

  // Disable API layer (fallback to direct queries)
  disableApiLayer() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('use_api_layer', 'false')
    }
  },

  // Get current mode
  getCurrentMode(): 'api' | 'direct' {
    return USE_API_LAYER ? 'api' : 'direct'
  }
}
