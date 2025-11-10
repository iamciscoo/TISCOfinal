'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface PromoCard {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string
  size: 'large' | 'medium' | 'small'
  ctaText: string
  href: string
  textColor?: 'light' | 'dark'
}

const promoCards: PromoCard[] = [
  {
    id: 'workspace-optimization',
    title: 'Complete Workspace Setup',
    subtitle: 'DESK SOLUTIONS',
    description: 'Professional office and gaming setup services',
    image: '/services/desk.jpeg',
    size: 'large',
    ctaText: 'Setup Service',
    href: '/services?service=office-setup#booking-form',
    textColor: 'light'
  },
  {
    id: 'productivity-boost',
    title: 'Products',
    subtitle: 'SHOP NOW',
    description: 'Complete range of tech products',
    image: '/services/nolimits.jpeg',
    size: 'medium',
    ctaText: 'Shop Now',
    href: '/products?category=8e81df36-63e2-430f-bf81-feee911a2069',
    textColor: 'light'
  },
  {
    id: 'tech-repair-service',
    title: 'Device Repair',
    description: 'Expert diagnostics and repair services',
    image: '/services/repairs.jpeg',
    size: 'small',
    ctaText: 'Book Repair',
    href: '/services?service=software-installation#booking-form',
    textColor: 'light'
  },
  {
    id: 'gaming-systems',
    title: 'Game Installation',
    description: 'Professional game setup and PC optimization services',
    image: '/services/gameinstall.jpeg',
    size: 'small',
    ctaText: 'Install Games',
    href: '/services?service=software-installation#booking-form',
    textColor: 'light'
  }
]

interface ServicesPromoGridProps {
  showHeader?: boolean
}

export function ServicesPromoGrid({ showHeader = true }: ServicesPromoGridProps) {
  return (
    <section className="mb-16">
      {showHeader && (
        <div className="text-left mb-12">
          <div className="mb-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              <span className="relative inline-block">
                <span className="relative z-10">Power Up</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-gradient-to-r from-orange-500 to-orange-600 transform -skew-y-1 opacity-30"></span>
              </span>
              {" "}Your Experience
            </h2>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
            Essential services designed to{" "}
            <span className="font-semibold bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">elevate your lifestyle</span>
          </p>
        </div>
      )}

      {/* Desktop Grid */}
      <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-6 h-[600px]">
        {promoCards.map((card) => {
          const gridClass = 
            card.size === 'large' ? 'col-span-2 row-span-2' :
            card.size === 'medium' ? 'col-span-2 row-span-1' :
            'col-span-1 row-span-1'
          
          return (
            <Link 
              key={card.id} 
              href={card.href}
              className={`${gridClass} group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  {card.subtitle && (
                    <p className="text-xs font-semibold tracking-wider text-white mb-2 uppercase drop-shadow">
                      {card.subtitle}
                    </p>
                  )}
                  
                  <h3 className={`font-bold mb-3 leading-tight text-white drop-shadow-lg ${
                    card.size === 'large' ? 'text-2xl xl:text-3xl' : 
                    card.size === 'medium' ? 'text-lg xl:text-xl' : 
                    'text-base xl:text-lg'
                  }`}>
                    {card.title}
                  </h3>
                  
                  <p className="text-sm mb-4 text-gray-100 drop-shadow">
                    {card.description}
                  </p>
                  
                  <div className="flex items-center gap-2 font-semibold text-sm transition-colors drop-shadow" style={{color: '#60a5fa'}}>
                    {card.ctaText}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Tablet Grid */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4 md:gap-6">
        {promoCards.map((card) => (
          <Link 
            key={card.id} 
            href={card.href}
            className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
              card.size === 'large' ? 'col-span-2 h-72 md:h-80' : 'h-56 md:h-64'
            }`}
          >
            <div className="relative w-full h-full">
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                style={{ objectFit: 'cover' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                {card.subtitle && (
                  <p className="text-xs font-semibold tracking-wider text-white mb-1 md:mb-2 uppercase drop-shadow">
                    {card.subtitle}
                  </p>
                )}
                
                <h3 className={`font-bold mb-2 md:mb-3 leading-tight text-white drop-shadow-lg ${
                  card.size === 'large' ? 'text-lg md:text-xl' : 'text-base md:text-lg'
                }`}>
                  {card.title}
                </h3>
                
                <p className="text-xs md:text-sm mb-3 md:mb-4 text-gray-100 drop-shadow">
                  {card.description}
                </p>
                
                <div className="flex items-center gap-2 font-semibold text-sm transition-colors drop-shadow" style={{color: '#60a5fa'}}>
                  {card.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Large Main Card */}
        <Link 
          href={promoCards[0].href}
          className="block group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-[420px]"
        >
          <div className="relative w-full h-full">
            <Image
              src={promoCards[0].image}
              alt={promoCards[0].title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Shadow overlay only at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              {promoCards[0].subtitle && (
                <p className="text-xs font-semibold tracking-wider text-white mb-2 uppercase drop-shadow">
                  {promoCards[0].subtitle}
                </p>
              )}
              
              <h3 className="text-xl font-bold mb-3 leading-tight text-white drop-shadow-lg">
                {promoCards[0].title}
              </h3>
              
              <p className="text-sm mb-4 text-gray-100 drop-shadow">
                {promoCards[0].description}
              </p>
              
              <div className="flex items-center gap-2 font-semibold text-sm transition-colors drop-shadow" style={{color: '#60a5fa'}}>
                {promoCards[0].ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Link>

        {/* Medium Card */}
        <Link 
          href={promoCards[1].href}
          className="block group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-48"
        >
          <div className="relative w-full h-full">
            <Image
              src={promoCards[1].image}
              alt={promoCards[1].title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Shadow overlay only at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              {promoCards[1].subtitle && (
                <p className="text-xs font-semibold tracking-wider text-white mb-2 uppercase drop-shadow">
                  {promoCards[1].subtitle}
                </p>
              )}
              
              <h3 className="text-lg font-bold mb-2 leading-tight text-white drop-shadow-lg">
                {promoCards[1].title}
              </h3>
              
              <p className="text-sm mb-4 text-gray-100 drop-shadow">
                {promoCards[1].description}
              </p>
              
              <div className="flex items-center gap-2 font-semibold text-sm transition-colors drop-shadow" style={{color: '#60a5fa'}}>
                {promoCards[1].ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Link>

        {/* Two Equal Cards */}
        <div className="grid grid-cols-2 gap-4">
          {promoCards.slice(2).map((card) => (
            <Link 
              key={card.id} 
              href={card.href}
              className="block group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-60"
            >
              <div className="relative w-full h-full">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Shadow overlay only at bottom - smaller for compact cards */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  {card.subtitle && (
                    <p className="text-xs font-semibold tracking-wider text-white mb-1 uppercase drop-shadow">
                      {card.subtitle}
                    </p>
                  )}
                  
                  <h3 className="text-sm font-bold mb-2 leading-tight text-white drop-shadow-lg">
                    {card.title}
                  </h3>
                  
                  <p className="text-xs mb-3 text-gray-100 drop-shadow line-clamp-2">
                    {card.description}
                  </p>
                  
                  <div className="flex items-center gap-1 font-semibold text-xs transition-colors drop-shadow" style={{color: '#60a5fa'}}>
                    {card.ctaText}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
