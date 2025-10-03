// Test webhook to debug the mobile payment issue
// This will help us identify where exactly the failure is occurring

const axios = require('axios')

// Test webhook payload based on ZenoPay documentation
const testWebhook = {
  order_id: 'test-mobile-payment-' + Date.now(),
  payment_status: 'COMPLETED',
  reference: 'TEST-' + Math.random().toString(36).substring(7),
  metadata: {
    test: true,
    debug: 'mobile-payment-issue'
  }
}

// Test with both local and production endpoints
const endpoints = [
  'http://localhost:3000/api/payments/webhooks',  // Local development
  'https://tiscomarket.store/api/payments/webhooks'  // Production
]

async function testWebhook() {
  console.log('🧪 Testing ZenoPay webhook endpoints...')
  console.log('📝 Test payload:', JSON.stringify(testWebhook, null, 2))
  
  for (const endpoint of endpoints) {
    console.log(`\n🎯 Testing endpoint: ${endpoint}`)
    
    try {
      const response = await axios.post(endpoint, testWebhook, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ZENOPAY_API_KEY || 'test-key',
          'User-Agent': 'ZenoPay-Webhook-Test/1.0'
        },
        timeout: 30000
      })
      
      console.log('✅ Success:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      })
    } catch (error) {
      console.error('❌ Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: endpoint
      })
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 This endpoint appears to be offline or unreachable')
      }
      
      if (error.response?.status === 401) {
        console.log('🔐 Authentication failed - check x-api-key header')
      }
      
      if (error.response?.status === 404) {
        console.log('❓ Transaction/session not found in database')
      }
    }
  }
}

// Also test if we can create a payment session first
async function createTestSession() {
  console.log('\n🧪 Testing payment session creation...')
  
  const sessionPayload = {
    amount: 1000,
    currency: 'TZS',
    provider: 'zenopay',
    order_data: JSON.stringify({
      items: [{
        product_id: 'test-product-id',
        quantity: 1
      }],
      payment_method: 'Mobile Money',
      shipping_address: 'Test Address',
      notes: 'Test order for debugging'
    })
  }
  
  try {
    // This would need proper auth, but helps us understand the flow
    console.log('📝 Session payload:', JSON.stringify(sessionPayload, null, 2))
    console.log('💡 Note: This test requires proper authentication to actually create a session')
    console.log('🔗 Use the admin panel or authenticated client to create a real session for testing')
  } catch (error) {
    console.error('Session test error:', error)
  }
}

// Run tests
testWebhook()
  .then(() => createTestSession())
  .then(() => {
    console.log('\n📊 Test completed. Check the logs above for any issues.')
    console.log('🔍 Next steps:')
    console.log('  1. Check if webhook endpoint is reachable')
    console.log('  2. Verify ZenoPay API key configuration')
    console.log('  3. Check database for any failed payment sessions')
    console.log('  4. Review server logs for detailed error messages')
  })
  .catch(console.error)
