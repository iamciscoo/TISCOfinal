/**
 * Customer Metrics API for Admin Dashboard
 * 
 * Provides comprehensive customer analytics including:
 * - Total registered users
 * - Sign-in frequencies (daily, weekly, monthly)
 * - Orders and bookings per user
 * - Device, OS, and browser statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const interval = searchParams.get('interval') || 'all' // daily, weekly, monthly, all
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get total registered users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get sign-in frequency based on interval
    let sessionsQuery = supabase
      .from('user_sessions')
      .select('*')
      .order('started_at', { ascending: false })
    
    // Apply date filter only if not 'all'
    if (interval !== 'all') {
      let dateRange: Date
      
      switch (interval) {
        case 'daily':
          dateRange = new Date()
          dateRange.setDate(dateRange.getDate() - 1)
          break
        case 'weekly':
          dateRange = new Date()
          dateRange.setDate(dateRange.getDate() - 7)
          break
        case 'monthly':
          dateRange = new Date()
          dateRange.setMonth(dateRange.getMonth() - 1)
          break
        default:
          dateRange = new Date()
          dateRange.setDate(dateRange.getDate() - 7)
      }
      
      sessionsQuery = sessionsQuery.gte('started_at', dateRange.toISOString())
    }

    // Get user sessions for the interval
    const { data: sessions, error: sessionsError } = await sessionsQuery

    if (sessionsError) throw sessionsError

    // Get user activity summaries
    const { data: activitySummaries, error: activityError } = await supabase
      .from('user_activity_summary')
      .select('*')
      .order('last_login_at', { ascending: false })
      .limit(limit)

    if (activityError) throw activityError

    // Get users with their order and booking counts
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        created_at,
        phone,
        city,
        country
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (usersError) throw usersError

    // Get orders count per user
    const { data: ordersData } = await supabase
      .from('orders')
      .select('user_id, id')
      .not('user_id', 'is', null)

    // Get bookings count per user
    const { data: bookingsData } = await supabase
      .from('service_bookings')
      .select('user_id, id')
      .not('user_id', 'is', null)

    // Aggregate data
    const userMetrics = users?.map(user => {
      const userOrders = ordersData?.filter(o => o.user_id === user.id) || []
      const userBookings = bookingsData?.filter(b => b.user_id === user.id) || []
      const userSessions = sessions?.filter(s => s.user_id === user.id) || []
      const activitySummary = activitySummaries?.find(a => a.user_id === user.id)

      // Calculate device statistics
      const deviceStats = userSessions.reduce((acc: any, session) => {
        acc[session.device_type || 'unknown'] = (acc[session.device_type || 'unknown'] || 0) + 1
        return acc
      }, {})

      const primaryDevice = Object.entries(deviceStats)
        .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'unknown'

      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
        phone: user.phone,
        city: user.city,
        country: user.country,
        registered_at: user.created_at,
        
        // Activity metrics
        total_orders: userOrders.length,
        total_bookings: userBookings.length,
        total_sessions: userSessions.length,
        last_login: activitySummary?.last_login_at || null,
        
        // Device information
        primary_device: activitySummary?.primary_device_type || primaryDevice,
        primary_browser: activitySummary?.primary_browser || userSessions[0]?.browser_name || 'Unknown',
        primary_os: activitySummary?.primary_os || userSessions[0]?.os_name || 'Unknown',
        
        // Recent session details
        recent_sessions: userSessions.slice(0, 5).map(s => ({
          session_id: s.session_id,
          device_type: s.device_type,
          os: `${s.os_name || 'Unknown'} ${s.os_version || ''}`.trim(),
          browser: `${s.browser_name || 'Unknown'} ${s.browser_version || ''}`.trim(),
          started_at: s.started_at,
          ip_address: s.ip_address,
          country: s.country,
          city: s.city
        }))
      }
    }) || []

    // Calculate aggregate statistics
    const statistics = {
      total_users: totalUsers || 0,
      total_sessions: sessions?.length || 0,
      unique_users_in_period: new Set(sessions?.map(s => s.user_id).filter(Boolean)).size,
      
      device_breakdown: sessions?.reduce((acc: any, s) => {
        acc[s.device_type || 'unknown'] = (acc[s.device_type || 'unknown'] || 0) + 1
        return acc
      }, {}),
      
      browser_breakdown: sessions?.reduce((acc: any, s) => {
        acc[s.browser_name || 'unknown'] = (acc[s.browser_name || 'unknown'] || 0) + 1
        return acc
      }, {}),
      
      os_breakdown: sessions?.reduce((acc: any, s) => {
        acc[s.os_name || 'unknown'] = (acc[s.os_name || 'unknown'] || 0) + 1
        return acc
      }, {})
    }

    return NextResponse.json({
      success: true,
      data: {
        interval,
        statistics,
        users: userMetrics
      }
    })
  } catch (error) {
    console.error('Error fetching customer metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer metrics' },
      { status: 500 }
    )
  }
}
