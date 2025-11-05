'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  ShoppingCart, 
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react'
import { Product } from '@/lib/types'
import { PriceDisplay } from '@/components/PriceDisplay'
import { getImageUrl, getDealPricing } from '@/lib/shared-utils'
import { api } from '@/lib/api-client'
import { ProductCard } from '@/components/shared/ProductCard'
import { ReviewForm } from '@/components/ReviewForm'
import { ReviewsList } from '@/components/ReviewsList'
import { LoadingSpinner } from '@/components/shared'
import { preserveLineBreaks } from '@/lib/text-utils'

interface ProductDetailProps {
  product: Product
}

/**
 * ProductDetail component displays comprehensive product information
 * 
 * Features:
 * - Multi-image gallery with lazy loading
 * - Real-time reviews and ratings
 * - Add to cart with quantity selection
 * - Related products recommendations
 * - Responsive design with mobile optimization
 * - Performance optimized with memoization
 */
const ProductDetailComponent = ({ product }: ProductDetailProps) => {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0)
  const [actualReviews, setActualReviews] = useState<{rating: number}[]>([])
  
  const { addItem, setItemQuantity, openCart } = useCartStore()
  
  // Lazy load related products section
  const shouldLoadRelated = true // Simplified - always load related products
  const relatedRef = useCallback(() => {
    // Simple ref callback without intersection observer for now
  }, [])

  // Memoized product images with proper sorting
  const productImages = useMemo(() => {
    if (product.product_images && product.product_images.length > 0) {
      return product.product_images
        .sort((a, b) => {
          if (a.is_main && !b.is_main) return -1
          if (!a.is_main && b.is_main) return 1
          return (a.sort_order || 0) - (b.sort_order || 0)
        })
        .map(img => img.url)
    }
    return [getImageUrl(product) || '/circular.svg']
  }, [product])

  // Memoized pricing information
  const pricingInfo = useMemo(() => getDealPricing(product), [product])
  
  // Memoized review statistics
  const reviewStats = useMemo(() => {
    const reviewCount = actualReviews.length
    const rating = reviewCount > 0 
      ? actualReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
      : 0
    return { reviewCount, rating }
  }, [actualReviews])

  // Load related products by category (only when section becomes visible)
  useEffect(() => {
    if (!shouldLoadRelated) return
    
    let isMounted = true
    const loadRelatedProducts = async () => {
      try {
        let data: Product[] = []
        
        // Try to get products from the same category if category_id exists
        if (product.category_id) {
          data = await api.getProductsByCategory(String(product.category_id))
        } else {
          // Fallback: get featured products if no category
          data = await api.getFeaturedProducts(8)
        }
        
        if (!isMounted) return
        
        // Filter out current product and limit to 4 items
        const filtered = Array.isArray(data) ? data.filter((p: Product) => String(p.id) !== String(product.id)) : []
        setRelatedProducts(filtered.slice(0, 4))
      } catch (error) {
        console.error('Failed to load related products:', error)
        // Try fallback: get any products
        try {
          const fallbackData = await api.getProducts(8)
          if (!isMounted) return
          const filtered = Array.isArray(fallbackData) ? fallbackData.filter((p: Product) => String(p.id) !== String(product.id)) : []
          setRelatedProducts(filtered.slice(0, 4))
        } catch (fallbackError) {
          console.error('Failed to load fallback products:', fallbackError)
        }
      }
    }
    
    loadRelatedProducts()
    return () => { isMounted = false }
  }, [shouldLoadRelated, product.category_id, product.id])

  // Fetch actual reviews to calculate real rating
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?product_id=${product.id}`)
        if (response.ok) {
          const data = await response.json()
          setActualReviews(data.reviews || [])
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }
    fetchReviews()
  }, [product.id])

  // Memoized event handlers for performance
  const handleQuantityChange = useCallback((change: number) => {
    setQuantity(prev => Math.max(1, Math.min(product.stock_quantity || 999, prev + change)))
  }, [product.stock_quantity])
  
  const handleImageSelect = useCallback((index: number) => {
    setSelectedImageIndex(index)
  }, [])
  
  const handleImageNavigation = useCallback((direction: 'prev' | 'next') => {
    setSelectedImageIndex(prev => {
      if (direction === 'prev') {
        return Math.max(0, prev - 1)
      }
      return Math.min(productImages.length - 1, prev + 1)
    })
  }, [productImages.length])

  const handleAddToCart = useCallback(async () => {
    setIsAddingToCart(true)
    
    try {
      addItem({
        id: product.id.toString(),
        name: product.name,
        price: pricingInfo.currentPrice,
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
  }, [product, quantity, pricingInfo.currentPrice, addItem, openCart])

  const handleBuyNow = useCallback(async () => {
    if ((product.stock_quantity || 0) <= 0) return
    setIsBuyingNow(true)
    try {
      // Set exact quantity in cart (doesn't increment existing quantity)
      setItemQuantity({
        id: product.id.toString(),
        name: product.name,
        price: pricingInfo.currentPrice,
        image_url: getImageUrl(product) || '/circular.svg'
      }, quantity)
      // Navigate to checkout immediately
      router.push('/checkout')
    } catch (error) {
      console.error('Error on Buy Now:', error)
    } finally {
      setIsBuyingNow(false)
    }
  }, [product, quantity, pricingInfo.currentPrice, setItemQuantity, router])
  
  // Simple review refresh without debouncing
  const debouncedRefreshReviews = useCallback(() => {
    setReviewRefreshTrigger(prev => prev + 1)
  }, [])

  // Calculate average rating
  const averageRating = actualReviews.length > 0 
    ? actualReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / actualReviews.length 
    : 0
  
  // Structured data for SEO - Fixed for Google Search Console
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} available at TISCO Market Tanzania`,
    "image": productImages.map(img => img ? (img.startsWith('http') ? img : `https://tiscomarket.store${img}`) : ''),
    "sku": product.id.toString(),
    "brand": {
      "@type": "Brand",
      "name": "TISCO Market"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://tiscomarket.store/product?id=${product.id}`,
      "priceCurrency": "TZS",
      "price": pricingInfo.currentPrice,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      "availability": (product.stock_quantity || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "TISCO Market",
        "url": "https://tiscomarket.store"
      }
    },
    ...(actualReviews.length > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "reviewCount": actualReviews.length,
        "bestRating": 5,
        "worstRating": 1
      },
      "review": actualReviews.slice(0, 5).map(review => ({
        "@type": "Review",
        // CRITICAL FIX: Added itemReviewed field required by Google
        "itemReviewed": {
          "@type": "Product",
          "name": product.name
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating || 5,
          "bestRating": 5,
          "worstRating": 1
        },
        "author": {
          "@type": "Person",
          "name": (review as Record<string, unknown>).user_name as string || 'TISCO Customer'
        },
        "reviewBody": (review as Record<string, unknown>).comment as string || 'Great product!',
        "datePublished": (review as Record<string, unknown>).created_at as string || new Date().toISOString()
      }))
    })
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8 overflow-x-hidden">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 lg:gap-12">
        {/* Product Images */}
        <div className="space-y-3 md:space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={productImages[selectedImageIndex] || '/circular.svg'}
              alt={`${product.name} - Image ${selectedImageIndex + 1}`}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={selectedImageIndex === 0}
              quality={85}
            />
            
            
            {/* Image Navigation */}
            {productImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
                  onClick={() => handleImageNavigation('prev')}
                  disabled={selectedImageIndex === 0}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
                  onClick={() => handleImageNavigation('next')}
                  disabled={selectedImageIndex === productImages.length - 1}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            
            {/* Image counter */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                {selectedImageIndex + 1} / {productImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail Images - Horizontal Scrollable Gallery */}
          {productImages.length > 1 && (
            <div className="relative">
              {/* Scroll container - hidden scrollbar with proper padding */}
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory py-2 px-1 -mx-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {productImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg cursor-pointer border-2 transition-all duration-200 snap-start ${
                      selectedImageIndex === index 
                        ? 'border-blue-500 ring-2 ring-blue-300 shadow-lg' 
                        : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                    }`}
                    onClick={() => handleImageSelect(index)}
                  >
                    <Image
                      src={image || '/circular.svg'}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      sizes="100px"
                      quality={60}
                    />
                    {/* Index indicator */}
                    <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold transition-all ${
                      selectedImageIndex === index 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'bg-gray-700 bg-opacity-70 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Scroll hint for many images */}
              {productImages.length > 4 && (
                <div className="mt-3 text-center">
                  <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 inline-flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    Scroll to view all {productImages.length} images
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Product Title & Category */}
          <div>
            <div className="text-sm text-blue-600 font-medium mb-2">
              {Array.isArray(product.categories) && product.categories.length > 0 
                ? product.categories[0]?.category?.name || 'Electronics'
                : (product.categories && 'name' in product.categories ? product.categories.name : 'Electronics')}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 md:gap-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 md:h-5 md:w-5 ${
                      i < Math.floor(reviewStats.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {reviewStats.rating.toFixed(1)} ({reviewStats.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {pricingInfo.isDeal ? (
                <>
                  <span className="text-3xl md:text-4xl font-bold text-red-600">
                    <PriceDisplay price={pricingInfo.currentPrice} />
                  </span>
                  {pricingInfo.originalPrice && pricingInfo.originalPrice > pricingInfo.currentPrice && (
                    <span className="text-lg md:text-xl text-gray-500 line-through">
                      <PriceDisplay price={pricingInfo.originalPrice} />
                    </span>
                  )}
                  <Badge variant="destructive">Deal</Badge>
                </>
              ) : (
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  <PriceDisplay price={pricingInfo.currentPrice} />
                </span>
              )}
            </div>
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
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              {product.description 
                ? preserveLineBreaks(product.description)
                : 'This is a high-quality product designed to meet your needs. With excellent craftsmanship and attention to detail, this item offers great value and performance.'
              }
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleAddToCart}
                className="flex-1 h-12 text-base md:text-lg"
                disabled={product.stock_quantity === 0 || isAddingToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12"
              onClick={handleBuyNow}
              disabled={product.stock_quantity === 0 || isBuyingNow}
            >
              {isBuyingNow ? 'Processing…' : 'Buy Now'}
            </Button>
          </div>

          
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Review Form */}
          <div>
            <ReviewForm 
              productId={String(product.id)} 
              onReviewSubmitted={debouncedRefreshReviews}
            />
          </div>

          {/* Reviews List */}
          <div>
            <ReviewsList 
              productId={String(product.id)} 
              refreshTrigger={reviewRefreshTrigger}
            />
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div ref={relatedRef} className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 md:mb-8">Explore Related Items.</h3>

          {shouldLoadRelated ? (
            <>
              {/* Mobile Slider */}
              <div className="md:hidden -mx-4 px-4">
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
                  {relatedProducts.length > 0 ? (
                    relatedProducts.map((rp) => (
                      <div key={String(rp.id)} className="min-w-[78%] snap-start">
                        <ProductCard product={rp} compact className="rounded-xl border border-gray-100" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 w-full">No related products found.</div>
                  )}
                </div>
              </div>

              {/* Desktop/Tablet Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.length > 0 ? (
                  relatedProducts.map((rp) => (
                    <ProductCard key={String(rp.id)} product={rp} />
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-500">No related products found.</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading related products..." />
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

export const ProductDetail = memo(ProductDetailComponent)
