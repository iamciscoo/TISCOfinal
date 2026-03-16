'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getScrollTarget, scrollToTop } from '@/lib/scroll-utils'

interface BackToTopButtonProps {
  threshold?: number
}

export function BackToTopButton({ threshold = 480 }: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const target = getScrollTarget()

    if (!target) {
      return
    }

    const handleScroll = () => {
      const scrollTop = target instanceof Window ? target.scrollY : target.scrollTop
      setIsVisible(scrollTop > threshold)
    }

    handleScroll()
    target.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      target.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  if (!isVisible) {
    return null
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="fixed left-4 z-[60] h-11 rounded-full border border-gray-200 bg-white/95 px-3 text-gray-800 shadow-lg backdrop-blur md:hidden"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
      onClick={() => scrollToTop('smooth')}
      aria-label="Back to top"
      data-testid="back-to-top-button"
    >
      <ArrowUp className="mr-1 h-4 w-4" />
      Top
    </Button>
  )
}
