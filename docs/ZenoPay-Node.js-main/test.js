// Use ES module import
import axios from 'axios';

// API endpoint
const url = 'https://zenoapi.com/api/payments/mobile_money_tanzania';

// Data to be sent
const data = {
  order_id: '3rer407fe-3ee8-4525-456f-ccb95de38250', // must be unique (UUID recommended)
  buyer_name: 'William',
  buyer_phone: '0689726060', // Tanzanian format 07XXXXXXXX
  buyer_email: 'william@zeno.co.tz',
  amount: 1000,
  webhook_url: 'https://example.com/webhook' // optional, for status updates
};

// Send POST request to the Zeno API
axios.post(url, data, {
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'  // Replace with your actual API key
  }
})
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response ? error.response.data : error.message);
  });
