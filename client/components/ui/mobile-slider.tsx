'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface MobileSliderProps {
  children: React.ReactNode[]
  className?: string
  showDots?: boolean
  showArrows?: boolean
  itemsPerView?: number
}

export function MobileSlider({ 
  children, 
  className = '', 
  showDots = true, 
  showArrows = true,
  itemsPerView = 1 
}: MobileSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTouch, setIsTouch] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const totalSlides = Math.ceil(children.length / itemsPerView)

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)))
  }

  const nextSlide = () => {
    goToSlide(currentIndex + 1)
  }

  const prevSlide = () => {
    goToSlide(currentIndex - 1)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouch(true)
    startX.current = e.touches[0].clientX
    if (sliderRef.current) {
      scrollLeft.current = sliderRef.current.scrollLeft
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouch || !sliderRef.current) return
    
    const x = e.touches[0].clientX
    const walk = (x - startX.current) * 2
    sliderRef.current.scrollLeft = scrollLeft.current - walk
  }

  const handleTouchEnd = () => {
    if (!isTouch || !sliderRef.current) return
    
    setIsTouch(false)
    const slideWidth = sliderRef.current.offsetWidth / itemsPerView
    const newIndex = Math.round(sliderRef.current.scrollLeft / slideWidth)
    goToSlide(newIndex)
  }

  useEffect(() => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.offsetWidth / itemsPerView
      sliderRef.current.scrollTo({
        left: currentIndex * slideWidth,
        behavior: 'smooth'
      })
    }
  }, [currentIndex, itemsPerView])

  return (
    <div className={`relative ${className}`}>
      {/* Slider Container */}
      <div
        ref={sliderRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0 snap-start"
            style={{ width: `${100 / itemsPerView}%` }}
          >
            <div className="px-2">
              {child}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm"
            onClick={prevSlide}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm"
            onClick={nextSlide}
            disabled={currentIndex === totalSlides - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalSlides > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
