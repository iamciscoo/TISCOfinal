/**
 * Production Endpoint Validation Script
 * Validates all critical API endpoints for production readiness
 */

const https = require('https')
const http = require('http')

const CLIENT_DOMAIN = 'tiscomarket.store'
const ADMIN_DOMAIN = 'admin.tiscomarket.store'

// Critical endpoints to validate
const ENDPOINTS = {
  client: [
    '/api/health',
    '/api/products',
    '/api/products/featured', 
    '/api/orders',
    '/api/cart',
    '/api/auth/profile',
    '/api/payments/initiate',
    '/api/payments/webhooks',
    '/api/newsletters',
    '/api/services',
    '/api/service-bookings',
    '/api/contact',
    '/api/reviews',
    // Product-specific notification endpoints
    '/api/admin/notifications/recipients',
  ],
  admin: [
    '/api/health',
    '/api/orders',
    '/api/products',
    '/api/users',
    '/api/dashboard/stats',
    '/api/dashboard/revenue',
    '/api/messages',
    '/api/notifications/manual-email',
    '/api/admin/notifications/recipients',
    // Debug endpoint (should be accessible in production for testing)
    '/api/debug/product-notifications',
    '/api/reviews',
    '/api/service-bookings',
  ]
}

// Environment configurations
const ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE',
  'SENDPULSE_API_KEY',
  'SENDPULSE_SECRET',
  'ZENOPAY_API_KEY',
  'ZENOPAY_SECRET',
  'ADMIN_EMAIL'
]

function makeRequest(domain, path, isHttps = true) {
  return new Promise((resolve) => {
    const options = {
      hostname: domain,
      path: path,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'TISCO-Production-Validator/1.0'
      }
    }
    
    const protocol = isHttps ? https : http
    
    const req = protocol.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 500), // Limit data for logging
          path: path,
          domain: domain
        })
      })
    })
    
    req.on('error', (error) => {
      resolve({
        status: 'ERROR',
        error: error.message,
        path: path,
        domain: domain
      })
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve({
        status: 'TIMEOUT',
        error: 'Request timeout after 10s',
        path: path,
        domain: domain
      })
    })
    
    req.end()
  })
}

async function validateEndpoints() {
  console.log('🔍 === PRODUCTION ENDPOINT VALIDATION ===\n')
  
  // Check environment variables
  console.log('1️⃣  Environment Variables Check:')
  const missingEnvVars = []
  ENV_VARS.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Present`)
    } else {
      console.log(`❌ ${envVar}: Missing`)
      missingEnvVars.push(envVar)
    }
  })
  
  if (missingEnvVars.length > 0) {
    console.log(`\n⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`)
    console.log('Note: Some endpoints may fail without proper environment variables\n')
  }
  
  // Validate SSL/HTTPS
  console.log('\n2️⃣  SSL/HTTPS Validation:')
  try {
    const clientSSL = await makeRequest(CLIENT_DOMAIN, '/', true)
    console.log(`✅ ${CLIENT_DOMAIN} HTTPS: ${clientSSL.status}`)
    
    const adminSSL = await makeRequest(ADMIN_DOMAIN, '/', true)  
    console.log(`✅ ${ADMIN_DOMAIN} HTTPS: ${adminSSL.status}`)
  } catch (error) {
    console.log(`❌ SSL Check failed: ${error.message}`)
  }
  
  // Validate client endpoints
  console.log('\n3️⃣  Client API Endpoints Validation:')
  const clientResults = []
  for (const endpoint of ENDPOINTS.client) {
    const result = await makeRequest(CLIENT_DOMAIN, endpoint, true)
    clientResults.push(result)
    
    const status = result.status
    const emoji = status === 200 ? '✅' : status === 401 ? '🔐' : status === 404 ? '❌' : '⚠️'
    console.log(`${emoji} ${CLIENT_DOMAIN}${endpoint}: ${status} ${result.error || ''}`)
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Validate admin endpoints
  console.log('\n4️⃣  Admin API Endpoints Validation:')
  const adminResults = []
  for (const endpoint of ENDPOINTS.admin) {
    const result = await makeRequest(ADMIN_DOMAIN, endpoint, true)
    adminResults.push(result)
    
    const status = result.status
    const emoji = status === 200 ? '✅' : status === 401 ? '🔐' : status === 404 ? '❌' : '⚠️'
    console.log(`${emoji} ${ADMIN_DOMAIN}${endpoint}: ${status} ${result.error || ''}`)
    
    // Small delay between requests  
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Summary
  console.log('\n5️⃣  Validation Summary:')
  
  const clientSuccess = clientResults.filter(r => r.status === 200 || r.status === 401).length
  const adminSuccess = adminResults.filter(r => r.status === 200 || r.status === 401).length
  
  console.log(`📊 Client Endpoints: ${clientSuccess}/${ENDPOINTS.client.length} accessible`)
  console.log(`📊 Admin Endpoints: ${adminSuccess}/${ENDPOINTS.admin.length} accessible`)
  
  const clientErrors = clientResults.filter(r => r.status === 'ERROR' || r.status === 'TIMEOUT')
  const adminErrors = adminResults.filter(r => r.status === 'ERROR' || r.status === 'TIMEOUT')
  
  if (clientErrors.length > 0) {
    console.log('\n❌ Client Endpoint Errors:')
    clientErrors.forEach(error => {
      console.log(`   ${error.path}: ${error.error}`)
    })
  }
  
  if (adminErrors.length > 0) {
    console.log('\n❌ Admin Endpoint Errors:')
    adminErrors.forEach(error => {
      console.log(`   ${error.path}: ${error.error}`)
    })
  }
  
  // Performance check
  console.log('\n6️⃣  Performance Check:')
  const start = Date.now()
  await makeRequest(CLIENT_DOMAIN, '/', true)
  const clientTime = Date.now() - start
  
  const start2 = Date.now()
  await makeRequest(ADMIN_DOMAIN, '/', true)
  const adminTime = Date.now() - start2
  
  console.log(`⚡ Client response time: ${clientTime}ms`)
  console.log(`⚡ Admin response time: ${adminTime}ms`)
  
  // Security headers check
  console.log('\n7️⃣  Security Headers Check:')
  const securityTest = await makeRequest(CLIENT_DOMAIN, '/', true)
  const headers = securityTest.headers || {}
  
  const securityHeaders = {
    'strict-transport-security': headers['strict-transport-security'] ? '✅' : '❌',
    'x-frame-options': headers['x-frame-options'] ? '✅' : '❌',
    'x-content-type-options': headers['x-content-type-options'] ? '✅' : '❌',
    'referrer-policy': headers['referrer-policy'] ? '✅' : '❌'
  }
  
  Object.entries(securityHeaders).forEach(([header, status]) => {
    console.log(`${status} ${header}`)
  })
  
  console.log('\n✅ Validation Complete!')
  
  // Overall health check
  const overallHealth = (
    clientSuccess >= ENDPOINTS.client.length * 0.8 && 
    adminSuccess >= ENDPOINTS.admin.length * 0.8 &&
    clientErrors.length === 0 &&
    adminErrors.length === 0
  )
  
  if (overallHealth) {
    console.log('🎉 Platform is ready for production deployment!')
  } else {
    console.log('⚠️  Some issues detected. Review errors before deployment.')
  }
}

// Run the validation
validateEndpoints().catch(error => {
  console.error('Validation script error:', error)
  process.exit(1)
})
