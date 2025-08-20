'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Package, 
  Truck, 
  MapPin,
  CheckCircle,
  Clock,
  Search
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface TrackingUpdate {
  status: string
  description: string
  location: string
  timestamp: string
  isCompleted: boolean
}

interface OrderTracking {
  orderNumber: string
  status: string
  estimatedDelivery: string
  trackingNumber: string
  carrier: string
  shippingAddress: string
  updates: TrackingUpdate[]
}

const sampleTracking: OrderTracking = {
  orderNumber: 'TISCO-2024-001234',
  status: 'In Transit',
  estimatedDelivery: 'February 15, 2024',
  trackingNumber: '1Z999AA1234567890',
  carrier: 'UPS',
  shippingAddress: '123 Main Street, Anytown, ST 12345',
  updates: [
    {
      status: 'Order Placed',
      description: 'Your order has been received and is being processed',
      location: 'TISCO Warehouse',
      timestamp: '2024-02-10 10:30 AM',
      isCompleted: true
    },
    {
      status: 'Processing',
      description: 'Your items are being picked and packed',
      location: 'TISCO Warehouse',
      timestamp: '2024-02-10 2:15 PM',
      isCompleted: true
    },
    {
      status: 'Shipped',
      description: 'Your package has been picked up by the carrier',
      location: 'TISCO Warehouse',
      timestamp: '2024-02-11 9:45 AM',
      isCompleted: true
    },
    {
      status: 'In Transit',
      description: 'Package is on the way to the next facility',
      location: 'Distribution Center - Chicago, IL',
      timestamp: '2024-02-12 6:20 AM',
      isCompleted: true
    },
    {
      status: 'In Transit',
      description: 'Package arrived at local facility',
      location: 'Local Facility - Anytown, ST',
      timestamp: '2024-02-13 3:30 PM',
      isCompleted: true
    },
    {
      status: 'Out for Delivery',
      description: 'Package is out for delivery',
      location: 'Local Facility - Anytown, ST',
      timestamp: '',
      isCompleted: false
    },
    {
      status: 'Delivered',
      description: 'Package delivered successfully',
      location: 'Customer Address',
      timestamp: '',
      isCompleted: false
    }
  ]
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [tracking, setTracking] = useState<OrderTracking | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Simulate API call
    setTimeout(() => {
      if (orderNumber.toLowerCase().includes('tisco') || orderNumber === '001234') {
        setTracking(sampleTracking)
      } else {
        setError('Order not found. Please check your order number and email address.')
      }
      setIsLoading(false)
    }, 1500)
  }

  const getStatusIcon = (status: string, isCompleted: boolean) => {
    if (!isCompleted) {
      return <Clock className="h-5 w-5 text-gray-400" />
    }
    
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'Out for Delivery':
        return <Truck className="h-5 w-5 text-blue-600" />
      case 'In Transit':
        return <Truck className="h-5 w-5 text-blue-600" />
      case 'Shipped':
        return <Package className="h-5 w-5 text-purple-600" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Track Order</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enter your order details below to get real-time updates on your shipment.
          </p>
        </div>

        {!tracking ? (
          /* Tracking Form */
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Order Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div>
                  <Label htmlFor="orderNumber">Order Number *</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="TISCO-2024-001234"
                    autoComplete="off"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have your order number? Check your email confirmation or{' '}
                  <Link href="/contact" className="text-blue-600 hover:underline">
                    contact support
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Tracking Results */
          <div className="space-y-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order #{tracking.orderNumber}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Current Status</h3>
                    <p className="text-xl font-semibold text-blue-600">{tracking.status}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Estimated Delivery</h3>
                    <p className="text-lg">{tracking.estimatedDelivery}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tracking Number</h3>
                    <p className="text-lg font-mono">{tracking.trackingNumber}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Shipping Address</h3>
                    <p className="text-gray-600">{tracking.shippingAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Tracking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tracking.updates.map((update, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          update.isCompleted 
                            ? 'bg-green-100' 
                            : index === tracking.updates.findIndex(u => !u.isCompleted)
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}>
                          {getStatusIcon(update.status, update.isCompleted)}
                        </div>
                        
                        {index < tracking.updates.length - 1 && (
                          <div className={`w-px h-12 mx-auto mt-2 ${
                            update.isCompleted ? 'bg-green-200' : 'bg-gray-200'
                          }`}></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium ${
                            update.isCompleted ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {update.status}
                          </h3>
                          {update.timestamp && (
                            <span className="text-sm text-gray-500">
                              {update.timestamp}
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          update.isCompleted ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {update.description}
                        </p>
                        
                        <p className={`text-xs mt-1 ${
                          update.isCompleted ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {update.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => setTracking(null)} variant="outline">
                Track Another Order
              </Button>
              <Button asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <section className="mt-16">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Need Help?
              </h2>
              <p className="text-gray-600 mb-6">
                Having trouble tracking your order? Our support team is here to help.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href="/faq">View FAQ</Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}
