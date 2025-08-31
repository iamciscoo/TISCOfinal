'use client'

import { useState, useCallback, memo } from 'react'
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

/**
 * ProductCard component displays product information in grid or list layout
 * 
 * Features:
 * - Responsive design with grid/list variants
 * - Deal pricing with discount display
 * - Stock status indicators
 * - Add to cart functionality with loading states
 * - Optimized images with proper alt text
 * - Accessible keyboard navigation
 */

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  variant = 'grid',
  showAddToCart = true,
  compact = false,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  
  // Pre-calculate values to avoid recalculation on re-renders
  const imageUrl = getImageUrl(product)
  const categoryName = getCategoryName(product)
  const inStock = isInStock(product)
  const { isDeal, currentPrice, originalPrice } = getDealPricing(product)

  // Memoized add to cart handler to prevent unnecessary re-renders
  const handleAddToCart = useCallback(async () => {
    if (isLoading || !inStock) return
    
    setIsLoading(true)
    try {
      // Simulate API call delay for better UX feedback
      await new Promise(resolve => setTimeout(resolve, 300))
      
      addItem({
        id: String(product.id),
        name: product.name,
        price: currentPrice,
        image_url: imageUrl
      }, 1)
    } catch (error) {
      console.error('Failed to add item to cart:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, inStock, addItem, product.id, product.name, currentPrice, imageUrl])

  // List variant rendering
  if (variant === 'list') {
    return (
      <Card className={cn("hover:shadow-lg transition-all duration-300 overflow-visible group", className)}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Product Image */}
            <div className="relative w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0">
              <Link href={`/products/${product.id}`} aria-label={`View ${product.name} details`}>
                <Image
                  src={imageUrl}
                  alt={`${product.name} product image`}
                  fill
                  className="object-cover rounded-l-lg transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 128px, 192px"
                />
              </Link>
              {/* Stock Status Badge */}
              {!inStock && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                  Out of Stock
                </Badge>
              )}
            </div>
            
            {/* Product Information */}
            <div className="flex-1 p-4 sm:p-6 min-w-0">
              {/* Category Badge */}
              <div className="flex items-start mb-2">
                <Badge variant="secondary" className="text-xs">{categoryName}</Badge>
              </div>
              
              {/* Product Name */}
              <Link href={`/products/${product.id}`} aria-label={`View ${product.name} details`}>
                <h3 className="text-xl font-semibold mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              
              {/* Product Description */}
              {product.description && (
                <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                  {product.description}
                </p>
              )}

              {/* Price and Actions */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Pricing Display */}
                <div className="flex-1 min-w-0">
                  {isDeal ? (
                    <div className="flex items-center gap-2 flex-wrap">
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
                </div>
                
                {/* Add to Cart Button */}
                {showAddToCart && inStock && (
                  <Button 
                    onClick={handleAddToCart}
                    disabled={isLoading}
                    size="sm"
                    className="shrink-0 whitespace-nowrap transition-all"
                    aria-label={isLoading ? 'Adding to cart...' : `Add ${product.name} to cart`}
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
    <Card className={cn("group hover:shadow-xl transition-all duration-300 overflow-hidden h-full", className)}>
      <CardContent className="p-0 flex h-full flex-col">
        {/* Product Image Container */}
        <div className={cn("relative overflow-hidden", "aspect-square")}>
          <Link href={`/products/${product.id}`} aria-label={`View ${product.name} details`}>
            <Image
              src={imageUrl}
              alt={`${product.name} product image`}
              fill
              className={cn(
                compact ? "object-contain bg-gray-50" : "object-cover",
                "group-hover:scale-105 transition-transform duration-300"
              )}
              sizes={compact ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            />
          </Link>
          
          {/* Stock Status Badge */}
          {!inStock && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              Out of Stock
            </Badge>
          )}
        </div>
        
        {/* Product Details */}
        <div className={cn(compact ? "p-1 sm:p-2" : "p-3", "flex flex-col flex-1")}> 
          {/* Category Badge */}
          <Badge variant="secondary" className="hidden sm:inline-flex mb-0.5 text-xs">
            {categoryName}
          </Badge>
          
          {/* Product Name */}
          <Link href={`/products/${product.id}`} aria-label={`View ${product.name} details`}>
            <h3 className={cn(
              "font-semibold mb-0 hover:text-blue-600 transition-colors",
              compact ? "text-[12px] sm:text-sm md:text-base line-clamp-1 sm:line-clamp-2" : "text-base line-clamp-2"
            )}>
              {product.name}
            </h3>
          </Link>

          {/* Price */}
          <div className="mt-0.5">
            <div className="min-w-0">
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
          </div>

          {/* Bottom-aligned Add to Cart */}
          {showAddToCart && inStock && (
            <div className="mt-auto pt-1">
              <Button 
                onClick={handleAddToCart}
                disabled={isLoading}
                size="sm"
                variant="secondary"
                className="w-full rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 py-1.5"
                aria-label={isLoading ? 'Adding to cart...' : `Add ${product.name} to cart`}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Export memoized component for better performance
export const ProductCard = memo(ProductCardComponent)
