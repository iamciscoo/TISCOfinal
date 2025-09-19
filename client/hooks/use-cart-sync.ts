'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCartStore } from '@/lib/store'

/**
 * Simplified cart persistence hook
 * Only handles local storage persistence when user authentication changes
 * All cart management is now client-side only
 */
export function useCartSync() {
  const { user } = useAuth()
  const setOwnerId = useCartStore((s) => s.setOwnerId)
  const clearCart = useCartStore((s) => s.clearCart)

  // Track cart ownership to prevent cross-user cart contamination
  useEffect(() => {
    const currentOwnerId = useCartStore.getState().ownerId
    
    if (user?.id) {
      // User signed in
      if (currentOwnerId && currentOwnerId !== user.id) {
        // Different user signed in - clear previous user's cart
        clearCart()
      }
      // Associate cart with this user
      setOwnerId(user.id)
    } else {
      // User signed out - keep owner ID to preserve cart for same user returning
      // Only clear owner if we want to allow guest cart accumulation
      // setOwnerId(null) - commented out to preserve cart for returning user
    }
  }, [user?.id, setOwnerId, clearCart])
}
