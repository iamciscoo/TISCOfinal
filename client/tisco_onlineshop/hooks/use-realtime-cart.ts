'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/lib/store'
import type { CartItem } from '@/lib/store'

// Server payload types
type ServerProductImage = { url: string; is_main?: boolean; sort_order?: number }
type ServerProduct = {
  id?: string
  name?: string
  price?: number
  image_url?: string
  product_images?: ServerProductImage[]
}
type ServerCartItem = {
  id: string
  product_id: string
  quantity: number
  products?: ServerProduct
}

// Maps server cart rows (with nested products) to the local CartStore shape
function mapServerItemsToLocal(items: ServerCartItem[]): CartItem[] {
  return (items || []).map((it) => {
    const product = it.products ?? {}
    const mainImg = Array.isArray(product.product_images)
      ? (product.product_images.find((img) => img?.is_main)?.url || product.image_url || '')
      : (product.image_url || '')

    return {
      id: String(it.id),
      productId: String(it.product_id),
      name: product.name ?? 'Product',
      price: Number(product.price ?? 0),
      quantity: Number(it.quantity ?? 0),
      image_url: mainImg,
    }
  })
}

export function useRealtimeCart() {
  const { isLoaded, isSignedIn, user } = useUser()
  const setItemsFromServer = useCartStore((s) => s.setItemsFromServer)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isHydratingRef = useRef(false)
  const log = (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[cart-rt]', ...args)
    }
  }

  useEffect(() => {
    if (!isLoaded) return

    // Helper to load server cart and hydrate local store
    const hydrateFromServer = async () => {
      if (!isSignedIn) return
      if (isHydratingRef.current) return
      isHydratingRef.current = true
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const mapped = mapServerItemsToLocal(data.items || [])
          setItemsFromServer(mapped)
          log('hydrated from server', { count: mapped.length })
        }
      } catch {
        // no-op; UI will continue using local state
      } finally {
        isHydratingRef.current = false
      }
    }

    // Subscribe to realtime changes for this user
    if (isSignedIn && user?.id) {
      // Initial hydration
      hydrateFromServer()

      // Close previous listeners
      if (eventSourceRef.current) {
        try { eventSourceRef.current.close() } catch {}
        eventSourceRef.current = null
      }
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current) } catch {}
        channelRef.current = null
      }

      // Prefer SSE stream from server (service role), fallback to client Supabase channel if SSE fails
      try {
        const es = new EventSource('/api/cart/stream')
        eventSourceRef.current = es
        log('SSE connecting')

        es.onopen = () => {
          log('SSE open')
        }
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            if (data?.type === 'cart_change') {
              log('SSE cart_change received')
              hydrateFromServer()
            }
          } catch {}
        }

        es.onerror = () => {
          log('SSE error, switching to Supabase realtime fallback')
          try { es.close() } catch {}
          eventSourceRef.current = null

          // Fallback: subscribe directly with anon client (may be limited by RLS)
          const channel = supabase
            .channel(`cart-items-${user.id}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` },
              () => hydrateFromServer()
            )
            .subscribe()
          channelRef.current = channel
          log('Supabase realtime fallback subscribed')
        }
      } catch {
        // Hard fallback if EventSource construction fails
        const channel = supabase
          .channel(`cart-items-${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` },
            () => hydrateFromServer()
          )
          .subscribe()
        channelRef.current = channel
        log('SSE construction failed, using Supabase realtime fallback')
      }

      return () => {
        log('cleanup: closing realtime streams')
        if (eventSourceRef.current) {
          try { eventSourceRef.current.close() } catch {}
          eventSourceRef.current = null
        }
        if (channelRef.current) {
          try { supabase.removeChannel(channelRef.current) } catch {}
          channelRef.current = null
        }
      }
    }

    // On sign-out, ensure we clean up subscription but keep local cart persisted as guest
    log('sign-out or unauthenticated state: cleaning up streams if any')
    if (eventSourceRef.current) {
      try { eventSourceRef.current.close() } catch {}
      eventSourceRef.current = null
    }
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current) } catch {}
      channelRef.current = null
    }
  }, [isLoaded, isSignedIn, user?.id, setItemsFromServer])
}
