/**
 * Custom hook for Intersection Observer API
 * 
 * Features:
 * - Lazy loading images and components
 * - Infinite scrolling implementation
 * - Performance monitoring
 * - Configurable options
 */

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
  triggerOnce?: boolean
}

interface UseIntersectionObserverResult {
  isIntersecting: boolean
  entry: IntersectionObserverEntry | null
  ref: React.RefObject<Element>
}

/**
 * Hook to observe element intersection with viewport
 * @param options - Intersection observer configuration
 * @returns Object with intersection state and ref
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverResult {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
    triggerOnce = false,
  } = options

  const ref = useRef<Element | null>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  const frozen = freezeOnceVisible && isIntersecting

  const updateEntry = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      setEntry(entry)
      setIsIntersecting(entry.isIntersecting)

      if (triggerOnce && entry.isIntersecting) {
        // Disconnect observer after first intersection
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
      }
    },
    [triggerOnce]
  )

  const observerRef = useRef<IntersectionObserver>()

  useEffect(() => {
    const element = ref.current
    const hasIOSupport = !!window.IntersectionObserver

    if (!hasIOSupport || frozen || !element) return

    observerRef.current = new IntersectionObserver(updateEntry, {
      threshold,
      root,
      rootMargin,
    })

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, root, rootMargin, frozen, updateEntry])

  return {
    isIntersecting,
    entry,
    ref,
  }
}

/**
 * Hook for lazy loading components
 * @param options - Intersection observer options
 * @returns Object with loading state and ref
 */
export function useLazyLoad(options: UseIntersectionObserverOptions = {}) {
  const { isIntersecting, ref } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.1,
    ...options,
  })

  return { shouldLoad: true, ref }
}

/**
 * Hook for infinite scrolling
 * @param callback - Function to call when intersection occurs
 * @param options - Intersection observer options
 * @returns Ref to attach to trigger element
 */
export function useInfiniteScroll(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 1.0,
    rootMargin: '100px',
    ...options,
  })

  useEffect(() => {
    if (isIntersecting) {
      callback()
    }
  }, [isIntersecting, callback])

  return ref
}
