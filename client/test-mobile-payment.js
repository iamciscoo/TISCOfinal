// Test script for mobile payment flow
const baseUrl = 'http://localhost:3000'

// Simulate a logged-in user session by creating a test session
async function testMobilePaymentFlow() {
  console.log('🧪 Testing Mobile Payment Flow...')
  
  // Test 1: Payment Initiation
  console.log('\n1. Testing Payment Initiation API...')
  try {
    const initResponse = await fetch(`${baseUrl}/api/payments/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Note: In real app, this would be handled by authentication middleware
      },
      body: JSON.stringify({
        amount: 50000,
        currency: 'TZS',
        provider: 'vodacom',
        phone_number: '0789123456',
        order_data: {
          items: [
            { product_id: 'test-product-1', quantity: 2, price: 25000 }
          ],
          shipping_address: 'Test Address, Dar es Salaam',
          customer_name: 'Test User',
          customer_email: 'test@example.com'
        }
      })
    })
    
    if (initResponse.status === 401) {
      console.log('❌ Payment initiation requires authentication (expected in production)')
    } else {
      const result = await initResponse.json()
      console.log('✅ Payment initiation response:', result)
    }
  } catch (error) {
    console.error('❌ Payment initiation error:', error.message)
  }

  // Test 2: Payment Status Check  
  console.log('\n2. Testing Payment Status API...')
  try {
    const statusResponse = await fetch(`${baseUrl}/api/payments/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: 'TEST_REF_123'
      })
    })
    
    if (statusResponse.status === 401) {
      console.log('❌ Payment status requires authentication (expected in production)')
    } else {
      const result = await statusResponse.json()
      console.log('✅ Payment status response:', result)
    }
  } catch (error) {
    console.error('❌ Payment status error:', error.message)
  }

  // Test 3: Webhook Simulation
  console.log('\n3. Testing Webhook Handling...')
  try {
    const webhookResponse = await fetch(`${baseUrl}/api/payments/webhooks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.ZENOPAY_API_KEY || 'test-key'
      },
      body: JSON.stringify({
        order_id: 'TEST_REF_123',
        payment_status: 'COMPLETED',
        reference: 'zenopay_ref_456'
      })
    })
    
    const result = await webhookResponse.json()
    console.log('✅ Webhook response:', result)
  } catch (error) {
    console.error('❌ Webhook error:', error.message)
  }

  console.log('\n🏁 Mobile Payment Flow Test Complete')
}

testMobilePaymentFlow()
