#!/usr/bin/env node
/**
 * Test Webhook Authentication Fix
 * Verifies that the webhook endpoint now accepts properly formatted requests
 */

const https = require('https')

const TEST_CASES = [
  {
    name: 'ZenoPay Standard Format',
    payload: {
      data: [{
        order_id: 'TX1CC27EA187DCAF236E2AEE6E',
        payment_status: 'COMPLETED', 
        reference: 'zenopay_ref_12345',
        transid: 'zp_tx_67890'
      }]
    },
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'ZenoPay-Webhook/1.0'
    }
  },
  {
    name: 'With API Key Auth',
    payload: {
      order_id: 'TXE70CFBD4C1D1DBDBF2F4A0C3',
      payment_status: 'COMPLETED',
      reference: 'api_key_test_ref'
    },
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ZENOPAY_API_KEY || 'test-key',
      'User-Agent': 'Test-Script/1.0'
    }
  },
  {
    name: 'Recovery Script Format',
    payload: {
      order_id: 'TXMG2NTCY77XGMWXJH',
      payment_status: 'COMPLETED',
      reference: 'recovery_test_ref'
    },
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'TISCO-Recovery/1.0'
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
      timeout: 10000
    }

    console.log(`\n🧪 Testing: ${testCase.name}`)
    console.log(`📤 Payload: ${postData.substring(0, 100)}...`)

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        const result = {
          name: testCase.name,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          response: data,
          headers: res.headers
        }
        
        console.log(`📥 Status: ${res.statusCode} ${result.success ? '✅' : '❌'}`)
        console.log(`📄 Response: ${data.substring(0, 150)}...`)
        
        resolve(result)
      })
    })

    req.on('error', (err) => {
      console.log(`❌ Network Error: ${err.message}`)
      resolve({
        name: testCase.name,
        success: false,
        error: err.message
      })
    })

    req.on('timeout', () => {
      req.destroy()
      console.log(`⏱️ Timeout`)
      resolve({
        name: testCase.name,
        success: false,
        error: 'Request timeout'
      })
    })

    req.write(postData)
    req.end()
  })
}

async function runWebhookTests() {
  console.log('🧪 === WEBHOOK AUTHENTICATION FIX VERIFICATION ===')
  console.log('Testing webhook endpoint with different authentication methods...\n')

  const results = []
  
  for (const testCase of TEST_CASES) {
    const result = await testWebhookEndpoint(testCase)
    results.push(result)
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  console.log('\n📊 === TEST RESULTS SUMMARY ===')
  console.log('================================')
  
  const successful = results.filter(r => r.success).length
  const total = results.length
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${result.name}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })
  
  console.log(`\n📈 Success Rate: ${successful}/${total} (${(successful/total*100).toFixed(1)}%)`)
  
  if (successful === total) {
    console.log('🎉 All webhook tests passed! Authentication fix is working.')
  } else if (successful > 0) {
    console.log('⚠️  Some tests passed. Webhook fix partially working.')
  } else {
    console.log('❌ All tests failed. Webhook authentication still has issues.')
  }

  return {
    total,
    successful,
    results,
    allPassed: successful === total
  }
}

if (require.main === module) {
  runWebhookTests()
    .then(summary => {
      if (summary.allPassed) {
        console.log('\n✅ Webhook fix verification complete - ready for production use!')
        process.exit(0)
      } else {
        console.log('\n❌ Webhook fix needs additional work')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { runWebhookTests }
