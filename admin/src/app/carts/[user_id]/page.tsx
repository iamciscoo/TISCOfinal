'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, Mail, Trash2 } from 'lucide-react'

interface CartItem {
  id: string
  product: {
    id: string
    name: string
    price: number
    image_url?: string
  }
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
}

interface Cart {
  user_id: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  items: CartItem[]
  total_items: number
  total_value: number
  last_updated: string
  created_at: string
}

export default function CartDetailsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [userId, setUserId] = useState<string>('')
  const routeParams = useParams() as { user_id?: string | string[] }
  useEffect(() => {
    const id = Array.isArray(routeParams?.user_id)
      ? routeParams.user_id[0]
      : routeParams?.user_id
    if (typeof id === 'string') setUserId(id)
  }, [routeParams])
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isAbandoned = useMemo(() => {
    if (!cart?.last_updated) return false
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
    return new Date(cart.last_updated) < cutoff
  }, [cart?.last_updated])

  const fetchCart = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/carts?user_id=${encodeURIComponent(String(userId))}&limit=1&page=1&status=all`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch cart')
      const data = await res.json()
      const c: Cart | undefined = data?.carts?.[0]
      setCart(c || null)
    } catch (e) {
      console.error('Error fetching cart details', e)
      toast({ title: 'Error', description: 'Failed to load cart', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [userId])

  // Realtime updates via admin SSE
  useEffect(() => {
    const es = new EventSource('/api/carts/stream')
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data?.type === 'cart_change') {
          fetchCart()
        }
      } catch {}
    }
    es.onerror = () => {
      try { es.close() } catch {}
    }
    return () => {
      try { es.close() } catch {}
    }
  }, [userId])

  const handleAction = async (action: 'send_abandonment_email' | 'clear_cart') => {
    if (!userId) return
    setActionLoading(action)
    try {
      const res = await fetch('/api/carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, user_id: userId })
      })
      if (!res.ok) throw new Error('Action failed')
      const data = await res.json()
      toast({ title: 'Success', description: data?.message || 'Action completed' })
      if (action === 'clear_cart') fetchCart()
    } catch {
      toast({ title: 'Error', description: 'Action failed', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const fullName = useMemo(() => {
    if (!cart?.user) return '-'
    const parts = [cart.user.first_name, cart.user.last_name].filter(Boolean)
    return parts.length ? parts.join(' ') : cart.user.email || '-'
  }, [cart?.user])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading cart...
        </div>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => router.push('/carts')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Carts
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Cart Not Found</CardTitle>
            <CardDescription>No cart data available for this user.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cart Details</h1>
          <p className="text-sm text-muted-foreground">User: {fullName} ({cart.user.email})</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isAbandoned ? 'destructive' : 'default'}>
            {isAbandoned ? 'Abandoned' : 'Active'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date(cart.last_updated).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push('/carts')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Carts
        </Button>
        <Button
          variant="outline"
          disabled={actionLoading === 'send_abandonment_email'}
          onClick={() => handleAction('send_abandonment_email')}
        >
          {actionLoading === 'send_abandonment_email' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          disabled={actionLoading === 'clear_cart'}
          onClick={() => handleAction('clear_cart')}
        >
          {actionLoading === 'clear_cart' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cart.total_items}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TZS {cart.total_value.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date(cart.created_at).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Products currently in this user's cart</CardDescription>
        </CardHeader>
        <CardContent>
          {cart.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No items in cart.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {it.product?.image_url ? (
                          <img src={it.product.image_url} alt={it.product.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded" />
                        )}
                        <div>
                          <div className="font-medium">{it.product?.name || 'Product'}</div>
                          <div className="text-xs text-muted-foreground">ID: {it.product?.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>TZS {Number(it.unit_price ?? it.product?.price ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{it.quantity}</TableCell>
                    <TableCell>TZS {Number(it.total_price).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
