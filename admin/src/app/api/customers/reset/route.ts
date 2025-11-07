/**
 * User Metrics Reset API for Admin Dashboard
 * 
 * Provides functionality to reset user activity data while preserving:
 * - User account and profile
 * - Order history (financial data)
 * - Service bookings
 * 
 * Data that gets cleared:
 * - User sessions (login history)
 * - User activity summary
 * - Product reviews
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user exists before attempting reset
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log(`🔄 Starting metrics reset for user: ${user.email} (${userId})`)

    // Track deletion counts for response
    const deletionResults = {
      sessions: 0,
      reviews: 0,
      activitySummary: 0
    }

    // 1. Delete user sessions
    const { data: deletedSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .select('id')

    if (sessionsError) {
      console.error('❌ Error deleting user sessions:', sessionsError)
      throw new Error(`Failed to delete user sessions: ${sessionsError.message}`)
    }
    
    deletionResults.sessions = deletedSessions?.length || 0
    console.log(`✅ Deleted ${deletionResults.sessions} user sessions`)

    // 2. Delete product reviews
    const { data: deletedReviews, error: reviewsError } = await supabase
      .from('reviews')
      .delete()
      .eq('user_id', userId)
      .select('id')

    if (reviewsError) {
      console.error('❌ Error deleting reviews:', reviewsError)
      throw new Error(`Failed to delete reviews: ${reviewsError.message}`)
    }
    
    deletionResults.reviews = deletedReviews?.length || 0
    console.log(`✅ Deleted ${deletionResults.reviews} product reviews`)

    // 3. Delete user activity summary
    const { data: deletedSummary, error: summaryError } = await supabase
      .from('user_activity_summary')
      .delete()
      .eq('user_id', userId)
      .select('id')

    if (summaryError) {
      console.error('❌ Error deleting activity summary:', summaryError)
      throw new Error(`Failed to delete activity summary: ${summaryError.message}`)
    }
    
    deletionResults.activitySummary = deletedSummary?.length || 0
    console.log(`✅ Deleted ${deletionResults.activitySummary} activity summary records`)

    console.log(`🎉 Successfully reset metrics for user: ${user.email}`)
    console.log('📊 Deletion summary:', deletionResults)

    return NextResponse.json({
      success: true,
      message: 'User metrics reset successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'
        },
        deletedCounts: deletionResults,
        totalDeleted: Object.values(deletionResults).reduce((sum, count) => sum + count, 0)
      }
    })
  } catch (error) {
    console.error('❌ Error resetting user metrics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset user metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
