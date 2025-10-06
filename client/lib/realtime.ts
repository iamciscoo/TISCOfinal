import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'  // Use the singleton client
import { cacheInvalidation } from './cache'

// Type for Supabase realtime payload (using actual Supabase types)
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
type RealtimePayload<T extends Record<string, unknown> = Record<string, unknown>> = RealtimePostgresChangesPayload<T>

// Real-time subscription manager
class RealtimeManager {
  private subscriptions = new Map<string, RealtimeChannel>()
  // Subscribe to cart changes
  subscribeToCart(userId: string, callback: (payload: RealtimePayload) => void) {
    const channelName = `cart:${userId}`
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Invalidate cart cache when changes occur
          cacheInvalidation.invalidateCart(userId)
          callback(payload)
        }
      )
      .subscribe()

    this.subscriptions.set(channelName, channel)
    return channel
  }

  // Subscribe to order changes
  subscribeToOrders(userId: string, callback: (payload: RealtimePayload) => void) {
    const channelName = `orders:${userId}`
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Invalidate orders cache when changes occur
          cacheInvalidation.invalidateOrders(userId)
          callback(payload)
        }
      )
      .subscribe()

    this.subscriptions.set(channelName, channel)
    return channel
  }

  // Subscribe to product changes (for inventory updates)
  subscribeToProducts(callback: (payload: RealtimePayload) => void) {
    const channelName = 'products'
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          // Invalidate product caches when changes occur
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            cacheInvalidation.invalidateProduct((payload.new as { id: string }).id)
          }
          if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            cacheInvalidation.invalidateProduct((payload.old as { id: string }).id)
          }
          callback(payload)
        }
      )
      .subscribe()

    this.subscriptions.set(channelName, channel)
    return channel
  }

  // Subscribe to review changes
  subscribeToReviews(productId: string, callback: (payload: RealtimePayload) => void) {
    const channelName = `reviews:${productId}`
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          // Invalidate product and reviews cache when changes occur
          cacheInvalidation.invalidateProduct(productId)
          callback(payload)
        }
      )
      .subscribe()

    this.subscriptions.set(channelName, channel)
    return channel
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(channelName)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    for (const [, channel] of this.subscriptions.entries()) {
      supabase.removeChannel(channel)
    }
    this.subscriptions.clear()
  }

  // Get subscription status
  getSubscriptionStatus(channelName: string) {
    const channel = this.subscriptions.get(channelName)
    return channel ? channel.state : 'not_subscribed'
  }
}

// Global realtime manager instance
export const realtimeManager = new RealtimeManager()

// React hooks for real-time subscriptions
export function useCartRealtime(userId: string, onUpdate?: (payload: RealtimePayload) => void) {
  if (typeof window === 'undefined') return

  const handleUpdate = (payload: RealtimePayload) => {
    if (onUpdate) onUpdate(payload)
  }

  // Subscribe on mount
  realtimeManager.subscribeToCart(userId, handleUpdate)

  // Return cleanup function
  return () => {
    realtimeManager.unsubscribe(`cart:${userId}`)
  }
}

export function useOrdersRealtime(userId: string, onUpdate?: (payload: RealtimePayload) => void) {
  if (typeof window === 'undefined') return

  const handleUpdate = (payload: RealtimePayload) => {
    if (onUpdate) onUpdate(payload)
  }

  // Subscribe on mount
  realtimeManager.subscribeToOrders(userId, handleUpdate)

  // Return cleanup function
  return () => {
    realtimeManager.unsubscribe(`orders:${userId}`)
  }
}

export function useProductsRealtime(onUpdate?: (payload: RealtimePayload) => void) {
  if (typeof window === 'undefined') return

  const handleUpdate = (payload: RealtimePayload) => {
    if (onUpdate) onUpdate(payload)
  }

  // Subscribe on mount
  realtimeManager.subscribeToProducts(handleUpdate)

  // Return cleanup function
  return () => {
    realtimeManager.unsubscribe('products')
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeManager.unsubscribeAll()
  })
}
