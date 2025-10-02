'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Bell, Mail, AlertCircle, CheckCircle, Clock, Send, RefreshCw, Trash2, Check, ExternalLink, X } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

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
  type Recipient = { id: string; email: string; name?: string; is_active: boolean; department?: string | null; notification_categories?: string[] | null; created_at: string }
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [newRecipient, setNewRecipient] = useState<{ email: string; name: string; department: string; notification_categories: string[] }>({ email: '', name: '', department: '', notification_categories: ['all'] })
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(['all']))

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
      
      const response = await fetch(`/api/admin/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Failed to fetch notifications')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats')
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
      const res = await fetch('/api/admin/notifications/recipients')
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
      const response = await fetch('/api/admin/notifications?bulk=true', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Successfully deleted ${result.deletedCount} notification${result.deletedCount > 1 ? 's' : ''}`)
        setSelectedIds(new Set())
        refreshData()
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
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Notifications</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage system notifications and email communications</p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications">All Notifications</TabsTrigger>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="recipients">Admin Recipients</TabsTrigger>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.size === notifications.length && notifications.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">
                    Select All ({notifications.length})
                  </span>
                </div>
                
                {selectedIds.size > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.size} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="w-full sm:w-auto"
                    >
                      {isDeleting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
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
                <Card key={notification.id}>
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          className="mt-1"
                        />
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="shrink-0 mt-1">{statusIcons[notification.status]}</div>
                          <CardTitle className="text-base sm:text-lg leading-tight break-words hyphens-auto overflow-wrap-anywhere">{notification.subject}</CardTitle>
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
                          className="shrink-0"
                        >
                          <X className="w-4 h-4 sm:hidden" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={priorityColors[notification.priority]}>
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{notification.event}</Badge>
                        {notification.category && (
                          <Badge variant="outline" className="text-xs">{notification.category}</Badge>
                        )}
                        {notification.platform_module && (
                          <Badge variant="secondary" className="text-xs">{notification.platform_module}</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      To: {notification.recipient_name || notification.recipient_email} 
                      {notification.recipient_name && ` (${notification.recipient_email})`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <span className="whitespace-nowrap">Created: {new Date(notification.created_at).toLocaleString()}</span>
                        {notification.sent_at && (
                          <span className="whitespace-nowrap">Sent: {new Date(notification.sent_at).toLocaleString()}</span>
                        )}
                        {notification.scheduled_at && (
                          <span className="whitespace-nowrap">Scheduled: {new Date(notification.scheduled_at).toLocaleString()}</span>
                        )}
                      </div>
                      {notification.error_message && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          Error: {notification.error_message}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">Channels: {notification.channels.join(', ')}</span>
                      </div>
                      {notification.action_url && (
                        <div>
                          <a
                            href={notification.action_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_email">Admin Email</Label>
                  <Input
                    id="recipient_email"
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Name (optional)</Label>
                  <Input
                    id="recipient_name"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Admin Name"
                  />
                </div>
              </div>

              {/* Department and Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="categories">Notification Categories</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      <Button
                        type="button"
                        variant={selectedEvents.has('all') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
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
                          disabled={selectedEvents.has('all')}
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
                        notification_categories: newRecipient.notification_categories.length > 0 ? newRecipient.notification_categories : ['all']
                      })
                    })
                    if (res.ok) {
                      toast.success('Recipient saved')
                      setNewRecipient({ email: '', name: '', department: '', notification_categories: ['all'] })
                      setSelectedEvents(new Set(['all']))
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
                Add / Update Recipient
              </Button>

              <div className="divide-y rounded border">
                {recipients.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No recipients added yet.</div>
                ) : (
                  recipients.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4">
                      <div>
                        <div className="font-medium">{r.name || 'Admin'}</div>
                        <div className="text-sm text-muted-foreground">{r.email}</div>
                        <div className="flex gap-2 mt-1">
                          {r.department && (
                            <Badge variant="outline">{r.department}</Badge>
                          )}
                          {Array.isArray(r.notification_categories) && r.notification_categories.length > 0 && (
                            <Badge variant="secondary">{r.notification_categories.join(', ')}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.is_active ? 'default' : 'secondary'}>
                          {r.is_active ? 'active' : 'inactive'}
                        </Badge>
                        <Button
                          variant="destructive"
                          size="sm"
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
