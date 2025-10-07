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
    // More strict checks to prevent calls when user is not truly authenticated
    if (!isLoaded || !isSignedIn || !user || !session || !hasHydrated || hasSyncedRef.current) return
    
    // Additional check: ensure we have a valid session with access token
    if (!session.access_token || session.expires_at && session.expires_at < Date.now() / 1000) {
      return
    }
    
    hasSyncedRef.current = true

    const run = async () => {
      try {
        // 1) Ensure profile exists/updated in local DB
        // Add retry logic for auth state synchronization
        const retries = 3
        let lastError: Error | null = null
        
        for (let i = 0; i < retries; i++) {
          try {
            // Double-check session is still valid before making the call
            if (!session?.access_token) {
              return
            }
            
            const response = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ action: 'sync_profile' }),
              // Suppress console errors for failed requests
              signal: AbortSignal.timeout(10000) // 10s timeout
            })
            
            if (response.status === 401) {
              // Auth not ready - this is expected, fail silently
              // Don't retry for 401 as it means auth is not available
              return
            }
            
            if (response.ok) {
              // Success - profile synced
              break
            }
            
            // For other errors, retry with backoff
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000))
              continue
            }
            
            break // Exit retry loop after final attempt
          } catch (err) {
            // Network error or timeout - fail silently
            // Don't retry network errors as they're unlikely to resolve quickly
            return
          }
        }
        
        // Fail silently - auth sync is not critical since user is already authenticated
        if (lastError) {
          // Don't throw or log - user experience is not affected
          return
        }
      } catch {
        // Suppress errors - auth sync failure doesn't affect user experience
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
