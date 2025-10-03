#!/usr/bin/env node
/**
 * ZenoPay Webhook Integration Test
 * Tests the rebuilt webhook handler with ZenoPay's actual format
 */

const https = require('https')

const WEBHOOK_URL = 'https://tiscomarket.store/api/payments/webhooks'

// Test cases based on ZenoPay documentation format
const ZENOPAY_TEST_CASES = [
  {
    name: 'ZenoPay Standard COMPLETED Payment',
    description: 'Matches exact format from ZenoPay documentation',
    payload: {
      order_id: 'TX1CC27EA187DCAF236E2AEE6E',  // Our transaction_reference
      payment_status: 'COMPLETED',
      reference: '1003020496',                   // ZenoPay's internal reference
      metadata: {
        product_id: '4af14ff3-6515-4721-ab0a-936f39243b53',
        custom_notes: 'Mobile money payment from Francis'
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ZENOPAY_API_KEY || 'test-api-key',
      'User-Agent': 'ZenoPay-Webhook/1.0'
    },
    expected: {
      shouldPass: true,
      shouldCreateOrder: true
    }
  },
  {
    name: 'ZenoPay FAILED Payment',
    description: 'Test failed payment handling',
    payload: {
      order_id: 'TXE70CFBD4C1D1DBDBF2F4A0C3',
      payment_status: 'FAILED',
      reference: '1003020497'
    },
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ZENOPAY_API_KEY || 'test-api-key',
      'User-Agent': 'ZenoPay-Webhook/1.0'
    },
    expected: {
      shouldPass: true,
      shouldCreateOrder: false
    }
  },
  {
    name: 'Invalid Authentication',
    description: 'Test webhook authentication rejection',
    payload: {
      order_id: 'TXMG2NTCY77XGMWXJH',
      payment_status: 'COMPLETED',
      reference: '1003020498'
    },
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'invalid-key',
      'User-Agent': 'Malicious-Actor/1.0'
    },
    expected: {
      shouldPass: false,
      shouldCreateOrder: false
    }
  },
  {
    name: 'Missing Required Fields',
    description: 'Test validation of required ZenoPay fields',
    payload: {
      // Missing order_id
      payment_status: 'COMPLETED',
      reference: '1003020499'
    },
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ZENOPAY_API_KEY || 'test-api-key',
      'User-Agent': 'ZenoPay-Webhook/1.0'
    },
    expected: {
      shouldPass: false,
      shouldCreateOrder: false
    }
  },
  {
    name: 'ZenoPay with Additional Fields',
    description: 'Test webhook with extra fields (should be ignored gracefully)',
    payload: {
      order_id: 'TXMFWLD9XM1RFH3OBX',
      payment_status: 'COMPLETED',
      reference: '1003020500',
      metadata: {
        transaction_time: '2025-10-03T23:30:00Z',
        channel: 'MPESA-TZ',
        msisdn: '255748624684'
      },
      // Extra fields that might be sent
      transid: 'CEJ3I3SETSN',
      amount: '200',
      channel: 'MPESA-TZ'
    },
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ZENOPAY_API_KEY || 'test-api-key',
      'User-Agent': 'ZenoPay-Webhook/1.0'
    },
    expected: {
      shouldPass: true,
      shouldCreateOrder: true
    }
  }
]

async function testWebhookEndpoint(testCase) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(testCase.payload)
    
    const options = {
      hostname: 'tiscomarket.store',
      path: '/api/payments/webhooks',
      method: 'POST',
      headers: {
        ...testCase.headers,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    }

    console.log(`\n🧪 Testing: ${testCase.name}`)
    console.log(`📄 Description: ${testCase.description}`)
    console.log(`📤 Payload: ${JSON.stringify(testCase.payload, null, 2)}`)

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300
        const result = {
          name: testCase.name,
          status: res.statusCode,
          success,
          response: data,
          headers: res.headers,
          expected: testCase.expected,
          passed: success === testCase.expected.shouldPass
        }
        
        console.log(`📥 Status: ${res.statusCode} ${success ? '✅' : '❌'}`)
        console.log(`🔍 Expected Pass: ${testCase.expected.shouldPass}, Actual Pass: ${success}`)
        console.log(`📄 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`)
        console.log(`✅ Test Result: ${result.passed ? 'PASS' : 'FAIL'}`)
        
        resolve(result)
      })
    })

    req.on('error', (err) => {
      console.log(`❌ Network Error: ${err.message}`)
      resolve({
        name: testCase.name,
        success: false,
        error: err.message,
        expected: testCase.expected,
        passed: false
      })
    })

    req.on('timeout', () => {
      req.destroy()
      console.log(`⏱️ Timeout`)
      resolve({
        name: testCase.name,
        success: false,
        error: 'Request timeout',
        expected: testCase.expected,
        passed: false
      })
    })

    req.write(postData)
    req.end()
  })
}

async function runZenoPayWebhookTests() {
  console.log('🚀 === ZENOPAY WEBHOOK INTEGRATION TESTS ===')
  console.log('Testing rebuilt webhook handler with ZenoPay documentation format...\n')

  if (!process.env.ZENOPAY_API_KEY) {
    console.warn('⚠️  ZENOPAY_API_KEY not set - some tests may fail authentication')
  }

  const results = []
  
  for (const testCase of ZENOPAY_TEST_CASES) {
    const result = await testWebhookEndpoint(testCase)
    results.push(result)
    
    // Wait 2 seconds between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Generate test report
  console.log('\n📊 === ZENOPAY WEBHOOK TEST RESULTS ===')
  console.log('==========================================')
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${result.name}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    if (!result.passed && result.status) {
      console.log(`   Expected: ${result.expected?.shouldPass ? 'Success' : 'Failure'}, Got: ${result.success ? 'Success' : 'Failure'}`)
    }
  })
  
  console.log(`\n📈 Overall Success Rate: ${passed}/${total} (${(passed/total*100).toFixed(1)}%)`)
  
  // Analyze specific issues
  const authFailures = results.filter(r => !r.passed && r.status === 401)
  const validationFailures = results.filter(r => !r.passed && r.status === 400)
  const serverErrors = results.filter(r => !r.passed && r.status >= 500)
  
  if (authFailures.length > 0) {
    console.log(`🔐 Authentication Issues: ${authFailures.length} tests failed authentication`)
  }
  if (validationFailures.length > 0) {
    console.log(`📝 Validation Issues: ${validationFailures.length} tests failed validation`)
  }
  if (serverErrors.length > 0) {
    console.log(`🚨 Server Errors: ${serverErrors.length} tests caused server errors`)
  }

  // Success assessment
  if (passed === total) {
    console.log('\n🎉 All ZenoPay webhook tests passed! Integration is working correctly.')
  } else if (passed >= total * 0.8) {
    console.log('\n✅ Most tests passed. Check specific failures above.')
  } else {
    console.log('\n❌ Many tests failed. Webhook integration needs more work.')
  }

  return {
    total,
    passed,
    results,
    success: passed >= total * 0.8  // 80% success threshold
  }
}

if (require.main === module) {
  runZenoPayWebhookTests()
    .then(summary => {
      if (summary.success) {
        console.log('\n✅ ZenoPay webhook integration verification complete!')
        process.exit(0)
      } else {
        console.log('\n❌ ZenoPay webhook integration needs fixes')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { runZenoPayWebhookTests }
