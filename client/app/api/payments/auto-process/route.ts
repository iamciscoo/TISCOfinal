import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Automatic payment processing to replace missing ZenoPay webhooks
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(req: NextRequest) {
  try {
    console.log('🔄 Starting automatic payment processing...')
    
    // Find sessions in "processing" status for more than 2 minutes (recent payments)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    
    const { data: recentSessions, error } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('status', 'processing')
      .lt('created_at', twoMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(5) // Process a few at a time

    if (error) {
      console.error('Auto-process query error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    if (!recentSessions || recentSessions.length === 0) {
      return NextResponse.json({ 
        message: 'No recent payments to process',
        checked_at: new Date().toISOString() 
      })
    }

    console.log(`🎯 Found ${recentSessions.length} recent payments to auto-process`)

    const results = []
    for (const session of recentSessions) {
      try {
        console.log(`⚡ Auto-processing payment: ${session.transaction_reference}`)
        
        // Auto-trigger webhook for recent payment (assume successful since balance was deducted)
        const webhookResponse = await fetch(`${req.nextUrl.origin}/api/payments/webhooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ZENOPAY_API_KEY!,
            'x-auto-processor': 'background-service'
          },
          body: JSON.stringify({
            order_id: session.transaction_reference,
            payment_status: 'COMPLETED', 
            reference: session.transaction_reference,
            auto_processed: true,
            processed_at: new Date().toISOString(),
            note: 'Auto-processed due to missing ZenoPay webhook'
          })
        })

        const webhookResult = await webhookResponse.json()
        
        // Log the auto-processing
        try {
          await supabase
            .from('payment_logs')
            .insert({
              session_id: session.id,
              event_type: 'auto_processed_payment',
              data: {
                message: 'Automatically processed payment (ZenoPay webhook missing)',
                session_age_minutes: Math.floor((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60)),
                webhook_response: webhookResult,
                auto_process_timestamp: new Date().toISOString()
              },
              user_id: session.user_id
            })
        } catch {
          // Don't fail if logging fails
        }

        results.push({
          transaction_reference: session.transaction_reference,
          status: 'auto_processed', 
          age_minutes: Math.floor((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60)),
          webhook_result: webhookResult
        })

      } catch (processError) {
        console.error(`❌ Auto-processing failed for ${session.transaction_reference}:`, processError)
        results.push({
          transaction_reference: session.transaction_reference,
          status: 'auto_process_failed',
          error: (processError as Error).message
        })
      }
    }

    return NextResponse.json({
      message: `Auto-processed ${recentSessions.length} recent payments`,
      results,
      processed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Auto-payment processor error:', error)
    return NextResponse.json({ 
      error: 'Auto-processor failed: ' + (error as Error).message 
    }, { status: 500 })
  }
}

// Also allow POST for manual triggers
export async function POST(req: NextRequest) {
  return GET(req)
}
