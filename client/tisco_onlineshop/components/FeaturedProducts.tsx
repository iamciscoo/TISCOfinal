'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { getProducts } from '@/lib/database'
import type { Product } from '@/lib/types'
import { PriceDisplay } from '@/components/PriceDisplay'
import { getImageUrl } from '@/lib/shared-utils'

export const FeaturedProducts = () => {
  const { addItem, openCart } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const data = await getProducts(6)
        if (isMounted) setProducts(data || [])
      } catch (e) {
        console.error('Failed to load featured products', e)
      }
    })()
    return () => { isMounted = false }
  }, [])

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of the best products with great deals and excellent reviews.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden relative">
              <Link href={`/products/${String(product.id)}`} className="absolute inset-0 z-10" aria-label={product.name}>
                <span aria-hidden="true" className="absolute inset-0" />
              </Link>
              <div className="relative">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <Image
                    src={getImageUrl(product)}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Badges intentionally removed */}

                {/* Quick Add hover overlay removed for cleaner layout */}
              </div>

              <CardContent className="p-6">
                {/* Category */}
                <div className="text-sm text-gray-500 mb-2">{product.categories?.name || 'Product'}</div>

                {/* Product Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  <span>{product.name}</span>
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor((product.rating ?? 4.5))
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {typeof product.rating === 'number' && (
                    <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <PriceDisplay price={product.price} className="text-2xl font-bold text-gray-900" />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    className="w-full relative z-20"
                    size="sm"
                    onClick={() => {
                      addItem({
                        id: String(product.id),
                        name: product.name,
                        price: product.price,
                        image_url: getImageUrl(product)
                      }, 1)
                      openCart()
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Quick Add
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full relative z-20">
                    <Link href={`/products/${String(product.id)}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Products Button */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link href="/products">
              View All Products
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
