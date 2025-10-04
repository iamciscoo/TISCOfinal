import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

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
      return NextResponse.json({ error: 'Transaction reference required' }, { status: 400 })
    }
    
    console.log(`🔍 User ${user.id} verifying payment: ${transaction_reference}`)
    
    // Check payment session
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('transaction_reference', transaction_reference)
      .eq('user_id', user.id)
      .single()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Payment session not found',
        status: 'not_found'
      }, { status: 404 })
    }
    
    // Check if order was created
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, payment_status, total_amount, created_at')
      .eq('user_id', user.id)
      .gte('created_at', session.created_at)
      .order('created_at', { ascending: false })
      .limit(5)
    
    const sessionAge = Date.now() - new Date(session.created_at).getTime()
    const ageMinutes = Math.floor(sessionAge / (1000 * 60))
    
    // If completed, return success
    if (session.status === 'completed') {
      const relatedOrder = orders?.find(o => 
        Math.abs(new Date(o.created_at).getTime() - new Date(session.created_at).getTime()) < 10 * 60 * 1000
      )
      
      return NextResponse.json({
        status: 'completed',
        message: 'Payment completed successfully',
        session: {
          transaction_reference,
          status: session.status,
          amount: session.amount,
          currency: session.currency
        },
        order: relatedOrder ? {
          id: relatedOrder.id,
          status: relatedOrder.status,
          payment_status: relatedOrder.payment_status,
          total_amount: relatedOrder.total_amount
        } : null,
        age_minutes: ageMinutes
      })
    }
    
    // If still processing and > 2 minutes, try to process it
    if (session.status === 'processing' && ageMinutes >= 2) {
      console.log(`⚡ Triggering processing for ${transaction_reference}`)
      
      try {
        const processResponse = await fetch(`${req.nextUrl.origin}/api/payments/webhooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_id: transaction_reference,
            payment_status: 'COMPLETED',
            reference: transaction_reference,
            amount: session.amount,
            channel: session.provider,
            user_triggered: true,
            user_id: user.id
          })
        })
        
        const processResult = await processResponse.json()
        
        if (processResponse.ok && processResult.success) {
          return NextResponse.json({
            status: 'processed',
            message: 'Payment processed successfully',
            session: {
              transaction_reference,
              status: 'completed',
              amount: session.amount,
              currency: session.currency
            },
            processing_result: processResult,
            age_minutes: ageMinutes
          })
        } else {
          console.error('Processing failed:', processResult)
        }
      } catch (processError) {
        console.error('Processing error:', processError)
      }
    }
    
    // Still processing or recent
    return NextResponse.json({
      status: session.status,
      message: ageMinutes < 2 
        ? 'Payment is being processed. Please wait a moment.'
        : 'Payment is taking longer than expected. Our team will resolve this shortly.',
      session: {
        transaction_reference,
        status: session.status,
        amount: session.amount,
        currency: session.currency
      },
      age_minutes: ageMinutes,
      next_check_in: ageMinutes < 2 ? 60 : 300 // seconds
    })
    
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      error: 'Verification failed',
      message: (error as Error).message
    }, { status: 500 })
  }
}
