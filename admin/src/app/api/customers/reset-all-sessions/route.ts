/**
 * Global Sessions Reset API for Admin Dashboard
 * 
 * Resets all user sessions globally, which affects:
 * - Total Sessions count
 * - Device breakdown statistics
 * - Browser breakdown statistics
 * - OS breakdown statistics
 * 
 * This is a platform-wide reset operation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Starting global sessions reset...')

    // Count sessions before deletion
    const { count: totalSessions } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })

    // Delete all user sessions
    const { error: sessionsError } = await supabase
      .from('user_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using impossible ID for neq)

    if (sessionsError) {
      console.error('❌ Error deleting all sessions:', sessionsError)
      throw new Error(`Failed to delete sessions: ${sessionsError.message}`)
    }

    console.log(`✅ Deleted ${totalSessions} sessions globally`)

    // Reset all user activity summaries
    const { error: summaryError } = await supabase
      .from('user_activity_summary')
      .update({
        total_sessions: 0,
        last_login_at: null,
        primary_device_type: null,
        primary_browser: null,
        primary_os: null
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (summaryError) {
      console.error('❌ Error updating activity summaries:', summaryError)
      // Don't throw - this is not critical
    }

    console.log('🎉 Successfully reset all sessions globally')

    return NextResponse.json({
      success: true,
      message: 'All sessions reset successfully',
      data: {
        deletedSessions: totalSessions || 0
      }
    })
  } catch (error) {
    console.error('❌ Error resetting all sessions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset all sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
