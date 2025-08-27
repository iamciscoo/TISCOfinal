#!/usr/bin/env node

/**
 * Payment Testing Script for TISCO Market
 * Run with: node scripts/test-payments.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test data
const testData = {
  validPhone: '255712345678',
  invalidPhone: '123456789',
  testAmount: 5000,
  providers: ['vodacom', 'tigo', 'airtel', 'halopesa']
};

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

async function testMobileMoneyPayment(orderId, phoneNumber, provider = 'vodacom') {
  console.log(`\n🧪 Testing Mobile Money Payment`);
  console.log(`Order ID: ${orderId}`);
  console.log(`Phone: ${phoneNumber}`);
  console.log(`Provider: ${provider}`);
  
  const result = await makeRequest('/api/payments/process', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      amount: testData.testAmount,
      currency: 'TZS',
      provider: provider,
      phone_number: phoneNumber,
      return_url: `${BASE_URL}/checkout/success`
    })
  });
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, JSON.stringify(result.data, null, 2));
  return result;
}

async function testCardPayment(orderId) {
  console.log(`\n💳 Testing Card Payment`);
  console.log(`Order ID: ${orderId}`);
  
  const result = await makeRequest('/api/payments/process', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      payment_method_id: 'mock_card_method',
      amount: testData.testAmount,
      currency: 'TZS',
      return_url: `${BASE_URL}/checkout/success`
    })
  });
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, JSON.stringify(result.data, null, 2));
  return result;
}

async function testPaymentStatus(transactionId) {
  console.log(`\n📊 Checking Payment Status`);
  console.log(`Transaction ID: ${transactionId}`);
  
  const result = await makeRequest(`/api/payments/status?transaction_id=${transactionId}`);
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, JSON.stringify(result.data, null, 2));
  return result;
}

async function testWebhook(orderId, status = 'completed') {
  console.log(`\n🔗 Testing Webhook`);
  console.log(`Order ID: ${orderId}`);
  console.log(`Status: ${status}`);
  
  const result = await makeRequest('/api/payments/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      status: status,
      transaction_id: `zeno_tx_${Date.now()}`,
      amount: testData.testAmount.toString(),
      currency: 'TZS'
    })
  });
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, JSON.stringify(result.data, null, 2));
  return result;
}

async function runTests() {
  console.log('🚀 Starting Payment Tests...');
  console.log(`Base URL: ${BASE_URL}`);
  
  // You'll need to replace this with an actual order ID from your database
  const testOrderId = 'test_order_' + Date.now();
  
  console.log(`\n⚠️  Note: Replace '${testOrderId}' with an actual order ID from your database`);
  
  try {
    // Test 1: Valid mobile money payment
    await testMobileMoneyPayment(testOrderId, testData.validPhone, 'vodacom');
    
    // Test 2: Invalid phone number
    await testMobileMoneyPayment(testOrderId, testData.invalidPhone, 'vodacom');
    
    // Test 3: Card payment
    await testCardPayment(testOrderId);
    
    // Test 4: Webhook simulation
    await testWebhook(testOrderId, 'completed');
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Phone number validation test
function testPhoneNormalization() {
  console.log('\n📱 Testing Phone Number Normalization');
  
  const testCases = [
    '0712345678',
    '712345678', 
    '+255712345678',
    '255712345678',
    '2550712345678',
    '123456789' // Invalid
  ];
  
  testCases.forEach(phone => {
    try {
      const normalized = normalizeTzMsisdn(phone);
      console.log(`${phone} → ${normalized} ✅`);
    } catch (error) {
      console.log(`${phone} → Error: ${error.message} ❌`);
    }
  });
}

function normalizeTzMsisdn(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('255')) return digits;
  if (digits.length === 10 && digits.startsWith('0')) return `255${digits.slice(1)}`;
  if (digits.length === 9) return `255${digits}`;
  if (digits.length === 13 && digits.startsWith('2550')) return `255${digits.slice(4)}`;
  if (String(raw || '').startsWith('+255')) return String(raw).replace('+', '');
  throw new Error('Invalid phone format. Use 2557XXXXXXXX (TZ)');
}

// Run tests if called directly
if (require.main === module) {
  testPhoneNormalization();
  runTests();
}

module.exports = {
  testMobileMoneyPayment,
  testCardPayment,
  testPaymentStatus,
  testWebhook,
  testPhoneNormalization
};
