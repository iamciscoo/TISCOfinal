'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useCartStore } from '@/lib/store'

// Automatically sync Clerk user to local DB on login and merge guest cart
export default function AuthSync() {
  const { isLoaded, isSignedIn } = useUser()
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasSyncedRef.current) return
    hasSyncedRef.current = true

    const run = async () => {
      try {
        // 1) Ensure profile exists/updated in local DB
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_profile' })
        })
      } catch (e) {
        console.warn('Profile sync failed', e)
      }

      try {
        // 2) Merge guest cart data if any
        let guestItems = items
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
            // Clear local cart after successful merge to prevent duplicates
            clearCart()
          } else {
            console.warn('Guest cart merge failed')
          }
        }
      } catch (e) {
        console.warn('Guest cart merge error', e)
      }
    }

    run()
  }, [isLoaded, isSignedIn, items, clearCart])

  return null
}
