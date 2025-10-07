'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileDialog } from '@/components/auth/ProfileDialog'

import Image from 'next/image'
import { 
  User, 
  Package, 
  ChevronRight,
  Truck,
  Clock,
  CheckCircle,
  Calendar,
  Settings,
  XCircle
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { LoadingSpinner, StatusBadge } from '@/components/shared'
import { useCurrency } from '@/lib/currency-context'

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

type ServiceBooking = {
  id: string
  created_at: string
  service_type: string
  preferred_date?: string
  preferred_time?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  services?: {
    id: string
    title: string
    description?: string
    duration?: string
    image?: string | null
  } | null
}
export default function AccountDashboard() {
  const { user, loading: authLoading } = useAuth()
  const isLoaded = !authLoading
  const [orders, setOrders] = useState<Order[]>([])
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const { formatPrice } = useCurrency()
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [])

  // Let middleware handle authentication redirect
  // Removed client-side auth check to prevent redirect loops

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders?fresh=1', {
        cache: 'no-store',
        credentials: 'include',
        headers: { 'x-no-cache': '1' }
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(Array.isArray(data?.orders) ? (data.orders as Order[]).slice(0, 3) : [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true)
      const response = await fetch('/api/service-bookings?fresh=1', {
        cache: 'no-store',
        credentials: 'include',
        headers: { 'x-no-cache': '1' }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(Array.isArray(data?.bookings) ? (data.bookings as ServiceBooking[]).slice(0, 1) : [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setBookingsLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner text="Loading account..." fullScreen />
      </div>
    )
  }

  if (isLoaded && !user) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'processing': return <Clock className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Settings className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <h1 className="text-2xl font-bold">Welcome back, {user?.user_metadata?.first_name || user?.email || 'User'}!</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="p-6">
                {/* User Info */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{user?.user_metadata?.first_name || user?.email}</h3>
                    <p className="text-gray-600 text-sm">Member since 2024</p>
                  </div>
                </div>
                <div className="mb-6">
                  <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)}>
                    Edit Profile
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium">{`${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() || user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <Link href="/account/orders" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-3 border-gray-300 text-black hover:bg-gray-100 hover:border-gray-400"
                      size="lg"
                    >
                      <Package className="h-5 w-5 text-black" />
                      View All Orders
                      <ChevronRight className="h-4 w-4 ml-auto text-black" />
                    </Button>
                  </Link>
<br></br>
                  {/* Navigation to Service Bookings */}
                  <Link href="/account/bookings" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-3 border-gray-300 text-black hover:bg-gray-100 hover:border-gray-400"
                      size="lg"
                    >
                      <Calendar className="h-5 w-5 text-black" />
                      View All Bookings
                      <ChevronRight className="h-4 w-4 ml-auto text-black" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Quick Stats and Recent Orders */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Spent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPrice(orders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
                        </p>
                      </div>
                      <User className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Recent Status</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {orders.length > 0 ? orders[0].status?.charAt(0).toUpperCase() + orders[0].status?.slice(1) : 'None'}
                        </p>
                      </div>
                      {orders.length > 0 && getStatusIcon(orders[0].status)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Button variant="outline" asChild>
                      <Link href="/account/orders">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">When you place your first order, it will appear here.</p>
                      <Button asChild>
                        <Link href="/products">Start Shopping</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              {getStatusIcon(order.status)}
                              <div className="min-w-0">
                                <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.created_at).toLocaleDateString()} • {order.order_items?.length || 0} items
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-row flex-wrap gap-1 sm:ml-2">
                              <StatusBadge status={order.status} />
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
                                  {order.payment_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="sm:text-right text-left w-full sm:w-auto">
                            <p className="font-semibold">{formatPrice(order.total_amount || 0)}</p>
                            <Button variant="outline" size="sm" className="mt-1 w-full sm:w-auto" asChild>
                              <Link href={`/account/orders/${order.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Services */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Services</CardTitle>
                    <Button variant="outline" asChild>
                      <Link href="/account/bookings">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="py-8"><LoadingSpinner text="Loading recent services..." /></div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                      <p className="text-gray-600 mb-6">When you book a service, it will appear here.</p>
                      <Button asChild>
                        <Link href="/services">Browse Services</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((b) => (
                        <div key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              {getBookingStatusIcon(b.status)}
                              <div className="min-w-0">
                                <p className="font-medium">{b.services?.title || 'Service Booking'}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(b.created_at).toLocaleDateString()} • {b.service_type}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-row flex-wrap gap-1 sm:ml-2">
                              <Badge 
                                variant="outline" 
                                className={`${getBookingStatusBadge(b.status)} border`}
                              >
                                <span className="capitalize">{b.status.replace('_', ' ')}</span>
                              </Badge>
                            </div>
                          </div>
                          <div className="sm:text-right text-left w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="mt-1 w-full sm:w-auto" asChild>
                              <Link href={`/account/bookings/${b.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <CartSidebar />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  )
}
