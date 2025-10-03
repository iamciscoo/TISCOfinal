/**
 * Mobile Payment Flow Testing Script
 * 
 * This script tests the complete mobile payment flow from initiation to completion
 * Run with: node test-mobile-payment-flow.js
 */

const https = require('https')

const CLIENT_DOMAIN = process.env.TEST_DOMAIN || 'tiscomarket.store'
const ADMIN_DOMAIN = process.env.TEST_ADMIN_DOMAIN || 'admin.tiscomarket.store'

// Test configuration
const TEST_CONFIG = {
  phone_number: '0756123456', // Test phone number
  provider: 'vodacom',
  amount: 50000, // TZS 50,000
  currency: 'TZS',
  test_products: [
    { product_id: 'test-product-1', quantity: 2 },
    { product_id: 'test-product-2', quantity: 1 }
  ]
}

function makeRequest(domain, path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: domain,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TISCO-Mobile-Payment-Test/1.0',
        ...options.headers
      },
      timeout: 30000
    }
    
    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ status: res.statusCode, headers: res.headers, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data, raw: true })
        }
      })
    })
    
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    
    req.end()
  })
}

async function testMobilePaymentFlow() {
  console.log('🧪 === MOBILE PAYMENT FLOW TEST ===\n')
  
  let testResults = {
    initiation: null,
    status_polling: [],
    webhook_simulation: null,
    final_status: null,
    errors: []
  }
  
  try {
    // Step 1: Test Payment Initiation
    console.log('1️⃣  Testing Payment Initiation...')
    const initiationPayload = {
      amount: TEST_CONFIG.amount,
      currency: TEST_CONFIG.currency,
      provider: TEST_CONFIG.provider,
      phone_number: TEST_CONFIG.phone_number,
      order_data: {
        items: TEST_CONFIG.test_products,
        payment_method: 'Mobile Money',
        shipping_address: 'Test Address, Dar es Salaam',
        notes: 'Test order from mobile payment flow test'
      },
      idempotency_key: `test_${Date.now()}`
    }
    
    console.log('📱 Initiating payment with:', {
      phone: TEST_CONFIG.phone_number,
      provider: TEST_CONFIG.provider,
      amount: `${TEST_CONFIG.currency} ${TEST_CONFIG.amount}`,
      items: TEST_CONFIG.test_products.length
    })
    
    const initiationResult = await makeRequest(CLIENT_DOMAIN, '/api/payments/initiate', {
      method: 'POST',
      body: initiationPayload,
      headers: {
        'Authorization': 'Bearer YOUR_TEST_TOKEN' // Replace with actual test token
      }
    })
    
    testResults.initiation = initiationResult
    
    if (initiationResult.status !== 200) {
      console.error('❌ Payment initiation failed:', initiationResult.status, initiationResult.data)
      return testResults
    }
    
    const transactionReference = initiationResult.data?.transaction?.transaction_reference
    if (!transactionReference) {
      console.error('❌ No transaction reference returned')
      return testResults
    }
    
    console.log('✅ Payment initiated successfully')
    console.log('📄 Transaction Reference:', transactionReference)
    console.log('📊 Response:', initiationResult.data)
    
    // Step 2: Test Status Polling (simulate client polling)
    console.log('\n2️⃣  Testing Status Polling...')
    const maxPolls = 5
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      
      console.log(`📊 Status poll ${i + 1}/${maxPolls}...`)
      const statusResult = await makeRequest(CLIENT_DOMAIN, '/api/payments/status', {
        method: 'POST',
        body: { reference: transactionReference },
        headers: {
          'Authorization': 'Bearer YOUR_TEST_TOKEN' // Replace with actual test token
        }
      })
      
      testResults.status_polling.push(statusResult)
      
      console.log(`Status: ${statusResult.data?.status || 'unknown'}`)
      
      if (statusResult.data?.status === 'COMPLETED') {
        console.log('✅ Payment completed via status polling')
        break
      } else if (statusResult.data?.status === 'FAILED') {
        console.log('❌ Payment failed via status polling')
        break
      }
    }
    
    // Step 3: Simulate Webhook (for testing)
    console.log('\n3️⃣  Simulating Webhook Completion...')
    const webhookPayload = {
      order_id: transactionReference,
      payment_status: 'COMPLETED',
      reference: `zenopay_ref_${Date.now()}`,
      data: [{
        order_id: transactionReference,
        payment_status: 'COMPLETED',
        reference: `zenopay_ref_${Date.now()}`,
        transid: `tx_${Date.now()}`
      }]
    }
    
    console.log('🔗 Sending webhook simulation...')
    const webhookResult = await makeRequest(CLIENT_DOMAIN, '/api/payments/webhooks', {
      method: 'POST',
      body: webhookPayload,
      headers: {
        'x-api-key': process.env.ZENOPAY_API_KEY || 'test-api-key',
        'Content-Type': 'application/json'
      }
    })
    
    testResults.webhook_simulation = webhookResult
    
    if (webhookResult.status === 200) {
      console.log('✅ Webhook processed successfully')
    } else {
      console.error('❌ Webhook processing failed:', webhookResult.status, webhookResult.data)
    }
    
    // Step 4: Final Status Check
    console.log('\n4️⃣  Final Status Check...')
    await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for processing
    
    const finalStatusResult = await makeRequest(CLIENT_DOMAIN, '/api/payments/status', {
      method: 'POST',
      body: { reference: transactionReference },
      headers: {
        'Authorization': 'Bearer YOUR_TEST_TOKEN' // Replace with actual test token
      }
    })
    
    testResults.final_status = finalStatusResult
    
    console.log('📊 Final Status:', finalStatusResult.data?.status)
    console.log('📄 Final Data:', finalStatusResult.data)
    
  } catch (error) {
    console.error('❌ Test Error:', error)
    testResults.errors.push(error.message)
  }
  
  // Test Summary
  console.log('\n📊 === TEST SUMMARY ===')
  console.log('✅ Initiation:', testResults.initiation?.status === 200 ? 'PASS' : 'FAIL')
  console.log('✅ Status Polling:', testResults.status_polling.length > 0 ? 'PASS' : 'FAIL')
  console.log('✅ Webhook:', testResults.webhook_simulation?.status === 200 ? 'PASS' : 'FAIL')
  console.log('✅ Final Status:', testResults.final_status?.data?.status === 'COMPLETED' ? 'PASS' : 'FAIL')
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:', testResults.errors)
  }
  
  console.log('\n🏁 Test Complete')
  return testResults
}

// Validate ZenoPay Response Formats
async function testZenoPayResponseHandling() {
  console.log('\n🧪 === ZENOPAY RESPONSE FORMAT TESTS ===\n')
  
  const testCases = [
    {
      name: 'API Response Format',
      payload: {
        data: [{
          order_id: 'TX123456789',
          payment_status: 'COMPLETED',
          reference: '0987654321',
          transid: 'zenopay_tx_123'
        }]
      }
    },
    {
      name: 'Simple Webhook Format',
      payload: {
        order_id: 'TX123456789',
        payment_status: 'COMPLETED',
        reference: '0987654321'
      }
    },
    {
      name: 'Nested Data Format',
      payload: {
        status: 'success',
        data: {
          order_id: 'TX123456789',
          payment_status: 'COMPLETED',
          reference: '0987654321'
        }
      }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`)
    
    try {
      const result = await makeRequest(CLIENT_DOMAIN, '/api/payments/webhooks', {
        method: 'POST',
        body: testCase.payload,
        headers: {
          'x-api-key': process.env.ZENOPAY_API_KEY || 'test-api-key',
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`   Status: ${result.status}`)
      console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}...`)
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
    }
    
    console.log('')
  }
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Mobile Payment Flow Tests...\n')
  
  testMobilePaymentFlow()
    .then(() => testZenoPayResponseHandling())
    .then(() => {
      console.log('\n✅ All tests completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error)
      process.exit(1)
    })
}
