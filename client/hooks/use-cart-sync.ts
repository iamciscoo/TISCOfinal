'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useCartStore, type CartItem } from '@/lib/store'

// Sync local cart changes to server for signed-in users.
// Avoid loops by skipping immediately after server-driven hydrations.
export function useCartSync() {
  const { isLoaded, isSignedIn } = useUser()
  const items = useCartStore((s) => s.items)
  const lastServerHydrate = useCartStore((s) => s._lastServerHydrate)
  const hasHydrated = useCartStore((s) => s.hasHydrated)

  // Map of productId -> { id: server cart row id, quantity }
  const serverMapRef = useRef<Map<string, { id: string; quantity: number }>>(new Map())
  const lastHydrateTsRef = useRef<number>(0)
  const syncingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const signInAtRef = useRef<number>(0)
  const GRACE_MS = 1500

  // Initialize baseline from server
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      // Clear baseline when signed out
      serverMapRef.current.clear()
      lastHydrateTsRef.current = 0
      signInAtRef.current = 0
      return
    }

    // Record sign-in time to allow AuthSync to merge first
    if (signInAtRef.current === 0) {
      signInAtRef.current = Date.now()
    }

    const init = async () => {
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const map = new Map<string, { id: string; quantity: number }>()
        const arr: Array<{ id: string; product_id: string; quantity: number }> = data.items || []
        for (const it of arr) {
          map.set(String(it.product_id), { id: String(it.id), quantity: Number(it.quantity) || 0 })
        }
        serverMapRef.current = map
      } catch (e) {
        console.debug('[cart-sync] init baseline failed', e)
      }
    }

    init()
  }, [isLoaded, isSignedIn])

  // Main sync effect: watch local items and push diffs
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    // Wait until local storage has hydrated to avoid pushing empty local state
    if (!hasHydrated) return

    // If this change was triggered by server hydration, skip outbound sync
    if (lastServerHydrate && lastServerHydrate > (lastHydrateTsRef.current || 0)) {
      lastHydrateTsRef.current = lastServerHydrate
      // Refresh baseline to align with server state after SSE hydration
      ;(async () => {
        try {
          const res = await fetch('/api/cart', { cache: 'no-store' })
          if (!res.ok) return
          const data = await res.json()
          const map = new Map<string, { id: string; quantity: number }>()
          const arr: Array<{ id: string; product_id: string; quantity: number }> = data.items || []
          for (const it of arr) {
            map.set(String(it.product_id), { id: String(it.id), quantity: Number(it.quantity) || 0 })
          }
          serverMapRef.current = map
          console.debug('[cart-sync] refreshed baseline after server hydrate')
        } catch {}
      })()
      return
    }

    // Within grace window after sign-in, skip outbound sync to let AuthSync merge first
    if (signInAtRef.current && Date.now() - signInAtRef.current < GRACE_MS) {
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (syncingRef.current) return
      syncingRef.current = true
      try {
        const localMap = new Map<string, { item: CartItem; quantity: number }>()
        for (const it of items) localMap.set(it.productId, { item: it, quantity: it.quantity })

        const serverMap = serverMapRef.current

        // Compute diffs
        const toAdd: Array<{ productId: string; quantity: number }> = []
        const toUpdate: Array<{ serverId: string; productId: string; quantity: number }> = []
        const toDelete: Array<{ serverId: string; productId: string }> = []

        // Add/Update
        for (const [productId, { quantity }] of localMap.entries()) {
          const server = serverMap.get(productId)
          if (!server) {
            toAdd.push({ productId, quantity })
          } else if (server.quantity !== quantity) {
            toUpdate.push({ serverId: server.id, productId, quantity })
          }
        }
        // Delete
        for (const [productId, server] of serverMap.entries()) {
          if (!localMap.has(productId)) {
            toDelete.push({ serverId: server.id, productId })
          }
        }

        // Execute diffs (sequential to keep it simple and ordered)
        for (const a of toAdd) {
          try {
            const res = await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ product_id: a.productId, quantity: a.quantity })
            })
            if (res.ok) {
              const out = await res.json()
              const newItem = out.item as { id: string; product_id: string; quantity: number }
              serverMap.set(String(newItem.product_id), { id: String(newItem.id), quantity: Number(newItem.quantity) || 0 })
            } else if (res.status === 401) {
              break
            } else {
              console.warn('[cart-sync] add failed', a)
            }
          } catch (e) {
            console.warn('[cart-sync] add error', a, e)
          }
        }

        for (const u of toUpdate) {
          try {
            const res = await fetch(`/api/cart/${encodeURIComponent(u.serverId)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity: u.quantity })
            })
            if (res.ok) {
              serverMap.set(u.productId, { id: u.serverId, quantity: u.quantity })
            } else if (res.status === 401) {
              break
            } else {
              console.warn('[cart-sync] update failed', u)
            }
          } catch (e) {
            console.warn('[cart-sync] update error', u, e)
          }
        }

        for (const d of toDelete) {
          try {
            const res = await fetch(`/api/cart/${encodeURIComponent(d.serverId)}`, { method: 'DELETE' })
            if (res.ok) {
              serverMap.delete(d.productId)
            } else if (res.status === 401) {
              break
            } else {
              console.warn('[cart-sync] delete failed', d)
            }
          } catch (e) {
            console.warn('[cart-sync] delete error', d, e)
          }
        }

        // Keep the ref up to date
        serverMapRef.current = serverMap
        console.debug('[cart-sync] sync complete', { adds: toAdd.length, updates: toUpdate.length, deletes: toDelete.length })
      } finally {
        syncingRef.current = false
      }
    }, 250)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [isLoaded, isSignedIn, hasHydrated, items, lastServerHydrate])
}
