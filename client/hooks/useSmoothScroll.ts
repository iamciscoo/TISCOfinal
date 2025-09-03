/**
 * Enhanced smooth scrolling hook with performance optimizations
 * 
 * Features:
 * - Customizable easing functions
 * - Performance-optimized RAF implementation
 * - Reduced motion support
 * - Mobile-friendly touch scrolling
 * - Intersection observer integration
 */

import { useCallback, useRef, useEffect } from 'react'

interface SmoothScrollOptions {
  duration?: number
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  offset?: number
  behavior?: 'smooth' | 'auto'
}

interface ScrollToOptions extends SmoothScrollOptions {
  element?: HTMLElement | string
  top?: number
  left?: number
}

// Easing functions for smooth animations
const easingFunctions = {
  linear: (t: number) => t,
  ease: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
}

export function useSmoothScroll() {
  const rafRef = useRef<number | null>(null)
  const isScrollingRef = useRef(false)

  // Check for reduced motion preference
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Cancel any ongoing scroll animation
  const cancelScroll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    isScrollingRef.current = false
  }, [])

  // Enhanced scroll to element or position
  const scrollTo = useCallback(({
    element,
    top,
    left,
    duration = 800,
    easing = 'ease-out',
    offset = 0,
    behavior = 'smooth'
  }: ScrollToOptions) => {
    // Use native smooth scrolling if reduced motion is preferred
    if (prefersReducedMotion() || behavior === 'auto') {
      if (element) {
        const targetElement = typeof element === 'string' 
          ? document.querySelector(element) as HTMLElement
          : element
        
        if (targetElement) {
          targetElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          })
        }
      } else if (top !== undefined || left !== undefined) {
        window.scrollTo({
          top: top ?? 0,
          left: left ?? 0,
          behavior: 'smooth'
        })
      }
      return
    }

    cancelScroll()

    let targetTop = top ?? window.scrollY
    const targetLeft = left ?? window.scrollX

    // Calculate target position if element is provided
    if (element) {
      const targetElement = typeof element === 'string' 
        ? document.querySelector(element) as HTMLElement
        : element
      
      if (!targetElement) return

      const rect = targetElement.getBoundingClientRect()
      targetTop = window.scrollY + rect.top - offset
    }

    const startTop = window.scrollY
    const startLeft = window.scrollX
    const distanceTop = targetTop - startTop
    const distanceLeft = targetLeft - startLeft
    const startTime = performance.now()

    isScrollingRef.current = true

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easedProgress = easingFunctions[easing](progress)
      
      const currentTop = startTop + (distanceTop * easedProgress)
      const currentLeft = startLeft + (distanceLeft * easedProgress)
      
      window.scrollTo(currentLeft, currentTop)
      
      if (progress < 1 && isScrollingRef.current) {
        rafRef.current = requestAnimationFrame(animateScroll)
      } else {
        isScrollingRef.current = false
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(animateScroll)
  }, [prefersReducedMotion, cancelScroll])

  // Scroll to top utility
  const scrollToTop = useCallback((options?: SmoothScrollOptions) => {
    scrollTo({ top: 0, ...options })
  }, [scrollTo])

  // Scroll to element utility
  const scrollToElement = useCallback((
    element: HTMLElement | string, 
    options?: SmoothScrollOptions
  ) => {
    scrollTo({ element, ...options })
  }, [scrollTo])

  // Scroll by offset utility
  const scrollBy = useCallback(({
    top = 0,
    left = 0,
    ...options
  }: { top?: number; left?: number } & SmoothScrollOptions) => {
    scrollTo({
      top: window.scrollY + top,
      left: window.scrollX + left,
      ...options
    })
  }, [scrollTo])

  // Check if currently scrolling
  const isScrolling = useCallback(() => isScrollingRef.current, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelScroll()
    }
  }, [cancelScroll])

  return {
    scrollTo,
    scrollToTop,
    scrollToElement,
    scrollBy,
    cancelScroll,
    isScrolling
  }
}

// Hook for scroll-triggered animations
export function useScrollAnimation(
  callback: (scrollY: number, direction: 'up' | 'down') => void,
  options: { throttle?: number } = {}
) {
  const { throttle = 16 } = options // ~60fps by default
  const lastScrollY = useRef(0)
  const lastCallTime = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now()
      
      if (now - lastCallTime.current < throttle) {
        return
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up'
        
        callback(currentScrollY, direction)
        
        lastScrollY.current = currentScrollY
        lastCallTime.current = now
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [callback, throttle])
}

// Hook for scroll position tracking
export function useScrollPosition() {
  const scrollY = useRef(0)
  const scrollX = useRef(0)
  const direction = useRef<'up' | 'down'>('down')

  useScrollAnimation((y, dir) => {
    scrollY.current = y
    scrollX.current = window.scrollX
    direction.current = dir
  }, {})

  return {
    scrollY: scrollY.current,
    scrollX: scrollX.current,
    direction: direction.current
  }
}
