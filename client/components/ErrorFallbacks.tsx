'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, ShoppingBag, Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorFallbackProps {
  error?: Error
  reset: () => void
}

export const ProductsErrorFallback: React.FC<ErrorFallbackProps> = ({ reset }) => (
  <Card className="max-w-lg mx-auto mt-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <Package className="h-5 w-5" />
        Failed to load products
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-gray-600">
        We couldn&apos;t load the products right now. This might be a temporary issue.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)

export const SearchErrorFallback: React.FC<ErrorFallbackProps> = ({ reset }) => (
  <Card className="max-w-lg mx-auto mt-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <Search className="h-5 w-5" />
        Search unavailable
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-gray-600">
        Search is temporarily unavailable. You can browse all products instead.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)

export const CartErrorFallback: React.FC<ErrorFallbackProps> = ({ reset }) => (
  <Card className="max-w-lg mx-auto mt-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <ShoppingBag className="h-5 w-5" />
        Cart error
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-gray-600">
        There was an issue with your cart. Your items should still be saved.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </Button>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </CardContent>
  </Card>
)

export const CheckoutErrorFallback: React.FC<ErrorFallbackProps> = ({ reset }) => (
  <Card className="max-w-lg mx-auto mt-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        Checkout error
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-gray-600">
        There was an issue during checkout. Your cart items are safe. Please try again or contact support.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
        <Button asChild>
          <Link href="/cart">View Cart</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)
