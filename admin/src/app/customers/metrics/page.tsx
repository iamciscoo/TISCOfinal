'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, Monitor, Smartphone, Tablet, TrendingUp, ShoppingBag, Calendar, RotateCcw, Search, ChevronLeft, ChevronRight, Eye, EyeOff, Columns } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface UserMetric {
  id: string
  email: string
  full_name: string
  phone: string | null
  city: string | null
  country: string | null
  registered_at: string
  total_orders: number
  total_bookings: number
  total_sessions: number
  last_login: string | null
  last_order_at: string | null
  last_order_amount: number | null
  last_booking_at: string | null
  last_booking_service: string | null
  primary_device: string
  primary_browser: string
  primary_os: string
  recent_sessions: Array<{
    session_id: string
    device_type: string
    os: string
    browser: string
    started_at: string
    ended_at: string | null
    ip_address: string | null
    country: string | null
    city: string | null
  }>
}

interface Statistics {
  total_users: number
  total_sessions: number
  unique_users_in_period: number
  device_breakdown: Record<string, number>
  browser_breakdown: Record<string, number>
  os_breakdown: Record<string, number>
}

export default function CustomerMetricsPage() {
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all')
  const [sortBy, setSortBy] = useState<'registered' | 'sessions' | 'orders' | 'bookings' | 'last_login'>('sessions')
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [users, setUsers] = useState<UserMetric[]>([])
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [globalResetLoading, setGlobalResetLoading] = useState(false)
  const [showGlobalResetDialog, setShowGlobalResetDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sessionPages, setSessionPages] = useState<Record<string, number>>({})
  const rowsPerPage = 20
  const sessionsPerPage = 20
  const { toast } = useToast()

  // Column visibility state - Orders and Bookings hidden by default for mobile
  const [columnVisibility, setColumnVisibility] = useState({
    email: true,
    registered: true,
    orders: false, // Hidden by default for cleaner mobile view
    bookings: false, // Hidden by default for cleaner mobile view
    sessions: true,
    lastLogin: true,
    device: true,
  })

  const toggleColumn = (column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }))
  }

  // Close expanded user details when clicking outside
  useEffect(() => {
    if (!expandedUser) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Don't close if clicking inside the expanded section or the View button
      if (target.closest('[data-expanded-row]') || target.closest('[data-view-button]')) {
        return
      }
      setExpandedUser(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedUser])

  useEffect(() => {
    fetchMetrics()
  }, [interval, sortBy])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      // Add cache-busting timestamp to force fresh data
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/customers/metrics?interval=${interval}&sortBy=${sortBy}&sortOrder=desc&_t=${timestamp}`, {
        cache: 'no-store'
      })
      const result = await response.json()

      if (result.success) {
        setStatistics(result.data.statistics)
        setUsers(result.data.users)
      }
    } catch (error) {
      console.error('Error fetching customer metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    return (
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.city?.toLowerCase().includes(query) ||
      user.country?.toLowerCase().includes(query)
    )
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleGlobalSessionsReset = async () => {
    try {
      setGlobalResetLoading(true)
      const response = await fetch('/api/customers/reset-all-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset all sessions')
      }

      toast({
        title: "✅ Successfully reset all sessions",
        description: `Deleted ${result.data.deletedSessions} sessions globally. Total Sessions and breakdowns have been recalculated.`,
      })

      // Refresh the metrics data
      setCurrentPage(1)
      setSearchQuery('')
      await new Promise(resolve => setTimeout(resolve, 500))
      await fetchMetrics()
    } catch (error) {
      console.error('Error resetting all sessions:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to reset all sessions',
        variant: "destructive",
      })
    } finally {
      setGlobalResetLoading(false)
      setShowGlobalResetDialog(false)
    }
  }

  const handleResetUser = async (userId: string) => {
    try {
      setResetLoading(true)
      const response = await fetch('/api/customers/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset user metrics')
      }

      // Show success toast
      toast({
        title: "✅ Successfully reset metrics",
        description: `Deleted ${result.data.deletedCounts.sessions} sessions, ${result.data.deletedCounts.reviews} reviews, and ${result.data.deletedCounts.activitySummary} activity summaries for ${result.data.user.name}. Device, browser, and OS statistics have been recalculated.`,
      })

      // Refresh the metrics data and reset pagination
      setCurrentPage(1)
      setSearchQuery('')
      // Small delay to ensure database changes are committed
      await new Promise(resolve => setTimeout(resolve, 500))
      await fetchMetrics()
    } catch (error) {
      console.error('Error resetting user metrics:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to reset user metrics',
        variant: "destructive",
      })
    } finally {
      setResetLoading(false)
      setResetUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Customer Metrics</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm">Comprehensive customer analytics and activity tracking</p>
        </div>
        
        {/* Filters - Stack on Mobile */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => setShowGlobalResetDialog(true)}
            disabled={globalResetLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-auto text-xs sm:text-sm h-9"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Reset All Sessions
          </Button>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sessions">Most Active (Sessions)</SelectItem>
              <SelectItem value="orders">Most Orders</SelectItem>
              <SelectItem value="bookings">Most Bookings</SelectItem>
              <SelectItem value="last_login">Recent Login</SelectItem>
              <SelectItem value="registered">Recently Registered</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={interval} onValueChange={(value: any) => setInterval(value)}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="daily">Last 24 Hours</SelectItem>
              <SelectItem value="weekly">Last 7 Days</SelectItem>
              <SelectItem value="monthly">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{statistics.total_users}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Registered on platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Users</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{statistics.unique_users_in_period}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{statistics.total_sessions}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Orders & Bookings</CardTitle>
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {users.reduce((sum, u) => sum + u.total_orders + u.total_bookings, 0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Device, Browser, OS Breakdown */}
      {statistics && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base">Device Breakdown</CardTitle>
              <CardDescription className="text-xs">Sessions by device type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-4 pt-2">
              {Object.entries(statistics.device_breakdown || {}).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device)}
                    <span className="capitalize">{device}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base">Browser Breakdown</CardTitle>
              <CardDescription className="text-xs">Sessions by browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-4 pt-2">
              {Object.entries(statistics.browser_breakdown || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="truncate">{browser}</span>
                    <Badge variant="secondary" className="text-xs ml-2">{count}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base">OS Breakdown</CardTitle>
              <CardDescription className="text-xs">Sessions by operating system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-4 pt-2">
              {Object.entries(statistics.os_breakdown || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([os, count]) => (
                  <div key={os} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="truncate">{os}</span>
                    <Badge variant="secondary" className="text-xs ml-2">{count}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Details Table */}
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">User Activity Details</CardTitle>
          <CardDescription className="text-xs">Individual user metrics and session information</CardDescription>
          
          {/* Search Bar and Column Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 sm:pt-4">
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-2 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 sm:pl-8 h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Columns className="h-3 w-3 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.email}
                    onCheckedChange={() => toggleColumn('email')}
                    className="text-xs"
                  >
                    Email
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.registered}
                    onCheckedChange={() => toggleColumn('registered')}
                    className="text-xs"
                  >
                    Registered
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.orders}
                    onCheckedChange={() => toggleColumn('orders')}
                    className="text-xs"
                  >
                    Orders
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.bookings}
                    onCheckedChange={() => toggleColumn('bookings')}
                    className="text-xs"
                  >
                    Bookings
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.sessions}
                    onCheckedChange={() => toggleColumn('sessions')}
                    className="text-xs"
                  >
                    Sessions
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.lastLogin}
                    onCheckedChange={() => toggleColumn('lastLogin')}
                    className="text-xs"
                  >
                    Last Login
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.device}
                    onCheckedChange={() => toggleColumn('device')}
                    className="text-xs"
                  >
                    Device
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                Showing {paginatedUsers.length} of {filteredUsers.length}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs whitespace-nowrap">User</TableHead>
                  {columnVisibility.sessions && (
                    <TableHead className="text-xs whitespace-nowrap">Sessions</TableHead>
                  )}
                  {columnVisibility.lastLogin && (
                    <TableHead className="text-xs whitespace-nowrap">Last Login</TableHead>
                  )}
                  {columnVisibility.orders && (
                    <TableHead className="text-xs whitespace-nowrap">Orders</TableHead>
                  )}
                  {columnVisibility.bookings && (
                    <TableHead className="text-xs whitespace-nowrap">Bookings</TableHead>
                  )}
                  {columnVisibility.email && (
                    <TableHead className="text-xs whitespace-nowrap hidden sm:table-cell">Email</TableHead>
                  )}
                  {columnVisibility.registered && (
                    <TableHead className="text-xs whitespace-nowrap hidden md:table-cell">Registered</TableHead>
                  )}
                  {columnVisibility.device && (
                    <TableHead className="text-xs whitespace-nowrap hidden lg:table-cell">Device</TableHead>
                  )}
                  <TableHead className="text-xs whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No users found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium text-xs sm:text-sm">{user.full_name}</TableCell>
                      {columnVisibility.sessions && (
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{user.total_sessions}</Badge>
                        </TableCell>
                      )}
                      {columnVisibility.lastLogin && (
                        <TableCell className="text-xs text-gray-600">
                          {formatDate(user.last_login)}
                        </TableCell>
                      )}
                      {columnVisibility.orders && (
                        <TableCell>
                          <Badge variant={user.total_orders > 0 ? 'default' : 'secondary'} className="text-xs">
                            {user.total_orders}
                          </Badge>
                        </TableCell>
                      )}
                      {columnVisibility.bookings && (
                        <TableCell>
                          <Badge variant={user.total_bookings > 0 ? 'default' : 'secondary'} className="text-xs">
                            {user.total_bookings}
                          </Badge>
                        </TableCell>
                      )}
                      {columnVisibility.email && (
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{user.email}</TableCell>
                      )}
                      {columnVisibility.registered && (
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{new Date(user.registered_at).toLocaleDateString()}</TableCell>
                      )}
                      {columnVisibility.device && (
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(user.primary_device)}
                            <span className="capitalize text-xs">{user.primary_device}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            className="text-xs h-7 px-2"
                            data-view-button
                          >
                            {expandedUser === user.id ? 'Hide' : 'View'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-7 px-2"
                            onClick={() => setResetUserId(user.id)}
                            disabled={resetLoading}
                            title="Reset user metrics"
                          >
                            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row with Session Details */}
                    {expandedUser === user.id && (
                      <TableRow data-expanded-row>
                        <TableCell colSpan={9} className="bg-gray-50 p-3 sm:p-4 border-l-4 border-blue-500" data-expanded-row>
                          <div className="space-y-3 sm:space-y-4" data-expanded-row>
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm sm:text-base font-semibold text-gray-900">User Information</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedUser(null)}
                                className="text-xs h-6 px-2"
                                data-view-button
                              >
                                Close
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                              <div>
                                <span className="font-medium">Phone:</span> {user.phone || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">City:</span> {user.city || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Country:</span> {user.country || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Browser:</span> {user.primary_browser}
                              </div>
                              <div>
                                <span className="font-medium">OS:</span> {user.primary_os}
                              </div>
                              <div>
                                <span className="font-medium">Last Order:</span> {user.last_order_at ? formatDate(user.last_order_at) : 'Never'}
                              </div>
                              {user.last_order_amount && (
                                <div>
                                  <span className="font-medium">Last Order Amount:</span> TZS {user.last_order_amount.toLocaleString()}
                                </div>
                              )}
                              {user.last_booking_at && (
                                <div>
                                  <span className="font-medium">Last Booking:</span> {formatDate(user.last_booking_at)}
                                </div>
                              )}
                              {user.last_booking_service && (
                                <div>
                                  <span className="font-medium">Service:</span> {user.last_booking_service}
                                </div>
                              )}
                            </div>

                            {user.recent_sessions.length > 0 && (() => {
                              const currentSessionPage = sessionPages[user.id] || 1
                              const totalSessionPages = Math.ceil(user.recent_sessions.length / sessionsPerPage)
                              const sessionStartIdx = (currentSessionPage - 1) * sessionsPerPage
                              const paginatedSessions = user.recent_sessions.slice(sessionStartIdx, sessionStartIdx + sessionsPerPage)
                              
                              return (
                              <>
                                <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                                  <h4 className="text-sm sm:text-base font-semibold text-gray-900">Recent Sessions</h4>
                                  <span className="text-xs text-gray-500">
                                    {user.recent_sessions.length} total
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Started</TableHead>
                                        <TableHead>Ended</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Browser</TableHead>
                                        <TableHead>OS</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>IP Address</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {paginatedSessions.map((session, sessionIndex) => {
                                        const duration = session.ended_at 
                                          ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000 / 60)
                                          : null
                                        
                                        return (
                                        <TableRow key={`${user.id}-${session.session_id}-${sessionIndex}`}>
                                          <TableCell className="text-sm">
                                            {formatDate(session.started_at)}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {session.ended_at ? formatDate(session.ended_at) : <Badge variant="secondary">Active</Badge>}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {duration ? `${duration} min` : '-'}
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              {getDeviceIcon(session.device_type)}
                                              <span className="capitalize text-sm">{session.device_type}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-sm">{session.browser}</TableCell>
                                          <TableCell className="text-sm">{session.os}</TableCell>
                                          <TableCell className="text-sm">
                                            {session.city || session.country || 'Unknown'}
                                          </TableCell>
                                          <TableCell className="text-sm font-mono">
                                            {session.ip_address || 'N/A'}
                                          </TableCell>
                                        </TableRow>
                                        )
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                                {totalSessionPages > 1 && (
                                  <div className="flex items-center justify-between pt-3 border-t mt-3">
                                    <div className="text-xs text-gray-500">
                                      Page {currentSessionPage} of {totalSessionPages}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSessionPages(prev => ({
                                          ...prev,
                                          [user.id]: Math.max(1, (prev[user.id] || 1) - 1)
                                        }))}
                                        disabled={currentSessionPage === 1}
                                      >
                                        <ChevronLeft className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSessionPages(prev => ({
                                          ...prev,
                                          [user.id]: Math.min(totalSessionPages, (prev[user.id] || 1) + 1)
                                        }))}
                                        disabled={currentSessionPage === totalSessionPages}
                                      >
                                        <ChevronRight className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                              )
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetUserId !== null} onOpenChange={(open: boolean) => !open && setResetUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Metrics?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the following data for this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>All user sessions (login history)</li>
              <li>Product reviews</li>
              <li>Activity summary statistics</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <p className="font-medium">Statistics Update:</p>
              <p className="text-xs mt-1">Device, browser, and OS breakdowns will be automatically recalculated after deletion.</p>
            </div>
            <p className="font-semibold text-amber-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>This action cannot be undone!</span>
            </p>
            <p className="text-xs text-gray-500">
              Note: User account, order history, and bookings will be preserved.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetUserId && handleResetUser(resetUserId)}
              disabled={resetLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {resetLoading ? 'Resetting...' : 'Reset Metrics'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global Sessions Reset Dialog */}
      <AlertDialog open={showGlobalResetDialog} onOpenChange={(open: boolean) => !open && setShowGlobalResetDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Sessions Globally?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset ALL user sessions platform-wide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="font-semibold text-red-800">⚠️ Warning: This is a platform-wide reset!</p>
              <p className="text-sm text-red-700 mt-1">This will affect ALL users and will:</p>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Delete all user sessions for every user</li>
              <li>Reset Total Sessions count to 0</li>
              <li>Clear Device breakdown statistics</li>
              <li>Clear Browser breakdown statistics</li>
              <li>Clear OS breakdown statistics</li>
              <li>Update all user activity summaries</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <p className="font-medium">What will be preserved:</p>
              <p className="text-xs mt-1">User accounts, orders, bookings, and reviews will remain unchanged.</p>
            </div>
            <p className="font-semibold text-red-600 flex items-center gap-2 text-lg">
              <span>🚨</span>
              <span>This action cannot be undone!</span>
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={globalResetLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGlobalSessionsReset}
              disabled={globalResetLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {globalResetLoading ? 'Resetting All Sessions...' : 'Reset All Sessions'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
