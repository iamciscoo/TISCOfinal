/**
 * ScrollOptimizer Component
 * 
 * A utility component that applies scroll performance optimizations
 * to its children and provides scroll-related functionality.
 */

"use client"

import React, { useEffect, useRef } from 'react'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

interface ScrollOptimizerProps {
  children: React.ReactNode
  className?: string
  enableParallax?: boolean
  enableMomentum?: boolean
  enableHorizontal?: boolean
  onScroll?: (scrollY: number, direction: 'up' | 'down') => void
}

export function ScrollOptimizer({
  children,
  className = '',
  enableParallax = false,
  enableMomentum = true,
  enableHorizontal = false,
  onScroll
}: ScrollOptimizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollTo } = useSmoothScroll()

  useEffect(() => {
    if (!onScroll) return

    let lastScrollY = 0
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const direction = currentScrollY > lastScrollY ? 'down' : 'up'
          onScroll(currentScrollY, direction)
          lastScrollY = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onScroll])

  const getOptimizedClasses = () => {
    const classes = ['scroll-container']
    
    if (enableMomentum) classes.push('momentum-scroll')
    if (enableParallax) classes.push('parallax-element')
    if (enableHorizontal) classes.push('horizontal-scroll')
    
    return classes.join(' ')
  }

  return (
    <div
      ref={containerRef}
      className={`${getOptimizedClasses()} ${className}`}
    >
      {children}
    </div>
  )
}

// Scroll to top button component
export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = React.useState(false)
  const { scrollToTop } = useSmoothScroll()

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  if (!isVisible) return null

  return (
    <button
      onClick={() => scrollToTop({ duration: 600, easing: 'ease-out' })}
      className="fixed bottom-8 right-8 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="Scroll to top"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  )
}

// Enhanced link component with smooth scrolling
interface SmoothLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  offset?: number
  duration?: number
  onClick?: () => void
}

export function SmoothLink({
  href,
  children,
  className = '',
  offset = 80,
  duration = 800,
  onClick
}: SmoothLinkProps) {
  const { scrollToElement } = useSmoothScroll()

  const handleClick = (e: React.MouseEvent) => {
    // Handle anchor links
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.substring(1)
      scrollToElement(`#${targetId}`, { offset, duration, easing: 'ease-out' })
    }
    
    onClick?.()
  }

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}
