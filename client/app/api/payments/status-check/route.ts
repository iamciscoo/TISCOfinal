import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ZenoPayClient } from '@/lib/zenopay'

// Status check endpoint to verify payment completion when webhooks fail
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const { transaction_reference } = await req.json()
    
    if (!transaction_reference) {
      return NextResponse.json({ error: 'transaction_reference required' }, { status: 400 })
    }

    // Get the payment session
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('transaction_reference', transaction_reference)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Payment session not found' }, { status: 404 })
    }

    // If already completed, return current status
    if (session.status === 'completed') {
      return NextResponse.json({ 
        status: 'completed',
        message: 'Payment already processed',
        session_status: session.status
      })
    }

    // Check status with ZenoPay
    const zenoClient = new ZenoPayClient()
    let zenoStatus: any = null
    
    try {
      const statusResponse = await zenoClient.getOrderStatus(transaction_reference)
      zenoStatus = statusResponse
      
      console.log('ZenoPay status check response:', statusResponse)
      
      // If payment is completed in ZenoPay, process it manually
      if (zenoStatus?.data && Array.isArray(zenoStatus.data) && zenoStatus.data.length > 0) {
        const paymentData = zenoStatus.data[0]
        
        if (paymentData.payment_status === 'COMPLETED') {
          // Manually trigger webhook processing
          const webhookResponse = await fetch(`${req.nextUrl.origin}/api/payments/webhooks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ZENOPAY_API_KEY!,
              'x-manual-trigger': 'status-check'
            },
            body: JSON.stringify({
              order_id: transaction_reference,
              payment_status: 'COMPLETED',
              reference: paymentData.reference || transaction_reference,
              amount: paymentData.amount,
              channel: paymentData.channel,
              transid: paymentData.transid,
              msisdn: paymentData.msisdn,
              manual_trigger: true
            })
          })
          
          const webhookResult = await webhookResponse.json()
          
          return NextResponse.json({
            status: 'completed',
            message: 'Payment completed and processed manually',
            zenopay_status: zenoStatus,
            webhook_result: webhookResult
          })
        }
      }
    } catch (statusError) {
      console.error('ZenoPay status check failed:', statusError)
      // Continue with current session status
    }

    // Update session as expired if it's been too long
    const sessionAge = Date.now() - new Date(session.created_at).getTime()
    const maxAge = 30 * 60 * 1000 // 30 minutes
    
    if (sessionAge > maxAge && session.status === 'processing') {
      await supabase
        .from('payment_sessions')
        .update({ 
          status: 'expired', 
          failure_reason: 'Payment timed out - no webhook received',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)
        
      return NextResponse.json({
        status: 'expired',
        message: 'Payment session expired - no confirmation received',
        zenopay_status: zenoStatus
      })
    }

    return NextResponse.json({
      status: session.status,
      message: 'Payment still processing',
      session_age_minutes: Math.floor(sessionAge / (1000 * 60)),
      zenopay_status: zenoStatus
    })

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json({ 
      error: 'Status check failed: ' + (error as Error).message 
    }, { status: 500 })
  }
}
