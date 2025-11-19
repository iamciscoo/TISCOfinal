'use client'

import { useMemo, useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

export type CategoryBarProps = {
  categories: Category[]
  className?: string
  onMobileCategorySelect?: () => void // Callback when category selected on mobile
}

// Map featured categories to provided hero images
const imageMap: Record<string, string> = {
  'electronics': '/shoppage/Electronics.png',
  'fashion': '/shoppage/Fashion.png',
  'clothing': '/shoppage/Clothing.jpeg',
  'home & garden': '/shoppage/home%20and%20garden.png',
  'rare finds': '/shoppage/rarefinds.png',
  'sports': '/shoppage/sports.png',
  'anime': '/shoppage/AnimeMerch.webp',
  'books': '/shoppage/Books.jpeg',
  'health': '/shoppage/health%20and%20beauty.png',
  'beauty': '/shoppage/health%20and%20beauty.png',
  'new': '/shoppage/New.png',
  'entertainment': '/shoppage/Entertainment.jpeg',
}

function pickImageFor(name: string): string | null {
  const key = (name || '').toLowerCase()
  const matchKey = Object.keys(imageMap).find(k => key.includes(k))
  return matchKey ? imageMap[matchKey] : null
}

export function CategoryBar({ categories, className, onMobileCategorySelect }: CategoryBarProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Preload all category images on mount
  useEffect(() => {
    const imagesToPreload = Object.values(imageMap)
    imagesToPreload.forEach(src => {
      const img = new window.Image()
      img.src = src
      // Image preloading happens automatically, no need to track state
    })
  }, [])

  // Choose a small curated set to mimic eBay row while using your actual categories
  const displayCategories = useMemo(() => {
    if (!categories?.length) return [] as Category[]

    // Prioritize by our image map order, then append remaining categories up to 10
    const prioritized: Category[] = []
    const used = new Set<string>()

    Object.keys(imageMap).forEach((k) => {
      const found = categories.find(c => (c.name || '').toLowerCase().includes(k))
      if (found) {
        const id = String(found.id)
        // Only add if not already added (prevents duplicates from multiple key matches)
        if (!used.has(id)) {
          prioritized.push(found)
          used.add(id)
        }
      }
    })

    for (const c of categories) {
      if (prioritized.length >= 10) break
      const id = String(c.id)
      if (!used.has(id)) {
        prioritized.push(c)
        used.add(id)
      }
    }

    return prioritized
  }, [categories])

  // Close on outside tap/click or Escape when mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return

    const handlePointer = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointer, { passive: true })
    document.addEventListener('touchstart', handlePointer, { passive: true })
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('touchstart', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [mobileMenuOpen])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Mobile Dropdown */}
      <div className="md:hidden w-full border rounded-xl bg-white relative">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-gray-800"
          aria-expanded={mobileMenuOpen}
          aria-controls="popular-categories-menu"
        >
          <span className="font-medium">Popular Categories</span>
          <svg
            className={cn('w-5 h-5 transition-transform', mobileMenuOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {/* Screen overlay to allow tap-outside close on mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {mobileMenuOpen && (
          <div id="popular-categories-menu" className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
            {displayCategories.map((cat) => (
              <Link
                key={String(cat.id)}
                href={`/products?category=${encodeURIComponent(String(cat.id))}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                onClick={() => {
                  setMobileMenuOpen(false)
                  // Trigger scroll callback for mobile category selection
                  if (onMobileCategorySelect) {
                    // Small delay to allow navigation to start before scroll
                    setTimeout(() => onMobileCategorySelect(), 100)
                  }
                }}
              >
                {(() => {
                  const img = pickImageFor(cat.name || '')
                  if (!img) return null
                  return (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100">
                      <Image 
                        src={img} 
                        alt={`${cat.name} icon`} 
                        fill 
                        className="object-cover" 
                        priority={true}
                        loading="eager"
                        unoptimized
                      />
                    </div>
                  )
                })()}
                <span className="font-medium text-gray-800">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Row */}
      <div className="hidden md:block w-full border rounded-xl bg-white">
        <div className="flex justify-between items-center px-4 md:px-6 py-4">
          {displayCategories.map((cat, index) => (
            <Fragment key={String(cat.id)}>
              {index > 0 && (
                <div className="h-4 w-px bg-gray-300 mx-2 hidden lg:block" aria-hidden="true" />
              )}
              <div
                className="relative"
                onMouseEnter={() => setActiveId(String(cat.id))}
                onMouseLeave={() => setActiveId(null)}
              >
                <Link
                  href={`/products?category=${encodeURIComponent(String(cat.id))}`}
                  className="text-sm md:text-base text-gray-800 hover:text-blue-700 whitespace-nowrap"
                >
                  {cat.name}
                </Link>

                {/* Desktop megamenu */}
                {activeId === String(cat.id) && (
                  <div 
                    className="hidden md:block absolute left-1/2 -translate-x-1/2 top-full z-50"
                    onMouseEnter={() => setActiveId(String(cat.id))}
                    onMouseLeave={() => setActiveId(null)}
                  >
                    {/* Invisible bridge to prevent gap */}
                    <div className="h-4 w-full" />
                    <div className="w-[800px] rounded-2xl shadow-2xl bg-white border p-8">
                      <div className="grid grid-cols-12 gap-6 items-stretch">
                        {/* Links */}
                        <div className="col-span-7 grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Explore</h4>
                            <ul className="space-y-2 text-sm">
                              <li>
                                <Link
                                  href={`/products?category=${encodeURIComponent(String(cat.id))}`}
                                  className="hover:text-blue-700"
                                >
                                  All {cat.name}
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href={`/search?category=${encodeURIComponent(String(cat.id))}`}
                                  className="hover:text-blue-700"
                                >
                                  Search {cat.name}
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href={`/deals?category=${encodeURIComponent(String(cat.id))}`}
                                  className="hover:text-blue-700"
                                >
                                  Deals in {cat.name}
                                </Link>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Quick links</h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                              <li>
                                <Link href="/products" className="hover:text-blue-700">All products</Link>
                              </li>
                              <li>
                                <Link href="/deals" className="hover:text-blue-700">All deals</Link>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Banner */}
                        <div className="col-span-5">
                          <div className="relative h-52 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
                            {(() => {
                              const img = pickImageFor(cat.name || '')
                              if (!img) return null
                              return (
                                <Image
                                  src={img}
                                  alt={`${cat.name} banner`}
                                  fill
                                  className="object-cover object-center"
                                  sizes="320px"
                                  priority={true}
                                  loading="eager"
                                  unoptimized
                                />
                              )
                            })()}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-transparent" />
                            <div className="absolute left-5 top-5">
                              <div className="text-xl font-bold text-gray-900 drop-shadow-sm">{cat.name}</div>
                            </div>
                            <div className="absolute left-5 bottom-5">
                              <Link
                                href={`/products?category=${encodeURIComponent(String(cat.id))}`}
                                className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-lg"
                              >
                                Shop now
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
