'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, Send, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  event: string
  recipient_email: string
  recipient_name?: string
  subject: string
  content: string
  title?: string
  category: string
  platform_module?: string
  entity_id?: string
  entity_type?: string
  action_required: boolean
  action_url?: string
  channels: string[]
  priority: string
  status: string
  created_at: string
  sent_at?: string
  scheduled_at?: string
  expires_at?: string
  read_at?: string
  dismissed_at?: string
  // Prefer unknown for generic metadata to avoid explicit any
  metadata?: Record<string, unknown>
  notification_recipients?: Array<{
    id: string
    user_id?: string
    status: string
    sent_at?: string
    failed_at?: string
    error_message?: string
  }>
}

interface AdminRecipient {
  id: string
  email: string
  name: string
  role: string
  department?: string
  notification_categories: string[]
  is_active: boolean
  created_at: string
}

const CATEGORIES = [
  'general', 'orders', 'products', 'users', 'payments', 'inventory', 'system', 'security', 'refunds'
]

// Removed unused PLATFORM_MODULES to satisfy @typescript-eslint/no-unused-vars

const PRIORITIES = ['low', 'medium', 'high', 'critical']

const DEPARTMENTS = ['technical', 'support', 'sales', 'management']

export function NotificationCenter() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [recipients, setRecipients] = useState<AdminRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: ''
  })

  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [showRecipientDialog, setShowRecipientDialog] = useState(false)

  // New notification form state
  const [newNotification, setNewNotification] = useState({
    event: '',
    recipient_email: '',
    recipient_name: '',
    subject: '',
    content: '',
    title: '',
    category: 'general',
    platform_module: '',
    entity_id: '',
    entity_type: '',
    action_required: false,
    action_url: '',
    priority: 'medium',
    scheduled_at: '',
    expires_at: ''
  })

  // New recipient form state
  const [newRecipient, setNewRecipient] = useState({
    email: '',
    name: '',
    role: 'admin',
    department: '',
    notification_categories: ['all'] as string[]
  })

  // Memoized fetchers to satisfy exhaustive-deps without changing behavior
  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/admin/notifications?${params}`)
      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications)
      } else {
        toast({ title: 'Error', description: 'Failed to fetch notifications', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({ title: 'Error', description: 'Failed to fetch notifications', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  const fetchRecipients = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/recipients')
      const data = await response.json()
      if (data.success) {
        setRecipients(data.recipients)
      } else {
        toast({ title: 'Error', description: 'Failed to fetch recipients', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
      toast({ title: 'Error', description: 'Failed to fetch recipients', variant: 'destructive' })
    }
  }, [toast])

  useEffect(() => {
    fetchNotifications()
    fetchRecipients()
  }, [fetchNotifications, fetchRecipients])

  // (moved into useCallback above)

  // (moved into useCallback above)

  const createNotification = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newNotification)
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Notification sent successfully",
        })
        setShowNotificationDialog(false)
        setNewNotification({
          event: '',
          recipient_email: '',
          recipient_name: '',
          subject: '',
          content: '',
          title: '',
          category: 'general',
          platform_module: '',
          entity_id: '',
          entity_type: '',
          action_required: false,
          action_url: '',
          priority: 'medium',
          scheduled_at: '',
          expires_at: ''
        })
        fetchNotifications()
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to create notification',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating notification:', error)
        toast({
          title: "Error",
          description: "Failed to send notification",
          variant: "destructive",
        })
    }
  }

  const createRecipient = async () => {
    try {
      const response = await fetch('/api/admin/recipients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRecipient)
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Recipient added successfully",
        })
        setShowRecipientDialog(false)
        setNewRecipient({
          email: '',
          name: '',
          role: 'admin',
          department: '',
          notification_categories: ['all']
        })
        fetchRecipients()
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to add recipient',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating recipient:', error)
        toast({
          title: "Error",
          description: "Failed to add recipient",
          variant: "destructive",
        })
    }
  }

  const deleteRecipient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipient?')) return

    try {
      const response = await fetch(`/api/admin/recipients/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Recipient removed successfully",
        })
        fetchRecipients()
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to delete recipient',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting recipient:', error)
        toast({
          title: "Error",
          description: "Failed to remove recipient",
          variant: "destructive",
        })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notification Center</h1>
        <div className="flex gap-2">
          <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Admin Recipient</DialogTitle>
                <DialogDescription>
                  Add a new admin recipient to receive system notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={newRecipient.department} onValueChange={(value) => setNewRecipient({...newRecipient, department: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createRecipient} className="w-full">
                  Add Recipient
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Notification</DialogTitle>
                <DialogDescription>
                  Send a custom notification to admin recipients or users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event">Event</Label>
                    <Input
                      id="event"
                      value={newNotification.event}
                      onChange={(e) => setNewNotification({...newNotification, event: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newNotification.category} onValueChange={(value) => setNewNotification({...newNotification, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipient_email">Recipient Email</Label>
                    <Input
                      id="recipient_email"
                      type="email"
                      value={newNotification.recipient_email}
                      onChange={(e) => setNewNotification({...newNotification, recipient_email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newNotification.priority} onValueChange={(value) => setNewNotification({...newNotification, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newNotification.subject}
                    onChange={(e) => setNewNotification({...newNotification, subject: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newNotification.content}
                    onChange={(e) => setNewNotification({...newNotification, content: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="action_required"
                    checked={newNotification.action_required}
                    onCheckedChange={(checked) => setNewNotification({...newNotification, action_required: checked})}
                  />
                  <Label htmlFor="action_required">Action Required</Label>
                </div>

                {newNotification.action_required && (
                  <div>
                    <Label htmlFor="action_url">Action URL</Label>
                    <Input
                      id="action_url"
                      type="url"
                      value={newNotification.action_url}
                      onChange={(e) => setNewNotification({...newNotification, action_url: e.target.value})}
                    />
                  </div>
                )}

                <Button onClick={createNotification} className="w-full">
                  Create Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            {PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>{priority}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recipients Section */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Recipients ({recipients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium">{recipient.name}</p>
                    <p className="text-sm text-gray-500">{recipient.email}</p>
                  </div>
                  <Badge variant="outline">{recipient.department}</Badge>
                  <Badge variant={recipient.is_active ? "default" : "secondary"}>
                    {recipient.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRecipient(recipient.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(notification.status)}
                    <Badge className={getPriorityColor(notification.priority)}>
                      {notification.priority}
                    </Badge>
                    <Badge variant="outline">{notification.category}</Badge>
                    {notification.platform_module && (
                      <Badge variant="secondary">{notification.platform_module}</Badge>
                    )}
                    {notification.action_required && (
                      <Badge variant="destructive">Action Required</Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg">{notification.title || notification.subject}</h3>
                  <p className="text-gray-600 mt-1">{notification.content}</p>
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>To: {notification.recipient_email}</span>
                    <span>Event: {notification.event}</span>
                    <span>Created: {new Date(notification.created_at).toLocaleDateString()}</span>
                    {notification.sent_at && (
                      <span>Sent: {new Date(notification.sent_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  {notification.action_url && (
                    <div className="mt-2">
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <a href={notification.action_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {notifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No notifications found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
