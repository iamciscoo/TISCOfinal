'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  cta: string
}

const heroSlides: HeroSlide[] = [
  {
    id: 'pc-building',
    title: 'Custom PC Building',
    subtitle: 'Build Your Dream Machine',
    description: 'Professional custom PC assembly and configuration tailored to your specific needs and budget. From gaming rigs to workstations, we bring your vision to life.',
    image: '/services/pcbuild.jpeg',
    cta: 'Book PC Build'
  },
  {
    id: 'office-setup',
    title: 'Desktop/Office Space Setup',
    subtitle: 'Transform Your Workspace',
    description: 'Complete workstation and office space configuration for optimal productivity and ergonomics. Multi-monitor setups, cable management, and more.',
    image: '/services/desksetup.jpeg',
    cta: 'Book Office Setup'
  },
  {
    id: 'software-install',
    title: 'Computer/Software Installation',
    subtitle: 'Professional Setup & Configuration',
    description: 'Expert installation and configuration of operating systems, software suites, and system optimization. Get your computer running at peak performance.',
    image: '/services/software.jpeg',
    cta: 'Book Installation'
  }
]

export const ServicesHeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const heroRef = useRef<HTMLElement | null>(null)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  // Scroll-driven effect (parallax + clip), mirrors other hero implementations
  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    let raf = 0
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const update = () => {
      const max = Math.max(1, window.innerHeight * 0.5)
      const y = window.scrollY
      const p = Math.min(1, Math.max(0, y / max))
      el.style.setProperty('--p', String(prefersReduced ? 0 : p))
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    const onResize = () => update()

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const scrollToBooking = () => {
    const bookingSection = document.getElementById('booking-form')
    if (bookingSection) {
      // Enhanced smooth scrolling with offset for fixed header
      const headerOffset = 80
      const elementPosition = bookingSection.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section
      ref={heroRef}
      className="relative h-[48vh] sm:h-[55vh] lg:h-[60vh] overflow-hidden bg-gray-900
                 mx-4 sm:mx-6 lg:mx-8 mt-2 md:mt-4
                 rounded-2xl md:rounded-3xl shadow-sm ring-1 ring-black/10"
      style={{
        containerType: 'inline-size',
        clipPath: 'inset(0 0 calc(var(--p,0) * 24vh) 0 round 1.5rem)',
        marginBottom: 'calc(var(--p,0) * -24vh)',
        transition: 'clip-path 150ms ease-out, margin-bottom 150ms ease-out',
      } as React.CSSProperties}
    >
      {/* Background Images */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            sizes="100vw"
            className="object-cover rounded-2xl md:rounded-3xl object-center pointer-events-none select-none will-change-transform"
            style={{
              transform: 'translateY(calc(var(--p,0) * 7vh)) scale(calc(1 + var(--p,0) * 0.04))',
              willChange: 'transform',
            }}
            priority={index === 0}
            onError={(e) => {
              console.error(`Failed to load image: ${slide.image}`)
              // Fallback to a local placeholder image to prevent blank hero
              try {
                e.currentTarget.src = '/services/customservice.webp'
              } catch {
                // no-op
              }
            }}
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50 rounded-2xl md:rounded-3xl" />
        </div>
      ))}

      {/* Content Overlay */}
      <div 
        className="relative z-10 h-full flex items-center"
        style={{
          transform: 'translateY(calc(var(--p,0) * -2vh))',
          opacity: 'calc(1 - var(--p,0) * 0.05)',
          willChange: 'transform, opacity',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Slide Content */}
            <div className="text-white space-y-2 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <p className="text-blue-400 font-medium text-sm sm:text-base md:text-lg tracking-wide uppercase">
                  {heroSlides[currentSlide].subtitle}
                </p>
                <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-6xl font-bold leading-tight font-chango">
                  {heroSlides[currentSlide].title}
                </h1>
              </div>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed max-w-2xl">
                {heroSlides[currentSlide].description}
              </p>

              <div className="pt-2 sm:pt-4">
                <Button 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-blue-600 hover:bg-blue-700"
                  onClick={scrollToBooking}
                >
                  {heroSlides[currentSlide].cta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-110' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ 
            width: `${((currentSlide + 1) / heroSlides.length) * 100}%` 
          }}
        />
      </div>
    </section>
  )
}
