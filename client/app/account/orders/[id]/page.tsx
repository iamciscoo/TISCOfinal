import { notFound } from 'next/navigation'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Truck, CheckCircle, Clock, ArrowLeft } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

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

// Generate static params for orders at build time
export async function generateStaticParams() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      console.warn('Missing environment variables for orders generateStaticParams, skipping static generation')
      return []
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    )
    
    // Fetch recent order IDs to generate static routes
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(100) // Reasonable limit for build time
    
    if (error) {
      console.error('Database error in orders generateStaticParams:', error)
      return []
    }
    
    console.log(`Generated static params for ${orders?.length || 0} orders`)
    
    // Return array of params for each order
    return (orders || []).map((order: { id: string }) => ({
      id: order.id,
    }))
  } catch (error) {
    console.error('Error generating static params for orders:', error)
    // Return empty array to prevent build failure
    return []
  }
}

// Enable ISR with fallback for orders not pre-generated
export const dynamicParams = true

async function getOrder(orderId: string, userId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          id,
          name,
          image_url,
          product_images (
            url,
            is_main,
            sort_order
          )
        )
      )
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .order('is_main', { ascending: false, foreignTable: 'order_items.products.product_images' })
    .order('sort_order', { ascending: true, foreignTable: 'order_items.products.product_images' })
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as Order
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

const formatPrice = (amount: number) => {
  return `TZS ${Math.round(amount).toLocaleString()}`
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUser()
  
  if (!user) {
    notFound()
  }

  const order = await getOrder(id, user.id)
  
  if (!order) {
    notFound()
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
          <span className="text-gray-900">Order #{id.slice(0, 8)}</span>
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
                {order.order_items?.map((item: OrderItem) => (
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


