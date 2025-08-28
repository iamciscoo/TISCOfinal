'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PriceDisplay } from '@/components/PriceDisplay'

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice,
    clearCart
  } = useCartStore()

  // Avoid hydration mismatch by deferring persisted cart reads until after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const totalItems = mounted ? getTotalItems() : 0
  const subtotal = mounted ? getTotalPrice() : 0
  const finalTotal = subtotal
  const displayItems = mounted ? items : []

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Shopping Cart</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Shopping Cart ({totalItems} items)
          </h1>
          {displayItems.length > 0 && (
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {displayItems.length === 0 ? (
          /* Empty Cart State */
          <Card className="bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingBag className="h-24 w-24 text-gray-300 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-8 text-center max-w-md">
                Looks like you haven&apos;t added any items to your cart yet. 
                Start shopping to fill it up!
              </p>
              <Button asChild size="lg" className="px-8">
                <Link href="/products">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Continue Shopping */}
              <div className="mb-6">
                <Button variant="outline" asChild>
                  <Link href="/products">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Link>
                </Button>
              </div>

              {/* Cart Items List */}
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {displayItems.map((item, index) => (
                      <div key={item.id}>
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                                sizes="(max-width: 640px) 80px, 96px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <div className="text-gray-400 text-xs">IMG</div>
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-1 break-words">
                              {item.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-3">
                              SKU: {item.productId.slice(0, 8).toUpperCase()}
                            </p>

                            <div className="space-y-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700 min-w-[30px]">Qty:</span>
                                <div className="flex items-center border border-gray-300 rounded-md">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="px-4 py-1 text-center min-w-[3rem] text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Price and Remove */}
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="text-lg font-semibold text-gray-900">
                                    <PriceDisplay price={item.price * item.quantity} />
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    <PriceDisplay price={item.price} /> each
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.productId)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 ml-4 flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < displayItems.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Why Shop With Us?</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Truck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">Flexible Delivery</div>
                        <div className="text-xs text-gray-600">Pickup is free. Delivery fee is paid on delivery.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">Secure Payment</div>
                        <div className="text-xs text-gray-600">SSL Protected</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <RotateCcw className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">Safe, Secure Delivery</div>
                        <div className="text-xs text-gray-600">Items handled with care and sealed packaging.</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white lg:sticky lg:top-24">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Order Summary</h3>
                  
                  <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                      <span className="font-medium"><PriceDisplay price={subtotal} /></span>
                    </div>

                    {/* Shipping */}
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">Calculated at checkout</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Within Dar es Salaam: TSH 5,000–10,000</div>
                        <div>Other regions: TSH 15,000</div>
                        <div>Pickup is free • Delivery fee paid on delivery</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span><PriceDisplay price={finalTotal} /></span>
                    </div>

                    {/* Shipping info mirrors checkout. No progress bar since fees depend on location/method. */}

                    {/* Checkout Button */}
                    <Button asChild className="w-full h-12 mt-6">
                      <Link href="/checkout">
                        Proceed to Checkout
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>256-bit SSL encrypted checkout</span>
                    </div>
                    
                    {/* Payment Method Banners */}
                    <div className="space-y-3 pt-4">
                      <div className="w-full aspect-[6/1] rounded-lg overflow-hidden border bg-white p-2">
                        <Image
                          src="/images/mobilepayment.png"
                          alt="Mobile payment methods"
                          width={1200}
                          height={200}
                          className="w-full h-full object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                          priority={false}
                        />
                      </div>
                      <div className="w-full aspect-[6/1] rounded-lg overflow-hidden border bg-white p-2">
                        <Image
                          src="/images/visamastercard.png"
                          alt="Visa and Mastercard"
                          width={1200}
                          height={200}
                          className="w-full h-full object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                          priority={false}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}
