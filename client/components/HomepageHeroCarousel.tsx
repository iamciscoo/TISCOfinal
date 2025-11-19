'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Tag, ArrowRight, Heart, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  cta: string
  ctaLink: string
  ctaIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const heroSlides: HeroSlide[] = [
  {
    id: 'main',
    title: 'No Bullshit. No Excuses. No Fluff.',
    subtitle: 'Just What You Need.',
    description: 'Skip the corporate nonsense. Get quality products delivered fast without the bureaucratic runaround. We keep it simple, honest, and efficient.',
    image: '/homehero.jpg',
    cta: 'Shop Now',
    ctaLink: '/products',
    ctaIcon: ShoppingBag
  },
  {
    id: 'whats-new',
    title: 'What\'s New',
    subtitle: 'Fresh Arrivals Weekly',
    description: 'New products added every week. No outdated inventory, no stale selections. Just the latest and greatest, straight to your door.',
    image: '/homehero2.jpg',
    cta: 'See What\'s New',
    ctaLink: '/products?category=new',
    ctaIcon: Sparkles
  },
  {
    id: 'promotions',
    title: 'Real Deals',
    subtitle: 'No Fake Discounts',
    description: 'Genuine promotions, not inflated prices marked down. When we say sale, we mean it. No games, no gimmicks, just honest savings.',
    image: '/homehero3.jpg',
    cta: 'View Promotions',
    ctaLink: '/deals',
    ctaIcon: Tag
  },
  {
    id: 'services',
    title: 'Professional Services',
    subtitle: 'Done Right, First Time',
    description: 'PC builds, office setups, software installation. No upselling, no hidden fees. Just professional work at fair prices.',
    image: '/homehero4.jpg',
    cta: 'Our Services',
    ctaLink: '/services',
    ctaIcon: ArrowRight
  },
  {
    id: 'anime',
    title: "It wouldn't be TISCO without a bit of anime",
    subtitle: 'Shop top otaku merch',
    description: 'From collectibles to apparel, discover our curated selection of anime merchandise. Quality products for true fans.',
    image: '/homehero5.webp',
    cta: 'Shop Anime',
    ctaLink: '/products?category=anime&query=anime',
    ctaIcon: Heart
  }
]

export const HomepageHeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const heroRef = useRef<HTMLElement | null>(null)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  // Scroll-driven effect (parallax + clip), mirrors ShopHero implementation
  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    let raf = 0
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const update = () => {
      // Reach full compression after ~50% viewport scroll for snappier transition
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

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-gray-900
                 w-full
                 rounded-2xl md:rounded-3xl shadow-sm ring-1 ring-black/10
                 h-[28vh] sm:h-[45vh] md:h-[50vh] lg:h-[55vh] xl:h-[60vh]"
      style={{
        containerType: 'inline-size',
        clipPath: 'inset(0 0 calc(var(--p,0) * 30vh) 0 round 1.5rem)',
        // Pull the next section upward by the same amount we clip, removing the perceived gap
        marginBottom: 'calc(var(--p,0) * -30vh)',
        transition: 'clip-path 150ms ease-out, margin-bottom 150ms ease-out',
      } as React.CSSProperties}
    >
      {/* Welcome Message */}
      <div className="absolute top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-20">
        <Link
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className="flex items-center gap-1 sm:gap-2 whitespace-nowrap leading-none text-white bg-black/50 sm:bg-black/30 backdrop-blur-sm px-7 py-1.5 sm:px-5 sm:py-2.5 rounded-full ring-1 ring-white/20 transition-opacity hover:opacity-90"
        >
          <span className="text-sm sm:text-sm font-medium">karibu!!!</span>
          <Image
            src="/icons/instagram.png"
            alt="Instagram"
            width={16}
            height={16}
            className="h-4 w-4 sm:h-4.5 sm:w-4.5 object-contain"
          />
          <span className="text-sm sm:text-sm font-medium">Join the family.</span>
        </Link>
      </div>
      {/* Background Images */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            sizes="100vw"
            className="object-cover object-center pointer-events-none select-none will-change-transform"
            style={{
              transform: 'translateY(calc(var(--p,0) * 4vh)) scale(calc(1 + var(--p,0) * 0.02))',
              willChange: 'transform',
            }}
            priority={index === 0}
            loading={index <= 1 ? 'eager' : 'lazy'}
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ))}

      {/* Content Overlay */}
      <div
        className="absolute inset-0 flex flex-col items-start justify-center z-10"
        style={{
          transform: 'translateY(calc(var(--p,0) * -1vh))',
          opacity: 'calc(1 - var(--p,0) * 0.3)',
          willChange: 'transform, opacity',
        }}
      >
        {/* Slide Content */}
        <div className="text-white space-y-2 sm:space-y-4 md:space-y-6 max-w-4xl px-4 sm:px-6">
          <div className="space-y-1 sm:space-y-3">
            <p className="text-blue-400 font-medium text-xs sm:text-base md:text-lg tracking-wide uppercase">
              {heroSlides[currentSlide].subtitle}
            </p>
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight font-chango">
              {heroSlides[currentSlide].title}
            </h1>
          </div>

          <p className="hidden sm:block text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-2xl">
            {heroSlides[currentSlide].description}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1 sm:pt-2">
            <Button
              className="text-sm sm:text-lg px-4 py-3 sm:px-8 sm:py-6 bg-blue-600 hover:bg-blue-700 font-semibold rounded-full"
              asChild
            >
              <Link href={heroSlides[currentSlide].ctaLink}>
                {React.createElement(heroSlides[currentSlide].ctaIcon, { className: "h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" })}
                {heroSlides[currentSlide].cta}
              </Link>
            </Button>

            {currentSlide === 0 && (
              <Button
                size="lg"
                variant="outline"
                className="hidden sm:flex text-sm sm:text-lg px-4 py-3 sm:px-8 sm:py-6 text-white border-white bg-black/20 hover:bg-white hover:text-gray-900 backdrop-blur-sm rounded-full"
                asChild
              >
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            )}
          </div>

          {/* Brand Message for Main Slide - Hidden on mobile */}
          {currentSlide === 0 && (
            <div className="hidden lg:block pt-2 lg:pt-3 border-t border-white/20 mt-2">
              <div className="grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-base lg:text-lg xl:text-xl font-bold text-white">No BS</div>
                  <div className="text-xs lg:text-sm text-gray-300">Straight talk, honest pricing</div>
                </div>
                <div>
                  <div className="text-base lg:text-lg xl:text-xl font-bold text-white">Fast</div>
                  <div className="text-xs lg:text-sm text-gray-300">Quick delivery, no delays</div>
                </div>
                <div>
                  <div className="text-base lg:text-lg xl:text-xl font-bold text-white">Simple</div>
                  <div className="text-xs lg:text-sm text-gray-300">Easy shopping, no hassle</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 lg:left-6 top-1/2 transform -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 lg:right-6 top-1/2 transform -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-2 sm:space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${index === currentSlide
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

      {/* Pause/Play Button */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all duration-200 backdrop-blur-sm cursor-pointer"
        aria-label={isAutoPlaying ? 'Pause carousel' : 'Play carousel'}
        title={isAutoPlaying ? 'Pause' : 'Play'}
      >
        {isAutoPlaying ? (
          <Pause className="h-4 w-4 sm:h-4 sm:w-4" />
        ) : (
          <Play className="h-4 w-4 sm:h-4 sm:w-4" />
        )}
      </button>
    </section>
  )
}
