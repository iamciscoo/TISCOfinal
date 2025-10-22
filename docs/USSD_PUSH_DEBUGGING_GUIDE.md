# 🚨 No USSD Push - Complete Debugging Guide

**Date:** October 22, 2025  
**Issue:** Orders created but no USSD push arriving on phone  
**Status:** Diagnostic logging added

---

## 🔍 Problem Description

**Symptoms:**
- ✅ Order appears in admin panel as "Pending"
- ❌ No USSD push received on customer's phone
- ⏱️ Frontend shows "Payment Timeout" after ~50 seconds

**What This Means:**
Your payment flow creates the order in the database BEFORE calling ZenoPay. If ZenoPay fails or times out, the order remains in the database even though no payment was initiated.

---

## 🏗️ Current Payment Flow

```
1. User clicks "Pay Now"
   ↓
2. ✅ ORDER CREATED in database (status: pending)
   ↓
3. ✅ Payment session created
   ↓
4. ❓ ZenoPay API called
   ↓
   IF SUCCESS → USSD push sent to phone
   IF FAILURE → Order remains in DB, no USSD push
   ↓
5. Frontend polls for status (50 seconds)
   ↓
6. Timeout if no webhook received
```

**The Problem:** Step 4 is failing silently, leaving orphaned orders in step 2.

---

## 🆕 Fixes Applied

### 1. **Enhanced Diagnostic Logging**

Added comprehensive logging to track exactly what ZenoPay returns:

```typescript
// BEFORE calling ZenoPay
🔍 ZenoPay Request Details: {
  buyer_phone: '0748624684',
  amount: 200,
  channel: 'vodacom',
  order_id: 'TISCOMH25...',
  buyer_email: '...',
  buyer_name: '...',
  webhook_url: '...'
}

// AFTER ZenoPay responds
📥 ZenoPay Raw Response: { ... } // Full API response

// IF SUCCESS
✅ ZenoPay call successful! USSD push should arrive shortly.
💡 Customer phone: 0748624684
💡 Result code: 000
💡 Gateway transaction ID: xxx

// IF FAILURE
❌ ZenoPay API Error: {
  name: 'Error',
  message: 'ZenoPay request timed out after 30 seconds',
  stack: '...'
}
```

### 2. **Order Cleanup for Failed Payments**

When ZenoPay fails, the order is now automatically marked as cancelled:

```typescript
// Old behavior:
Order created → ZenoPay fails → Order stays "pending" forever ❌

// New behavior:
Order created → ZenoPay fails → Order marked "cancelled" ✅
```

This prevents orphaned "pending" orders that confuse customers and admins.

---

## 🔍 How to Debug Your Payment Issue

### **Step 1: Check Vercel Function Logs**

Go to: **Vercel Dashboard → Functions → `/api/payments/mobile/initiate`**

Look for these diagnostic logs after your payment attempt:

#### **✅ What You WANT to see (successful):**
```
🚀 Initiating payment for order: cee874d3...
📞 Webhook URL: https://tiscomarket.store/api/payments/mobile/webhook
📋 ZenoPay order_id: TISCOMH25... (session ref)
📦 Linked to database order: cee874d3...

🔍 ZenoPay Request Details: {
  "buyer_phone": "0748624684",
  "amount": 200,
  "channel": "vodacom",
  "order_id": "TISCOMH25...",
  "buyer_email": "francisjac21@gmail.com",
  "buyer_name": "Francis Mwambene",
  "webhook_url": "https://tiscomarket.store/api/payments/mobile/webhook"
}

📥 ZenoPay Raw Response: {
  "status": "success",
  "message": "Payment initiated",
  "resultcode": "000",
  ...
}

📊 ZenoPay result code: 000
✅ ZenoPay call successful! USSD push should arrive shortly.
💡 Customer phone: 0748624684
💡 Result code: 000
💡 Gateway transaction ID: xxx
✅ Payment initiated for order: cee874d3...
```

#### **❌ What You're PROBABLY seeing (failure):**
```
🚀 Initiating payment for order: cee874d3...
📞 Webhook URL: https://tiscomarket.store/api/payments/mobile/webhook
🔍 ZenoPay Request Details: { ... }

❌ ZenoPay API Error: {
  "name": "Error",
  "message": "ZenoPay request timed out after 30 seconds"
}

❌ Payment initiation failed: Error: ZenoPay request timed out...
❌ Error details: {
  "name": "Error",
  "message": "ZenoPay request timed out after 30 seconds",
  "details": { ... }
}

🗑️ Marking order cee874d3... as cancelled due to payment failure
```

---

### **Step 2: Check the ZenoPay Request Details**

From the `🔍 ZenoPay Request Details` log, verify:

| Field | Expected | Common Mistakes |
|-------|----------|-----------------|
| **buyer_phone** | `0748624684` (10 digits, starts with 0) | `255748624684`, `748624684` |
| **amount** | `200` (integer, no decimals) | `200.00`, `"200"` |
| **channel** | `vodacom`, `tigo`, `airtel`, or `halotel` | `null`, `undefined`, `M-Pesa` |
| **webhook_url** | `https://tiscomarket.store/api/...` | `http://` (not HTTPS) |

---

### **Step 3: Check ZenoPay Raw Response**

The `📥 ZenoPay Raw Response` log shows exactly what ZenoPay returned.

#### **Successful Response:**
```json
{
  "status": "success",
  "resultcode": "000",
  "message": "Payment initiated successfully",
  "transid": "ABC123",
  "reference": "0123456789"
}
```

#### **Error Response Examples:**
```json
{
  "resultcode": "001",
  "message": "Invalid API key"
}
```

```json
{
  "resultcode": "003",
  "message": "Invalid phone number format"
}
```

```json
{
  "resultcode": "999",
  "message": "Gateway error - please try again"
}
```

---

### **Step 4: Check Payment Logs Table**

Query your Supabase database:

```sql
SELECT 
  event_type,
  data->'details'->>'phone' as phone,
  data->'details'->>'result_code' as result_code,
  data->'details'->>'channel' as channel,
  data->>'error' as error,
  created_at
FROM payment_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

**What to look for:**
- ✅ `payment_initiated` event exists
- ❌ `payment_processing` event missing = ZenoPay failed
- ❌ `payment_failed` event exists = Check error message

---

## 🚨 Common Root Causes & Solutions

### **1. ZenoPay API Timeout (30s)**

**Symptoms:**
- Logs show: `ZenoPay request timed out after 30 seconds`
- Order created but marked as cancelled
- No USSD push

**Possible Causes:**
- ZenoPay service is slow/down
- Network connectivity issues
- API endpoint unreachable

**Solutions:**
1. **Test ZenoPay API directly:**
   ```bash
   curl -X POST https://zenoapi.com/api/payments/mobile_money_tanzania \
     -H "x-api-key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 1000,
       "buyer_phone": "0748624684",
       "buyer_name": "Test User",
       "buyer_email": "test@example.com",
       "order_id": "TEST'$(date +%s)'"
     }'
   ```

2. **Check Zen oPay status page** (if they have one)

3. **Contact ZenoPay support:**
   - Report timeout issues
   - Verify API key is active
   - Check for rate limiting

---

### **2. Invalid API Key**

**Symptoms:**
- Logs show: `resultcode: 001` or `Invalid API key`
- Immediate failure (no timeout)

**Solution:**
1. Verify `ZENOPAY_API_KEY` in Vercel environment variables
2. Check if API key has expired or been revoked
3. Ensure key has proper permissions

---

### **3. Invalid Phone Number Format**

**Symptoms:**
- Logs show: `resultcode: 003` or `Invalid phone number format`
- Request details show wrong phone format

**Expected Format:**
```
✅ 0748624684  (10 digits, starts with 0)
✅ 0693749306  (10 digits, starts with 0)

❌ 255748624684  (should be 0748624684)
❌ 748624684     (missing leading 0)
❌ +255748624684 (should be 0748624684)
```

**Solution:**
Our `normalizeTzPhone()` function should handle this, but if you see wrong format in logs:
1. Check the phone input in the checkout form
2. Verify normalization is working: Look for the `🔍 ZenoPay Request Details` log

---

### **4. Wrong Provider/Channel Mapping**

**Symptoms:**
- Customer selects "M-Pesa" but has Tigo SIM
- USSD arrives but fails on phone
- Channel mismatch in logs

**Provider Mappings:**
```typescript
'M-Pesa'       → channel: 'vodacom'
'Tigo Pesa'    → channel: 'tigo'
'Airtel Money' → channel: 'airtel'
'Halopesa'     → channel: 'halotel'
```

**Solution:**
- Customer must select correct provider for their SIM
- Phone number prefix doesn't guarantee provider (people port numbers)

---

### **5. Mobile Money Account Not Active**

**Symptoms:**
- ZenoPay succeeds (logs show success)
- USSD push sent
- BUT: Customer doesn't receive push or receives error

**Possible Causes:**
- Phone number not registered for mobile money
- Account suspended/blocked
- SIM card issue
- Phone off or no signal

**Solution:**
1. Test with known working M-Pesa number
2. Customer should dial USSD code manually to verify account:
   - M-Pesa: `*150*00#`
   - Tigo Pesa: `*150*01#`
   - Airtel Money: `*150*60#`

---

### **6. Webhook URL Not Reachable**

**Symptoms:**
- USSD push arrives on phone
- Customer approves payment
- Order never updates to "paid"
- No webhook received

**Check:**
```
📞 Webhook URL: https://tiscomarket.store/api/payments/mobile/webhook
```

**Solution:**
1. Ensure URL is **HTTPS** (not HTTP)
2. Ensure webhook route is deployed
3. Test webhook manually:
   ```bash
   curl -X POST https://tiscomarket.store/api/payments/mobile/webhook \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_ZENOPAY_KEY" \
     -d '{
       "order_id": "TEST123",
       "payment_status": "COMPLETED",
       "reference": "0123456789"
     }'
   ```

---

## 🧪 Testing Checklist

### **Before Testing:**
- [ ] Verify `ZENOPAY_API_KEY` is set in Vercel
- [ ] Ensure you have TZS 200+ in mobile money account
- [ ] Phone has signal and is on
- [ ] Using correct provider for your SIM

### **During Test:**
1. Start payment from checkout
2. **Immediately check Vercel logs** (real-time)
3. Look for `🔍 ZenoPay Request Details`
4. Look for `📥 ZenoPay Raw Response`
5. Look for `✅ ZenoPay call successful` OR `❌ ZenoPay API Error`

### **If USSD Push Arrives:**
1. Check your phone within 60 seconds
2. Approve payment with PIN
3. Wait 5-10 seconds for webhook
4. Check if order updates to "paid" in admin

### **If No USSD Push:**
1. Check logs for error message
2. Verify phone number format in logs
3. Check `resultcode` in response
4. Follow troubleshooting for specific error code

---

## 📊 Diagnostic Logs Reference

### **Log Emoji Key:**
| Emoji | Meaning |
|-------|---------|
| 🚀 | Payment initiation started |
| 📞 | Webhook URL being used |
| 📋 | Transaction reference assigned |
| 📦 | Linked to database order |
| 🔍 | Diagnostic info (request details) |
| 📥 | Raw response from ZenoPay |
| 📊 | Result code extracted |
| ✅ | Success |
| ❌ | Error/Failure |
| 💡 | Important info |
| 🗑️ | Order cleanup |
| ⏳ | Processing/waiting |

---

## 🎯 Quick Diagnostic Decision Tree

```
Did logs show "🔍 ZenoPay Request Details"?
├─ NO → Check if payment initiation endpoint was called
└─ YES → Continue

Did logs show "📥 ZenoPay Raw Response"?
├─ NO → ZenoPay API failed (timeout or error before response)
│        Check for "❌ ZenoPay API Error"
│        └─ Message: "timeout" → ZenoPay service issue
│        └─ Message: "API key" → Invalid credentials
│        └─ Other → Check error message
│
└─ YES → ZenoPay responded
         Check result code in response
         └─ "000" → Success! USSD should arrive
         └─ "001" → Invalid API key
         └─ "003" → Invalid phone format
         └─ "999" → Gateway error
         └─ Other → Check ZenoPay docs for code meaning
```

---

## 🔧 Emergency Fixes

### **If ZenoPay Keeps Timing Out:**

**Option 1: Increase Timeout**
```typescript
// In /client/lib/zenopay.ts
const timeoutId = setTimeout(() => controller.abort(), 60000) // 30s → 60s
```

**Option 2: Disable Channel Parameter**
```bash
# In Vercel environment variables
ENABLE_ZENOPAY_CHANNEL=false
```

**Option 3: Use Different ZenoPay Endpoint**
Contact ZenoPay support to ask if there's a faster endpoint or if regional routing is available.

---

### **If Phone Format Is Wrong:**

Check the normalization function is working:
```typescript
// Test in browser console or Node
const normalizeTzPhone = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) return digits
  if (digits.length === 12 && digits.startsWith('255')) 
    return '0' + digits.substring(3)
  if (digits.length === 9) return '0' + digits
  return digits
}

// Test
console.log(normalizeTzPhone('255748624684'))  // Should: 0748624684
console.log(normalizeTzPhone('748624684'))     // Should: 0748624684
console.log(normalizeTzPhone('0748624684'))    // Should: 0748624684
```

---

## 📞 Support Contacts

### **ZenoPay Support:**
- Email: support@zenoapi.com
- Website: https://zenoapi.com
- **What to include:**
  - Your API key (first/last 4 chars only)
  - Timestamp of failed request
  - `order_id` used
  - Phone number (redacted: 0748XXXXXX)
  - Error message from logs

### **Mobile Network Support:**
- **Vodacom (M-Pesa):** *150#
- **Tigo (Tigo Pesa):** *150*01#
- **Airtel (Airtel Money):** *150*60#

---

## ✅ Success Indicators

You'll know the fix worked when logs show:

```
🔍 ZenoPay Request Details: { ... }
📥 ZenoPay Raw Response: { "resultcode": "000", ... }
📊 ZenoPay result code: 000
✅ ZenoPay call successful! USSD push should arrive shortly.
💡 Customer phone: 0748624684
💡 Result code: 000
✅ Payment initiated for order: xxx
```

**And then:**
- USSD push arrives on phone within 10-30 seconds
- Customer approves payment
- Webhook updates order to "paid" within 5-10 seconds
- Admin dashboard shows order as "Paid"
- Customer receives order confirmation email

---

## 📝 Next Steps After Deploying This Fix

1. **Deploy to Vercel** (changes include diagnostic logging + order cleanup)
2. **Test payment** with small amount (TZS 200)
3. **Check Vercel logs** immediately after attempting payment
4. **Screenshot/copy the logs** and analyze using this guide
5. **Report findings** - Share what you see in the `🔍 ZenoPay Request Details` and `📥 ZenoPay Raw Response` logs

---

**Status:** 🟢 Diagnostic tools deployed and ready for testing
**Last Updated:** October 22, 2025
