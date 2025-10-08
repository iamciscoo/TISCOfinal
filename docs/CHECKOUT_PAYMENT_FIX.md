# 🔧 Checkout → Payment Connection Fix

**Purpose:** Ensure smooth flow when "Place Order" button is clicked

---

## 🎯 **COMPLETE PAYMENT FLOW**

```
┌─────────────┐
│   CUSTOMER  │
│  (Browser)  │
└──────┬──────┘
       │ 1. Clicks "Place Order"
       ↓
┌─────────────────────────┐
│  CHECKOUT PAGE          │
│  /app/checkout/page.tsx │
└──────┬──────────────────┘
       │ 2. POST /api/payments/mobile/initiate
       │    {
       │      amount: 200,
       │      provider: "M-Pesa",
       │      phone_number: "0742123456",
       │      order_data: { items, shipping, customer }
       │    }
       ↓
┌────────────────────────────────┐
│  INITIATE ENDPOINT             │
│  /api/payments/mobile/initiate │
└──────┬─────────────────────────┘
       │ 3. Creates payment_session in DB
       │ 4. Calls ZenoPay API
       ↓
┌─────────────┐
│   ZENOPAY   │
│  (Gateway)  │
└──────┬──────┘
       │ 5. Sends STK Push to phone
       ↓
┌─────────────┐
│  CUSTOMER   │
│   PHONE     │
└──────┬──────┘
       │ 6. Enters PIN & Confirms
       │
       ├─────────────────────────┐
       │                         │
       ↓                         ↓
┌─────────────┐         ┌───────────────┐
│  FRONTEND   │         │    ZENOPAY    │
│   POLLING   │         │    WEBHOOK    │
└──────┬──────┘         └───────┬───────┘
       │ 7a. GET           7b. POST
       │ /status?ref=TX    /webhook
       ↓                         ↓
┌─────────────┐         ┌───────────────┐
│   STATUS    │         │   WEBHOOK     │
│  ENDPOINT   │         │   HANDLER     │
└──────┬──────┘         └───────┬───────┘
       │                        │ 8. Creates order
       │                        │ 9. Sends emails
       │                        │ 10. Updates session
       ↓                        ↓
┌─────────────────────────────────┐
│  FRONTEND DETECTS COMPLETION    │
│  Redirects to /account/orders   │
└─────────────────────────────────┘
```

---

## 🐛 **ISSUES TO FIX**

### **1. Phone Number Normalization**

**Current checkout code:**
```typescript
const msisdn = normalizeTzPhoneForApi(paymentData.mobilePhone)
// Returns: "255742123456" (E.164)
```

**Problem:** ZenoPay tries multiple formats but prefers local format first

**Fix:** Send local format directly
```typescript
// RECOMMENDED: Send local format
function normalizeToLocal(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  
  // Already local format
  if (digits.length === 10 && digits.startsWith('0')) {
    return digits // 0742123456
  }
  
  // E.164 format
  if (digits.length === 12 && digits.startsWith('255')) {
    return `0${digits.slice(3)}` // 255742123456 → 0742123456
  }
  
  // International with +
  if (phone.startsWith('+255')) {
    return `0${digits.slice(3)}`
  }
  
  // 9 digits (missing leading 0)
  if (digits.length === 9) {
    return `0${digits}`
  }
  
  throw new Error('Invalid Tanzania phone number')
}
```

---

### **2. Status Polling Method**

**Current (checkout):**
```typescript
const sres = await fetch('/api/payments/mobile/status', {
  method: 'POST',
  body: JSON.stringify({ transaction_reference: reference })
})
```

**Status endpoint expects:**
```typescript
// GET with query parameter
GET /api/payments/mobile/status?transaction_reference=TISCO1A2B3C4D
```

**Fix in checkout:**
```typescript
const sres = await fetch(
  `/api/payments/mobile/status?transaction_reference=${encodeURIComponent(reference)}`,
  {
    method: 'GET',
    credentials: 'include',
  }
)
```

---

### **3. Order Data Structure**

**What webhook expects:**
```typescript
interface OrderData {
  items: Array<{
    product_id: string
    name: string
    price: number
    quantity: number
  }>
  email: string
  first_name: string
  last_name: string
  phone?: string
  shipping_address: string
  address_line_1?: string
  notes?: string
}
```

**Verify checkout sends this:**
```typescript
const orderData = {
  items: cartItems.map(item => ({
    product_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  })),
  email: deliveryData.email,
  first_name: deliveryData.firstName,
  last_name: deliveryData.lastName,
  phone: deliveryData.phone || null,
  shipping_address: deliveryData.address,
  address_line_1: deliveryData.address,
  notes: deliveryData.notes || ''
}
```

---

### **4. Error Handling Best Practices**

**Add timeout configuration:**
```typescript
const PAYMENT_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const POLL_INTERVAL = 3000 // 3 seconds

async function pollPaymentStatus(reference: string) {
  const startTime = Date.now()
  
  while (Date.now() - startTime < PAYMENT_TIMEOUT) {
    try {
      const response = await fetch(
        `/api/payments/mobile/status?transaction_reference=${reference}`,
        { method: 'GET' }
      )
      
      if (!response.ok) {
        console.error('Status check failed:', response.status)
        await sleep(POLL_INTERVAL)
        continue
      }
      
      const data = await response.json()
      
      if (data.status === 'completed') {
        return true // Success!
      }
      
      if (data.status === 'failed') {
        return false // Payment failed
      }
      
      // Still processing, wait and retry
      await sleep(POLL_INTERVAL)
      
    } catch (error) {
      console.error('Polling error:', error)
      await sleep(POLL_INTERVAL)
    }
  }
  
  // Timeout reached
  return false
}
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Checkout Page Fixes:**
- [ ] Update phone normalization to local format
- [ ] Change status polling from POST to GET
- [ ] Add proper timeout handling
- [ ] Verify order_data structure
- [ ] Add retry mechanism for failed payments
- [ ] Show clear loading states during polling

### **Payment Initiate Endpoint:**
- [x] Already handles multiple phone formats ✅
- [x] Creates payment_session properly ✅
- [x] Calls ZenoPay with correct structure ✅

### **Payment Status Endpoint:**
- [ ] Ensure accepts GET with query params
- [ ] Return proper status values
- [ ] Handle non-existent sessions gracefully

### **Webhook Handler:**
- [x] Creates orders from payment_sessions ✅
- [x] Sends email notifications ✅
- [x] Updates session status ✅

---

## 🔒 **SECURITY BEST PRACTICES**

### **1. Amount Verification**
```typescript
// Server recalculates total - NEVER trust client
const calculatedTotal = items.reduce((sum, item) => 
  sum + (item.price * item.quantity), 0
)

if (Math.abs(calculatedTotal - providedAmount) > 0.01) {
  throw new Error('Amount mismatch - possible tampering')
}
```

### **2. Duplicate Prevention**
```typescript
// Check for recent identical payment (5 min window)
const recentSession = await findRecentSession({
  user_id,
  amount,
  phone_number,
  timeWindow: 5 * 60 * 1000
})

if (recentSession && recentSession.status !== 'failed') {
  return { existing: true, session: recentSession }
}
```

### **3. Webhook Validation**
```typescript
// Verify webhook comes from ZenoPay
const apiKey = request.headers.get('x-api-key')
if (apiKey !== process.env.ZENOPAY_API_KEY) {
  return new Response('Unauthorized', { status: 401 })
}
```

---

## 🎨 **USER EXPERIENCE IMPROVEMENTS**

### **Loading States:**
```typescript
// Show different messages based on stage
setLoadingMessage('Initiating payment...')        // Step 1
setLoadingMessage('Waiting for phone approval...') // Step 2
setLoadingMessage('Processing payment...')         // Step 3
setLoadingMessage('Creating your order...')        // Step 4
```

### **Error Messages:**
```typescript
const ERROR_MESSAGES = {
  invalid_phone: 'Invalid phone number. Use format: 07XX XXX XXX',
  timeout: 'Payment is taking longer than expected. Please check your phone.',
  insufficient_funds: 'Insufficient balance. Please top up and try again.',
  user_canceled: 'Payment canceled. You can try again.',
  network_error: 'Network issue. Please check your connection.',
}
```

### **Success Flow:**
```typescript
// Clear sequence
toast({ title: 'Payment Initiated' })
// ... polling ...
toast({ title: 'Payment Confirmed' })
// ... order creation ...
toast({ title: 'Order Placed Successfully!' })
router.push('/account/orders?new=true')
```

---

## 🧪 **TESTING SCENARIOS**

### **Scenario 1: Happy Path**
1. User fills checkout form
2. Selects M-Pesa, enters 0742123456
3. Clicks "Place Order"
4. Receives STK push
5. Enters PIN
6. Order appears in dashboard

### **Scenario 2: User Cancels**
1. User gets STK push
2. Cancels payment
3. Frontend shows "Payment canceled"
4. Can retry with same or different method

### **Scenario 3: Timeout**
1. User doesn't respond to STK push
2. Frontend shows timeout message after 5 min
3. Can retry payment
4. If payment completes later, webhook handles it

### **Scenario 4: Network Issues**
1. Network drops during polling
2. Frontend continues polling when reconnected
3. Shows appropriate error messages
4. Doesn't create duplicate orders

---

## 📊 **MONITORING & LOGGING**

### **Log Critical Events:**
```typescript
// Payment initiation
console.log('🚀 Payment initiated:', {
  session_id,
  amount,
  provider,
  phone: maskPhone(phone_number)
})

// Polling status
console.log('🔄 Polling payment:', {
  reference,
  attempt,
  elapsed_time
})

// Payment completed
console.log('✅ Payment confirmed:', {
  reference,
  order_id,
  duration
})

// Payment failed
console.error('❌ Payment failed:', {
  reference,
  reason,
  stage
})
```

### **Track Metrics:**
- Average payment completion time
- Polling attempts before success
- Timeout rate
- Retry success rate
- Provider-specific success rates

---

## 🚀 **DEPLOYMENT CHECKLIST**

Before deploying:

- [ ] Test with real M-Pesa account
- [ ] Test with real Tigo Pesa account  
- [ ] Test with real Airtel Money account
- [ ] Test timeout scenarios
- [ ] Test network interruption
- [ ] Test duplicate prevention
- [ ] Verify emails are sent
- [ ] Check admin dashboard shows orders
- [ ] Monitor logs for errors
- [ ] Set up alerting for payment failures

---

## 📚 **ZENOPAY INTEGRATION REFERENCE**

### **From ZenoPay Documentation:**

**Create Payment:**
```javascript
POST https://zenoapi.com/api/payments/mobile_money_tanzania

{
  "order_id": "TISCO1A2B3C4D",      // Your unique ref
  "buyer_name": "Francis Jacob",
  "buyer_phone": "0742123456",       // LOCAL FORMAT
  "buyer_email": "customer@example.com",
  "amount": 200,
  "webhook_url": "https://tiscomarket.store/api/payments/mobile/webhook"
}
```

**Check Status:**
```javascript
GET https://zenoapi.com/api/payments/order-status?order_id=TISCO1A2B3C4D

Response:
{
  "result": "SUCCESS",
  "data": [{
    "order_id": "TISCO1A2B3C4D",
    "payment_status": "COMPLETED",
    "amount": "200",
    "channel": "MPESA-TZ"
  }]
}
```

**Webhook Payload:**
```javascript
POST /api/payments/mobile/webhook

{
  "order_id": "TISCO1A2B3C4D",
  "payment_status": "COMPLETED",
  "reference": "0936183435",
  "amount": "200",
  "transid": "CEJ3I3SETSN"
}
```

---

## ✅ **SUMMARY**

**When "Place Order" is clicked:**

1. ✅ Validate form data
2. ✅ Normalize phone to local format (0742123456)
3. ✅ Create order_data object
4. ✅ Call `/api/payments/mobile/initiate`
5. ✅ Show "Check your phone" message
6. ✅ Poll `/api/payments/mobile/status` (GET, not POST)
7. ✅ Wait for webhook to create order
8. ✅ Show success and redirect
9. ✅ Handle errors gracefully with retry

**Everything flows smoothly! 🎉**

---

**Next:** I'll create the actual code fixes for checkout/page.tsx
