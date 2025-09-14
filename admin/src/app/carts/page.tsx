'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, Trash2, Mail, Eye, ShoppingCart } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

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

export default function CartsManagement() {
  const router = useRouter()
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 20
  })
  const [analytics, setAnalytics] = useState<{ 
    totalCarts: number; 
    totalValue: number; 
    avgCartValue: number;
    summary?: { 
      active: number; 
      abandoned: number; 
      converted: number; 
      total_value: number;
      active_carts: number;
      average_cart_value: number;
      abandonment_rate: number;
      conversion_rate: number;
    };
    top_abandoned_products?: Array<{ name: string; count: number; value: number }>;
  } | null>(null)
  
  const { toast } = useToast()

  const fetchCarts = async () => {
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        status: filters.status,
        ...(filters.search && { user_id: filters.search })
      })

      const response = await fetch(`/api/carts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch carts')
      
      const data = await response.json()
      setCarts(data.carts || [])
    } catch (error) {
      console.error('Error fetching carts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load carts',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/carts?period=30')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  useEffect(() => {
    fetchCarts()
    fetchAnalytics()
  }, [filters])

  // Realtime: listen for cart changes and refresh list
  useEffect(() => {
    const es = new EventSource('/api/carts/stream')
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data?.type === 'cart_change') {
          fetchCarts()
        }
      } catch {}
    }
    es.onerror = () => {
      try { es.close() } catch {}
    }
    return () => {
      try { es.close() } catch {}
    }
  }, [filters.page, filters.limit, filters.status, filters.search])

  const handleCartAction = async (action: string, userId?: string, itemIds?: string[]) => {
    setActionLoading(`${action}-${userId || 'bulk'}`)
    try {
      const response = await fetch('/api/carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          user_id: userId,
          cart_item_ids: itemIds
        })
      })

      if (!response.ok) throw new Error('Action failed')

      const data = await response.json()
      toast({
        title: 'Success',
        description: data.message
      })
      
      fetchCarts()
    } catch {
      toast({
        title: 'Error',
        description: 'Action failed',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const cartColumns: ColumnDef<Cart>[] = [
    {
      id: 'userEmail',
      accessorFn: (row) => row.user?.email ?? '',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.user.first_name} {row.original.user.last_name}</p>
          <p className="text-sm text-gray-600">{row.original.user.email}</p>
        </div>
      )
    },
    {
      accessorKey: 'total_items',
      header: 'Items',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.total_items} items
        </Badge>
      )
    },
    {
      accessorKey: 'total_value',
      header: 'Total Value',
      cell: ({ row }) => (
        <span className="font-medium">
          TZS {row.original.total_value.toLocaleString()}
        </span>
      )
    },
    {
      accessorKey: 'last_updated',
      header: 'Last Updated',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.last_updated).toLocaleDateString()}
        </span>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const isAbandoned = new Date(row.original.last_updated) < sevenDaysAgo
        
        return (
          <Badge variant={isAbandoned ? 'destructive' : 'default'}>
            {isAbandoned ? 'Abandoned' : 'Active'}
          </Badge>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { router.push(`/carts/${row.original.user_id}`) }}
            className="w-full sm:w-auto"
          >
            <Eye className="w-4 h-4 sm:mr-0 mr-2" />
            <span className="sm:hidden">View</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCartAction('send_abandonment_email', row.original.user_id)}
            disabled={actionLoading === `send_abandonment_email-${row.original.user_id}`}
            className="w-full sm:w-auto"
          >
            {actionLoading === `send_abandonment_email-${row.original.user_id}` ? 
              <Loader2 className="w-4 h-4 animate-spin sm:mr-0 mr-2" /> : 
              <Mail className="w-4 h-4 sm:mr-0 mr-2" />
            }
            <span className="sm:hidden">Email</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCartAction('clear_cart', row.original.user_id)}
            disabled={actionLoading === `clear_cart-${row.original.user_id}`}
            className="w-full sm:w-auto"
          >
            {actionLoading === `clear_cart-${row.original.user_id}` ? 
              <Loader2 className="w-4 h-4 animate-spin sm:mr-0 mr-2" /> : 
              <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
            }
            <span className="sm:hidden">Clear</span>
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Cart Management</h1>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Carts</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary?.active_carts || 0}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cart Value</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">TZS {analytics.summary?.average_cart_value || 0}</div>
              <p className="text-xs text-muted-foreground">Average value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abandonment Rate</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary?.abandonment_rate || 0}%</div>
              <p className="text-xs text-muted-foreground">Cart abandonment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary?.conversion_rate || 0}%</div>
              <p className="text-xs text-muted-foreground">Guest to user</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by user ID or email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button onClick={() => fetchCarts()} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Carts</CardTitle>
          <CardDescription>
            Manage customer shopping carts and send abandonment reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <DataTable 
              columns={cartColumns} 
              data={carts}
              searchKey="userEmail"
            />
          )}
        </CardContent>
      </Card>

      {/* Top Abandoned Products */}
      {analytics?.top_abandoned_products && (
        <Card>
          <CardHeader>
            <CardTitle>Most Abandoned Products</CardTitle>
            <CardDescription>Products frequently left in abandoned carts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.top_abandoned_products.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">TZS {item.product.price}</p>
                  </div>
                  <Badge variant="destructive">
                    {item.total_abandoned} abandoned
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
