import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// Webhook monitoring and logging endpoint
export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`🔔 [${timestamp}] WEBHOOK MONITOR: Incoming request`)
  
  try {
    // Log all headers and body for debugging
    const headers = Object.fromEntries(req.headers.entries())
    const body = await req.json().catch(() => ({}))
    
    console.log(`📡 [${timestamp}] Headers:`, headers)
    console.log(`📦 [${timestamp}] Body:`, body)
    
    // Log to database for analysis
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        event_type: 'webhook_monitor_received',
        data: {
          timestamp,
          headers,
          body,
          user_agent: req.headers.get('user-agent'),
          content_type: req.headers.get('content-type'),
          origin: req.headers.get('origin'),
          referer: req.headers.get('referer')
        }
      })
    
    if (logError) {
      console.error('Monitor logging failed:', logError)
    }
    
    // Forward to actual webhook if this looks like a ZenoPay request
    if (body.order_id && body.payment_status) {
      console.log(`🔄 [${timestamp}] Forwarding to main webhook...`)
      
      const webhookResponse = await fetch(`${req.nextUrl.origin}/api/payments/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      const result = await webhookResponse.json()
      console.log(`✅ [${timestamp}] Webhook forwarded, result:`, result)
      
      return NextResponse.json({
        monitor: 'received_and_forwarded',
        timestamp,
        webhook_result: result
      })
    }
    
    return NextResponse.json({
      monitor: 'received_and_logged',
      timestamp,
      message: 'Request logged for analysis'
    })
    
  } catch (error) {
    console.error(`❌ [${timestamp}] Monitor error:`, error)
    return NextResponse.json({
      monitor: 'error',
      timestamp,
      error: (error as Error).message
    }, { status: 500 })
  }
}

// Also allow GET for testing
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'webhook_monitor_active',
    timestamp: new Date().toISOString(),
    message: 'Webhook monitor is running and logging all requests'
  })
}
