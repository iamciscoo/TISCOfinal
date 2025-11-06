/**
 * Session Analytics API
 * 
 * Tracks user sessions with device, browser, and OS information
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
    
    const {
      user_id,
      session_id,
      device_type,
      os_name,
      os_version,
      browser_name,
      browser_version,
      landing_page,
      referrer,
      user_agent
    } = body

    // Get IP address from request headers
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                       req.headers.get('x-real-ip') || 
                       null

    // Insert session record
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user_id || null,
        session_id,
        device_type,
        os_name,
        os_version,
        browser_name,
        browser_version,
        landing_page,
        referrer,
        user_agent,
        ip_address,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Session tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track session' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    // Update last activity time
    const { error } = await supabase
      .from('user_sessions')
      .update({
        last_activity_at: new Date().toISOString()
      })
      .eq('session_id', session_id)

    if (error) {
      console.error('Error updating session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}
