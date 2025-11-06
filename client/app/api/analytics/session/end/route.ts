/**
 * Session End API
 * 
 * Records when a user session ends (logout, close browser, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    // Update session with end time
    const { error } = await supabase
      .from('user_sessions')
      .update({
        ended_at: new Date().toISOString()
      })
      .eq('session_id', session_id)
      .is('ended_at', null) // Only update if not already ended

    if (error) {
      console.error('Error ending session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Session end error:', error)
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    )
  }
}
