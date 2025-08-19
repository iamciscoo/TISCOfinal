'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { 
  User, 
  Package, 
  Heart, 
  Settings, 
  MapPin,
  CreditCard,
  ChevronRight,
  Truck,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { LoadingSpinner, StatusBadge } from '@/components/shared'

export default function AccountDashboard() {
  const { user, isLoaded } = useUser()
  const [activeTab, setActiveTab] = useState('overview')

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner text="Loading account..." fullScreen />
      </div>
    )
  }

  if (!user) {
    redirect('/sign-in?redirect_url=/account')
  }

  // Sample data - in real app, this would come from API
  const recentOrders = [
    {
      id: 'ORD-001',
      date: '2024-01-15',
      status: 'delivered',
      total: 299.99,
      items: 3,
      trackingNumber: 'TRK123456789'
    },
    {
      id: 'ORD-002', 
      date: '2024-01-10',
      status: 'shipped',
      total: 149.99,
      items: 2,
      trackingNumber: 'TRK987654321'
    },
    {
      id: 'ORD-003',
      date: '2024-01-05',
      status: 'processing',
      total: 79.99,
      items: 1,
      trackingNumber: null
    }
  ]

  const wishlistItems = [
    { id: '1', name: 'Gaming Laptop', price: 1299.99, image: '/products/6g.png' },
    { id: '2', name: 'Wireless Headphones', price: 299.99, image: '/products/2g.png' },
    { id: '3', name: 'Smart Watch', price: 399.99, image: '/products/1g.png' }
  ]



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'processing': return <Clock className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">
            Welcome back, {user.firstName || user.emailAddresses[0].emailAddress}!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {user.firstName?.charAt(0) || user.emailAddresses[0].emailAddress.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.emailAddresses[0].emailAddress
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.emailAddresses[0].emailAddress}
                    </div>
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'orders', label: 'Orders', icon: Package },
                    { id: 'wishlist', label: 'Wishlist', icon: Heart },
                    { id: 'addresses', label: 'Addresses', icon: MapPin },
                    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
                    { id: 'settings', label: 'Account Settings', icon: Settings },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                        activeTab === id 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Orders</p>
                          <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
                          <p className="text-2xl font-bold text-gray-900">{wishlistItems.length}</p>
                        </div>
                        <Heart className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Spent</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${recentOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                          </p>
                        </div>
                        <CreditCard className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <div>
                                <p className="font-medium">Order {order.id}</p>
                                <p className="text-sm text-gray-600">{order.date} • {order.items} items</p>
                              </div>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${order.total.toFixed(2)}</p>
                            <Button variant="outline" size="sm" className="mt-1">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 text-center">
                      <Button variant="outline" onClick={() => setActiveTab('orders')}>
                        View All Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold">Order {order.id}</h3>
                              <p className="text-sm text-gray-600">Placed on {order.date}</p>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">${order.total.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">{order.items} items</p>
                          </div>
                        </div>
                        
                        {order.trackingNumber && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>Tracking Number:</strong> {order.trackingNumber}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm">View Details</Button>
                          {order.trackingNumber && (
                            <Button variant="outline" size="sm">Track Package</Button>
                          )}
                          {order.status === 'delivered' && (
                            <Button variant="outline" size="sm">Leave Review</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <Card>
                <CardHeader>
                  <CardTitle>My Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="aspect-square bg-gray-100 rounded-md mb-4">
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            IMG
                          </div>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
                        <p className="text-lg font-semibold text-gray-900 mb-3">
                          ${item.price.toFixed(2)}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">Add to Cart</Button>
                          <Button variant="outline" size="sm">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other tabs placeholder */}
            {['addresses', 'payments', 'settings'].includes(activeTab) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeTab === 'addresses' && 'Saved Addresses'}
                    {activeTab === 'payments' && 'Payment Methods'}
                    {activeTab === 'settings' && 'Account Settings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      {activeTab === 'addresses' && <MapPin className="h-12 w-12 mx-auto" />}
                      {activeTab === 'payments' && <CreditCard className="h-12 w-12 mx-auto" />}
                      {activeTab === 'settings' && <Settings className="h-12 w-12 mx-auto" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab === 'addresses' && 'No saved addresses'}
                      {activeTab === 'payments' && 'No payment methods'}
                      {activeTab === 'settings' && 'Account settings'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {activeTab === 'addresses' && 'Add an address to make checkout faster next time.'}
                      {activeTab === 'payments' && 'Add a payment method for faster checkout.'}
                      {activeTab === 'settings' && 'Manage your account preferences and security settings.'}
                    </p>
                    <Button>
                      {activeTab === 'addresses' && 'Add Address'}
                      {activeTab === 'payments' && 'Add Payment Method'}
                      {activeTab === 'settings' && 'Update Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}
