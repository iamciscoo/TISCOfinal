"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/shared/ProductCard"
import type { Product } from "@/lib/types"

// Simple shuffle for random selection each load
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function NewArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Fetch a modest batch and filter client-side for robust compatibility
        const ts = Date.now()
        const res = await fetch(`/api/products?limit=50&_t=${ts}`, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        })
        if (!res.ok) throw new Error("Failed to fetch products")
        const json = await res.json()
        const data: Product[] = Array.isArray(json?.data) ? json.data : json

        // Filter by 'is_new' flag OR category named/slugged 'new'
        const newItems = (data || []).filter((p: Product) => {
          if (p?.is_new) return true
          const cats = (p as { categories?: { category?: { name?: string; slug?: string } }[] }).categories || []
          return cats?.some((c: { category?: { name?: string; slug?: string } }) => {
            const nm = (c?.category?.name || "").toString().toLowerCase()
            const sg = (c?.category?.slug || "").toString().toLowerCase()
            return nm === "new" || sg === "new"
          })
        })

        // Randomize and take up to 7
        const picked = shuffle(newItems).slice(0, 7)
        if (mounted) setProducts(picked)
      } catch (e) {
        console.error("[NewArrivals] load error:", e)
        if (mounted) setProducts([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const hasProducts = products.length > 0
  const showArrows = !loading && products.length > 7
  const desktopCols = Math.min(Math.max(products.length, 1), 7)

  const handleScroll = (dir: "left" | "right") => {
    const el = scrollerRef.current
    if (!el) return
    const amount = el.clientWidth * 0.85
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }

  const ctaHref = useMemo(() => "/products?category=new&query=New", [])

  return (
    <section aria-labelledby="new-arrivals-heading" className="py-8 sm:py-12 bg-white w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top banner with image and CTA */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center mb-6 sm:mb-8">
          <div className="md:col-span-5 relative rounded-xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
            <Image
              src="/newarrivals.png"
              alt="New Arrivals"
              width={1280}
              height={720}
              className="w-full h-48 sm:h-56 md:h-64 object-cover"
              priority={false}
            />
          </div>
          <div className="md:col-span-7">
            <h2 id="new-arrivals-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              New <span className="relative inline-block"><span className="relative z-10">Arrivals</span><span className="absolute bottom-1 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-600 opacity-30 -skew-y-1"></span></span>
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-5">Fresh picks just in. Explore the latest additions handpicked for you.</p>
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href={ctaHref} aria-label="Shop New Arrivals">
                Shop New Arrivals
              </Link>
            </Button>
          </div>
        </div>

        {/* Product slider */}
        <div className="relative">
          {/* Desktop arrows */}
          {showArrows && (
            <>
              <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                <button
                  type="button"
                  onClick={() => handleScroll("left")}
                  className="h-10 w-10 grid place-items-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 hover:bg-white transition"
                  aria-label="Scroll left"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700"><path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                </button>
              </div>
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                <button
                  type="button"
                  onClick={() => handleScroll("right")}
                  className="h-10 w-10 grid place-items-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 hover:bg-white transition"
                  aria-label="Scroll right"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700"><path fill="currentColor" d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
                </button>
              </div>
            </>
          )}

          <div
            ref={scrollerRef}
            className="pl-4 -mr-4 pr-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:pb-0 md:overflow-x-hidden md:grid md:mx-0 md:px-0"
            style={{ gridTemplateColumns: `repeat(${desktopCols}, minmax(0, 1fr))` }}
          >
            {loading && (
              <div className="w-full col-span-7 grid grid-cols-2 md:grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!loading && hasProducts && (
              <>
                {products.map((product, idx) => (
                  <div
                    key={product.id || idx}
                    className="min-w-[78%] md:min-w-0 md:w-auto snap-start transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <ProductCard product={product} compact className="rounded-xl border border-gray-100" />
                  </div>
                ))}
              </>
            )}

            {!loading && !hasProducts && (
              <div className="w-full text-center text-gray-600 py-8 md:col-span-full">
                New items will appear here soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default NewArrivalsSection
