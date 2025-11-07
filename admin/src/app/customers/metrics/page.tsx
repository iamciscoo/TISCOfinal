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
import { Users, Monitor, Smartphone, Tablet, TrendingUp, ShoppingBag, Calendar, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react'
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Metrics</h1>
          <p className="text-gray-600 mt-1">Comprehensive customer analytics and activity tracking</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowGlobalResetDialog(true)}
            disabled={globalResetLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All Sessions
          </Button>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_users}</div>
              <p className="text-xs text-muted-foreground">Registered on platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.unique_users_in_period}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_sessions}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders & Bookings</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.reduce((sum, u) => sum + u.total_orders + u.total_bookings, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Device, Browser, OS Breakdown */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Sessions by device type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(statistics.device_breakdown || {}).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device)}
                    <span className="capitalize">{device}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Browser Breakdown</CardTitle>
              <CardDescription>Sessions by browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(statistics.browser_breakdown || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <span>{browser}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OS Breakdown</CardTitle>
              <CardDescription>Sessions by operating system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(statistics.os_breakdown || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([os, count]) => (
                  <div key={os} className="flex items-center justify-between">
                    <span>{os}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity Details</CardTitle>
          <CardDescription>Individual user metrics and session information</CardDescription>
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Primary Device</TableHead>
                  <TableHead>Actions</TableHead>
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
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.registered_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={user.total_orders > 0 ? 'default' : 'secondary'}>
                          {user.total_orders}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.total_bookings > 0 ? 'default' : 'secondary'}>
                          {user.total_bookings}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.total_sessions}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(user.last_login)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(user.primary_device)}
                          <span className="capitalize text-sm">{user.primary_device}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                          >
                            {expandedUser === user.id ? 'Hide' : 'Details'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => setResetUserId(user.id)}
                            disabled={resetLoading}
                            title="Reset user metrics (clears sessions and reviews)"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row with Session Details */}
                    {expandedUser === user.id && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            <h4 className="font-semibold">User Information</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                                <div className="flex items-center justify-between mt-4">
                                  <h4 className="font-semibold">Recent Sessions</h4>
                                  <span className="text-xs text-gray-500">
                                    {user.recent_sessions.length} total sessions
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
