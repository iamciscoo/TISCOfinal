import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

// User-triggered payment completion check
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

    console.log(`🔍 User checking payment completion for: ${transaction_reference}`)

    // Get the payment session
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('transaction_reference', transaction_reference)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Payment session not found' }, { status: 404 })
    }

    // If already completed, just return status
    if (session.status === 'completed') {
      return NextResponse.json({ 
        status: 'completed',
        message: 'Payment already processed',
        transaction_reference
      })
    }

    // If still processing and been more than 1 minute, auto-process it
    const sessionAge = Date.now() - new Date(session.created_at).getTime()
    const oneMinute = 60 * 1000

    if (session.status === 'processing' && sessionAge > oneMinute) {
      console.log(`⚡ Auto-processing user's payment: ${transaction_reference}`)
      
      // Trigger immediate processing
      const webhookResponse = await fetch(`${req.nextUrl.origin}/api/payments/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ZENOPAY_API_KEY!,
          'x-user-triggered': 'completion-check'
        },
        body: JSON.stringify({
          order_id: transaction_reference,
          payment_status: 'COMPLETED',
          reference: transaction_reference,
          user_triggered: true,
          user_id: user.id,
          triggered_at: new Date().toISOString()
        })
      })

      const webhookResult = await webhookResponse.json()
      
      // Log user-triggered processing
      try {
        await supabase
          .from('payment_logs')
          .insert({
            session_id: session.id,
            event_type: 'user_triggered_completion',
            data: {
              message: 'User manually triggered payment completion check',
              session_age_minutes: Math.floor(sessionAge / (1000 * 60)),
              webhook_response: webhookResult,
              user_check_timestamp: new Date().toISOString()
            },
            user_id: user.id
          })
      } catch {
        // Don't fail if logging fails
      }

      return NextResponse.json({
        status: 'processed',
        message: 'Payment processed successfully',
        transaction_reference,
        webhook_result: webhookResult,
        processing_time_minutes: Math.floor(sessionAge / (1000 * 60))
      })
    }

    // Still too recent, ask user to wait
    return NextResponse.json({
      status: 'processing',
      message: 'Payment is still being processed. Please wait a moment.',
      transaction_reference,
      age_seconds: Math.floor(sessionAge / 1000),
      wait_message: 'Check again in 30 seconds if no confirmation received'
    })

  } catch (error) {
    console.error('Payment completion check error:', error)
    return NextResponse.json({ 
      error: 'Completion check failed: ' + (error as Error).message 
    }, { status: 500 })
  }
}
