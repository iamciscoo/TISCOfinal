'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, ShoppingCart, Heart } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { PriceDisplay } from '@/components/PriceDisplay'
import { Product } from '@/lib/types'
import { getImageUrl, getCategoryName, isInStock } from '@/lib/shared-utils'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list'
  showAddToCart?: boolean
  showWishlist?: boolean
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'grid',
  showAddToCart = true,
  showWishlist = true
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
        price: product.price,
        image_url: imageUrl
      }, 1)
    } finally {
      setIsLoading(false)
    }
  }

  const imageUrl = getImageUrl(product)
  const categoryName = getCategoryName(product)
  const inStock = isInStock(product)

  if (variant === 'list') {
    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-0">
          <div className="flex">
            <div className="relative w-48 h-48 flex-shrink-0">
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
            
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary">{categoryName}</Badge>
                {showWishlist && (
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
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

              {(product.rating || product.reviews_count) && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {product.reviews_count && (
                    <span className="text-sm text-gray-500">({product.reviews_count})</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <PriceDisplay 
                  price={product.price} 
                  className="text-2xl font-bold text-blue-600" 
                />
                {showAddToCart && isInStock(product) && (
                  <Button 
                    onClick={handleAddToCart}
                    disabled={isLoading}
                    className="ml-4"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isLoading ? 'Adding...' : 'Add to Cart'}
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
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <Link href={`/products/${product.id}`}>
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          
                          {!inStock && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              Out of Stock
            </Badge>
          )}
          
          {showWishlist && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            >
              <Heart className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="p-4">
          <Badge variant="secondary" className="mb-2 text-xs">
            {categoryName}
          </Badge>
          
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold mb-2 hover:text-blue-600 line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {(product.rating || product.reviews_count) && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < (product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              {product.reviews_count && (
                <span className="text-xs text-gray-500">({product.reviews_count})</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <PriceDisplay 
              price={product.price} 
              className="text-lg font-bold text-blue-600" 
            />
            {showAddToCart && isInStock(product) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddToCart}
                disabled={isLoading}
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
