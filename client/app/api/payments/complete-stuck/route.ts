import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Find the stuck payment session
    const { data: session } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('transaction_reference', transaction_reference)
      .eq('status', 'processing')
      .single()

    if (!session) {
      return NextResponse.json({ error: 'No stuck payment session found' }, { status: 404 })
    }

    console.log('Found stuck payment session:', session.id)

    // Trigger webhook completion
    const webhookUrl = `${req.nextUrl.origin}/api/payments/webhooks`
    const payload = {
      transaction_reference: session.transaction_reference,
      status: 'COMPLETED',
      gateway_transaction_id: session.gateway_transaction_id || session.transaction_reference,
      amount: session.amount,
      currency: session.currency,
      manually_completed: true
    }

    console.log('Triggering webhook with payload:', payload)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ZENOPAY_API_KEY || 'dev-key'
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    console.log('Webhook response:', response.status, responseText)

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment completed successfully',
        session_id: session.id,
        transaction_reference: session.transaction_reference
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to complete payment', 
        webhook_response: responseText 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error completing stuck payment:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
