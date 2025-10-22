# 🚨 No USSD Push - Debugging Guide

**Date:** 2025-10-22  
**Issue:** Payment initiated but no USSD prompt arriving on phone  
**Status:** Investigating

---

## 🔍 Problem Identified

**Symptoms:**
- Frontend shows "Payment Processing..."
- Initiate endpoint responds successfully (200)
- Order created in database
- **BUT: No USSD push received on phone** ❌

**Evidence from Logs:**
```sql
-- Latest payment session
Transaction: TISCOMH253NV34LMZU0TF
Status: pending
Events: payment_initiated ✅
Events: payment_processing ❌ MISSING!

-- Previous payment
Transaction: TISCOMH25235VMVAB9M1B
Error: "ZenoPay request timed out after 30 seconds"
```

**Root Cause:**
ZenoPay API is **timing out** (30 seconds) before completing the USSD push request. Without a successful ZenoPay response, the mobile network never receives the STK push command.

---

## 📊 Event Flow Comparison

### **Successful Payment (from 14:58):**
```
✅ payment_initiated
✅ payment_processing (with channel, result_code: 000)
✅ webhook_received
✅ order_created
```

### **Failed Payments (recent):**
```
✅ payment_initiated
❌ NOTHING (ZenoPay timeout)
Session stuck in 'pending'
No USSD sent to phone
```

---

## ⚡ Fix Applied: Hybrid Error Detection

### **Problem with Fire-and-Forget:**
```typescript
// Fire ZenoPay call
initiateZenoPayment({...})

// Return immediately (don't wait)
return NextResponse.json({ success: true })

// If ZenoPay times out, user never knows! ❌
```

### **Solution: Wait 5 Seconds for Quick Check:**
```typescript
// Fire ZenoPay
const zenoPayPromise = initiateZenoPayment({...})

// Wait max 5 seconds
const quickCheck = Promise.race([
  zenoPayPromise,
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('QUICK_TIMEOUT')), 5000)
  )
])

try {
  await quickCheck
  // Success! Return to user
} catch (error) {
  if (error.message === 'QUICK_TIMEOUT') {
    // Still processing, continue in background
    zenoPayPromise.catch(bgError => {
      console.error('❌ ZenoPay failed:', bgError)
      updateSessionStatus(session.id, 'failed', ...)
    })
  } else {
    // Immediate error - tell user now!
    throw error
  }
}
```

**Benefits:**
- ✅ Catches immediate errors (API key, invalid params)
- ✅ Returns success if ZenoPay starts within 5s
- ✅ Continues monitoring in background for slow responses
- ✅ Still avoids 30-70s full wait

---

## 🔍 Diagnostic Logging Added

### **New Logs to Check:**

```typescript
// In /lib/payments/service.ts
console.log(`🔍 ZenoPay Request Details:`, {
  buyer_phone: normalizedPhone,  // Check format!
  amount: amountInt,
  channel: channel || 'auto',
  order_id: zenoOrderId
})
```

**What to Verify:**
1. **Phone Format:** Should be `0XXXXXXXXX` (10 digits, starts with 0)
2. **Amount:** Should be integer (e.g., 200)
3. **Channel:** Should be `vodacom`, `tigo`, `airtel`, or `auto`
4. **Order ID:** Should be unique transaction reference

---

## 🧪 Testing Steps

### **1. Check Server Logs After Payment Attempt:**

Look for these logs:
```
✅ 🚀 Initiating payment for order: [order_id]
✅ 📞 Webhook URL: [url]
✅ 🔍 ZenoPay Request Details: {...}
```

**Then check for:**
```
✅ ✅ ZenoPay call completed quickly
   OR
⏳ 🕒 ZenoPay call still processing, continuing in background...
   OR
❌ ❌ ZenoPay failed immediately: [error]
```

### **2. Check Payment Logs Table:**

```sql
SELECT event_type, data, created_at 
FROM payment_logs 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Expected for successful USSD push:**
```
payment_initiated
payment_processing ← THIS IS CRITICAL!
```

**If `payment_processing` is missing:**
- ZenoPay API call failed
- No USSD was sent to mobile network
- Check error in logs

### **3. Verify Phone Number Format:**

From logs, check `buyer_phone` value:
```javascript
// CORRECT formats:
"0748624684"  // 10 digits, starts with 0 ✅
"0693749306"  // 10 digits, starts with 0 ✅

// WRONG formats:
"255748624684"  // Should be converted to 0748624684 ❌
"748624684"     // Missing leading 0 ❌
"+255748624684" // Should be converted ❌
```

**Normalization function** (`/lib/payments/service.ts:34`):
```typescript
export function normalizeTzPhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '')
  
  if (digits.length === 10 && digits.startsWith('0')) return digits
  if (digits.length === 12 && digits.startsWith('255')) 
    return '0' + digits.substring(3)
  if (digits.length === 9) return '0' + digits
  
  return digits // Fallback
}
```

---

## 🚨 Possible Root Causes

### **1. ZenoPay API Issues:**
- ❌ API timeout (30 seconds)
- ❌ Invalid API key
- ❌ Rate limiting
- ❌ Service downtime

**How to verify:**
```bash
# Check ZenoPay status
curl -X POST https://zenoapi.com/api/payments/mobile_money_tanzania \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "buyer_phone": "0748624684",
    "buyer_name": "Test",
    "buyer_email": "test@example.com",
    "order_id": "TEST123"
  }'
```

### **2. Phone Number Format:**
- ❌ Wrong format sent to ZenoPay
- ❌ Mobile network doesn't recognize number
- ❌ Number not registered for mobile money

**How to verify:**
Check diagnostic logs for `buyer_phone` value

### **3. Channel Mapping:**
- ❌ Wrong channel selected (e.g., M-Pesa → tigo channel)
- ❌ Auto-detection failing

**Provider to Channel Mapping:**
```typescript
// In /lib/payments/service.ts
function mapProviderToChannel(provider: string): string | null {
  const mapping: Record<string, string> = {
    'M-Pesa': 'vodacom',
    'Tigo Pesa': 'tigo',
    'Airtel Money': 'airtel'
  }
  return mapping[provider] || null
}
```

### **4. Mobile Money Account Issues:**
- ❌ Phone number not registered for M-Pesa/Tigo/Airtel
- ❌ Account suspended
- ❌ SIM card issue

---

## ✅ Next Steps

### **Immediate Actions:**

1. **Check Server Logs:**
   - Look for diagnostic output
   - Verify phone format
   - Check for ZenoPay errors

2. **Verify ZenoPay API:**
   - Test with curl/Postman
   - Confirm API key is valid
   - Check if service is operational

3. **Test Different Phone:**
   - Try different M-Pesa number
   - Verify mobile money account is active
   - Test with known working number

4. **Monitor Payment Logs:**
   ```sql
   -- Watch for events in real-time
   SELECT * FROM payment_logs 
   WHERE created_at > NOW() - INTERVAL '5 minutes'
   ORDER BY created_at DESC;
   ```

### **If ZenoPay Keeps Timing Out:**

**Option A: Increase ZenoPay Client Timeout**
```typescript
// In /lib/zenopay.ts
const timeoutId = setTimeout(() => controller.abort(), 60000) // 30s → 60s
```

**Option B: Contact ZenoPay Support**
- Report timeout issues
- Verify API key permissions
- Check for service degradation

**Option C: Retry Logic**
```typescript
// Add automatic retry for timeouts
let retries = 3
while (retries > 0) {
  try {
    const response = await client.createOrder({...})
    break // Success
  } catch (error) {
    if (error.message.includes('timeout') && retries > 1) {
      retries--
      await new Promise(r => setTimeout(r, 2000)) // Wait 2s
      continue
    }
    throw error
  }
}
```

---

## 📝 Expected Diagnostic Output

### **Successful Payment:**
```
🚀 Initiating payment for order: abc-123
📞 Webhook URL: https://tiscomarket.store/api/payments/mobile/webhook
🔍 ZenoPay Request Details: {
  buyer_phone: '0748624684',
  amount: 200,
  channel: 'vodacom',
  order_id: 'TISCOMH253NV34LMZU0TF'
}
✅ ZenoPay call completed quickly
📋 Transaction reference: TISCOMH253NV34LMZU0TF
💡 USSD prompt should arrive shortly on customer's phone
```

### **Timeout (Background Processing):**
```
🚀 Initiating payment for order: abc-123
📞 Webhook URL: https://tiscomarket.store/api/payments/mobile/webhook
🔍 ZenoPay Request Details: {...}
🕒 ZenoPay call still processing, continuing in background...
📋 Transaction reference: TISCOMH253NV34LMZU0TF
💡 USSD prompt should arrive shortly on customer's phone
[Later in background...]
❌ ZenoPay failed in background: ZenoPay request timed out after 30 seconds
```

### **Immediate Failure:**
```
🚀 Initiating payment for order: abc-123
📞 Webhook URL: https://tiscomarket.store/api/payments/mobile/webhook
🔍 ZenoPay Request Details: {...}
❌ ZenoPay failed immediately: Invalid API key
Payment initiation error: Invalid API key
[Returns error to frontend]
```

---

## 🎯 Summary

**Problem:** No USSD push arriving on phone  
**Cause:** ZenoPay API timing out before completing request  
**Fix Applied:** Hybrid detection (5s grace period)  
**Next Steps:** Check diagnostic logs, verify ZenoPay API, test with different phone

**Key Logs to Monitor:**
1. `🔍 ZenoPay Request Details` - Verify phone format
2. `payment_processing` event - Confirms USSD sent
3. Background error logs - Catch timeout failures

**Expected Behavior After Fix:**
- Immediate errors: User notified within 5 seconds
- Successful calls: USSD arrives within 10-30 seconds
- Timeouts: Logged in background, session marked failed

**Status:** Ready for testing with enhanced diagnostics
