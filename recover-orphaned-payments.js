/**
 * EMERGENCY RECOVERY SCRIPT
 * Recover orphaned mobile payment sessions and create missing orders
 * 
 * Run with: node recover-orphaned-payments.js
 */

const https = require('https')

const CLIENT_DOMAIN = 'tiscomarket.store'

async function recoverOrphanedPayments() {
  console.log('🚨 === EMERGENCY PAYMENT RECOVERY ===\n')
  
  const orphanedSessions = [
    {
      transaction_reference: 'TX1CC27EA187DCAF236E2AEE6E',
      amount: 200,
      currency: 'TZS',
      created_at: '2025-10-02 20:40:56.302+00'
    },
    {
      transaction_reference: 'TXE70CFBD4C1D1DBDBF2F4A0C3',
      amount: 200,
      currency: 'TZS',
      created_at: '2025-09-27 20:53:57.859+00'
    },
    {
      transaction_reference: 'TXMG2NTCY77XGMWXJH',
      amount: 200,
      currency: 'TZS',
      created_at: '2025-09-27 19:24:20.816+00'
    },
    {
      transaction_reference: 'TXMFWLD9XM1RFH3OBX',
      amount: 200,
      currency: 'TZS',
      created_at: '2025-09-23 13:29:14.122+00'
    },
    {
      transaction_reference: 'TXMFUTAK5O7XMNNXHO',
      amount: 200,
      currency: 'TZS',
      created_at: '2025-09-22 07:35:31.98+00'
    }
  ]

  console.log(`Found ${orphanedSessions.length} orphaned payment sessions to recover`)

  for (const session of orphanedSessions) {
    console.log(`\n📱 Recovering session: ${session.transaction_reference}`)
    
    const webhookPayload = {
      order_id: session.transaction_reference,
      payment_status: 'COMPLETED',
      reference: `recovery_${Date.now()}`,
      data: [{
        order_id: session.transaction_reference,
        payment_status: 'COMPLETED',
        reference: `recovery_ref_${Date.now()}`,
        transid: `recovery_tx_${Date.now()}`
      }]
    }

    try {
      const result = await sendWebhook(webhookPayload)
      
      if (result.success) {
        console.log(`✅ Successfully recovered ${session.transaction_reference}`)
      } else {
        console.error(`❌ Failed to recover ${session.transaction_reference}: ${result.error}`)
      }
      
      // Wait 2 seconds between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`❌ Error recovering ${session.transaction_reference}:`, error.message)
    }
  }

  console.log('\n🏁 Recovery process completed')
}

function sendWebhook(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload)
    
    const options = {
      hostname: CLIENT_DOMAIN,
      path: '/api/payments/webhooks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'TISCO-Recovery-Script/1.0',
        'x-api-key': process.env.ZENOPAY_API_KEY || 'recovery-key'
      },
      timeout: 30000
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: parsed })
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` })
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: data })
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` })
          }
        }
      })
    })

    req.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({ success: false, error: 'Request timeout' })
    })

    req.write(postData)
    req.end()
  })
}

// Run recovery if called directly
if (require.main === module) {
  recoverOrphanedPayments()
    .then(() => {
      console.log('\n✅ Recovery script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Recovery script failed:', error)
      process.exit(1)
    })
}

module.exports = { recoverOrphanedPayments }
