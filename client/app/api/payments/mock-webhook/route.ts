import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Mock webhook endpoint for testing payment completion
// This simulates ZenoPay sending a success webhook
export async function POST(req: NextRequest) {
  try {
    // Disable in production to avoid exposing a mock in prod
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const body = await req.json()
    const { transaction_reference, status = 'COMPLETED' } = body

    if (!transaction_reference) {
      return NextResponse.json({ error: 'Missing transaction_reference' }, { status: 400 })
    }

    // Trigger the real webhook with mock ZenoPay payload
    // IMPORTANT: Prefer current request origin first to avoid targeting production when running locally
    const origin = new URL(req.url).origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const webhookUrl = `${origin}/api/payments/webhooks`
    
    const mockPayload = {
      order_id: transaction_reference,
      payment_status: status,
      reference: `mock_${Date.now()}`,
      transaction_id: `zeno_${Date.now()}`,
      gateway_transaction_id: `zeno_${Date.now()}`,
      data: {
        order_id: transaction_reference,
        payment_status: status,
        amount: "1000",
        channel: "MPESA-TZ",
        transid: `MOCK${Date.now()}`,
        reference: `mock_${Date.now()}`,
        msisdn: "255744963858",
        gateway_transaction_id: `zeno_${Date.now()}`
      },
      // Include any additional data passed from the request
      ...body
    }

    console.log('Triggering mock webhook for:', transaction_reference)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ZENOPAY_API_KEY || '',
        'x-signature': 'mock-signature-for-testing',
      },
      body: JSON.stringify(mockPayload)
    })

    const result = await response.text()
    
    return NextResponse.json({ 
      success: true, 
      webhook_response: result,
      payload: mockPayload 
    })

  } catch (error) {
    console.error('Mock webhook error:', error)
    return NextResponse.json({ error: 'Mock webhook failed' }, { status: 500 })
  }
}
