'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Tag, ArrowRight, Heart } from 'lucide-react'
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
    ctaLink: '/products?filter=new',
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

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000) // Change slide every 6 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

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
    <section className="relative h-[85vh] overflow-hidden bg-gray-900">
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
            className="object-cover"
            priority={index === 0}
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-4xl">
            {/* Slide Content */}
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <p className="text-blue-400 font-medium text-lg tracking-wide uppercase">
                  {heroSlides[currentSlide].subtitle}
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight font-chango">
                  {heroSlides[currentSlide].title}
                </h1>
              </div>
              
              <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-3xl">
                {heroSlides[currentSlide].description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 font-semibold"
                  asChild
                >
                  <Link href={heroSlides[currentSlide].ctaLink}>
                    {React.createElement(heroSlides[currentSlide].ctaIcon, { className: "h-5 w-5 mr-2" })}
                    {heroSlides[currentSlide].cta}
                  </Link>
                </Button>
                
                {currentSlide === 0 && (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6 text-white border-white bg-black/20 hover:bg-white hover:text-gray-900 backdrop-blur-sm"
                    asChild
                  >
                    <Link href="/about">
                      Learn More
                    </Link>
                  </Button>
                )}
              </div>

              {/* Brand Message for Main Slide */}
              {currentSlide === 0 && (
                <div className="pt-8 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                    <div>
                      <div className="text-2xl font-bold text-white">No BS</div>
                      <div className="text-sm text-gray-300">Straight talk, honest pricing</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">Fast</div>
                      <div className="text-sm text-gray-300">Quick delivery, no delays</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">Simple</div>
                      <div className="text-sm text-gray-300">Easy shopping, no hassle</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
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
