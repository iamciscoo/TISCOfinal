#!/usr/bin/env node
// Debug Production Authentication - Find exact auth mismatch issue

console.log('🔍 === PRODUCTION AUTH DEBUG ===')

const config = {
  productionUrl: 'https://tiscomarket.store',
  localApiKey: 'a09eMYJfzRya4nSTsOFybPejSlKgRFsO1Kd5A_-MS700hri2ES-sZBamYiGbO0TnuvFWIuf1FafyjoJmZ70nIAuvFWIuf1FafyjoJmZ70nIA'
}

// Test 1: Check production environment variables
async function checkProductionEnv() {
  console.log('\n🌍 === PRODUCTION ENVIRONMENT CHECK ===')
  
  try {
    const response = await fetch(`${config.productionUrl}/api/debug/env-check?key=temp-debug-2025`)
    
    if (response.ok) {
      const envData = await response.json()
      console.log('✅ Production environment data:', envData)
      
      console.log('\n🔍 Key Analysis:')
      console.log('Local key length:', config.localApiKey.length)
      console.log('Production key length:', envData.zenoPayKeyLength)
      console.log('Local key preview:', `${config.localApiKey.substring(0, 20)}...${config.localApiKey.substring(config.localApiKey.length - 20)}`)
      console.log('Production key preview:', envData.zenoPayKeyPreview)
      
      return envData
    } else {
      console.log('❌ Could not access production environment check:', response.status)
      return null
    }
  } catch (error) {
    console.log('❌ Environment check failed:', error.message)
    return null
  }
}

// Test 2: Test different API key formats
async function testApiKeyFormats() {
  console.log('\n🧪 === API KEY FORMAT TESTING ===')
  
  const testKeys = [
    { name: 'Local Key (exact)', key: config.localApiKey },
    { name: 'Local Key (trimmed)', key: config.localApiKey.trim() },
    { name: 'Local Key (no spaces)', key: config.localApiKey.replace(/\s+/g, '') },
    { name: 'Empty Key', key: '' },
    { name: 'Wrong Key', key: 'wrong-key-test' }
  ]
  
  const results = []
  
  for (const testCase of testKeys) {
    console.log(`\n🔑 Testing: ${testCase.name}`)
    console.log(`   Key length: ${testCase.key.length}`)
    console.log(`   Key preview: ${testCase.key.substring(0, 20)}...${testCase.key.substring(testCase.key.length - 10)}`)
    
    try {
      const response = await fetch(`${config.productionUrl}/api/debug/env-check?key=temp-debug-2025`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testCase.key
        },
        body: JSON.stringify({ testApiKey: testCase.key })
      })
      
      const result = await response.json()
      console.log(`   Result: ${response.status}`, result)
      
      results.push({
        name: testCase.name,
        key: testCase.key,
        status: response.status,
        match: result.keysMatch,
        result
      })
      
    } catch (error) {
      console.log(`   Error: ${error.message}`)
      results.push({ name: testCase.name, error: error.message })
    }
  }
  
  return results
}

// Test 3: Test actual webhook with different keys
async function testWebhookWithKeys() {
  console.log('\n📡 === WEBHOOK KEY TESTING ===')
  
  const testKeys = [
    config.localApiKey,
    config.localApiKey.trim(),
    config.localApiKey.replace(/\s+/g, '')
  ]
  
  for (const key of testKeys) {
    console.log(`\n🎯 Testing webhook with key length ${key.length}`)
    
    try {
      const response = await fetch(`${config.productionUrl}/api/payments/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'User-Agent': 'Debug-Test/1.0'
        },
        body: JSON.stringify({
          order_id: 'DEBUG-TEST-' + Date.now(),
          payment_status: 'COMPLETED',
          reference: 'DEBUG-REF-' + Math.random().toString(36).substring(2, 8)
        })
      })
      
      const responseText = await response.text()
      console.log(`   Status: ${response.status}`)
      console.log(`   Response: ${responseText.substring(0, 200)}`)
      
      if (response.status === 200 || response.status === 404) {
        console.log('   ✅ Authentication passed!')
        return key
      }
      
    } catch (error) {
      console.log(`   Error: ${error.message}`)
    }
  }
  
  return null
}

// Test 4: Check environment variable names
async function checkEnvVarNames() {
  console.log('\n📝 === ENVIRONMENT VARIABLE NAMES CHECK ===')
  
  try {
    const response = await fetch(`${config.productionUrl}/api/debug/env-check?key=temp-debug-2025`)
    
    if (response.ok) {
      const envData = await response.json()
      console.log('All ZenoPay/Webhook related env vars:', envData.allEnvVars)
      
      // Check for common variations
      const possibleKeyNames = [
        'ZENOPAY_API_KEY',
        'ZENO_PAY_API_KEY', 
        'ZENOPAY_KEY',
        'ZENO_API_KEY',
        'WEBHOOK_API_KEY'
      ]
      
      console.log('\n🔍 Checking for possible key name variations...')
      possibleKeyNames.forEach(name => {
        const exists = envData.allEnvVars.includes(name)
        console.log(`   ${name}: ${exists ? '✅ EXISTS' : '❌ Missing'}`)
      })
      
      return envData.allEnvVars
    }
  } catch (error) {
    console.log('❌ Could not check env var names:', error.message)
  }
  
  return []
}

// Main debug function
async function debugProductionAuth() {
  console.log('🚀 Starting production authentication debugging...')
  console.log(`🎯 Target: ${config.productionUrl}`)
  
  // Step 1: Check production environment
  const envData = await checkProductionEnv()
  
  // Step 2: Check environment variable names
  const envVarNames = await checkEnvVarNames()
  
  // Step 3: Test different API key formats
  const keyTestResults = await testApiKeyFormats()
  
  // Step 4: Test actual webhook
  const workingKey = await testWebhookWithKeys()
  
  // Generate report
  console.log('\n🎯 === AUTHENTICATION DEBUG REPORT ===')
  
  if (envData) {
    console.log('\n📊 Environment Analysis:')
    console.log(`  Production has ZenoPay key: ${envData.hasZenoPayKey ? '✅' : '❌'}`)
    console.log(`  Key length in production: ${envData.zenoPayKeyLength}`)
    console.log(`  Local key length: ${config.localApiKey.length}`)
    console.log(`  Lengths match: ${envData.zenoPayKeyLength === config.localApiKey.length ? '✅' : '❌'}`)
  }
  
  console.log('\n🔑 Key Test Results:')
  keyTestResults.forEach(result => {
    if (result.result) {
      console.log(`  ${result.name}: ${result.result.keysMatch ? '✅ MATCH' : '❌ NO MATCH'}`)
    }
  })
  
  if (workingKey) {
    console.log(`\n✅ Found working key: ${workingKey.length} characters`)
  } else {
    console.log('\n❌ No working key found')
  }
  
  // Specific diagnosis
  console.log('\n🔍 **DIAGNOSIS:**')
  
  if (!envData?.hasZenoPayKey) {
    console.log('🚨 ZENOPAY_API_KEY is not set in production environment')
  } else if (envData.zenoPayKeyLength !== config.localApiKey.length) {
    console.log('🚨 Production key length differs from local key')
    console.log(`   Local: ${config.localApiKey.length} chars`)
    console.log(`   Production: ${envData.zenoPayKeyLength} chars`)
  } else if (keyTestResults.some(r => r.result?.keysMatch)) {
    console.log('✅ Keys appear to match in debug test')
    console.log('🤔 Issue might be elsewhere - check webhook handler logic')
  } else {
    console.log('🚨 Keys do not match despite being set')
    console.log('💡 Possible causes:')
    console.log('   - Whitespace in production key')
    console.log('   - Different encoding')
    console.log('   - Wrong environment variable name')
    console.log('   - Caching issue in Vercel')
  }
  
  console.log('\n💡 **NEXT STEPS:**')
  if (!workingKey) {
    console.log('  1. Check Vercel environment variables exactly')
    console.log('  2. Remove and re-add ZENOPAY_API_KEY in Vercel')
    console.log('  3. Ensure no extra whitespace/characters')
    console.log('  4. Trigger new Vercel deployment')
  } else {
    console.log('  1. Authentication is actually working!')
    console.log('  2. Check if webhook processing has other issues')
  }
}

// Run debug
if (require.main === module) {
  debugProductionAuth()
    .then(() => {
      console.log('\n✅ Production auth debug completed!')
    })
    .catch(error => {
      console.error('\n💥 Debug failed:', error)
      process.exit(1)
    })
}

module.exports = { debugProductionAuth }
