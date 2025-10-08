# 🏦 TISCO Payment System - Complete Guide

**Last Updated:** January 2025  
**Version:** 2.0  
**Platform:** TISCO E-Commerce Platform  
**Payment Provider:** ZenoPay Mobile Money Tanzania

---

## 📚 Table of Contents

1. [System Overview](#system-overview)
2. [Foundational Concepts](#foundational-concepts)
3. [ZenoPay Integration](#zenopay-integration)
4. [API Endpoints](#api-endpoints)
5. [Payment Flow](#payment-flow)
6. [Security Measures](#security-measures)
7. [Status Codes & Responses](#status-codes--responses)
8. [Webhooks](#webhooks)
9. [Error Handling](#error-handling)
10. [System Audit & Improvements](#system-audit--improvements)

---

## 1. System Overview

### What is the TISCO Payment System?

The TISCO payment system enables customers in Tanzania to purchase products using **Mobile Money** services (M-Pesa, Tigo Pesa, Airtel Money, Halopesa). It integrates with **ZenoPay**, a third-party payment gateway that handles the actual money transfer between customer mobile wallets and the merchant account.

### Architecture Components

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────┐
│   Customer  │────▶│ TISCO Server │────▶│   ZenoPay   │────▶│  Mobile   │
│  (Browser)  │     │  (Next.js)   │     │  (Gateway)  │     │  Networks │
└─────────────┘     └──────────────┘     └─────────────┘     └───────────┘
       │                    │                    │                    │
       │                    ▼                    │                    │
       │            ┌───────────────┐            │                    │
       │            │   Supabase    │            │                    │
       │            │   Database    │            │                    │
       │            └───────────────┘            │                    │
       │                                         │                    │
       └◀────────────────────────────────────────┴────────────────────┘
                         Webhook Notification
```

---

## 2. Foundational Concepts

### 2.1 Mobile Money in Tanzania

**Mobile Money** is a digital wallet system where users can:
- Store money in their mobile phone account
- Send/receive money via phone number
- Pay for goods and services

**Popular Providers:**
- **M-Pesa** (Vodacom) - Most popular
- **Tigo Pesa** (Tigo)
- **Airtel Money** (Airtel)
- **Halopesa** (Halotel)

### 2.2 Payment Gateway (ZenoPay)

Think of ZenoPay as a **bridge** between your website and mobile money networks:

1. **You** send payment request to ZenoPay
2. **ZenoPay** communicates with mobile networks
3. **Customer** receives STK push (payment prompt) on phone
4. **Customer** enters PIN to confirm
5. **ZenoPay** notifies you via webhook when payment completes

### 2.3 Payment Session

A **Payment Session** is a temporary record that tracks a single payment attempt:

```typescript
{
  id: "uuid",
  user_id: "customer-uuid",
  amount: 50000, // in TZS (Tanzanian Shillings)
  currency: "TZS",
  provider: "M-Pesa",
  phone_number: "0742123456",
  transaction_reference: "TISCO1A2B3C4D", // Unique ID
  status: "pending", // or "processing", "completed", "failed"
  order_data: { /* customer info, items, shipping */ }
}
```

---

## 3. ZenoPay Integration

### 3.1 Authentication

ZenoPay uses **API Key** authentication:

```javascript
headers: {
  'x-api-key': 'YOUR_SECRET_API_KEY',
  'Content-Type': 'application/json'
}
```

⚠️ **Security:** API key stored in environment variable `ZENOPAY_API_KEY`

### 3.2 ZenoPay Endpoints

#### Create Payment Request
```
POST https://zenoapi.com/api/payments/mobile_money_tanzania
```

**Request Body:**
```json
{
  "order_id": "TISCO1A2B3C4D",      // Your unique transaction reference
  "buyer_name": "John Doe",
  "buyer_phone": "0742123456",       // Tanzania format (07XX XXX XXX)
  "buyer_email": "john@example.com",
  "amount": 50000,                   // Amount in TZS
  "webhook_url": "https://yourdomain.com/api/payments/mobile/webhook"
}
```

**Success Response:**
```json
{
  "reference": "0936183435",
  "resultcode": "000",
  "result": "SUCCESS",
  "message": "Payment request sent successfully"
}
```

#### Check Payment Status
```
GET https://zenoapi.com/api/payments/order-status?order_id=TISCO1A2B3C4D
```

**Response:**
```json
{
  "reference": "0936183435",
  "resultcode": "000",
  "result": "SUCCESS",
  "data": [{
    "order_id": "TISCO1A2B3C4D",
    "amount": "50000",
    "payment_status": "COMPLETED",
    "channel": "MPESA-TZ",
    "transid": "CEJ3I3SETSN",
    "reference": "0936183435",
    "msisdn": "255742123456"
  }]
}
```

---

## 4. API Endpoints

### 4.1 Initiate Mobile Payment

**Endpoint:** `POST /api/payments/mobile/initiate`

**Purpose:** Start a mobile money payment process

**Authentication:** Required (Supabase Auth)

**Request Body:**
```json
{
  "amount": 50000,
  "currency": "TZS",
  "provider": "M-Pesa",
  "phone_number": "0742123456",
  "order_data": {
    "items": [
      {
        "product_id": "uuid",
        "name": "Product Name",
        "price": 25000,
        "quantity": 2
      }
    ],
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "shipping_address": "123 Main St, Dar es Salaam",
    "notes": "Please deliver during business hours"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "transaction_reference": "TISCO1A2B3C4D",
  "status": "processing",
  "message": "Payment request sent. Check your phone.",
  "session_id": "uuid",
  "gateway_transaction_id": "ZP123456"
}
```

**Error Response (400 - Validation):**
```json
{
  "error": "Amount mismatch",
  "calculated": 50000,
  "provided": 45000
}
```

**Error Response (500 - Gateway):**
```json
{
  "success": false,
  "error": "Payment initiation failed. Please try again.",
  "technical_error": "ZenoPay API timeout",
  "transaction_reference": "TISCO1A2B3C4D",
  "retryable": true
}
```

---

### 4.2 Check Payment Status

**Endpoint:** `GET /api/payments/mobile/status?transaction_reference=TISCO1A2B3C4D`

**Purpose:** Poll payment status

**Authentication:** Required

**Success Response:**
```json
{
  "success": true,
  "status": "completed",
  "transaction_reference": "TISCO1A2B3C4D",
  "amount": 50000,
  "provider": "M-Pesa",
  "order_id": "uuid" // Available after completion
}
```

---

### 4.3 Webhook Receiver

**Endpoint:** `POST /api/payments/mobile/webhook`

**Purpose:** Receive payment notifications from ZenoPay

**Authentication:** None (validates via ZenoPay signature)

**Webhook Payload from ZenoPay:**
```json
{
  "order_id": "TISCO1A2B3C4D",
  "payment_status": "COMPLETED",
  "reference": "0936183435",
  "amount": "50000",
  "transid": "CEJ3I3SETSN"
}
```

---

## 5. Payment Flow

### Complete Payment Journey

```
1. Customer clicks "Checkout" → Fills shipping info
                                      ↓
2. Selects "Mobile Money" → Chooses provider (M-Pesa)
                                      ↓
3. Enters phone number → Clicks "Pay Now"
                                      ↓
4. Frontend calls → POST /api/payments/mobile/initiate
                                      ↓
5. Backend creates → Payment Session in DB
                                      ↓
6. Backend calls → ZenoPay API
                                      ↓
7. ZenoPay sends → STK Push to customer phone
                                      ↓
8. Customer receives → Payment prompt on phone
                                      ↓
9. Customer enters → Mobile Money PIN
                                      ↓
10. ZenoPay processes → Payment with mobile network
                                      ↓
11. ZenoPay calls → TISCO Webhook (POST /api/payments/mobile/webhook)
                                      ↓
12. Webhook creates → Order + Order Items in DB
                                      ↓
13. Webhook updates → Payment Session to "completed"
                                      ↓
14. Webhook sends → Email to customer + admin
                                      ↓
15. Customer redirected → Order confirmation page
```

---

## 6. Security Measures

### 6.1 Authentication Layers

1. **User Authentication:**
   - Supabase JWT tokens
   - Required for initiating payments
   - Prevents unauthorized payment requests

2. **API Key Protection:**
   ```typescript
   // Server-side only (never exposed to client)
   const ZENOPAY_API_KEY = process.env.ZENOPAY_API_KEY
   ```

3. **Webhook Validation:**
   ```typescript
   // Verify webhook comes from ZenoPay
   const apiKey = req.headers.get('x-api-key')
   if (apiKey !== process.env.ZENOPAY_API_KEY) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

### 6.2 Anti-Fraud Measures

1. **Duplicate Payment Prevention:**
   ```typescript
   // Check for recent identical session within 5 minutes
   const recentSession = await findRecentDuplicateSession({
     user_id,
     amount,
     provider,
     phone_number,
     timeWindow: '5 minutes'
   })
   
   if (recentSession) {
     return { is_duplicate: true, existing_session }
   }
   ```

2. **Amount Validation:**
   ```typescript
   // Server recalculates total to prevent tampering
   const calculatedTotal = items.reduce((sum, item) => 
     sum + (item.price * item.quantity), 0
   )
   
   if (Math.abs(calculatedTotal - providedAmount) > 0.01) {
     throw new ValidationError('Amount mismatch')
   }
   ```

3. **Phone Number Normalization:**
   ```typescript
   // Ensure valid Tanzania phone format
   function normalizeTzPhone(raw: string): string {
     const digits = raw.replace(/\D/g, '')
     
     if (digits.startsWith('255')) {
       return `0${digits.slice(3)}` // +255742123456 → 0742123456
     }
     
     if (!digits.startsWith('0') || digits.length !== 10) {
       throw new ValidationError('Invalid phone number')
     }
     
     return digits
   }
   ```

### 6.3 Idempotency

**Problem:** User clicks "Pay" button multiple times

**Solution:** Generate unique transaction reference + check duplicates

```typescript
function generateTransactionReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `TISCO${timestamp}${random}` // e.g., TISCO1A2B3C4D5E
}
```

---

## 7. Status Codes & Responses

### 7.1 HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | Success | Payment initiated, status retrieved |
| `400` | Bad Request | Missing fields, invalid data |
| `401` | Unauthorized | No auth token, invalid API key |
| `404` | Not Found | Payment session doesn't exist |
| `500` | Server Error | Database failure, gateway timeout |

### 7.2 Payment Session Status

| Status | Description | Next Action |
|--------|-------------|-------------|
| `pending` | Session created, awaiting ZenoPay call | None |
| `processing` | ZenoPay notified, awaiting customer | Poll status |
| `completed` | Payment successful, order created | Show confirmation |
| `failed` | Payment rejected or timeout | Retry allowed |
| `expired` | Session older than 30 minutes | Create new session |

### 7.3 ZenoPay Result Codes

| Code | Meaning |
|------|---------|
| `000` | Success - Payment initiated |
| `001` | Invalid API key |
| `002` | Missing required parameters |
| `003` | Invalid phone number format |
| `004` | Insufficient funds |
| `005` | User canceled payment |
| `999` | Internal gateway error |

---

## 8. Webhooks

### 8.1 What is a Webhook?

A **webhook** is an HTTP POST request sent automatically by ZenoPay when a payment status changes.

**Analogy:** Instead of you calling a restaurant every 5 minutes to ask "Is my food ready?", the restaurant calls you when it's ready.

### 8.2 Webhook Registration

Webhook URL is sent during payment initiation:

```typescript
const webhookUrl = `${origin}/api/payments/mobile/webhook`

await zenoPayClient.initiatePayment({
  // ... other params
  webhook_url: webhookUrl
})
```

### 8.3 Webhook Processing Flow

```typescript
1. ZenoPay sends POST request
                ↓
2. Parse JSON body { order_id, payment_status, amount, ... }
                ↓
3. Validate webhook (check API key header)
                ↓
4. Find payment session by order_id (transaction_reference)
                ↓
5. Check if already processed (prevent duplicate processing)
                ↓
6. If status === "COMPLETED":
   a. Create order in database
   b. Create order_items records
   c. Update payment_session status
   d. Send confirmation email to customer
   e. Send notification email to admin
                ↓
7. Return 200 OK to ZenoPay
```

### 8.4 Webhook Payload Example

**What ZenoPay Sends:**
```json
{
  "order_id": "TISCO1A2B3C4D",
  "payment_status": "COMPLETED",
  "reference": "0936183435",
  "amount": "50000",
  "transid": "CEJ3I3SETSN",
  "channel": "MPESA-TZ",
  "msisdn": "255742123456"
}
```

**What TISCO Responds:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "order_id": "uuid"
}
```

### 8.5 Webhook Security

1. **Verify Source:**
   ```typescript
   const apiKey = req.headers.get('x-api-key')
   if (apiKey !== process.env.ZENOPAY_API_KEY) {
     return new Response('Unauthorized', { status: 401 })
   }
   ```

2. **Idempotency Check:**
   ```typescript
   if (session.status === 'completed') {
     return { message: 'Already processed' }
   }
   ```

3. **Status Validation:**
   ```typescript
   if (payment_status !== 'COMPLETED') {
     return { message: 'Payment not completed yet' }
   }
   ```

---

## 9. Error Handling

### 9.1 Error Types

```typescript
class ValidationError extends Error {
  // Bad input from user
  // Example: Invalid phone number
}

class ZenoPayError extends Error {
  retryable: boolean
  // ZenoPay API issues
  // Example: Timeout, invalid API key
}

class OrderCreationError extends Error {
  // Database issues creating order
  // Example: Constraint violation
}
```

### 9.2 Error Recovery Strategy

```typescript
try {
  // Attempt payment
  await initiateZenoPayment()
} catch (error) {
  if (error instanceof ValidationError) {
    // User fix required - show friendly message
    return "Invalid phone number format. Use 07XX XXX XXX"
  }
  
  if (error instanceof ZenoPayError && error.retryable) {
    // Gateway issue - allow retry
    return "Payment gateway timeout. Please try again."
  }
  
  // Unknown error - log for debugging
  await logPaymentEvent('payment_failed', { error })
  return "Payment failed. Contact support."
}
```

### 9.3 Webhook Failure Handling

If webhook fails:

1. **Payment Session:** Stays in "processing" state
2. **Customer:** Can poll status via frontend
3. **Admin:** Receives alert about stuck payment
4. **Resolution:** Manual verification + order creation

---

## 10. System Audit & Improvements

### 10.1 Current Architecture Strengths ✅

1. **Comprehensive Logging:**
   - Every payment action logged to `payment_logs` table
   - Easy debugging and audit trail

2. **Duplicate Prevention:**
   - 5-minute window duplicate detection
   - Prevents accidental double charges

3. **Security:**
   - Server-side amount validation
   - API key protection
   - Webhook verification

4. **Error Handling:**
   - Custom error types
   - User-friendly messages
   - Retry logic for transient failures

### 10.2 Identified Issues & Recommendations

#### Issue 1: Complex Webhook Dependencies ⚠️

**Current:** Webhook creates order AND sends emails synchronously

**Problem:** If email service fails, whole webhook fails

**Recommendation:**
```typescript
// ✅ IMPROVED: Separate concerns
async function handleWebhook(payload) {
  // 1. Create order (critical)
  const order = await createOrder(payload)
  
  // 2. Update session (critical)
  await updatePaymentSession(payload)
  
  // 3. Send emails (non-critical) - make asynchronous
  setImmediate(() => {
    sendCustomerEmail(order).catch(logError)
    sendAdminEmail(order).catch(logError)
  })
  
  return { success: true, order_id: order.id }
}
```

#### Issue 2: Redundant Code in Multiple Files 🔄

**Current:** Phone normalization logic duplicated in 3 files

**Recommendation:** Centralize in `@/lib/payments/utils.ts`

```typescript
// ❌ BEFORE: Duplicated in service.ts, initiate/route.ts, webhook/route.ts
function normalizeTzPhone(phone) { /* ... */ }

// ✅ AFTER: Single source of truth
// lib/payments/utils.ts
export function normalizeTzPhone(phone: string): string { /* ... */ }

// Import wherever needed
import { normalizeTzPhone } from '@/lib/payments/utils'
```

#### Issue 3: Missing Timeout Configuration ⏱️

**Current:** ZenoPay requests can hang indefinitely

**Recommendation:**
```typescript
// Add timeout to all ZenoPay API calls
const response = await axios.post(url, data, {
  headers: { 'x-api-key': apiKey },
  timeout: 30000, // 30 seconds max
  signal: AbortSignal.timeout(30000)
})
```

#### Issue 4: No Payment Expiry Mechanism 📅

**Current:** Old "pending" sessions stay forever

**Recommendation:** Add cleanup job

```typescript
// Run daily cron job
async function expireOldSessions() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  
  await supabase
    .from('payment_sessions')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('created_at', thirtyMinutesAgo)
}
```

#### Issue 5: Webhook Retry Logic Missing 🔁

**Current:** If webhook fails, payment stuck

**Recommendation:** Implement retry mechanism

```typescript
// Add to payment_sessions table
{
  webhook_attempts: 0,
  last_webhook_attempt: timestamp,
  webhook_error: string
}

// Retry webhook 3 times with exponential backoff
async function retryFailedWebhooks() {
  const failedSessions = await getFailedWebhookSessions()
  
  for (const session of failedSessions) {
    if (session.webhook_attempts < 3) {
      await processWebhook(session)
    } else {
      await alertAdmin(session) // Manual intervention needed
    }
  }
}
```

### 10.3 Optimization Recommendations

1. **Database Indexing:**
```sql
-- Speed up payment session lookups
CREATE INDEX idx_payment_sessions_reference 
ON payment_sessions(transaction_reference);

CREATE INDEX idx_payment_sessions_user_status 
ON payment_sessions(user_id, status);
```

2. **Caching:**
```typescript
// Cache provider mappings
const PROVIDER_CACHE = new Map([
  ['M-Pesa', 'vodacom'],
  ['Tigo Pesa', 'tigo'],
  // ...
])
```

3. **Monitoring:**
```typescript
// Add performance tracking
const startTime = Date.now()
await processPayment()
const duration = Date.now() - startTime

if (duration > 5000) {
  logSlowPayment({ duration, session_id })
}
```

### 10.4 Priority Action Items

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 🔴 High | Add webhook retry mechanism | Prevent stuck payments | Medium |
| 🔴 High | Implement session expiry | Clean up old data | Low |
| 🟡 Medium | Centralize utility functions | Code maintainability | Low |
| 🟡 Medium | Add timeout configurations | Prevent hanging requests | Low |
| 🟢 Low | Add database indexes | Performance improvement | Low |

---

## Conclusion

The TISCO payment system is **well-architected** with:
- ✅ Proper security measures
- ✅ Comprehensive error handling
- ✅ Good logging and audit trails
- ✅ Duplicate prevention

**Areas for improvement:**
- Separate critical and non-critical operations
- Add retry mechanisms for webhooks
- Centralize utility functions
- Implement session expiry
- Add performance monitoring

**Overall Assessment:** 🟢 Production-ready with minor optimizations recommended

---

## Additional Resources

- **ZenoPay Documentation:** https://zenoapi.com/docs
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Mobile Money in Tanzania:** https://www.gsma.com/mobilefordevelopment/country/tanzania

---

**Questions? Contact the development team.**
