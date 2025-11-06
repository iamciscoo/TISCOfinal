'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Users, Monitor, Smartphone, Tablet, TrendingUp, ShoppingBag, Calendar } from 'lucide-react'

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
  primary_device: string
  primary_browser: string
  primary_os: string
  recent_sessions: Array<{
    session_id: string
    device_type: string
    os: string
    browser: string
    started_at: string
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
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [users, setUsers] = useState<UserMetric[]>([])
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [interval])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/metrics?interval=${interval}`)
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
                {users.map((user) => (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        >
                          {expandedUser === user.id ? 'Hide' : 'Details'}
                        </Button>
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
                            </div>

                            {user.recent_sessions.length > 0 && (
                              <>
                                <h4 className="font-semibold mt-4">Recent Sessions</h4>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date/Time</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Browser</TableHead>
                                        <TableHead>OS</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>IP Address</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {user.recent_sessions.map((session) => (
                                        <TableRow key={session.session_id}>
                                          <TableCell className="text-sm">
                                            {formatDate(session.started_at)}
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
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
