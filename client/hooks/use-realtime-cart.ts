'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
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
  const { user, loading } = useAuth()
  const isLoaded = !loading
  const isSignedIn = !!user
  const setItemsFromServer = useCartStore((s) => s.setItemsFromServer)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isHydratingRef = useRef(false)
  const didInitialHydrateRef = useRef(false)
  const log = (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[cart-rt]', ...args)
    }
  }

  useEffect(() => {
    if (!isLoaded) return
    // Wait for local persisted cart to hydrate before any server hydration
    if (!hasHydrated) return

    // Helper to load server cart and hydrate local store
    const hydrateFromServer = async (isRealtime = false) => {
      if (!isSignedIn) return
      if (isHydratingRef.current) return
      isHydratingRef.current = true
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' })
        if (res.ok) {
          const payload = await res.json()
          const items = (payload?.data?.items ?? payload?.items ?? []) as ServerCartItem[]
          const mapped = mapServerItemsToLocal(items)
          // On the very first hydration after page load, if server is empty or has fewer items than local,
          // keep local state and let useCartSync push to server instead of overwriting.
          const currentLocalCount = useCartStore.getState().items.length
          if (!didInitialHydrateRef.current && !isRealtime && currentLocalCount > 0 && mapped.length <= currentLocalCount) {
            didInitialHydrateRef.current = true
            log('skip initial server hydrate (server <= local items)', { server: mapped.length, local: currentLocalCount })
          } else {
            setItemsFromServer(mapped)
            didInitialHydrateRef.current = true
            log('hydrated from server', { count: mapped.length })
          }
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
      hydrateFromServer(false)

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
              hydrateFromServer(true)
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
              () => hydrateFromServer(true)
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
            () => hydrateFromServer(true)
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
  }, [isLoaded, hasHydrated, isSignedIn, user?.id, setItemsFromServer])
}
