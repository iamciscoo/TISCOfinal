'use client'

import React from 'react'
import { Plus, Minus, ShoppingCart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import Link from 'next/link'
import { SafeImage } from '@/components/SafeImage'
import { useCartStore } from '@/lib/store'
import { PriceDisplay } from '@/components/PriceDisplay'

export const CartSidebar = () => {
  const {
    items,
    isOpen,
    closeCart,
    openCart,
    removeItem,
    updateQuantity,
    clearCart
  } = useCartStore()

  // Derive totals directly from items so values always stay in sync
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
      <SheetContent className="overflow-x-hidden p-0">
        <div className="p-6 pb-0">
          <SheetHeader className="space-y-2.5">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart ({totalItems})
            </SheetTitle>
            <SheetDescription>
              Review and manage items in your shopping cart
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex flex-col h-full min-h-0 px-6">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-6 scroll-container momentum-scroll">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Add some items to get started!</p>
                <Button onClick={closeCart} asChild>
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col space-y-3 p-4 bg-white rounded-lg border">
                    {/* Top Row: Image, Name, Remove Button */}
                    <div className="flex gap-3 justify-between items-start">
                      {/* Product Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <SafeImage
                            src={item.image_url}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div className="text-gray-400 text-xs">IMG</div>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          SKU: {item.productId.slice(0, 8).toUpperCase()}
                        </p>
                        {/* Per-item price under SKU on mobile only */}
                        <p className="text-sm text-gray-600 mt-1 sm:hidden">
                          <PriceDisplay price={item.price} className="font-medium" />
                          <span className="text-xs text-gray-500 ml-1">each</span>
                        </p>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.productId)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Bottom Row: Quantity Controls and Total Price */}
                    <div className="flex items-center justify-between gap-2 overflow-visible flex-wrap">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">Qty:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium px-1 min-w-[1.5rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Total Price (hidden on mobile to avoid overflow) */}
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          <PriceDisplay price={item.price * item.quantity} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Clear Cart Button */}
                {items.length > 0 && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Clear local cart only (cart is now client-side only)
                        clearCart()
                      }}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cart
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="border-t pt-6 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Subtotal ({totalItems} items)</p>
                <p><PriceDisplay price={totalPrice} /></p>
              </div>

              {/* Tax Info */}
              <p className="text-sm text-gray-500">
                Delivery and taxes calculated at checkout.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button asChild className="w-full h-12">
                  <Link href="/checkout" onClick={() => setTimeout(closeCart, 100)}>
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/cart" onClick={() => setTimeout(closeCart, 100)}>
                    View Full Cart
                  </Link>
                </Button>

                <Button variant="ghost" onClick={closeCart} className="w-full">
                  Continue Shopping
                </Button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure checkout guaranteed</span>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

