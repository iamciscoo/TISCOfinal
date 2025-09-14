'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCartStore, type CartItem } from '@/lib/store'
import { createClient } from '@/lib/supabase-auth'

// Minimal server payload types for mapping
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

// Automatically sync authenticated user to local DB on login and merge guest cart
export default function AuthSync() {
  const { user, loading } = useAuth()
  const isLoaded = !loading
  const isSignedIn = !!user
  const setItemsFromServer = useCartStore((state) => state.setItemsFromServer)
  const hasHydrated = useCartStore((state) => state.hasHydrated)
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !hasHydrated || hasSyncedRef.current) return
    hasSyncedRef.current = true

    const run = async () => {
      try {
        // 1) Ensure profile exists/updated in local DB
        const syncRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_profile' })
        })
        // If API returned normalized names, propagate to client auth session for immediate UI
        if (syncRes.ok) {
          try {
            const payload = await syncRes.json().catch(() => ({}))
            const profile = payload?.user || {}
            const first_name = profile?.first_name || ''
            const last_name = profile?.last_name || ''
            const avatar_url = profile?.avatar_url || ''
            if (first_name || last_name || avatar_url) {
              const supabase = createClient()
              await supabase.auth.updateUser({
                data: {
                  ...(first_name ? { first_name } : {}),
                  ...(last_name ? { last_name } : {}),
                  ...(avatar_url ? { avatar_url } : {}),
                }
              })
            }
          } catch {}
        }
      } catch (e) {
        console.warn('Profile sync failed', e)
      }

      try {
        // 2) Merge guest cart data if any
        let guestItems = useCartStore.getState().items
        if (!guestItems || guestItems.length === 0) {
          // Fallback to persisted storage in case zustand state not hydrated yet
          try {
            const persisted = localStorage.getItem('tisco-cart-storage')
            if (persisted) {
              const parsed = JSON.parse(persisted)
              guestItems = parsed?.state?.items || []
            }
          } catch {}
        }

        if (Array.isArray(guestItems) && guestItems.length > 0) {
          const guest_cart = guestItems.map((it: { productId: string; quantity: number }) => ({
            id: it.productId,
            quantity: it.quantity,
          }))

          const res = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'merge_guest_data', guest_cart })
          })
          if (res.ok) {
            // Hydrate local store from server to avoid outbound sync deleting items
            try {
              const cartRes = await fetch('/api/cart', { cache: 'no-store' })
              if (cartRes.ok) {
                const payload = await cartRes.json()
                const arr: ServerCartItem[] = (payload?.data?.items ?? payload?.items ?? [])
                const mapped: CartItem[] = arr.map((it: ServerCartItem) => {
                  const p = it.products || {}
                  const imgs = Array.isArray(p.product_images) ? p.product_images : []
                  const main = (imgs.find((img: ServerProductImage) => img?.is_main)?.url) || p.image_url || ''
                  return {
                    id: String(it.id),
                    productId: String(it.product_id),
                    name: p.name ?? 'Product',
                    price: Number(p.price ?? 0),
                    quantity: Number(it.quantity ?? 0),
                    image_url: main,
                  }
                })
                // Protection: if server cart is empty but local has items (e.g., first load),
                // keep local cart and let outbound sync handle pushing to server.
                const currentLocalCount = useCartStore.getState().items.length
                if (mapped.length === 0 && currentLocalCount > 0) {
                  // skip overwriting local cart with empty server state
                } else {
                  setItemsFromServer(mapped)
                }
              }
            } catch {}
          } else {
            console.warn('Guest cart merge failed')
          }
        }
      } catch (e) {
        console.warn('Guest cart merge error', e)
      }
    }

    run()
  }, [isLoaded, isSignedIn, hasHydrated, setItemsFromServer])

  // Reset one-time guard on sign-out so next login merges again
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      hasSyncedRef.current = false
    }
  }, [isLoaded, isSignedIn])

  return null
}
