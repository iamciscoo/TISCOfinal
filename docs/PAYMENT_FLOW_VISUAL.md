# 🎯 **TISCO PAYMENT FLOW - VISUAL GUIDE**

**Matching Your Checkout Screenshot**

---

## 📱 **YOUR CHECKOUT PAGE**

```
┌─────────────────────────────────────────────┐
│         Secure Checkout                     │
│   Complete your order in a few simple steps │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ Delivery  ✅ Payment  ⭕ Confirm       │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📦 Review Your Order                       │
│                                             │
│  📍 Delivery Address                        │
│     Francis Jacob                           │
│     P.O. Box 35062, Dar es Salaam          │
│     Phone: +255 758 787 168                │
│                                             │
│  💳 Payment Method                          │
│     Mobile Money: M-Pesa                    │
│     Phone: **********168                    │
│                                             │
│  🛍️ Order Items (1)                         │
│     Bracelet  x1              TSh 200       │
│                                             │
│  ┌─────────────────────────────┐           │
│  │    [Place Order →]          │           │
│  └─────────────────────────────┘           │
│                                             │
│  📊 Order Summary                           │
│     Subtotal (1 items)        TSh 200      │
│     Delivery            TSh 5000-10000      │
│     Total                     TSh 200      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔄 **WHAT HAPPENS WHEN YOU CLICK "PLACE ORDER"**

### **Step 1: Frontend Validation** ⚡
```typescript
// File: /app/checkout/page.tsx

const handlePlaceOrder = async () => {
  // 1. Validate form
  if (!deliveryData.firstName || !deliveryData.address) {
    toast({ title: 'Missing Info', description: 'Please fill all required fields' })
    return
  }
  
  // 2. Get cart items
  const cartItems = getCart() // Your Bracelet (TSh 200)
  
  // 3. Prepare order data
  const orderData = {
    items: [{
      product_id: 'bracelet-id',
      name: 'Bracelet',
      price: 200,
      quantity: 1
    }],
    email: 'francisjacob08@gmail.com',
    first_name: 'Francis',
    last_name: 'Jacob',
    phone: '+255758787168',
    shipping_address: 'P.O. Box 35062, Dar es Salaam, Tanzania',
    notes: ''
  }
  
  // 4. Normalize phone number
  const msisdn = normalizeTzPhoneForApi('+255758787168')
  // Result: 255758787168
  
  const localPhone = convertToLocalFormat(msisdn)
  // Result: 0758787168 (what ZenoPay expects)
```

---

### **Step 2: Call Payment Initiation API** 🚀
```typescript
// POST /api/payments/mobile/initiate

const response = await fetch('/api/payments/mobile/initiate', {
  method: 'POST',
  body: JSON.stringify({
    amount: 200,                    // TSh 200
    currency: 'TZS',
    provider: 'M-Pesa',            // From payment method
    phone_number: '0758787168',    // Your phone (local format)
    order_data: orderData          // All order details
  })
})

// Expected Response:
{
  "success": true,
  "transaction_reference": "TISCO1A2B3C4D",
  "status": "processing",
  "message": "Payment request sent. Check your phone.",
  "session_id": "uuid"
}
```

---

### **Step 3: Backend Creates Payment Session** 💾
```typescript
// File: /api/payments/mobile/initiate/route.ts

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const user = await getUser()
  
  // 2. Validate amount matches cart total
  const calculatedTotal = items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  )
  // calculatedTotal = 200 ✅ Matches provided amount
  
  // 3. Generate unique transaction reference
  const transactionRef = generateOrderReference()
  // Result: "TISCO1A2B3C4D"
  
  // 4. Check for duplicate payments (5-min window)
  const recentSession = await checkDuplicateSession(...)
  if (recentSession) {
    return { existing: true, session: recentSession }
  }
  
  // 5. Create payment_session record in database
  const session = await supabase
    .from('payment_sessions')
    .insert({
      user_id: user.id,
      amount: 200,
      currency: 'TZS',
      provider: 'M-Pesa',
      phone_number: '0758787168',
      transaction_reference: 'TISCO1A2B3C4D',
      order_data: orderData,  // Stored for webhook
      status: 'pending'
    })
  
  // 6. Call ZenoPay API
  const zenoResult = await zenoPayClient.createOrder({
    order_id: 'TISCO1A2B3C4D',
    buyer_name: 'Francis Jacob',
    buyer_phone: '0758787168',
    buyer_email: 'francisjacob08@gmail.com',
    amount: 200,
    webhook_url: 'https://tiscomarket.store/api/payments/mobile/webhook'
  })
  
  // 7. Update session status
  await supabase
    .from('payment_sessions')
    .update({ status: 'processing' })
    .eq('id', session.id)
  
  return { success: true, transaction_reference: 'TISCO1A2B3C4D' }
}
```

---

### **Step 4: ZenoPay Sends STK Push** 📱
```
┌─────────────────────────────┐
│   💸 M-Pesa Payment         │
├─────────────────────────────┤
│                             │
│  Enter your M-Pesa PIN to   │
│  pay TSh 200 to TISCO       │
│                             │
│  Merchant: TISCO Market     │
│  Amount: TSh 200            │
│  Ref: TISCO1A2B3C4D        │
│                             │
│  ┌──────────┐ ┌──────────┐ │
│  │  CANCEL  │ │    OK    │ │
│  └──────────┘ └──────────┘ │
│                             │
└─────────────────────────────┘
  Your Phone (Vodacom)
```

**What happens:**
1. ZenoPay receives request
2. Connects to Vodacom M-Pesa
3. Vodacom sends STK push to 0758787168
4. You see payment prompt on your phone

---

### **Step 5: Frontend Starts Polling** 🔄
```typescript
// File: /app/checkout/page.tsx

async function pollPaymentStatus(reference: string) {
  const startTime = Date.now()
  const timeout = 5 * 60 * 1000 // 5 minutes
  let attempt = 0
  
  // Show loading message
  setLoadingMessage('Waiting for phone confirmation...')
  
  while (Date.now() - startTime < timeout) {
    attempt++
    
    // Check status every 3 seconds
    const response = await fetch('/api/payments/mobile/status', {
      method: 'POST',
      body: JSON.stringify({ reference: 'TISCO1A2B3C4D' })
    })
    
    const data = await response.json()
    
    console.log(`Attempt ${attempt}: Status = ${data.status}`)
    
    if (data.status === 'completed') {
      // ✅ Payment successful!
      return true
    }
    
    if (data.status === 'failed') {
      // ❌ Payment failed
      return false
    }
    
    // Still processing, wait and retry
    await sleep(3000)
  }
  
  // Timeout reached
  return false
}
```

**Console output you'll see:**
```
🚀 Payment initiated: uuid
📞 Webhook URL: https://tiscomarket.store/api/payments/mobile/webhook
🔄 Polling payment: TISCO1A2B3C4D (attempt 1)
⏳ Status: processing
🔄 Polling payment: TISCO1A2B3C4D (attempt 2)
⏳ Status: processing
🔄 Polling payment: TISCO1A2B3C4D (attempt 3)
✅ Status: completed
✅ Payment confirmed!
```

---

### **Step 6: You Enter PIN & Confirm** 🔐
```
┌─────────────────────────────┐
│   💸 M-Pesa Payment         │
├─────────────────────────────┤
│                             │
│  Enter your M-Pesa PIN:     │
│                             │
│  ┌───┬───┬───┬───┐         │
│  │ ● │ ● │ ● │ ● │         │
│  └───┴───┴───┴───┘         │
│                             │
│  [Confirm]                  │
│                             │
└─────────────────────────────┘

      ↓ You press confirm

┌─────────────────────────────┐
│   ✅ Payment Successful      │
├─────────────────────────────┤
│                             │
│  TSh 200 sent to TISCO      │
│                             │
│  Transaction ID:            │
│  CEJ3I3SETSN                │
│                             │
│  New Balance: TSh 45,000    │
│                             │
└─────────────────────────────┘
```

---

### **Step 7: ZenoPay Sends Webhook** 🔔
```typescript
// ZenoPay calls: POST /api/payments/mobile/webhook

{
  "order_id": "TISCO1A2B3C4D",
  "payment_status": "COMPLETED",
  "reference": "0936183435",
  "amount": "200",
  "transid": "CEJ3I3SETSN",
  "channel": "MPESA-TZ",
  "msisdn": "255758787168"
}
```

---

### **Step 8: Webhook Creates Order** 📦
```typescript
// File: /api/payments/mobile/webhook/route.ts

export async function POST(req: NextRequest) {
  // 1. Parse webhook payload
  const {
    order_id,           // TISCO1A2B3C4D
    payment_status,     // COMPLETED
    reference,          // 0936183435
    amount,             // 200
    transid            // CEJ3I3SETSN
  } = await req.json()
  
  // 2. Find payment session
  const session = await supabase
    .from('payment_sessions')
    .select('*')
    .eq('transaction_reference', 'TISCO1A2B3C4D')
    .single()
  
  // 3. Check if already processed
  if (session.status === 'completed') {
    return { message: 'Already processed' }
  }
  
  // 4. Validate payment is COMPLETED
  if (payment_status !== 'COMPLETED') {
    return { message: 'Payment not completed yet' }
  }
  
  // 5. Get order_data from session
  const orderData = session.order_data
  /*
    {
      items: [{ product_id, name: 'Bracelet', price: 200, quantity: 1 }],
      email: 'francisjacob08@gmail.com',
      first_name: 'Francis',
      last_name: 'Jacob',
      shipping_address: 'P.O. Box 35062...',
      ...
    }
  */
  
  // 6. Create order in database
  const order = await supabase
    .from('orders')
    .insert({
      user_id: session.user_id,
      total_amount: 200,
      currency: 'TZS',
      status: 'processing',
      payment_status: 'paid',
      payment_method: 'Mobile Money (M-Pesa) - ***787168',
      shipping_address: 'P.O. Box 35062, Dar es Salaam, Tanzania',
      notes: '',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  // 7. Create order items
  await supabase
    .from('order_items')
    .insert([{
      order_id: order.id,
      product_id: 'bracelet-id',
      quantity: 1,
      price: 200
    }])
  
  // 8. Update payment session
  await supabase
    .from('payment_sessions')
    .update({
      status: 'completed',
      gateway_transaction_id: 'CEJ3I3SETSN'
    })
    .eq('id', session.id)
  
  // 9. Send email notifications (async)
  setImmediate(async () => {
    // Email to customer
    await sendEmail({
      to: 'francisjacob08@gmail.com',
      subject: 'Order Confirmation - TISCO',
      template: 'order-confirmation',
      data: {
        customerName: 'Francis Jacob',
        orderId: order.id,
        items: [{ name: 'Bracelet', quantity: 1, price: 200 }],
        total: 200,
        shippingAddress: 'P.O. Box 35062...'
      }
    })
    
    // Email to admin
    await sendEmail({
      to: 'admin@tiscomarket.store',
      subject: '🔔 New Order Received',
      template: 'admin-order-alert',
      data: {
        orderId: order.id,
        customer: 'Francis Jacob',
        total: 200,
        paymentMethod: 'M-Pesa'
      }
    })
  })
  
  return { success: true, order_id: order.id }
}
```

---

### **Step 9: Frontend Detects Success** ✅
```typescript
// Back in /app/checkout/page.tsx

const success = await pollPaymentStatus('TISCO1A2B3C4D')

if (success) {
  // ✅ Payment confirmed!
  
  toast({
    title: 'Payment Confirmed!',
    description: 'Your order has been placed successfully.'
  })
  
  // Clear cart (client-side only now)
  clearCart()
  
  // Redirect to orders page
  router.push('/account/orders?justPaid=1')
}
```

---

### **Step 10: Order Confirmation Page** 🎉
```
┌─────────────────────────────────────────────┐
│  🎉 Order Placed Successfully!              │
├─────────────────────────────────────────────┤
│                                             │
│  Order #abc12345                            │
│  Status: Processing                         │
│  Payment: Paid (M-Pesa)                    │
│                                             │
│  📦 Items:                                  │
│     • Bracelet x1           TSh 200         │
│                                             │
│  📍 Delivery Address:                       │
│     Francis Jacob                           │
│     P.O. Box 35062, Dar es Salaam          │
│                                             │
│  ✉️ Confirmation email sent to:             │
│     francisjacob08@gmail.com               │
│                                             │
│  [View Order Details]  [Continue Shopping] │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📧 **EMAILS SENT**

### **To Customer:**
```
From: TISCO <noreply@tiscomarket.store>
To: francisjacob08@gmail.com
Subject: Order Confirmation #abc12345

Hi Francis Jacob,

Thank you for your order!

Order Details:
- Order ID: #abc12345
- Date: January 8, 2025
- Total: TSh 200

Items:
1. Bracelet x1 - TSh 200

Payment: Paid via M-Pesa (Transaction: CEJ3I3SETSN)

Shipping Address:
P.O. Box 35062
Dar es Salaam, Tanzania

We'll contact you soon to arrange delivery.

Thank you for shopping with TISCO!
```

### **To Admin:**
```
From: TISCO System <system@tiscomarket.store>
To: admin@tiscomarket.store
Subject: 🔔 New Order Received

New Order Alert!

Order ID: #abc12345
Customer: Francis Jacob
Email: francisjacob08@gmail.com
Phone: +255 758 787 168

Items:
- Bracelet x1 - TSh 200

Total: TSh 200
Payment: Paid (M-Pesa)

Shipping: P.O. Box 35062, Dar es Salaam

[View in Admin Dashboard]
```

---

## ⏱️ **TIMING BREAKDOWN**

| Stage | Duration | Total Elapsed |
|-------|----------|---------------|
| Form validation | 0.1s | 0.1s |
| API call to initiate | 0.5s | 0.6s |
| Database session creation | 0.2s | 0.8s |
| ZenoPay API call | 1.0s | 1.8s |
| STK push delivery | 2.0s | 3.8s |
| User enters PIN | 10s | 13.8s |
| Payment processing | 3.0s | 16.8s |
| Webhook received | 0.5s | 17.3s |
| Order creation | 0.8s | 18.1s |
| Polling detects success | 3.0s | 21.1s |
| Redirect to orders | 0.2s | 21.3s |

**Total: ~21 seconds** ⚡

---

## 🎯 **SUCCESS!**

Your order flow is:
✅ Secure - Amount validated server-side  
✅ Reliable - Duplicate prevention  
✅ Fast - Async processing  
✅ User-friendly - Clear feedback  
✅ Complete - Notifications sent  

**When you click "Place Order", everything moves smoothly! 🚀**

---

## 🔧 **IF SOMETHING GOES WRONG**

### **Scenario 1: Phone Not Responding**
```
⏳ Polling: 1, 2, 3, 4, 5... 20 attempts
⏰ Timeout after 5 minutes

Message shown:
"Payment timeout. You can retry or check your orders later 
if payment completes."

[Retry Payment] [Change Payment Method]
```

### **Scenario 2: You Cancel Payment**
```
❌ Status: failed
Reason: User canceled

Message shown:
"Payment canceled. You can try again with the same or 
different payment method."

[Try Again] [Change Method]
```

### **Scenario 3: Insufficient Balance**
```
❌ Status: failed
Reason: Insufficient funds

Message shown:
"Insufficient balance. Please top up your M-Pesa account."

[Try Again]
```

---

**Now you understand the complete flow! 🎓**
