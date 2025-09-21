'use client'
 
// Sleek, compact promotional cards inspired by the provided mock.
// Desktop: 3-column grid. Mobile: horizontal snap slider.
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface PromoCard {
  id: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  imageSrc: string
  imageAlt: string
}

const promotionalCards: PromoCard[] = [
  {
    id: 'deals',
    title: 'Exclusive Deals & Offers',
    description: 'Save big with our discounts.',
    ctaText: 'Shop Deals',
    ctaLink: '/deals',
    imageSrc: '/homehero3.jpg',
    imageAlt: 'Discounted products'
  },
  {
    id: 'shop',
    title: 'Shop Smart, Live Better',
    description: 'Discover products that enhance your lifestyle.',
    ctaText: 'Start Shopping',
    ctaLink: '/products',
    imageSrc: '/homehero4.jpg',
    imageAlt: 'Ergonomic chair'
  },
  {
    id: 'gadgets',
    title: 'Anime & Manga Collection',
    description: 'Figures, accessories, and gear for true anime fans.',
    ctaText: 'Explore Anime',
    ctaLink: '/products?category=anime&query=anime',
    imageSrc: '/homehero5.webp',
    imageAlt: 'Keyboard and gadgets'
  }
]

export const PromotionalCards = () => {
  return (
    <section className="py-5 sm:py-10 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop/Tablet Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-3">
          {promotionalCards.map((card) => (
            <Link key={card.id} href={card.ctaLink} className="group block">
              <div
                className="flex items-center justify-between h-32 md:h-36 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 px-5 md:px-6 overflow-hidden transition-all hover:shadow-md"
              >
                {/* Text */}
                <div className="flex-1 pr-4">
                  <h3 className="text-gray-900 text-base md:text-lg font-semibold leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 hidden lg:block">
                    {card.description}
                  </p>
                  <span className="mt-3 inline-flex items-center text-blue-600 group-hover:text-blue-700 text-sm font-medium">
                    {card.ctaText}
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                {/* Image */}
                <div className="relative h-full w-28 md:w-32 lg:w-36 flex-shrink-0">
                  <div className="absolute inset-y-2 right-0 left-0 rounded-xl overflow-hidden">
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      fill
                      sizes="(max-width: 768px) 120px, 160px"
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* Mobile Slider */}
        <div className="md:hidden">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide">
            {promotionalCards.map((card) => (
              <Link key={card.id} href={card.ctaLink} className="group min-w-[90%] sm:min-w-[85%] snap-start">
                <div className="flex items-center justify-between h-36 sm:h-32 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 px-4 sm:px-5 overflow-hidden active:scale-[0.99] transition">
                  {/* Text */}
                  <div className="flex-1 pr-3 min-w-0">
                    <h3 className="text-gray-900 text-base sm:text-lg font-semibold leading-snug mb-1 break-words">
                      {card.title}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm mb-2 line-clamp-2 break-words">
                      {card.description}
                    </p>
                    <span className="inline-flex items-center text-blue-600 text-sm font-medium">
                      {card.ctaText}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </div>
                  {/* Image */}
                  <div className="relative h-full w-24 sm:w-28 flex-shrink-0">
                    <div className="absolute inset-y-2 right-0 left-0 rounded-xl overflow-hidden">
                      <Image
                        src={card.imageSrc}
                        alt={card.imageAlt}
                        fill
                        sizes="120px"
                        className="object-cover"
                        priority={false}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
