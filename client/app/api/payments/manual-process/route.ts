import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

// Manual payment processing for stuck sessions
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transaction_reference } = await req.json()
    
    if (!transaction_reference) {
      return NextResponse.json({ error: 'transaction_reference required' }, { status: 400 })
    }

    // Get the payment session
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('transaction_reference', transaction_reference)
      .eq('user_id', user.id) // Ensure user can only process their own sessions
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Payment session not found or not authorized' }, { status: 404 })
    }

    // Only allow processing of stuck sessions
    if (session.status !== 'processing') {
      return NextResponse.json({ 
        error: `Session status is ${session.status}, manual processing not allowed` 
      }, { status: 400 })
    }

    // Check session age - only process if it's been at least 5 minutes
    const sessionAge = Date.now() - new Date(session.created_at).getTime()
    const minAge = 5 * 60 * 1000 // 5 minutes
    
    if (sessionAge < minAge) {
      return NextResponse.json({
        error: 'Session too recent, please wait before manual processing',
        age_minutes: Math.floor(sessionAge / (1000 * 60)),
        min_age_minutes: 5
      }, { status: 400 })
    }

    // Trigger the status check endpoint
    const statusResponse = await fetch(`${req.nextUrl.origin}/api/payments/status-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction_reference })
    })

    const statusResult = await statusResponse.json()

    // Log the manual processing attempt
    try {
      await supabase
        .from('payment_logs')
        .insert({
          session_id: session.id,
          event_type: 'manual_processing_attempt',
          data: { 
            message: 'User triggered manual payment processing',
            session_age_minutes: Math.floor(sessionAge / (1000 * 60)),
            status_check_result: statusResult
          },
          user_id: session.user_id
        })
    } catch {
      // Don't fail if logging fails
    }

    return NextResponse.json({
      message: 'Manual processing triggered',
      session_reference: transaction_reference,
      status_check_result: statusResult
    })

  } catch (error) {
    console.error('Manual processing error:', error)
    return NextResponse.json({ 
      error: 'Manual processing failed: ' + (error as Error).message 
    }, { status: 500 })
  }
}
