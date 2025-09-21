
# ZenoPay Mobile Money Tanzania Integration

This project demonstrates how to integrate with **ZenoPay Mobile Money API** to accept payments in Tanzania.  
It includes examples of **creating a payment request**, **checking order status**, and **handling webhooks**.

---

## 📌 Requirements
- Node.js 16+
- npm or yarn
- [Axios](https://www.npmjs.com/package/axios)

Install dependencies:

```bash
npm install axios
````

---

## 🚀 Create Payment Request

```javascript
import axios from 'axios';

const url = 'https://zenoapi.com/api/payments/mobile_money_tanzania';

// Payment request payload
const data = {
  order_id: '3rer407fe-3ee8-4525-456f-ccb95de38250', // Unique transaction ID (UUID recommended)
  buyer_name: 'William',
  buyer_phone: '0689726060', // Tanzanian number format 07XXXXXXXX
  buyer_email: 'william@zeno.co.tz',
  amount: 1000,
  webhook_url: 'https://example.com/webhook' // Optional, to receive payment status updates
};

// Send request
axios.post(url, data, {
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY' // Replace with your actual API key
  }
})
  .then(response => console.log('Response:', response.data))
  .catch(error => console.error('Error:', error.response ? error.response.data : error.message));
```

---

## 📡 Check Order Status

You can query the status of a payment using the `order_id`:

```javascript
const statusUrl = 'https://zenoapi.com/api/payments/order-status';
const orderId = '3rer407fe-3ee8-4525-456f-ccb95de38250';

axios.get(`${statusUrl}?order_id=${orderId}`, {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(response => console.log('Order Status:', response.data))
  .catch(error => console.error('Error:', error.response ? error.response.data : error.message));
```

Sample response:

```json
{
  "reference": "0936183435",
  "resultcode": "000",
  "result": "SUCCESS",
  "message": "Order fetch successful",
  "data": [
    {
      "order_id": "3rer407fe-3ee8-4525-456f-ccb95de38250",
      "amount": "1000",
      "payment_status": "COMPLETED",
      "channel": "MPESA-TZ",
      "transid": "CEJ3I3SETSN",
      "reference": "0936183435",
      "msisdn": "255744963858"
    }
  ]
}
```

---

## 🔔 Webhook Setup

To automatically receive notifications when a payment is **COMPLETED**, include a `webhook_url` in your payment request.

ZenoPay will POST to your webhook with this payload:

```json
{
  "order_id": "677e43274d7cb",
  "payment_status": "COMPLETED",
  "reference": "1003020496",
  "metadata": {
    "product_id": "12345",
    "custom_notes": "Please gift-wrap this item."
  }
}
```

Verify the request by checking the `x-api-key` header to ensure it comes from ZenoPay.

---

## 📧 Support

* Email: [support@zenoapi.com](mailto:support@zenoapi.com)
* Website: [https://zenoapi.com](https://zenoapi.com)

---

**ZenoPay – Simplifying Digital Payments in Tanzania 🇹🇿**

```
