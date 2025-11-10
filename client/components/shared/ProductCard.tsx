'use client'

import { useState, useCallback, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { truncateWithLineBreaks } from '@/lib/text-utils'
import { PriceDisplay } from '@/components/PriceDisplay'
import { Product } from '@/lib/types'
import { getImageUrl, getCategoryName, isInStock, getDealPricing } from '@/lib/shared-utils'
import { useCartStore } from '@/lib/store'
import { getProductUrl } from '@/lib/url-utils'

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
  const [imageError, setImageError] = useState(false)
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
              <Link href={getProductUrl(product.name, String(product.id))} aria-label={`View ${product.name} details`} className="relative block w-full h-full">
                <Image
                  src={imageError ? '/circular.svg' : imageUrl}
                  alt={`${product.name} product image`}
                  fill
                  className="object-cover rounded-l-lg transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 128px, 192px"
                  onError={() => {
                    console.error(`Failed to load product image for ${product.name}: ${imageUrl}`)
                    setImageError(true)
                  }}
                  unoptimized={imageError}
                />
              </Link>
              {/* Stock Status Badge */}
              {!inStock && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white z-10">
                  Out of Stock
                </Badge>
              )}
              
              {/* New Badge */}
              {product.is_new && (
                <Badge className="absolute bottom-1 left-1 bg-black/80 text-white font-medium text-[10px] sm:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1 z-10 rounded backdrop-blur-sm">
                  New
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
              <Link href={getProductUrl(product.name, String(product.id))} aria-label={`View ${product.name} details`}>
                <h3 className="text-xl font-semibold mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              
              {/* Product Description */}
              {product.description && (
                <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                  {truncateWithLineBreaks(product.description, 100)}
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
      <CardContent className={cn(compact ? "p-1.5 sm:p-2" : "p-3", "flex h-full flex-col")}>
          {/* Product Image Container */}
        <Link href={getProductUrl(product.name, String(product.id))} aria-label={`View ${product.name} details`} className={cn(
          "aspect-square bg-gray-100 rounded-md overflow-hidden relative block", 
          compact ? "mb-1 sm:mb-2" : "mb-3"
        )}>
          <Image
            src={imageError ? '/circular.svg' : imageUrl}
            alt={`${product.name} product image`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes={compact ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            onError={() => {
              console.error(`Failed to load product image for ${product.name}: ${imageUrl}`)
              setImageError(true)
            }}
            unoptimized={imageError}
          />
          
          {/* Stock Status Badge */}
          {!inStock && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white z-10">
              Out of Stock
            </Badge>
          )}
          
          {/* New Badge */}
          {product.is_new && (
            <Badge className={cn(
              "absolute bottom-1 left-1 bg-black/80 text-white font-medium z-10 rounded backdrop-blur-sm",
              compact 
                ? "text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5" 
                : "text-[10px] sm:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1"
            )}>
              New
            </Badge>
          )}
        </Link>
        
        {/* Product Details */}
        <div className={cn(compact ? "px-1 py-0 sm:px-1.5 sm:py-1" : "p-3", "flex flex-col flex-1")}> 
          {/* Category Badge */}
          <Badge variant="secondary" className="hidden sm:inline-flex mb-0.5 text-xs">
            {categoryName}
          </Badge>
          
          {/* Product Name */}
          <Link href={getProductUrl(product.name, String(product.id))} aria-label={`View ${product.name} details`}>
            <h3 className={cn(
              "font-semibold mb-0 hover:text-blue-600 transition-colors leading-tight",
              compact ? "text-[11px] sm:text-sm md:text-base line-clamp-1 sm:line-clamp-2" : "text-base line-clamp-2"
            )}>
              {product.name}
            </h3>
          </Link>

          {/* Price */}
          <div className={cn(compact ? "mt-0.5 sm:mt-1" : "mt-0")}>
            <div className="min-w-0">
              {isDeal ? (
                <div className="flex flex-col gap-0">
                  <PriceDisplay 
                    price={currentPrice} 
                    className={cn("font-bold text-red-600 leading-tight", compact ? "text-xs sm:text-sm" : "text-base sm:text-lg")}
                  />
                  {originalPrice && originalPrice > currentPrice && (
                    <PriceDisplay 
                      price={originalPrice} 
                      className={cn("text-gray-500 line-through leading-tight", compact ? "text-[9px] sm:text-xs" : "text-xs")}
                    />
                  )}
                </div>
              ) : (
                <PriceDisplay 
                  price={currentPrice} 
                  className={cn("font-bold text-blue-600 leading-tight", compact ? "text-xs sm:text-sm" : "text-base sm:text-lg")}
                />
              )}
            </div>
          </div>

          {/* Bottom-aligned Add to Cart */}
          {showAddToCart && inStock && (
            <div className={cn("mt-auto", compact ? "pt-0.5 sm:pt-1" : "pt-0.5")}>
              <Button 
                onClick={handleAddToCart}
                disabled={isLoading}
                size="sm"
                variant="secondary"
                className={cn(
                  "w-full rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200",
                  compact ? "h-7 sm:h-8 text-[10px] sm:text-xs" : "h-8 sm:h-9"
                )}
                aria-label={isLoading ? 'Adding to cart...' : `Add ${product.name} to cart`}
              >
                <ShoppingCart className={cn(compact ? "h-2.5 w-2.5 mr-0.5 sm:h-3 sm:w-3 sm:mr-1" : "h-3 w-3 mr-1")} />
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
