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
    id: 'my-space',
    title: 'Your Personal Space',
    description: 'Products curated just for you, exactly the way you like them.',
    ctaText: 'Visit My Space',
    ctaLink: '/account/my-space',
    imageSrc: '/Myspace.jpeg',
    imageAlt: 'Personalized shopping experience'
  },
  {
    id: 'deals',
    title: 'Exclusive Deals & Offers',
    description: 'Save big with our discounts. This is where the good stuff lives',
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
    <section className="py-3 sm:py-10 bg-white relative overflow-hidden mb-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop/Tablet Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {promotionalCards.map((card, index) => (
            <Link 
              key={card.id} 
              href={card.ctaLink} 
              className="group block"
            >
              <div
                className="flex flex-col justify-between rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-3 md:p-4 lg:p-5 xl:p-6 gap-2 transition-all hover:shadow-md h-full min-h-[240px] md:min-h-[260px] lg:min-h-[280px]"
              >
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 text-xs md:text-sm lg:text-base xl:text-lg font-semibold leading-tight line-clamp-2 break-words">
                    {card.title}
                  </h3>
                  <p className="text-gray-500 text-[10px] md:text-xs lg:text-sm mt-0.5 md:mt-1 hidden lg:block line-clamp-2">
                    {card.description}
                  </p>
                  <span className="mt-1.5 md:mt-2 lg:mt-3 inline-flex items-center text-blue-600 group-hover:text-blue-700 text-[10px] md:text-xs lg:text-sm font-medium whitespace-nowrap">
                    {card.ctaText}
                    <ArrowRight className="ml-0.5 md:ml-1 h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                {/* Image at bottom to avoid text clipping */}
                <div className="relative w-full h-20 md:h-24 lg:h-28 xl:h-32">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 320px, (min-width: 768px) 240px, 100vw"
                      className="object-cover"
                      priority={index === 0}
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* Mobile Slider */}
        <div className="md:hidden">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pl-4 -mr-4 pr-4 scrollbar-hide">
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
                        loading="lazy"
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
