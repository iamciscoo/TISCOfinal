'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Truck, CheckCircle, Clock, ArrowLeft } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared'
import { useCurrency } from '@/lib/currency-context'

interface PageProps {
  params: Promise<{ id: string }>
}

type OrderItem = {
  id: string
  quantity: number
  price: number
  products?: {
    id: string
    name: string
    price: number
    image_url: string | null
  } | null
}

type Order = {
  id: string
  created_at: string
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_address?: string | null
  order_items?: OrderItem[]
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="h-4 w-4" />
    case 'shipped':
      return <Truck className="h-4 w-4" />
    case 'processing':
    case 'pending':
      return <Clock className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800'
    case 'shipped':
      return 'bg-blue-100 text-blue-800'
    case 'processing':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function OrderDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { user, loading } = useAuth()
  const isLoaded = !loading
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { formatPrice } = useCurrency()

  const fetchOrder = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true)
      else setRefreshing(true)
      setError(null)
      const response = await fetch(`/api/orders/${resolvedParams.id}?fresh=1`, {
        cache: 'no-store',
        headers: { 'x-no-cache': '1' }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found')
        } else {
          setError(`Failed to load order: ${response.status} ${response.statusText}`)
        }
        return
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (err) {
      console.error('Failed to fetch order:', err)
      setError('Failed to load order')
    } finally {
      if (isInitial) setInitialLoading(false)
      else setRefreshing(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    if (isLoaded && user) {
      fetchOrder(true)
    }
  }, [isLoaded, user, fetchOrder])

  // Client-side redirect to avoid hook-order mismatch
  useEffect(() => {
    if (isLoaded && !user) {
      router.replace('/sign-in?redirect_url=/account/orders')
    }
  }, [isLoaded, user, router])

  // Poll for updates while order is pending/processing or payment not finalized
  useEffect(() => {
    if (!order) return
    const isPaymentPending = order.payment_status === 'pending'
    const isOrderInProgress = order.status === 'pending' || order.status === 'processing'
    const shouldPoll = isPaymentPending || isOrderInProgress
    if (!shouldPoll) return
    const interval = setInterval(() => {
      fetchOrder(false)
    }, 4000)
    return () => clearInterval(interval)
  }, [order, fetchOrder])

  if (!isLoaded || initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner text="Loading order details..." fullScreen />
        <Footer />
        <CartSidebar />
      </div>
    )
  }

  if (isLoaded && !user) {
    return null
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-2">{error || 'Order not found'}</h1>
          <p className="text-gray-600 mb-6">The order you are looking for does not exist or could not be loaded.</p>
          <Button asChild>
            <Link href="/account/orders">Back to orders</Link>
          </Button>
        </div>
        <Footer />
        <CartSidebar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/account/orders" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Orders
          </Link>
          <span>/</span>
          <span className="text-gray-900">Order #{resolvedParams.id.slice(0, 8)}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span>Order Details</span>
                  <Badge variant="secondary" className={`${statusColor(order.status)} border-0`}>
                    <span className="flex items-center gap-1">
                      <StatusIcon status={order.status} />
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </Badge>
                  {refreshing && (
                    <span className="ml-auto text-xs font-normal text-gray-500">Refreshing…</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-medium">Order ID:</span> {order.id}</div>
                  <div><span className="font-medium">Placed on:</span> {new Date(order.created_at).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Payment:</span> 
                    <Badge 
                      variant="secondary"
                      className={
                        order.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800 border-0' 
                          : order.payment_status === 'failed'
                          ? 'bg-red-100 text-red-800 border-0'
                          : 'bg-yellow-100 text-yellow-800 border-0'
                      }
                    >
                      {order.payment_status || 'pending'}
                    </Badge>
                  </div>
                  <div><span className="font-medium">Total:</span> {formatPrice(order.total_amount || 0)}</div>
                </div>
                {order.shipping_address && (
                  <div>
                    <span className="font-medium">Delivery to:</span> {order.shipping_address}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      {item.products?.image_url && (
                        <Image src={item.products.image_url} alt={item.products.name} width={56} height={56} className="rounded" />
                      )}
                      <div>
                        <div className="font-medium">{item.products?.name}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="text-right font-semibold">
                      {formatPrice((item.price * item.quantity))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Side actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full" variant="outline">
                  <Link href="/account/orders">Back to Orders</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}


