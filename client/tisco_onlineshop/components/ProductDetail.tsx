'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  ZoomIn
} from 'lucide-react'
import Image from 'next/image'
import { Product } from '@/lib/types'
import { PriceDisplay } from '@/components/PriceDisplay'
import { getImageUrl } from '@/lib/shared-utils'
import { getProductsByCategory } from '@/lib/database'
import { ProductCard } from '@/components/shared/ProductCard'

interface ProductDetailProps {
  product: Product
}

export const ProductDetail = ({ product }: ProductDetailProps) => {
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  
  const { addItem, openCart } = useCartStore()

  // Load related products by category
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        if (!product.category_id) {
          if (isMounted) setRelatedProducts([])
          return
        }
        const data = await getProductsByCategory(String(product.category_id))
        if (!isMounted) return
        const filtered = (data || []).filter(p => String(p.id) !== String(product.id))
        setRelatedProducts(filtered.slice(0, 4))
      } catch (e) {
        console.error('Failed to load related products', e)
      }
    }
    load()
    return () => { isMounted = false }
  }, [product.category_id, product.id])

  // Use real product images from database, fallback to main image and placeholder
  const productImages = product.product_images && product.product_images.length > 0
    ? product.product_images
        .sort((a, b) => {
          if (a.is_main && !b.is_main) return -1
          if (!a.is_main && b.is_main) return 1
          return (a.sort_order || 0) - (b.sort_order || 0)
        })
        .map(img => img.url)
    : [getImageUrl(product) || '/circular.svg']

  const rating = product.rating || 4.5
  const reviewCount = product.reviews_count || 127

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, Math.min(product.stock_quantity || 999, quantity + change)))
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    
    try {
      addItem({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image_url: getImageUrl(product) || '/circular.svg'
      }, quantity)
      
      // Open cart sidebar to show the added item
      openCart()
      
      // Reset quantity to 1 after adding
      setQuantity(1)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <Link href={`/categories/${product.category_id}`} className="hover:text-blue-600">
          {product.categories?.name || 'Category'}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {productImages[selectedImageIndex] ? (
              <Image
                src={productImages[selectedImageIndex]}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                fill
                className="object-cover transition-opacity duration-300"
                onLoadingComplete={() => setImageLoading(false)}
                onLoadStart={() => setImageLoading(true)}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={selectedImageIndex === 0}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-gray-400 text-lg">No Image</div>
              </div>
            )}
            
            {/* Loading overlay */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* Zoom Button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 left-4 w-8 h-8 p-0 opacity-80 hover:opacity-100"
              title="Zoom image"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            {/* Image Navigation */}
            {productImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
                  onClick={() => setSelectedImageIndex(Math.min(productImages.length - 1, selectedImageIndex + 1))}
                  disabled={selectedImageIndex === productImages.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Share Button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 w-8 h-8 p-0 opacity-80 hover:opacity-100"
              title="Share product"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            {/* Image counter */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                {selectedImageIndex + 1} / {productImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {productImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative aspect-square bg-gray-100 rounded-md cursor-pointer border-2 transition-all hover:border-blue-400 ${
                    selectedImageIndex === index ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                    sizes="(max-width: 768px) 25vw, 12vw"
                  />
                  {/* Index indicator */}
                  <div className={`absolute top-1 right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium ${
                    selectedImageIndex === index 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-white opacity-60'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Product Title & Category */}
          <div>
            <div className="text-sm text-blue-600 font-medium mb-2">
              {product.categories?.name || 'Electronics'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {rating} ({reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-gray-900">
                <PriceDisplay price={product.price} />
              </span>
            </div>
            <p className="text-sm text-green-600 font-medium">
              Free shipping on orders over <PriceDisplay price={50} />
            </p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {(product.stock_quantity || 0) > 0 ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">
                  In Stock ({product.stock_quantity || 0} available)
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          <Separator />

          {/* Product Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || 'This is a high-quality product designed to meet your needs. With excellent craftsmanship and attention to detail, this item offers great value and performance.'}
            </p>
          </div>

          <Separator />

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-1 text-center min-w-[3rem]">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stock_quantity || 999)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleAddToCart}
                className="flex-1 h-12 text-lg"
                disabled={product.stock_quantity === 0 || isAddingToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                onClick={handleWishlistToggle}
                className="h-12 w-12 p-0"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
              </Button>
            </div>

            <Button variant="outline" className="w-full h-12">
              Buy Now
            </Button>
          </div>

          <Separator />

          {/* Product Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Free Delivery</div>
                <div className="text-xs text-gray-600">Orders over $50</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm font-medium">Warranty</div>
                <div className="text-xs text-gray-600">1 Year Coverage</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm font-medium">Easy Returns</div>
                <div className="text-xs text-gray-600">30 Day Policy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Reviews Summary */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-6">Customer Reviews</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">{rating}</div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.floor(rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600">Based on {reviewCount} reviews</div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-8">{stars}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${stars === 5 ? 60 : stars === 4 ? 25 : stars === 3 ? 10 : stars === 2 ? 3 : 2}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {stars === 5 ? 76 : stars === 4 ? 32 : stars === 3 ? 13 : stars === 2 ? 4 : 2}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sample Reviews */}
            {[
              {
                id: 1,
                name: "Sarah Johnson",
                rating: 5,
                date: "2 days ago",
                verified: true,
                review: "Absolutely love this product! The quality exceeded my expectations and it arrived faster than promised. Highly recommend!"
              },
              {
                id: 2,
                name: "Mike Chen",
                rating: 4,
                date: "1 week ago",
                verified: true,
                review: "Great value for money. Works exactly as described. Only minor issue was the packaging could be better, but the product itself is excellent."
              },
              {
                id: 3,
                name: "Emily Davis",
                rating: 5,
                date: "2 weeks ago",
                verified: false,
                review: "This is my second purchase of this item. Consistent quality and great customer service. Will definitely buy again!"
              }
            ].map((review) => (
              <div key={review.id} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{review.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{review.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.review}</p>
              </div>
            ))}

            {/* Load More Reviews */}
            <div className="text-center pt-6">
              <Button variant="outline" className="px-8">
                Load More Reviews
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.length > 0 ? (
              relatedProducts.map((rp) => (
                <ProductCard key={String(rp.id)} product={rp} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">No related products found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
