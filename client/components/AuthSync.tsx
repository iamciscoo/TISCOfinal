'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCartStore } from '@/lib/store'

// Automatically sync authenticated user to local DB on login and merge guest cart
export default function AuthSync() {
  const { user, loading, session } = useAuth()
  const isLoaded = !loading
  const isSignedIn = !!user
  const hasHydrated = useCartStore((state) => state.hasHydrated)
  const ownerId = useCartStore((state) => state.ownerId)
  const setOwnerId = useCartStore((state) => state.setOwnerId)
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !hasHydrated || hasSyncedRef.current) return
    hasSyncedRef.current = true

    const run = async () => {
      try {
        // 1) Ensure profile exists/updated in local DB
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_profile' })
        })
        // Profile sync completed via API - no client-side updates needed
      } catch (e) {
        console.warn('Profile sync failed', e)
      }

      try {
        // Ensure local cart belongs to the current authenticated user
        if (ownerId && user && ownerId !== user.id) {
          // Different user's local cart detected — clear to avoid cross-account bleed
          console.log('LOGIN DEBUG: Clearing cart for different user', { ownerId, userId: user.id })
          useCartStore.getState().clearCart()
        } else if (ownerId && user && ownerId === user.id) {
          // Same user returning - keep their cart
          console.log('LOGIN DEBUG: Same user returning, keeping cart', { ownerId, userId: user.id })
        }
        // Mark current owner
        if (user) setOwnerId(user.id)

        // Cart is now purely client-side - no server merging needed
        console.log('LOGIN DEBUG: Cart ownership set, client-side persistence active')
      } catch (e) {
        console.warn('Cart ownership setup error', e)
      }
    }

    run()
  }, [isLoaded, isSignedIn, hasHydrated, ownerId, setOwnerId, user, session?.access_token])

  // Reset one-time guard on sign-out so next login merges again
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      hasSyncedRef.current = false
      // Keep ownerId on sign-out to preserve cart for returning user
      // setOwnerId(null) - commented out to maintain cart persistence
    }
  }, [isLoaded, isSignedIn])

  return null
}
