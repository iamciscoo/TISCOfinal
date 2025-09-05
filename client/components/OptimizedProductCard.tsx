'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { LazyImage } from '@/components/shared/LazyImage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { getDealPricing } from '@/lib/shared-utils'
import { useCartStore } from '@/lib/cart-store'
import { preloadRoute } from '@/lib/performance'

interface Product {
  id: string
  name: string
  price: number
  sale_price?: number | null
  image_url?: string
  product_images?: Array<{
    url: string
    is_main: boolean
    sort_order: number
  }>
  stock_quantity: number
  category?: {
    name: string
  }
}

interface OptimizedProductCardProps {
  product: Product
  priority?: boolean
}

const OptimizedProductCardComponent: React.FC<OptimizedProductCardProps> = ({ 
  product, 
  priority = false 
}) => {
  const addToCart = useCartStore((state) => state.addToCart)
  const { finalPrice, originalPrice, discount } = getDealPricing(product.price, product.sale_price)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: finalPrice,
      quantity: 1,
      image_url: product.product_images?.find(img => img.is_main)?.url || product.image_url || '/circular.svg'
    })
  }

  const handleMouseEnter = () => {
    preloadRoute(`/products/${product.id}`)
  }

  const imageUrl = product.product_images?.find(img => img.is_main)?.url || product.image_url || '/circular.svg'

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <Link 
        href={`/products/${product.id}`}
        onMouseEnter={handleMouseEnter}
        className="block"
      >
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <LazyImage
            src={imageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              -{discount}%
            </div>
          )}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-2">
            {product.category && (
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {product.category.name}
              </p>
            )}
            
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900">
                {formatCurrency(finalPrice)}
              </span>
              {originalPrice > finalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>
            
            <Button 
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full mt-2"
              size="sm"
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

export const OptimizedProductCard = memo(OptimizedProductCardComponent)
