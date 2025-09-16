'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface OrderItem {
  quantity: number
  price: number
  products?: {
    name: string
    price: number
  }
}

interface Order {
  id: string
  user_id: string
  total_amount: number
  currency: string
  payment_status: 'pending' | 'paid' | 'failed'
  status: string
  created_at: string
  shipping_address: string
  order_items: OrderItem[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (orderId: string) => {
    setMarkingPaid(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/mark-paid`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Order marked as paid:', result)
        // Refresh orders
        await fetchOrders()
        alert('Order marked as paid successfully! Check console for notification details.')
      } else {
        const error = await response.json()
        alert(`Failed to mark order as paid: ${error.error}`)
      }
    } catch (error) {
      console.error('Error marking order as paid:', error)
      alert('Failed to mark order as paid')
    } finally {
      setMarkingPaid(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin - Orders</h1>
        <div>Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin - Orders Management</h1>
      
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p>No orders found.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      {new Date(order.created_at).toLocaleDateString()} • 
                      {order.order_items.length} items
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {order.payment_status}
                    </Badge>
                    <Badge variant="outline">{order.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Total:</strong> {order.total_amount.toLocaleString()} {order.currency}</p>
                  <p><strong>Shipping:</strong> {order.shipping_address || 'Not specified'}</p>
                  
                  {order.order_items.length > 0 && (
                    <div>
                      <strong>Items:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {order.order_items.map((item, index) => (
                          <li key={index}>
                            {item.products?.name || 'Unknown Product'} × {item.quantity}
                            ({(item.products?.price || item.price).toLocaleString()} {order.currency})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {order.payment_status !== 'paid' && (
                    <div className="pt-4">
                      <Button
                        onClick={() => markAsPaid(order.id)}
                        disabled={markingPaid === order.id}
                        variant="default"
                      >
                        {markingPaid === order.id ? 'Marking as Paid...' : 'Mark as Paid'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
