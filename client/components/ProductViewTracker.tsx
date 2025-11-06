'use client'

import { useEffect } from 'react'

interface ProductViewTrackerProps {
  productId: string
}

/**
 * Component that tracks product page views
 * Increments view count when product page is viewed
 */
export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  useEffect(() => {
    // Track view after a short delay to ensure it's a genuine page view
    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`/api/products/${productId}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        console.log('[ProductViewTracker] View tracked for product:', productId)
      } catch (error) {
        // Silently fail to not disrupt user experience
        console.error('[ProductViewTracker] Failed to track view:', error)
      }
    }, 1500) // 1.5 second delay to filter out accidental clicks

    return () => clearTimeout(timeoutId)
  }, [productId])

  // This component renders nothing
  return null
}
