'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Bell, Mail, AlertCircle, CheckCircle, Clock, Send, RefreshCw, Trash2, Check, ExternalLink, X, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductMultiSelect } from '@/components/ui/product-multi-select'

// Component to display assigned products for a recipient
function ProductAssignmentDisplay({ productIds }: { productIds: string[] }) {
  const [products, setProducts] = React.useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchProducts = async () => {
      if (!productIds || productIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        // Fetch ALL products first, then filter on client side
        // This ensures we get the exact products that match the IDs
        const response = await fetch('/api/admin/products?limit=1000', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const allProducts = Array.isArray(data.products) ? data.products : []
          
          // Filter to only include products with matching IDs
          const matchedProducts = allProducts.filter((p: { id: string }) => 
            productIds.includes(p.id)
          )
          
          console.log('Product filtering:', {
            requestedIds: productIds,
            totalProducts: allProducts.length,
            matchedProducts: matchedProducts.length,
            matched: matchedProducts.map((p: { id: string; name: string }) => p.name)
          })
          
          setProducts(matchedProducts)
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [productIds])

  if (loading) {
    return <span className="text-xs text-muted-foreground">Loading...</span>
  }

  if (products.length === 0) {
    return <span className="text-xs text-red-500">⚠️ No matching products found</span>
  }

  return (
    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-1">
      {products.map((product) => (
        <div key={product.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
          📦 {product.name}
        </div>
      ))}
    </div>
  )
}

interface NotificationRecord {
  id: string
  event: string
  recipient_email: string
  recipient_name?: string
  subject: string
  content: string
  channels: string[]
  status: 'pending' | 'sent' | 'failed' | 'scheduled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  error_message?: string
  sent_at?: string
  scheduled_at?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  category?: string
  platform_module?: string
  action_url?: string
}

interface NotificationStats {
  total: number
  sent: number
  failed: number
  pending: number
  by_event: Record<string, number>
}

const statusIcons = {
  pending: <Clock className="w-4 h-4 text-yellow-500" />,
  sent: <CheckCircle className="w-4 h-4 text-green-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  scheduled: <Bell className="w-4 h-4 text-blue-500" />
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

// Only include categories that are actually implemented and make logical sense
const CATEGORIES = [
  'order_created',    // ✅ Used in checkout/order creation (customer notifications)
  'orders',           // Simplified category for all order events
  'payment_success',  // ✅ Used for successful payments (customer notifications)
  'payment_failed',   // ✅ Used for failed payments (customer notifications)
  'payments',         // Simplified category for all payment events
  'booking_created',  // ✅ Used for service bookings (customer notifications)
  'bookings',         // Simplified category for booking events  
  'contact_message_received', // ✅ Used for contact forms (customer notifications)
  'contact',          // Simplified category for contact events
  'user_registered',  // ✅ Used for welcome emails to new users (customer notifications)
  'users',            // Simplified category for user events
  'admin_order_created' // ✅ Used for admin order notifications (admin notifications)
]
const MODULES = ['orders', 'products', 'users', 'payments', 'inventory', 'analytics', 'system']
const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high', 'urgent'] as const
const DEPARTMENTS = ['technical', 'support', 'sales', 'management']

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // Recipients state
  type Recipient = { id: string; email: string; name?: string; is_active: boolean; department?: string | null; notification_categories?: string[] | null; assigned_product_ids?: string[] | null; created_at: string }
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [newRecipient, setNewRecipient] = useState<{ email: string; name: string; department: string; notification_categories: string[]; assigned_product_ids: string[] }>({ email: '', name: '', department: '', notification_categories: ['all'], assigned_product_ids: [] })
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(['all']))
  const [isEditing, setIsEditing] = useState(false)

  // Manual notification form
  const [manualNotification, setManualNotification] = useState({
    event: 'admin_notification',
    recipient_email: '',
    recipient_name: '',
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    action_url: ''
  })

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (eventFilter !== 'all') params.append('event', eventFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (moduleFilter !== 'all') params.append('platform_module', moduleFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      
      // Add cache busting timestamp
      params.append('_t', Date.now().toString())
      
      const response = await fetch(`/api/admin/notifications?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[FETCH] Received notifications:', data.notifications.length)
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Failed to fetch notifications')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchRecipients = async () => {
    try {
      const res = await fetch('/api/admin/notifications/recipients', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setRecipients(Array.isArray(data.recipients) ? data.recipients : [])
      }
    } catch (e) {
      console.error('Failed to fetch recipients:', e)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchNotifications(), fetchStats(), fetchRecipients()])
    setIsRefreshing(false)
  }

  const sendManualNotification = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: manualNotification.event,
          recipient_email: manualNotification.recipient_email,
          recipient_name: manualNotification.recipient_name || undefined,
          data: {
            notification_type: 'Manual Notification',
            title: manualNotification.title,
            message: manualNotification.message,
            action_url: manualNotification.action_url || undefined
          },
          priority: manualNotification.priority
        })
      })

      if (response.ok) {
        toast.success('Notification sent successfully')
        setManualNotification({
          event: 'admin_notification',
          recipient_email: '',
          recipient_name: '',
          title: '',
          message: '',
          priority: 'medium',
          action_url: ''
        })
        refreshData()
      } else {
        toast.error('Failed to send notification')
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      toast.error('Failed to send notification')
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)))
    }
  }

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No notifications selected')
      return
    }

    const confirmed = confirm(`Are you sure you want to delete ${selectedIds.size} notification${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      console.log('[DELETE] Deleting notifications:', Array.from(selectedIds))
      const response = await fetch('/api/admin/notifications?bulk=true', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
        cache: 'no-store'
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[DELETE] Delete result:', result)
        toast.success(`Successfully deleted ${result.deletedCount} notification${result.deletedCount > 1 ? 's' : ''}`)
        setSelectedIds(new Set())
        
        // Force immediate UI update
        setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)))
        
        // Then refresh from server
        await refreshData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete notifications')
      }
    } catch (error) {
      console.error('Failed to delete notifications:', error)
      toast.error('Failed to delete notifications')
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchNotifications(), fetchStats(), fetchRecipients()])
      setLoading(false)
    }
    loadData()
  }, [filter, eventFilter, categoryFilter, moduleFilter, priorityFilter])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-xs sm:text-base line-clamp-2">Manage system notifications and email communications</p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
          <RefreshCw className={`w-4 h-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Total</CardTitle>
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Sent</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Failed</CardTitle>
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Pending</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5">All Notifications</TabsTrigger>
          <TabsTrigger value="send" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5">Send Notification</TabsTrigger>
          <TabsTrigger value="recipients" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5">Admin Recipients</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters and Bulk Actions */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="order_created">Order Created</SelectItem>
                  <SelectItem value="booking_created">Booking Created</SelectItem>
                  <SelectItem value="contact_message_received">Contact Message</SelectItem>
                  <SelectItem value="user_registered">User Registered</SelectItem>
                  <SelectItem value="payment_success">Payment Success</SelectItem>
                  <SelectItem value="payment_failed">Payment Failed</SelectItem>
                  <SelectItem value="admin_order_created">Admin Order Created</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {MODULES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {notifications.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Checkbox
                    checked={selectedIds.size === notifications.length && notifications.length > 0}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="text-xs sm:text-sm font-semibold cursor-pointer">
                    Select All <span className="text-muted-foreground">({notifications.length})</span>
                  </Label>
                </div>
                
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {selectedIds.size} selected
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="flex-1 sm:flex-initial"
                    >
                      {isDeleting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          <span className="hidden sm:inline">Deleting...</span>
                          <span className="sm:hidden">Deleting</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Selected
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No notifications found</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          className="mt-1 shrink-0"
                        />
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="shrink-0 mt-0.5">{statusIcons[notification.status]}</div>
                          <CardTitle className="text-sm sm:text-lg leading-snug break-words">{notification.subject}</CardTitle>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!confirm('Delete this notification record?')) return
                            const url = `/api/admin/notifications?id=${encodeURIComponent(notification.id)}`
                            const res = await fetch(url, { method: 'DELETE' })
                            if (res.ok) {
                              toast.success('Notification deleted')
                              refreshData()
                            } else {
                              toast.error('Failed to delete notification')
                            }
                          }}
                          className="shrink-0 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline sm:ml-1">Delete</span>
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Badge className={`${priorityColors[notification.priority]} text-xs`}>
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs truncate max-w-[120px] sm:max-w-none">{notification.event}</Badge>
                        {notification.category && (
                          <Badge variant="outline" className="text-xs truncate max-w-[100px] sm:max-w-none">{notification.category}</Badge>
                        )}
                        {notification.platform_module && (
                          <Badge variant="secondary" className="text-xs truncate max-w-[100px] sm:max-w-none">{notification.platform_module}</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mt-2 text-xs sm:text-sm break-all">
                      <span className="font-medium">To:</span> {notification.recipient_name || notification.recipient_email} 
                      {notification.recipient_name && <span className="hidden sm:inline"> ({notification.recipient_email})</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">Created: {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}</span>
                        {notification.sent_at && (
                          <span className="truncate">Sent: {new Date(notification.sent_at).toLocaleDateString()} {new Date(notification.sent_at).toLocaleTimeString()}</span>
                        )}
                        {notification.scheduled_at && (
                          <span className="truncate">Scheduled: {new Date(notification.scheduled_at).toLocaleDateString()} {new Date(notification.scheduled_at).toLocaleTimeString()}</span>
                        )}
                      </div>
                      {notification.error_message && (
                        <div className="text-xs sm:text-sm text-red-600 bg-red-50 p-2 rounded break-words">
                          <span className="font-semibold">Error:</span> {notification.error_message}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="text-xs sm:text-sm truncate">Channels: {notification.channels.join(', ')}</span>
                      </div>
                      {notification.action_url && (
                        <div>
                          <a
                            href={notification.action_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs sm:text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Open action
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Manual Notification</CardTitle>
              <CardDescription>Send a custom notification to a specific user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_email">Recipient Email</Label>
                  <Input
                    id="recipient_email"
                    type="email"
                    value={manualNotification.recipient_email}
                    onChange={(e) => setManualNotification(prev => ({ ...prev, recipient_email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Recipient Name (Optional)</Label>
                  <Input
                    id="recipient_name"
                    value={manualNotification.recipient_name}
                    onChange={(e) => setManualNotification(prev => ({ ...prev, recipient_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={manualNotification.title}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={manualNotification.message}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Your notification message..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_url">Action URL (Optional)</Label>
                <Input
                  id="action_url"
                  type="url"
                  value={manualNotification.action_url}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, action_url: e.target.value }))}
                  placeholder="https://example.com/action"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={manualNotification.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                    setManualNotification(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={sendManualNotification}
                disabled={!manualNotification.recipient_email || !manualNotification.title || !manualNotification.message}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recipients Management */}
        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Recipients</CardTitle>
              <CardDescription>Manage admins who receive notification updates by email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_email">Admin Email</Label>
                  <Input
                    id="recipient_email"
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@example.com"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Name (optional)</Label>
                  <Input
                    id="recipient_name"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Admin Name"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Department and Categories */}
              <div className="space-y-4">
                {/* Department Field */}
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={newRecipient.department} onValueChange={(value) => setNewRecipient(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Filter Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <Label htmlFor="product-filter">Product-Specific Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Optional: Select specific products to receive notifications for. When products are selected, this recipient will only receive order creation notifications for these products (category filters will be disabled).
                  </p>
                  <ProductMultiSelect
                    selectedProductIds={newRecipient.assigned_product_ids}
                    onSelectionChange={(productIds) => {
                      setNewRecipient(prev => ({ ...prev, assigned_product_ids: productIds }))
                    }}
                    placeholder="Search and select products for notifications..."
                  />
                  {newRecipient.assigned_product_ids.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-800">Product Filter Active</p>
                          <p className="text-amber-700 mt-1">
                            This recipient will only receive order creation notifications for the selected products. Category-based notifications are disabled when product filters are active.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Selection - Disabled when products are selected */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categories">Notification Categories</Label>
                    {newRecipient.assigned_product_ids.length > 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        Category selection is disabled because product filters are active.
                      </p>
                    )}
                    <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 max-h-48 overflow-y-auto">
                      <Button
                        type="button"
                        variant={selectedEvents.has('all') ? 'default' : 'outline'}
                        size="sm"
                        disabled={newRecipient.assigned_product_ids.length > 0}
                        className="text-xs sm:text-sm min-h-[32px] px-2 sm:px-3"
                        onClick={() => {
                          if (newRecipient.assigned_product_ids.length > 0) return // Don't allow changes when product filter is active
                          
                          if (selectedEvents.has('all')) {
                            // When deselecting "All Events", clear selection to allow individual category selection
                            setSelectedEvents(new Set())
                            setNewRecipient(prev => ({ ...prev, notification_categories: [] }))
                          } else {
                            // When selecting "All Events", clear other selections and set to 'all'
                            setSelectedEvents(new Set(['all']))
                            setNewRecipient(prev => ({ ...prev, notification_categories: ['all'] }))
                          }
                        }}
                      >
                        All Events
                      </Button>
                      {CATEGORIES.map((category) => (
                        <Button
                          key={category}
                          type="button"
                          variant={selectedEvents.has(category) ? 'default' : 'outline'}
                          size="sm"
                          disabled={selectedEvents.has('all') || newRecipient.assigned_product_ids.length > 0}
                          className="text-xs sm:text-sm min-h-[32px] px-2 sm:px-3 col-span-1"
                          onClick={() => {
                            const newSelected = new Set(selectedEvents)
                            newSelected.delete('all') // Remove 'all' when selecting specific events
                            
                            if (newSelected.has(category)) {
                              newSelected.delete(category)
                            } else {
                              newSelected.add(category)
                            }
                            
                            setSelectedEvents(newSelected)
                            const categories = Array.from(newSelected)
                            // Don't automatically fall back to 'all' - let user make empty selection
                            setNewRecipient(prev => ({ ...prev, notification_categories: categories }))
                          }}
                        >
                          {category.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Button>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Selected: {selectedEvents.has('all') ? 'All Events' : 
                        Array.from(selectedEvents).map(c => 
                          c.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                        ).join(', ') || 'None (will default to All Events)'}
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/notifications/recipients', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        email: newRecipient.email, 
                        name: newRecipient.name,
                        department: newRecipient.department || undefined,
                        notification_categories: newRecipient.assigned_product_ids.length > 0 ? [] : (newRecipient.notification_categories.length > 0 ? newRecipient.notification_categories : ['all']),
                        assigned_product_ids: newRecipient.assigned_product_ids.length > 0 ? newRecipient.assigned_product_ids : null
                      })
                    })
                    if (res.ok) {
                      toast.success(isEditing ? 'Recipient updated' : 'Recipient added')
                      setNewRecipient({ email: '', name: '', department: '', notification_categories: ['all'], assigned_product_ids: [] })
                      setSelectedEvents(new Set(['all']))
                      setIsEditing(false)
                      fetchRecipients()
                    } else {
                      const j = await res.json().catch(() => ({}))
                      toast.error(j?.error || 'Failed to save recipient')
                    }
                  } catch (e) {
                    toast.error('Failed to save recipient')
                  }
                }}
                disabled={!newRecipient.email}
              >
                {isEditing ? 'Update Recipient' : 'Add Recipient'}
              </Button>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewRecipient({ email: '', name: '', department: '', notification_categories: ['all'], assigned_product_ids: [] })
                    setSelectedEvents(new Set(['all']))
                    setIsEditing(false)
                    toast.info('Edit cancelled')
                  }}
                >
                  Cancel Edit
                </Button>
              )}

              <div className="divide-y rounded border">
                {recipients.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No recipients added yet.</div>
                ) : (
                  recipients.map((r) => (
                    <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{r.name || 'Admin'}</div>
                        <div className="text-sm text-muted-foreground truncate">{r.email}</div>
                        <div className="flex gap-1 sm:gap-2 mt-2 flex-wrap">
                          {r.department && (
                            <Badge variant="outline" className="text-xs">{r.department}</Badge>
                          )}
                          {r.assigned_product_ids && r.assigned_product_ids.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="default" className="bg-orange-100 text-orange-800 text-xs w-fit">
                                <Package className="h-3 w-3 mr-1" />
                                {r.assigned_product_ids.length} product{r.assigned_product_ids.length === 1 ? '' : 's'}
                              </Badge>
                              <ProductAssignmentDisplay productIds={r.assigned_product_ids} />
                            </div>
                          ) : (
                            Array.isArray(r.notification_categories) && r.notification_categories.length > 0 && (
                              <Badge variant="secondary" className="text-xs max-w-[200px] truncate" title={r.notification_categories.join(', ')}>
                                {r.notification_categories.join(', ')}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.is_active ? 'default' : 'secondary'} className="text-xs">
                          {r.is_active ? 'active' : 'inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1 h-auto"
                          onClick={() => {
                            setNewRecipient({
                              email: r.email,
                              name: r.name || '',
                              department: r.department || '',
                              notification_categories: r.notification_categories || ['all'],
                              assigned_product_ids: r.assigned_product_ids || []
                            })
                            setSelectedEvents(new Set(r.notification_categories || ['all']))
                            setIsEditing(true)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                            toast.info(`Editing ${r.name || r.email}. You can now add/remove products.`)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs px-2 py-1 h-auto"
                          onClick={async () => {
                            if (!confirm(`Remove ${r.email}?`)) return
                            const url = `/api/admin/notifications/recipients?id=${encodeURIComponent(r.id)}`
                            const res = await fetch(url, { method: 'DELETE' })
                            if (res.ok) {
                              toast.success('Recipient removed')
                              fetchRecipients()
                            } else {
                              toast.error('Failed to remove recipient')
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
