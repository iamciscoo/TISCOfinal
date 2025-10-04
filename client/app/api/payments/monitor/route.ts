import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Automated payment monitoring to detect and process stuck payments
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Starting payment monitor check...')
    
    // Find sessions stuck in "processing" for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { data: stuckSessions, error } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('status', 'processing')
      .lt('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Monitor query error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    if (!stuckSessions || stuckSessions.length === 0) {
      return NextResponse.json({ 
        message: 'No stuck payments found',
        checked_at: new Date().toISOString() 
      })
    }

    console.log(`🚨 Found ${stuckSessions.length} stuck payment sessions`)

    const results = []
    for (const session of stuckSessions) {
      try {
        console.log(`🔄 Processing stuck session: ${session.transaction_reference}`)
        
        // Trigger webhook manually for stuck payment
        const webhookResponse = await fetch(`${req.nextUrl.origin}/api/payments/webhooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ZENOPAY_API_KEY!,
            'x-automated-recovery': 'payment-monitor'
          },
          body: JSON.stringify({
            order_id: session.transaction_reference,
            payment_status: 'COMPLETED',
            reference: session.transaction_reference,
            automated_recovery: true,
            recovery_timestamp: new Date().toISOString()
          })
        })

        const webhookResult = await webhookResponse.json()
        
        // Log the recovery attempt
        try {
          await supabase
            .from('payment_logs')
            .insert({
              session_id: session.id,
              event_type: 'automated_recovery_attempt',
              data: {
                message: 'Automated payment monitor triggered recovery',
                session_age_minutes: Math.floor((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60)),
                webhook_response: webhookResult,
                recovery_timestamp: new Date().toISOString()
              },
              user_id: session.user_id
            })
        } catch {
          // Don't fail recovery if logging fails
        }

        results.push({
          transaction_reference: session.transaction_reference,
          status: 'recovery_attempted',
          age_minutes: Math.floor((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60)),
          webhook_result: webhookResult
        })

      } catch (recoveryError) {
        console.error(`❌ Recovery failed for ${session.transaction_reference}:`, recoveryError)
        results.push({
          transaction_reference: session.transaction_reference,
          status: 'recovery_failed',
          error: (recoveryError as Error).message
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${stuckSessions.length} stuck payments`,
      results,
      checked_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Payment monitor error:', error)
    return NextResponse.json({ 
      error: 'Monitor failed: ' + (error as Error).message 
    }, { status: 500 })
  }
}

// Also allow POST for manual triggers
export async function POST(req: NextRequest) {
  return GET(req)
}
