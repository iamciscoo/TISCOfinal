'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { PriceDisplay } from '@/components/PriceDisplay'
import { Product } from '@/lib/types'
import { getImageUrl, getCategoryName, isInStock, getDealPricing } from '@/lib/shared-utils'
 

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list'
  showAddToCart?: boolean
  showWishlist?: boolean
  compact?: boolean
  className?: string
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'grid',
  showAddToCart = true,
  compact = false,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      addItem({
        id: String(product.id),
        name: product.name,
        price: currentPrice,
        image_url: imageUrl
      }, 1)
    } finally {
      setIsLoading(false)
    }
  }

  const imageUrl = getImageUrl(product)
  const categoryName = getCategoryName(product)
  const inStock = isInStock(product)
  const { isDeal, currentPrice, originalPrice } = getDealPricing(product)

  if (variant === 'list') {
    return (
      <Card className={cn("hover:shadow-lg transition-all duration-300 overflow-visible", className)}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            <div className="relative w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0">
              <Link href={`/products/${product.id}`}>
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover rounded-l-lg"
                />
              </Link>
                              {!inStock && (
                <Badge className="absolute top-2 left-2 bg-red-500">
                  Out of Stock
                </Badge>
              )}
            </div>
            
            <div className="flex-1 p-4 sm:p-6 min-w-0">
              <div className="flex items-start mb-2">
                <Badge variant="secondary">{categoryName}</Badge>
              </div>
              
              <Link href={`/products/${product.id}`}>
                <h3 className="text-xl font-semibold mb-2 hover:text-blue-600">
                  {product.name}
                </h3>
              </Link>
              
              {product.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>
              )}


              <div className="flex items-center justify-between gap-3 flex-wrap">
                {isDeal ? (
                  <div className="flex items-center gap-2">
                    <PriceDisplay 
                      price={currentPrice} 
                      className="text-2xl font-bold text-red-600" 
                    />
                    {originalPrice && originalPrice > currentPrice && (
                      <PriceDisplay 
                        price={originalPrice} 
                        className="text-sm text-gray-500 line-through" 
                      />
                    )}
                  </div>
                ) : (
                  <PriceDisplay 
                    price={currentPrice} 
                    className="text-2xl font-bold text-blue-600" 
                  />
                )}
                {showAddToCart && isInStock(product) && (
                  <Button 
                    onClick={handleAddToCart}
                    disabled={isLoading}
                    size="sm"
                    className="ml-4 shrink-0 whitespace-nowrap"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{isLoading ? 'Adding...' : 'Add to Cart'}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid variant (default)
  return (
    <Card className={cn("group hover:shadow-xl transition-all duration-300 overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className={cn("relative overflow-hidden", compact ? "aspect-[3/2]" : "aspect-square") }>
          <Link href={`/products/${product.id}`}>
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className={cn(
                compact ? "object-contain bg-gray-50" : "object-cover",
                "group-hover:scale-105 transition-transform duration-300"
              )}
            />
          </Link>
          
                          {!inStock && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              Out of Stock
            </Badge>
          )}
          
          
        </div>
        
        <div className={cn(compact ? "p-2 sm:p-3" : "p-4") }>
          <Badge variant="secondary" className="hidden sm:inline-flex mb-2 text-xs">
            {categoryName}
          </Badge>
          
          <Link href={`/products/${product.id}`}>
            <h3 className={cn(
              "font-semibold mb-1 hover:text-blue-600",
              compact ? "text-[13px] sm:text-sm md:text-base line-clamp-1 sm:line-clamp-2" : "text-base line-clamp-2"
            ) }>
              {product.name}
            </h3>
          </Link>

          
          <div className="flex items-end justify-between gap-2 mt-2">
            <div className="flex-1 min-w-0">
              {isDeal ? (
                <div className="flex flex-col gap-0.5">
                  <PriceDisplay 
                    price={currentPrice} 
                    className={cn("font-bold text-red-600 leading-tight", compact ? "text-sm sm:text-base" : "text-base sm:text-lg")}
                  />
                  {originalPrice && originalPrice > currentPrice && (
                    <PriceDisplay 
                      price={originalPrice} 
                      className={cn("text-gray-500 line-through leading-tight", compact ? "text-[10px] sm:text-xs" : "text-xs")}
                    />
                  )}
                </div>
              ) : (
                <PriceDisplay 
                  price={currentPrice} 
                  className={cn("font-bold text-blue-600 leading-tight", compact ? "text-sm sm:text-base" : "text-base sm:text-lg")}
                />
              )}
            </div>
            {showAddToCart && isInStock(product) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-shrink-0 h-8 w-8 p-0"
                aria-label={isLoading ? 'Adding to cart...' : 'Add to cart'}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
