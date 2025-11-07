/**
 * TISCO Notifications Management Page
 * 
 * This page lets admins:
 * 1. View all system notifications (emails sent to customers)
 * 2. Send custom notifications to specific users
 * 3. Manage admin recipients (who gets notification alerts)
 * 
 * Think of it like a control panel for seeing what emails the system sent,
 * and who on your team should be notified when certain events happen.
 */

'use client' // This tells Next.js to run this code in the browser, not on the server

// React hooks - think of these as tools that let components remember things and respond to changes
import * as React from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Pre-built UI components - these are like Lego blocks we use to build the page
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

// Icons - little pictures we show in the UI
import { Bell, Mail, AlertCircle, CheckCircle, Clock, Send, RefreshCw, Trash2, ExternalLink, X, Package, CreditCard } from 'lucide-react'

// Toast - popup messages that appear briefly to tell users something happened
import { toast } from 'sonner'

// More UI components
import { Checkbox } from '@/components/ui/checkbox'
import { ProductMultiSelect } from '@/components/ui/product-multi-select'

// Utility function to format dates in East African Time (Tanzania timezone)
import { formatToEAT } from '@/lib/utils'

// =============================================================================
// HELPER COMPONENTS - Small pieces that are used in the main page
// =============================================================================

/**
 * ProductAssignmentDisplay Component
 * 
 * Shows which products an admin is assigned to receive notifications for.
 * For example, if an admin only wants notifications about "iPhone" and "MacBook",
 * this component fetches those product names and displays them.
 * 
 * @param productIds - Array of product IDs like ["123", "456"]
 */
function ProductAssignmentDisplay({ productIds }: { productIds: string[] }) {
  // State variables - these hold data that changes over time
  const [products, setProducts] = React.useState<Array<{ id: string; name: string }>>([]) // List of products to display
  const [loading, setLoading] = React.useState(true) // Are we still fetching data?

  // useEffect runs code when the component loads or when productIds changes
  React.useEffect(() => {
    // Async function to fetch product data from the server
    const fetchProducts = async () => {
      // If there are no product IDs, don't bother fetching anything
      if (!productIds || productIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        // Step 1: Fetch all products from the database (up to 1000)
        // We get all products, then filter on our end to find the ones we need
        const response = await fetch('/api/admin/products?limit=1000', { cache: 'no-store' })
        
        if (response.ok) {
          const data = await response.json()
          const allProducts = Array.isArray(data.products) ? data.products : []
          
          // Step 2: Filter to only show products that match our productIds
          // Example: If productIds is ["123", "456"], only keep products with those IDs
          const matchedProducts = allProducts.filter((p: { id: string }) => 
            productIds.includes(p.id)
          )
          
          // Save the matched products so we can display them
          setProducts(matchedProducts)
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error)
      } finally {
        // Whether it worked or failed, we're done loading
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

// =============================================================================
// TYPE DEFINITIONS - These describe what shape our data has
// =============================================================================

/**
 * NotificationRecord
 * 
 * Describes a single notification (email) that was sent by the system.
 * Think of it like a receipt for an email that was sent.
 */
interface NotificationRecord {
  id: string                    // Unique identifier for this notification
  event: string                 // What triggered it? (e.g., "order_created", "payment_failed")
  recipient_email: string       // Who did we send it to?
  recipient_name?: string       // Their name (if we know it)
  subject: string               // Email subject line
  content: string               // The actual email message
  channels: string[]            // How we sent it (usually just ["email"])
  status: 'pending' | 'sent' | 'failed' | 'scheduled'  // Did it send successfully?
  priority: 'low' | 'medium' | 'high' | 'urgent'       // How important is it?
  error_message?: string        // If it failed, why?
  sent_at?: string             // When was it sent?
  scheduled_at?: string        // When was it scheduled to send?
  created_at: string           // When was this notification created?
  updated_at: string           // Last time it was updated
  category?: string            // Optional category tag (legacy field)
  platform_module?: string     // Which part of the platform triggered this (legacy field)
  action_url?: string          // Optional link the recipient can click
  metadata?: Record<string, any>  // Extra data attached to the notification
}

/**
 * NotificationStats
 * 
 * Summary numbers shown at the top of the page.
 * Like a dashboard showing "37 total, 35 sent, 2 failed, 0 pending"
 */
interface NotificationStats {
  total: number                 // Total number of notifications
  sent: number                  // How many were sent successfully
  failed: number                // How many failed to send
  pending: number               // How many are waiting to be sent
  by_event: Record<string, number>  // Count per event type (not currently displayed)
}

// =============================================================================
// CONSTANTS - Values that never change
// =============================================================================

/**
 * Status Icons
 * 
 * Maps each notification status to a colored icon.
 * Example: "sent" shows a green checkmark ✅
 */
const statusIcons = {
  pending: <Clock className="w-4 h-4 text-yellow-500" />,      // Yellow clock ⏰
  sent: <CheckCircle className="w-4 h-4 text-green-500" />,    // Green checkmark ✅
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,    // Red alert ❌
  scheduled: <Bell className="w-4 h-4 text-blue-500" />        // Blue bell 🔔
}

/**
 * Priority Colors
 * 
 * CSS classes for different priority levels.
 * These make the priority badges different colors.
 */
const priorityColors = {
  low: 'bg-gray-100 text-gray-800',       // Gray badge
  medium: 'bg-blue-100 text-blue-800',    // Blue badge
  high: 'bg-orange-100 text-orange-800',  // Orange badge
  urgent: 'bg-red-100 text-red-800'       // Red badge
}

/**
 * Notification Event Types
 * 
 * These are all the different types of emails the system can send.
 * Each one is triggered by a specific action in the app.
 * 
 * Example: When a customer places an order, we send them an "order_created" email
 */
const NOTIFICATION_EVENTS = [
  'order_created',              // Customer placed an order
  'payment_success',            // Payment went through successfully
  'payment_failed',             // Payment was declined
  'booking_created',            // Customer booked a service
  'contact_message_received',   // Someone filled out the contact form
  'user_registered',            // New user signed up
  'admin_order_created'         // Notify admin about new orders
] as const

/**
 * Priority Levels
 * 
 * Used to filter notifications by how important they are.
 * "all" means show everything, the others filter to that specific level.
 */
const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high', 'urgent'] as const

/**
 * Department Options
 * 
 * When adding admin recipients, you can assign them to a department.
 * This helps organize who gets what notifications.
 */
const DEPARTMENTS = ['technical', 'support', 'sales', 'management'] as const

/**
 * Pagination Setting
 * 
 * How many notifications to show per page.
 * If there are 47 notifications total, we show 10 per page across 5 pages.
 */
const ITEMS_PER_PAGE = 10

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function NotificationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // ---------------------------------------------------------------------------
  // STATE VARIABLES - These hold all the data that changes on this page
  // ---------------------------------------------------------------------------
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('notifications')
  
  // Notifications data
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])  // List of all notifications
  const [stats, setStats] = useState<NotificationStats | null>(null)            // Summary stats (total, sent, failed, etc.)
  const [loading, setLoading] = useState(true)                                  // Are we loading data from server?
  
  // Filter states - these control what notifications we show
  const [filter, setFilter] = useState<string>('all')              // Filter by status (all/sent/failed/pending)
  const [eventFilter, setEventFilter] = useState<string>('all')    // Filter by event type (order_created, etc.)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')  // Filter by priority (low/medium/high)
  
  // Loading states - track if we're doing something async
  const [isRefreshing, setIsRefreshing] = useState(false)      // Are we refreshing the data?
  const [isClearingAll, setIsClearingAll] = useState(false)    // Are we deleting all notifications?
  const [isSavingRecipient, setIsSavingRecipient] = useState(false)  // Are we saving a recipient?
  
  // Pagination states - control which page we're on
  const [currentPage, setCurrentPage] = useState(1)    // Which page are we showing? (1, 2, 3, etc.)
  const [totalPages, setTotalPages] = useState(1)      // How many pages total?
  
  // Bulk selection states - for selecting and deleting multiple items
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())  // Which notification IDs are checked?
  const [isDeleting, setIsDeleting] = useState(false)                      // Are we deleting selected items?

  // Admin Recipients states - for managing who gets notification alerts
  type Recipient = { 
    id: string
    email: string
    name?: string
    is_active: boolean
    department?: string | null
    notification_categories?: string[] | null
    assigned_product_ids?: string[] | null
    created_at: string
  }
  const [recipients, setRecipients] = useState<Recipient[]>([])  // List of admin recipients
  const [newRecipient, setNewRecipient] = useState<{
    email: string
    name: string
    department: string
    notification_categories: string[]
    assigned_product_ids: string[]  // Fixed type: should be string[], not never[]
  }>({                                             // Form data for adding/editing recipient
    email: '',
    name: '',
    department: '',
    notification_categories: ['all'],
    assigned_product_ids: []
  })
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(['all']))  // Which events are selected?
  const [isEditing, setIsEditing] = useState(false)                                     // Are we editing a recipient?

  // Manual notification form states - for sending custom emails
  const [manualNotification, setManualNotification] = useState({
    event: 'admin_notification',
    recipient_email: '',
    recipient_name: '',
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    action_url: ''
  })

  // Payment Details states - for managing payment account information
  type PaymentDetails = {
    id?: string
    bank_name: string
    account_number: string
    account_name: string
    mpesa_number: string
    tigo_pesa_number: string
    airtel_money_number: string
    lipa_number: string
    payment_instructions: string
  }
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    bank_name: '',
    account_number: '',
    account_name: '',
    mpesa_number: '',
    tigo_pesa_number: '',
    airtel_money_number: '',
    lipa_number: '',
    payment_instructions: 'IMPORTANT PAYMENT INSTRUCTIONS:\n\n1. Include your ORDER NUMBER as the payment reference\n2. After payment, check your order status in "My Orders" section\n3. You will receive an email confirmation once payment is verified\n4. Payment verification typically takes 5-15 minutes\n5. Keep your payment receipt for your records\n\nFor any payment issues, contact our support team immediately.\n\nThank you for shopping with TISCO Market!'
  })
  const [excludedFields, setExcludedFields] = useState<Set<string>>(new Set())
  const [isSavingPaymentDetails, setIsSavingPaymentDetails] = useState(false)
  const [paymentDetailsLoaded, setPaymentDetailsLoaded] = useState(false)
  const [isSendingNotification, setIsSendingNotification] = useState(false)

  // ---------------------------------------------------------------------------
  // DATA FETCHING FUNCTIONS - Get data from the server
  // ---------------------------------------------------------------------------
  
  /**
   * fetchNotifications
   * 
   * Gets the list of notifications from the database.
   * Applies filters if the user selected any (status, event type, priority).
   * 
   * Example: If user selected "failed" status, only show failed notifications.
   */
  const fetchNotifications = async () => {
    try {
      // Step 1: Build the URL with filter parameters
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)              // Add status filter if not "all"
      if (eventFilter !== 'all') params.append('event', eventFilter)     // Add event filter if not "all"
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)  // Add priority filter
      
      // Add timestamp to prevent browser from using old cached data
      params.append('_t', Date.now().toString())
      
      // Step 2: Fetch data from server
      const response = await fetch(`/api/admin/notifications?${params}`, {
        cache: 'no-store',  // Don't cache this request
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',  // Tell browser not to cache
          'Pragma': 'no-cache'
        }
      })
      
      // Step 3: Process the response
      if (response.ok) {
        const data = await response.json()
        const allNotifications = data.notifications
        setNotifications(allNotifications)  // Save notifications to state
        
        // Calculate how many pages we need (e.g., 47 notifications / 10 per page = 5 pages)
        const total = Math.ceil(allNotifications.length / ITEMS_PER_PAGE)
        setTotalPages(total)
        
        // If we're on page 5 but there are only 3 pages now, go back to page 1
        if (currentPage > total && total > 0) {
          setCurrentPage(1)
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Failed to fetch notifications')  // Show error popup to user
    }
  }

  /**
   * fetchStats
   * 
   * Gets summary statistics to show in the cards at the top of the page.
   * Shows: Total notifications, How many sent, How many failed, How many pending
   */
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)  // Save stats to show in the UI
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  /**
   * fetchRecipients
   * 
   * Gets the list of admin recipients (people who receive notification alerts).
   * These are the admins configured to get emails when certain events happen.
   */
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

  /**
   * refreshData
   * 
   * Refreshes all data on the page by fetching everything again.
   * Called when user clicks the "Refresh" button.
   */
  const refreshData = async () => {
    setIsRefreshing(true)  // Show loading spinner
    
    // Fetch all data at once (parallel, not one after another)
    await Promise.all([fetchNotifications(), fetchStats(), fetchRecipients(), fetchPaymentDetails()])
    
    setIsRefreshing(false)  // Hide loading spinner
  }

  /**
   * fetchPaymentDetails
   * 
   * Fetches the active payment details from the database.
   * These are the account numbers and payment instructions configured by admins.
   */
  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch('/api/admin/payment-details')
      const result = await response.json()
      
      if (result.paymentDetails) {
        // Ensure all fields are strings, not null
        const details = result.paymentDetails
        const defaultInstructions = 'IMPORTANT PAYMENT INSTRUCTIONS:\n\n1. Include your ORDER NUMBER as the payment reference\n2. After payment, check your order status in "My Orders" section\n3. You will receive an email confirmation once payment is verified\n4. Payment verification typically takes 5-15 minutes\n5. Keep your payment receipt for your records\n\nFor any payment issues, contact our support team immediately.\n\nThank you for shopping with TISCO Market!'
        
        setPaymentDetails({
          id: details.id || '',
          bank_name: details.bank_name || '',
          account_number: details.account_number || '',
          account_name: details.account_name || '',
          mpesa_number: details.mpesa_number || '',
          tigo_pesa_number: details.tigo_pesa_number || '',
          airtel_money_number: details.airtel_money_number || '',
          lipa_number: details.lipa_number || '',
          payment_instructions: details.payment_instructions || defaultInstructions
        })
        setPaymentDetailsLoaded(true)
      }
    } catch (error) {
      console.error('Failed to fetch payment details:', error)
    }
  }

  /**
   * savePaymentDetails
   * 
   * Saves the payment details (account numbers, mobile money numbers, etc.) to the database.
   */
  const savePaymentDetails = async () => {
    setIsSavingPaymentDetails(true)
    try {
      const response = await fetch('/api/admin/payment-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDetails)
      })

      if (response.ok) {
        toast.success('Payment details saved successfully!')
        fetchPaymentDetails() // Refresh data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save payment details')
      }
    } catch (error) {
      console.error('Failed to save payment details:', error)
      toast.error('Failed to save payment details')
    } finally {
      setIsSavingPaymentDetails(false)
    }
  }

  /**
   * insertPaymentDetailsIntoMessage
   * 
   * Helper function to insert payment details into the notification message.
   */
  const insertPaymentDetailsIntoMessage = () => {
    if (!paymentDetailsLoaded) {
      toast.error('Please save payment details first in the section above')
      return
    }

    // Build sections only for filled fields that aren't excluded
    const sections: string[] = []

    // Bank Transfer Section
    if (!excludedFields.has('bank') && (paymentDetails.bank_name || paymentDetails.account_number || paymentDetails.account_name)) {
      const bankLines: string[] = ['🏦 BANK TRANSFER:']
      if (paymentDetails.bank_name) bankLines.push(`   Bank: ${paymentDetails.bank_name}`)
      if (paymentDetails.account_number) bankLines.push(`   Account Number: ${paymentDetails.account_number}`)
      if (paymentDetails.account_name) bankLines.push(`   Account Name: ${paymentDetails.account_name}`)
      sections.push(bankLines.join('\n'))
    }

    // Mobile Money Section
    const mobileMoneyLines: string[] = []
    if (!excludedFields.has('mpesa') && paymentDetails.mpesa_number) mobileMoneyLines.push(`   • M-Pesa: ${paymentDetails.mpesa_number}`)
    if (!excludedFields.has('tigo_pesa') && paymentDetails.tigo_pesa_number) mobileMoneyLines.push(`   • Tigo Pesa: ${paymentDetails.tigo_pesa_number}`)
    if (!excludedFields.has('airtel_money') && paymentDetails.airtel_money_number) mobileMoneyLines.push(`   • Airtel Money: ${paymentDetails.airtel_money_number}`)
    
    if (mobileMoneyLines.length > 0) {
      sections.push('📱 MOBILE MONEY OPTIONS:\n' + mobileMoneyLines.join('\n'))
    }

    // LIPA Number
    if (!excludedFields.has('lipa') && paymentDetails.lipa_number) {
      sections.push(`💳 LIPA NUMBER: ${paymentDetails.lipa_number}`)
    }

    // Additional Instructions
    if (!excludedFields.has('instructions') && paymentDetails.payment_instructions) {
      sections.push(`📝 PAYMENT INSTRUCTIONS:\n${paymentDetails.payment_instructions}`)
    }

    if (sections.length === 0) {
      toast.error('No payment details configured')
      return
    }

    const detailsText = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nPAYMENT DETAILS\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + sections.join('\n\n') + '\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n'

    setManualNotification(prev => ({
      ...prev,
      message: prev.message + detailsText
    }))
    
    toast.success('Payment details inserted into message!')
  }

  // ---------------------------------------------------------------------------
  // ACTION FUNCTIONS - Functions that do things when user clicks buttons
  // ---------------------------------------------------------------------------

  /**
   * sendManualNotification
   * 
   * Sends a custom notification (email) to a specific person.
   * Used in the "Send Notification" tab.
   * 
   * Example: Admin wants to send a special message to a customer about their order.
   */
  const sendManualNotification = async () => {
    setIsSendingNotification(true)
    try {
      // Send the notification data to the server
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
        toast.success('Notification sent successfully')  // Show success popup
        
        // Clear the form so it's ready for the next notification
        setManualNotification({
          event: 'admin_notification',
          recipient_email: '',
          recipient_name: '',
          title: '',
          message: '',
          priority: 'medium',
          action_url: ''
        })
        
        refreshData()  // Refresh the list to show the new notification
      } else {
        toast.error('Failed to send notification')  // Show error popup
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setIsSendingNotification(false)
    }
  }

  /**
   * handleSelectAll
   * 
   * Toggles the "select all" checkbox.
   * Only selects notifications visible on the current page (not all pages).
   * 
   * Example: If you're on page 2 showing 10 items, this selects those 10.
   */
  const handleSelectAll = () => {
    // Get only the notifications visible on the current page
    const visibleNotifications = notifications.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,  // Start index (e.g., page 2 starts at index 10)
      currentPage * ITEMS_PER_PAGE         // End index (e.g., page 2 ends at index 20)
    )
    const visibleIds = visibleNotifications.map(n => n.id)
    
    // Check if all visible items are already selected
    const allVisibleSelected = visibleIds.every(id => selectedIds.has(id))
    
    if (allVisibleSelected && visibleIds.length > 0) {
      // If everything is selected, deselect all visible items
      const newSelected = new Set(selectedIds)
      visibleIds.forEach(id => newSelected.delete(id))
      setSelectedIds(newSelected)
    } else {
      // If not everything is selected, select all visible items
      const newSelected = new Set(selectedIds)
      visibleIds.forEach(id => newSelected.add(id))
      setSelectedIds(newSelected)
    }
  }

  /**
   * handleSelectNotification
   * 
   * Toggles a single notification checkbox on/off.
   * 
   * @param id - The notification ID to toggle
   */
  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedIds)
    
    // If already selected, remove it. Otherwise, add it.
    if (newSelected.has(id)) {
      newSelected.delete(id)  // Uncheck this notification
    } else {
      newSelected.add(id)     // Check this notification
    }
    
    setSelectedIds(newSelected)
  }

  /**
   * handleBulkDelete
   * 
   * Deletes all selected notifications.
   * Shows a confirmation popup first to prevent accidents.
   * 
   * Example: User checked 5 notifications, clicks "Delete Selected" → This deletes those 5.
   */
  const handleBulkDelete = async () => {
    // Make sure at least one notification is selected
    if (selectedIds.size === 0) {
      toast.error('No notifications selected')
      return
    }

    // Ask user to confirm before deleting
    const confirmed = confirm(
      `Are you sure you want to delete ${selectedIds.size} notification${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    )
    if (!confirmed) return  // User clicked "Cancel"

    setIsDeleting(true)  // Show loading state on delete button
    
    try {
      // Send delete request to server with all selected IDs
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
        toast.success(
          `Successfully deleted ${result.deletedCount} notification${result.deletedCount > 1 ? 's' : ''}`
        )
        
        setSelectedIds(new Set())  // Clear all checkboxes
        
        // Immediately remove deleted items from the UI (don't wait for server refresh)
        setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)))
        
        // Then refresh from server to make sure we're in sync
        await refreshData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete notifications')
      }
    } catch (error) {
      console.error('Failed to delete notifications:', error)
      toast.error('Failed to delete notifications')
    } finally {
      setIsDeleting(false)  // Hide loading state
    }
  }

  // ---------------------------------------------------------------------------
  // EFFECTS - Code that runs automatically when certain things change
  // ---------------------------------------------------------------------------

  /**
   * Initial Load + Reload on Filter Change
   * 
   * This runs when:
   * 1. The page first loads
   * 2. User changes any filter (status, event, priority)
   * 
   * It fetches all the data and displays it.
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)  // Show loading spinner
      
      // Fetch notifications, stats, recipients, and payment details all at once
      await Promise.all([fetchNotifications(), fetchStats(), fetchRecipients(), fetchPaymentDetails()])
      
      setLoading(false)  // Hide loading spinner
    }
    loadData()
  }, [filter, eventFilter, priorityFilter])  // Re-run when these filters change
  
  /**
   * Reset to Page 1 When Filters Change
   * 
   * When user changes a filter, go back to page 1.
   * Example: If you're on page 3 and filter to "failed", start at page 1 of failed notifications.
   */
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, eventFilter, priorityFilter])

  /**
   * Handle URL Parameters
   * 
   * Pre-fill form when coming from messages page
   */
  useEffect(() => {
    const tab = searchParams.get('tab')
    const email = searchParams.get('email')
    const name = searchParams.get('name')
    const subject = searchParams.get('subject')
    
    if (tab) {
      setActiveTab(tab)
    }
    
    if (email || name || subject) {
      setManualNotification(prev => ({
        ...prev,
        recipient_email: email || prev.recipient_email,
        recipient_name: name || prev.recipient_name,
        title: subject ? `Re: ${subject}` : prev.title
      }))
    }
  }, [searchParams])

  // Auto-refresh removed - admins can use the manual refresh button to update data

  // ---------------------------------------------------------------------------
  // RENDER - What to show on the page
  // ---------------------------------------------------------------------------

  // If still loading data, show a spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Main page content (shown after loading is done)

  return (
    <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-xs sm:text-base line-clamp-2">Manage system notifications and email communications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} disabled={isRefreshing} variant="outline" size="sm" className="shrink-0">
            <RefreshCw className={`w-4 h-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            onClick={async () => {
              const confirmed = confirm(
                `⚠️ WARNING: This will permanently delete ALL ${notifications.length} notifications!\n\nThis action cannot be undone. Are you absolutely sure?`
              )
              if (!confirmed) return
              
              setIsClearingAll(true)
              try {
                const allIds = notifications.map(n => n.id)
                const response = await fetch('/api/admin/notifications?bulk=true', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: allIds })
                })
                
                if (response.ok) {
                  const result = await response.json()
                  toast.success(`Successfully cleared ${result.deletedCount} notifications`)
                  await refreshData()
                } else {
                  toast.error('Failed to clear notifications')
                }
              } catch (error) {
                console.error('Failed to clear all notifications:', error)
                toast.error('Failed to clear notifications')
              } finally {
                setIsClearingAll(false)
              }
            }}
            disabled={isClearingAll || notifications.length === 0}
            variant="destructive"
            size="sm"
            className="shrink-0"
          >
            <Trash2 className={`w-4 h-4 sm:mr-2 ${isClearingAll ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Clear All</span>
          </Button>
        </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5">All Notifications</TabsTrigger>
          <TabsTrigger value="send" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5">Send Notification</TabsTrigger>
          <TabsTrigger value="recipients" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5">Admin Recipients</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters and Bulk Actions */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  {NOTIFICATION_EVENTS.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
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
                    checked={(() => {
                      const visibleNotifications = notifications.slice(
                        (currentPage - 1) * ITEMS_PER_PAGE,
                        currentPage * ITEMS_PER_PAGE
                      )
                      const visibleIds = visibleNotifications.map(n => n.id)
                      return visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id))
                    })()}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="text-xs sm:text-sm font-semibold cursor-pointer">
                    Select All on Page <span className="text-muted-foreground">({Math.min(ITEMS_PER_PAGE, notifications.length - (currentPage - 1) * ITEMS_PER_PAGE)})</span>
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

          {/* ===============================================================
           * NOTIFICATIONS LIST - Display all the email notifications
           * ===============================================================
           * This section shows each notification as a card with details.
           * Think of it like a list of receipts for emails that were sent.
           * =============================================================== */}
          <div className="space-y-4">
            {/* If there are NO notifications, show a message */}
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No notifications found</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* If there ARE notifications, show them page by page */}
                {/* Step 1: Slice the array to get only items for current page */}
                {/* Step 2: Map through each notification and create a card */}
                {notifications
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((notification) => (
                <Card key={notification.id} className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
                    <div className="space-y-2 sm:space-y-3">
                      {/* Top row: Checkbox + Icon + Title + Delete button */}
                      <div className="flex items-start gap-2 sm:gap-3">
                        {/* Checkbox to select this notification for bulk actions */}
                        {/* Is this notification selected? - shrink-0 means don't make it smaller */}
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          className="mt-1 shrink-0"
                        />
                        
                        {/* Status icon + Email subject */}
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          {/* Status icon (green checkmark, red X, yellow clock, etc.) */}
                          <div className="shrink-0 mt-0.5">{statusIcons[notification.status]}</div>
                          
                          {/* Email subject line (what the email was about) */}
                          <CardTitle className="text-sm sm:text-lg leading-snug break-words">{notification.subject}</CardTitle>
                        </div>
                        {/* Delete button for this single notification - Red button (dangerous action) */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            // Step 1: Ask user to confirm (prevent accidents)
                            if (!confirm('Delete this notification record?')) return
                            
                            // Step 2: Send delete request to server
                            const url = `/api/admin/notifications?id=${encodeURIComponent(notification.id)}`
                            const res = await fetch(url, { method: 'DELETE' })
                            
                            // Step 3: Show success or error message
                            if (res.ok) {
                              toast.success('Notification deleted')  // Green popup
                              refreshData()  // Reload the list
                            } else {
                              toast.error('Failed to delete notification')  // Red popup
                            }
                          }}
                          className="shrink-0 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline sm:ml-1">Delete</span>
                        </Button>
                      </div>
                      {/* Badges row: Shows priority, event type, category, module */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {/* Priority badge (low/medium/high/urgent) with color coding */}
                        <Badge className={`${priorityColors[notification.priority]} text-xs`}>
                          {notification.priority}
                        </Badge>
                        
                        {/* Event type badge (what triggered this email - e.g., "order_created", "payment_failed") */}
                        <Badge variant="outline" className="text-xs truncate max-w-[120px] sm:max-w-none">
                          {notification.event}
                        </Badge>
                        
                        {/* Category badge (only show if it exists - "&&" means "if this exists, then show this") */}
                        {/* Legacy field for categorization */}
                        {notification.category && (
                          <Badge variant="outline" className="text-xs truncate max-w-[100px] sm:max-w-none">
                            {notification.category}
                          </Badge>
                        )}
                        
                        {/* Platform module badge (which part of system sent this - e.g., "orders", "payments") */}
                        {notification.platform_module && (
                          <Badge variant="secondary" className="text-xs truncate max-w-[100px] sm:max-w-none">
                            {notification.platform_module}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Recipient information (who we sent this email to) */}
                    <CardDescription className="mt-2 text-xs sm:text-sm break-all">
                      <span className="font-medium">To:</span> {notification.recipient_name || notification.recipient_email} 
                      {/* If we have their name, also show email in parentheses (desktop only) */}
                      {notification.recipient_name && <span className="hidden sm:inline"> ({notification.recipient_email})</span>}
                    </CardDescription>
                  </CardHeader>
                  {/* Card body - Additional notification details */}
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-2">
                      {/* Timestamps - When things happened */}
                      <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-muted-foreground">
                        {/* Always show when notification was created */}
                        <span className="truncate">Created: {formatToEAT(notification.created_at)}</span>
                        
                        {/* Only show "Sent" time if it was actually sent */}
                        {notification.sent_at && (
                          <span className="truncate">Sent: {formatToEAT(notification.sent_at)}</span>
                        )}
                        
                        {/* Only show "Scheduled" time if it was scheduled */}
                        {notification.scheduled_at && (
                          <span className="truncate">Scheduled: {formatToEAT(notification.scheduled_at)}</span>
                        )}
                      </div>
                      {/* Error message box (only shows if there was an error) */}
                      {notification.error_message && (
                        <div className="text-xs sm:text-sm text-red-600 bg-red-50 p-2 rounded break-words">
                          <span className="font-semibold">Error:</span> {notification.error_message}
                        </div>
                      )}
                      
                      {/* Delivery channels (how we sent it: email, SMS, etc. - Usually just "email") */}
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="text-xs sm:text-sm truncate">
                          Channels: {notification.channels.join(', ')}
                        </span>
                      </div>
                      
                      {/* Action button link (if this notification has a clickable action) */}
                      {notification.action_url && (
                        <div>
                          {/* URL to go to when clicked - opens in new tab for security */}
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
                  ))}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, notifications.length)} of {notifications.length} notifications
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-9 h-9 p-0"
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          {/* Payment Details Configuration Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="payment-details" className="border rounded-lg">
              <Card className="border-0">
                <CardHeader className="pb-0">
                  <AccordionTrigger className="hover:no-underline [&[data-state=open]]:pb-4">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left flex-1">
                        <CardTitle className="text-base sm:text-lg font-semibold">Payment Details Configuration</CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-0.5">
                          Configure payment account details for Direct Pay orders
                        </CardDescription>
                      </div>
                    </div>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="space-y-6 pt-2">
              {/* Bank Transfer Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    🏦 Bank Transfer Details
                  </h3>
                  <Button
                    type="button"
                    variant={excludedFields.has('bank') ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      const newExcluded = new Set(excludedFields)
                      if (newExcluded.has('bank')) {
                        newExcluded.delete('bank')
                      } else {
                        newExcluded.add('bank')
                      }
                      setExcludedFields(newExcluded)
                    }}
                    className={`h-8 px-4 rounded-full ${excludedFields.has('bank') ? 'text-red-600 border-red-300' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {excludedFields.has('bank') ? '❌ Excluded' : 'Included'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={paymentDetails.bank_name}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                      placeholder="e.g., CRDB Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Bank Account Number</Label>
                    <Input
                      id="account_number"
                      value={paymentDetails.account_number}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, account_number: e.target.value }))}
                      placeholder="e.g., 0123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      value={paymentDetails.account_name}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, account_name: e.target.value }))}
                      placeholder="e.g., TISCO MARKET LTD"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Money Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                  📱 Mobile Money Details
                </h3>
                
                {/* M-Pesa */}
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-900">M-Pesa</h4>
                    <Button
                      type="button"
                      variant={excludedFields.has('mpesa') ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => {
                        const newExcluded = new Set(excludedFields)
                        if (newExcluded.has('mpesa')) {
                          newExcluded.delete('mpesa')
                        } else {
                          newExcluded.add('mpesa')
                        }
                        setExcludedFields(newExcluded)
                      }}
                      className={`h-7 px-3 text-xs rounded-full ${excludedFields.has('mpesa') ? 'text-red-600 border-red-300' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {excludedFields.has('mpesa') ? '❌ Excluded' : 'Included'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mpesa_number">M-Pesa Number</Label>
                    <Input
                      id="mpesa_number"
                      value={paymentDetails.mpesa_number}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, mpesa_number: e.target.value }))}
                      placeholder="e.g., +255 7XX XXX XXX or 07XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Tigo Pesa */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900">Tigo Pesa</h4>
                    <Button
                      type="button"
                      variant={excludedFields.has('tigo_pesa') ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => {
                        const newExcluded = new Set(excludedFields)
                        if (newExcluded.has('tigo_pesa')) {
                          newExcluded.delete('tigo_pesa')
                        } else {
                          newExcluded.add('tigo_pesa')
                        }
                        setExcludedFields(newExcluded)
                      }}
                      className={`h-7 px-3 text-xs rounded-full ${excludedFields.has('tigo_pesa') ? 'text-red-600 border-red-300' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {excludedFields.has('tigo_pesa') ? '❌ Excluded' : 'Included'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tigo_pesa_number">Tigo Pesa Number</Label>
                    <Input
                      id="tigo_pesa_number"
                      value={paymentDetails.tigo_pesa_number}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, tigo_pesa_number: e.target.value }))}
                      placeholder="e.g., +255 6XX XXX XXX or 06XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Airtel Money */}
                <div className="bg-red-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-red-900">Airtel Money</h4>
                    <Button
                      type="button"
                      variant={excludedFields.has('airtel_money') ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => {
                        const newExcluded = new Set(excludedFields)
                        if (newExcluded.has('airtel_money')) {
                          newExcluded.delete('airtel_money')
                        } else {
                          newExcluded.add('airtel_money')
                        }
                        setExcludedFields(newExcluded)
                      }}
                      className={`h-7 px-3 text-xs rounded-full ${excludedFields.has('airtel_money') ? 'text-red-600 border-red-300' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {excludedFields.has('airtel_money') ? '❌ Excluded' : 'Included'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="airtel_money_number">Airtel Money Number</Label>
                    <Input
                      id="airtel_money_number"
                      value={paymentDetails.airtel_money_number}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, airtel_money_number: e.target.value }))}
                      placeholder="e.g., +255 6XX XXX XXX or 06XX XXX XXX"
                    />
                  </div>
                </div>
              </div>

              {/* LIPA Number */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    💳 LIPA Number
                  </h3>
                  <Button
                    type="button"
                    variant={excludedFields.has('lipa') ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      const newExcluded = new Set(excludedFields)
                      if (newExcluded.has('lipa')) {
                        newExcluded.delete('lipa')
                      } else {
                        newExcluded.add('lipa')
                      }
                      setExcludedFields(newExcluded)
                    }}
                    className={`h-8 px-4 rounded-full ${excludedFields.has('lipa') ? 'text-red-600 border-red-300' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {excludedFields.has('lipa') ? '❌ Excluded' : 'Included'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lipa_number">LIPA Number</Label>
                  <Input
                    id="lipa_number"
                    value={paymentDetails.lipa_number}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, lipa_number: e.target.value }))}
                    placeholder="e.g., 888xxx"
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional: Business short code or LIPA number for Till/Paybill payments
                  </p>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    📝 Additional Instructions
                  </h3>
                  <Button
                    type="button"
                    variant={excludedFields.has('instructions') ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      const newExcluded = new Set(excludedFields)
                      if (newExcluded.has('instructions')) {
                        newExcluded.delete('instructions')
                      } else {
                        newExcluded.add('instructions')
                      }
                      setExcludedFields(newExcluded)
                    }}
                    className={`h-8 px-4 rounded-full ${excludedFields.has('instructions') ? 'text-red-600 border-red-300' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {excludedFields.has('instructions') ? '❌ Excluded' : 'Included'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_instructions">Additional Payment Instructions</Label>
                  <Textarea
                    id="payment_instructions"
                    value={paymentDetails.payment_instructions}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, payment_instructions: e.target.value }))}
                    placeholder="Professional payment instructions will guide customers on next steps..."
                    rows={8}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={savePaymentDetails}
                  disabled={isSavingPaymentDetails}
                  size="lg"
                >
                  {isSavingPaymentDetails ? 'Saving...' : 'Save Payment Details'}
                </Button>
              </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>💡 Tip:</strong> After saving, use the "Insert Payment Details" button in the message field below to add these details to your notification.
                      </p>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          {/* Send Manual Notification Card */}
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
                  rows={8}
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant={paymentDetailsLoaded ? "default" : "outline"}
                    size="sm"
                    onClick={insertPaymentDetailsIntoMessage}
                    disabled={!paymentDetailsLoaded}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <CreditCard className="h-4 w-4" />
                    Insert Payment Details
                  </Button>
                  {!paymentDetailsLoaded && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      💡 Save payment details above first
                    </span>
                  )}
                  {paymentDetailsLoaded && (
                    <span className="text-xs text-green-600">
                      Ready to insert
                    </span>
                  )}
                </div>
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
                disabled={!manualNotification.recipient_email || !manualNotification.title || !manualNotification.message || isSendingNotification}
                className="w-full"
              >
                {isSendingNotification ? (
                  <>
                    <span className="animate-pulse">Sending</span>
                    <span className="ml-1 animate-bounce">...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Notification
                  </>
                )}
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
                      {NOTIFICATION_EVENTS.map((category) => (
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
                  setIsSavingRecipient(true)
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
                  } finally {
                    setIsSavingRecipient(false)
                  }
                }}
                disabled={!newRecipient.email || isSavingRecipient}
              >
                {isSavingRecipient ? (
                  <>
                    <span className="animate-pulse">Saving</span>
                    <span className="ml-1 animate-bounce">...</span>
                  </>
                ) : (
                  isEditing ? 'Update Recipient' : 'Add Recipient'
                )}
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
