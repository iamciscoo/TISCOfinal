import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  console.log('🔄 Starting automatic payment processing...')
  
  try {
    // Find payments that are "processing" for more than 3 minutes
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    
    const { data: pendingSessions, error } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('status', 'processing')
      .lt('created_at', threeMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(5) // Process a few at a time
    
    if (error) {
      console.error('❌ Database query error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    if (!pendingSessions?.length) {
      return NextResponse.json({
        message: 'No pending payments to process',
        checked_at: new Date().toISOString()
      })
    }
    
    console.log(`🎯 Found ${pendingSessions.length} pending payments to process`)
    
    const results = []
    
    for (const session of pendingSessions) {
      try {
        console.log(`⚡ Auto-processing: ${session.transaction_reference}`)
        
        // Simulate webhook call to process the payment
        const webhookResponse = await fetch(`${req.nextUrl.origin}/api/payments/webhooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_id: session.transaction_reference,
            payment_status: 'COMPLETED',
            reference: session.transaction_reference,
            amount: session.amount,
            channel: session.provider,
            auto_processed: true,
            processed_at: new Date().toISOString()
          })
        })
        
        const result = await webhookResponse.json()
        
        results.push({
          transaction_reference: session.transaction_reference,
          status: webhookResponse.ok ? 'processed' : 'failed',
          result,
          age_minutes: Math.floor((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60))
        })
        
        // Log the auto-processing attempt
        const { error: logError } = await supabase
          .from('payment_logs')
          .insert({
            session_id: session.id,
            event_type: 'auto_processed',
            data: {
              message: 'Automatically processed due to delayed webhook',
              webhook_response: result,
              processing_timestamp: new Date().toISOString()
            },
            user_id: session.user_id
          })
        
        if (logError) {
          console.warn('Logging failed:', logError)
        }
        
      } catch (processError) {
        console.error(`❌ Processing failed for ${session.transaction_reference}:`, processError)
        results.push({
          transaction_reference: session.transaction_reference,
          status: 'error',
          error: (processError as Error).message
        })
      }
    }
    
    const processingTime = Date.now() - startTime
    console.log(`✅ Processed ${results.length} payments in ${processingTime}ms`)
    
    return NextResponse.json({
      message: `Processed ${results.length} pending payments`,
      results,
      processing_time_ms: processingTime,
      processed_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('💥 Auto-processing error:', error)
    return NextResponse.json({
      error: 'Auto-processing failed',
      message: (error as Error).message
    }, { status: 500 })
  }
}

// Allow POST as well for manual triggers
export async function POST(req: NextRequest) {
  return GET(req)
}
