import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.origin
  
  // Your production webhook URL that ZenoPay should call
  const webhookUrl = `${baseUrl}/api/payments/webhooks`
  
  // Test webhook endpoint accessibility
  try {
    const testResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': 'test-verification'
      },
      body: JSON.stringify({ test: 'verification' })
    })
    
    const webhookAccessible = testResponse.status !== 404
    
    return NextResponse.json({
      success: true,
      webhook_setup: {
        site_url: baseUrl,
        webhook_endpoint: webhookUrl,
        webhook_accessible: webhookAccessible,
        expected_zenopay_webhook_url: 'https://tiscomarket.store/api/payments/webhooks',
        zenopay_configuration: {
          instructions: [
            '1. Login to your ZenoPay dashboard',
            '2. Navigate to API Settings or Webhook Configuration',
            '3. Set webhook URL to: https://tiscomarket.store/api/payments/webhooks',
            '4. Ensure authentication is set to use x-api-key header',
            '5. Test with a small payment to verify the flow'
          ]
        },
        webhook_format_expected: {
          description: 'ZenoPay sends this format when payment is successful',
          sample_payload: {
            reference: '0982403775',
            resultcode: '000',
            result: 'SUCCESS',
            message: 'Order fetch successful',
            data: [{
              order_id: 'YOUR_TRANSACTION_REFERENCE',
              payment_status: 'COMPLETED',
              transid: 'ZenoPay_Transaction_ID',
              reference: 'ZenoPay_Internal_Reference',
              amount: '200',
              channel: 'MPESA-TZ',
              msisdn: '255748624684'
            }]
          }
        },
        payment_flow: {
          steps: [
            '1. Customer places order on tiscomarket.store',
            '2. System creates payment session in database',
            '3. System calls ZenoPay API with webhook_url: https://tiscomarket.store/api/payments/webhooks',
            '4. Customer approves payment on their phone',
            '5. ZenoPay sends webhook notification to https://tiscomarket.store/api/payments/webhooks',
            '6. System processes webhook: creates order, updates payment status, sends emails',
            '7. Customer sees order in their account, receives confirmation email',
            '8. Admin receives notification email about new order'
          ]
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to verify webhook setup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
