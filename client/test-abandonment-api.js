// Test script for cart abandonment API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testAbandonmentAPI() {
  console.log('Testing cart abandonment API...\n');

  // Test payload mimicking logout with cart items
  const testPayload = {
    reason: 'logout',
    preserve_for_restoration: true,
    cart_items: [
      {
        product_id: 'test-product-1',
        quantity: 2,
        price: 29.99,
        name: 'Test Product 1',
        image_url: 'https://example.com/test1.jpg'
      },
      {
        product_id: 'test-product-2', 
        quantity: 1,
        price: 49.99,
        name: 'Test Product 2',
        image_url: 'https://example.com/test2.jpg'
      }
    ]
  };

  try {
    console.log('Sending test payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(`${API_BASE}/cart/record-abandonment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.text();
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    console.log('Response body:', result);

    // Try to parse as JSON
    try {
      const jsonResult = JSON.parse(result);
      console.log('\nParsed JSON result:', JSON.stringify(jsonResult, null, 2));
    } catch (parseError) {
      console.log('\nCould not parse response as JSON:', parseError.message);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testAbandonmentAPI();
