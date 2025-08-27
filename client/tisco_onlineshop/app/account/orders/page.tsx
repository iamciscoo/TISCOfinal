'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Image from 'next/image'
import { 
  Package, 
  Search, 
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { useCurrency } from '@/lib/currency-context'
import { LoadingSpinner } from '@/components/shared'

type OrderItem = {
  quantity: number
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

export default function OrdersPage() {
  const { user, isLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [orders, setOrders] = useState<Order[]>([])
  // Show full-screen loader only on initial load; subsequent polls are silent refreshes
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    fetchOrders(true)
  }, [])

  const fetchOrders = async (isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true)
      else setRefreshing(true)
      const response = await fetch('/api/orders?fresh=1', {
        cache: 'no-store',
        headers: { 'x-no-cache': '1' }
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(Array.isArray(data?.orders) ? (data.orders as Order[]) : [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      if (isInitial) setInitialLoading(false)
      else setRefreshing(false)
    }
  }

  // Lightweight polling: refresh while any order is pending/processing or has pending payment
  const hasInFlight = useMemo(() => {
    return orders.some(
      (o) => o.status === 'pending' || o.status === 'processing' || o.payment_status === 'pending'
    )
  }, [orders])

  useEffect(() => {
    if (!hasInFlight) return
    const id = setInterval(fetchOrders, 4000)
    return () => clearInterval(id)
  }, [hasInFlight])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner text="Loading orders..." fullScreen />
      </div>
    )
  }

  if (!user) {
    redirect('/sign-in?redirect_url=/account/orders')
  }

  // Filter and sort orders
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items?.some((item: OrderItem) => 
        item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800' 
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'processing': return <Clock className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner text="Loading orders..." fullScreen />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/account" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Account
          </Link>
          <span>/</span>
          <span className="text-gray-900">Orders</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
            <p className="text-gray-600">
              View and track all your orders in one place
            </p>
          </div>
          {refreshing && (
            <div className="text-sm text-gray-500">Refreshing…</div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder="Search orders or products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'No orders match your filters'
                : 'No orders yet'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'When you place your first order, it will appear here.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button asChild>
                <Link href="/products">
                  Start Shopping
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order: Order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-semibold text-lg">
                          Order #{order.id.slice(0, 8)}
                        </h3>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant="secondary"
                            className={`${getStatusColor(order.status)} border-0`}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </Badge>
                          {order.payment_status && (
                            <Badge 
                              variant="outline"
                              className={
                                order.payment_status === 'paid' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : order.payment_status === 'failed'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }
                            >
                              💳 {order.payment_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> {formatPrice(order.total_amount ?? 0)}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span> {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'item' : 'items'}
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {order.order_items?.slice(0, 3).map((item: OrderItem, index: number) => (
                          <div key={index} className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded flex items-center gap-2">
                            {item.products?.image_url && (
                              <Image 
                                src={item.products.image_url} 
                                alt={item.products.name}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                            )}
                            {item.products?.name} (x{item.quantity})
                          </div>
                        ))}
                        {(order.order_items?.length || 0) > 3 && (
                          <div className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            +{(order.order_items?.length || 0) - 3} more
                          </div>
                        )}
                      </div>

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Delivery to:</span> {order.shipping_address}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-40">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/account/orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}
