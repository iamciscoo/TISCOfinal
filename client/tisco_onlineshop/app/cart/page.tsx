'use client'

import Link from 'next/link'
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

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()
  const shippingCost = totalPrice > 50 ? 0 : 9.99
  const taxAmount = totalPrice * 0.08 // 8% tax
  const finalTotal = totalPrice + shippingCost + taxAmount

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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Shopping Cart</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart ({totalItems} items)
          </h1>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    {items.map((item, index) => (
                      <div key={item.id}>
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <div className="text-gray-400 text-sm">IMG</div>
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                              SKU: {item.productId.slice(0, 8).toUpperCase()}
                            </p>

                            <div className="flex items-center justify-between">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">Qty:</span>
                                <div className="flex items-center border border-gray-300 rounded-md">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="px-4 py-1 text-center min-w-[3rem] text-sm">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Price and Remove */}
                              <div className="flex items-center gap-4">
                                <div className="text-right">
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
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < items.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Why Shop With Us?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium">Free Shipping</div>
                        <div className="text-xs text-gray-500">Orders over <PriceDisplay price={50} /></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-sm font-medium">Secure Payment</div>
                        <div className="text-xs text-gray-500">SSL Protected</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="text-sm font-medium">Easy Returns</div>
                        <div className="text-xs text-gray-500">30 Day Policy</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Order Summary</h3>
                  
                  <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                      <span className="font-medium"><PriceDisplay price={totalPrice} /></span>
                    </div>

                    {/* Shipping */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <div className="text-right">
                        {shippingCost === 0 ? (
                          <div>
                            <span className="font-medium text-green-600">FREE</span>
                            <div className="text-xs text-gray-500">Orders over <PriceDisplay price={50} /></div>
                          </div>
                        ) : (
                          <span className="font-medium"><PriceDisplay price={shippingCost} /></span>
                        )}
                      </div>
                    </div>

                    {/* Tax */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (8%)</span>
                      <span className="font-medium"><PriceDisplay price={taxAmount} /></span>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span><PriceDisplay price={finalTotal} /></span>
                    </div>

                    {/* Free Shipping Progress */}
                    {totalPrice < 50 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-800 mb-2">
                          Add <PriceDisplay price={50 - totalPrice} /> more for free shipping!
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((totalPrice / 50) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

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
