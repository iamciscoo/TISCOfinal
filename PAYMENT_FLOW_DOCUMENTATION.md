# TISCO Platform Payment Flow Documentation

## Overview

The TISCO platform implements a comprehensive payment handling system that supports multiple payment methods with a focus on mobile money payments popular in Tanzania. The system uses two main flows: a modern session-based approach for new orders and a legacy order-first approach.

## Payment Architecture

### Core Components

1. **Frontend Checkout Page** (`/client/app/checkout/page.tsx`)
2. **Payment API Endpoints** (`/client/app/api/payments/`)
3. **Order Creation API** (`/client/app/api/orders/route.ts`)
4. **Database Tables** (payment_sessions, payment_transactions, orders, etc.)
5. **External Payment Gateway** (ZenoPay integration)

### Database Schema

#### Payment Sessions Table
```sql
CREATE TABLE payment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TZS',
    provider VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    gateway_transaction_id VARCHAR(255),
    order_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);
```

#### Payment Transactions Table
```sql
-- Referenced in code but schema not found in migrations
-- Used for tracking payment attempts linked to existing orders
```

#### Orders Table
```sql
ALTER TABLE orders 
ADD COLUMN currency VARCHAR(3) DEFAULT 'TZS',
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));
```

## Payment Flow Detailed Breakdown

### Flow 1: New Session-Based Payment (Primary)

This is the modern approach where payment is processed first, and orders are created only after successful payment.

#### Step 1: Checkout Initiation
**File**: `/client/app/checkout/page.tsx` (Lines 210-448)

```typescript
const handlePlaceOrder = async () => {
    // Validation checks
    if (!user) {
        toast({ title: "Authentication Required", ... })
        return
    }
    
    // Validate shipping and payment data
    if (!shippingData.firstName || !paymentData.provider) {
        toast({ title: "Missing Information", ... })
        return
    }
```

**What happens**: 
- User fills checkout form with shipping details and payment method
- Form validates required fields (name, email, phone, payment provider)
- System prepares order data structure for later order creation

#### Step 2: Payment Method Routing
**File**: `/client/app/checkout/page.tsx` (Lines 299-434)

```typescript
if (paymentData.method === 'office') {
    // Office payment - create order first (legacy flow)
    const orderResponse = await fetch('/api/orders', { ... })
} else {
    // Mobile money - initiate payment first (new flow)
    const procRes = await fetch('/api/payments/initiate', { ... })
}
```

**What happens**:
- System routes to different flows based on payment method
- Office payments use legacy order-first approach
- Mobile money uses new session-based approach

#### Step 3: Payment Session Creation
**File**: `/client/app/api/payments/initiate/route.ts` (Lines 79-94)

```typescript
const { data: session, error: sessionError } = await supabase
    .from('payment_sessions')
    .insert({
        user_id: user.id,
        amount,
        currency,
        provider,
        phone_number,
        transaction_reference: cleanRef,
        order_data: JSON.stringify(order_data),
        status: 'pending',
        created_at: new Date().toISOString()
    })
```

**What happens**:
- Creates temporary payment session record
- Stores order data as JSON for later order creation
- Generates unique transaction reference for gateway

#### Step 4: ZenoPay Gateway Integration
**File**: `/client/app/api/payments/initiate/route.ts` (Lines 162-237)

```typescript
const tryCreate = async (buyer_phone: string, withChannel: boolean) => {
    const res = await client.createOrder({
        buyer_name: meta.buyerName,
        buyer_phone,
        buyer_email: meta.buyerEmail,
        amount: amountInt,
        order_id: session.transaction_reference,
        webhook_url: meta.webhookUrl,
        ...(withChannel && channel ? { channel } : {}),
    })
}
```

**What happens**:
- Initiates payment request with ZenoPay gateway
- Tries multiple phone number formats (local, E.164, +E.164)
- Attempts with and without channel specification
- Updates session status to 'processing'

#### Step 5: Payment Status Polling
**File**: `/client/app/checkout/page.tsx` (Lines 450-483)

```typescript
const pollPaymentStatus = async (reference: string): Promise<boolean> => {
    const start = Date.now()
    const timeoutMs = 15_000 // 15 seconds
    
    while (Date.now() - start < timeoutMs) {
        const sres = await fetch('/api/payments/status', { ... })
        const sjson = await sres.json()
        const st = String(sjson?.status || '').toUpperCase()
        
        if (successSet.has(st)) return true
        if (failureSet.has(st)) return false
        
        await delay(2000) // Check every 2 seconds
    }
    return false // Timeout
}
```

**What happens**:
- Frontend polls payment status every 2 seconds for 15 seconds
- Checks for success/failure status from gateway
- Returns boolean indicating payment success/failure

#### Step 6: Payment Status Checking
**File**: `/client/app/api/payments/status/route.ts` (Lines 72-101)

```typescript
// Check both payment_transactions and payment_sessions
const { data: sessionResult } = await supabase
    .from('payment_sessions')
    .select('id, user_id, transaction_reference, gateway_transaction_id, status, created_at')
    .or(`transaction_reference.eq.${reference},gateway_transaction_id.eq.${reference}`)
    .eq('user_id', user.id)
```

**What happens**:
- API checks session status in database
- Maps internal status to external status codes
- Auto-completes stuck payments after 5 minutes
- Optionally queries ZenoPay for latest status

#### Step 7: Webhook Processing
**File**: `/client/app/api/payments/webhooks/route.ts` (Lines 508-655)

```typescript
async function handleSessionPaymentSuccess(session: PaymentSession, webhookData: WebhookData) {
    // Parse order data from session
    const orderData = JSON.parse(session.order_data)
    
    // Create the order now that payment is successful
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: session.user_id,
            total_amount: session.amount,
            currency: session.currency,
            payment_method: orderData.payment_method,
            status: 'processing',
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
        })
}
```

**What happens**:
- ZenoPay sends webhook notification of payment status
- System verifies webhook signature for security
- Creates actual order record after successful payment
- Creates order items and payment transaction records
- Updates session status to 'completed'

#### Step 8: Order Completion
**File**: `/client/app/checkout/page.tsx` (Lines 378-421)

```typescript
// Payment successful - now create the order
const orderResponse = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
})

// Complete the flow
toast({ title: 'Payment Confirmed', description: 'Your payment was successful and order created.' })
clearCart()
router.push('/account/orders?justPaid=1')
```

**What happens**:
- Frontend creates order after successful payment confirmation
- Clears shopping cart from local storage and server
- Redirects user to orders page with success indicator
- Triggers cache invalidation for order data

### Flow 2: Legacy Order-First Payment

Used for office payments and some legacy integrations.

#### Step 1: Order Creation First
**File**: `/client/app/api/orders/route.ts` (Lines 208-226)

```typescript
const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
        user_id: user.id,
        total_amount,
        currency,
        payment_method,
        shipping_address: shippingAddressStr,
        notes,
        status: 'pending',
        payment_status: 'pending'
    })
```

#### Step 2: Payment Processing
**File**: `/client/app/api/payments/process/route.ts` (Lines 133-147)

```typescript
const { data: transaction, error: transactionError } = await supabase
    .from('payment_transactions')
    .insert({
        order_id,
        user_id: user.id,
        payment_method_id: payment_method_id || null,
        amount,
        currency,
        status: 'pending',
        payment_type: paymentMethod!.type,
        provider: paymentMethod!.provider,
        transaction_reference: cleanRef
    })
```

## Payment Methods Supported

### 1. Mobile Money
- **Providers**: M-Pesa, Airtel Money, Tigo Pesa/MixxByYas
- **Process**: Real-time payment via ZenoPay gateway
- **Phone Format**: Supports multiple formats, normalizes to TZ standard
- **Timeout**: 15-second user approval window

### 2. Pay at Office
- **Process**: Order created immediately, payment collected later
- **Status**: Order marked as 'processing' with 'pending' payment
- **Use Case**: Customer pickup or cash payments

### 3. Bank Transfer (Legacy)
- **Process**: Manual verification required
- **Status**: 'awaiting_verification'
- **Implementation**: Basic placeholder in code

### 4. Cash on Delivery (Legacy)
- **Process**: Payment collected on delivery
- **Status**: Order confirmed, payment pending
- **Implementation**: Basic placeholder in code

## Security Features

### Webhook Verification
**File**: `/client/app/api/payments/webhooks/route.ts` (Lines 411-470)

```typescript
function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.WEBHOOK_SECRET
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(rawBody, 'utf8')
    const expectedHex = hmac.digest('hex')
    
    return timingSafeEqualLenient(providedBuf, expectedBuf)
}
```

### Rate Limiting
**File**: `/client/app/api/payments/status/route.ts` (Lines 11-33)

```typescript
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 60 // 60 requests per minute per user+IP

function checkRateLimit(key: string) {
    // In-memory rate limiting implementation
}
```

### Authentication
- All payment endpoints require Clerk authentication
- User ID validation on all operations
- Row-level security policies on database tables

## Error Handling

### Payment Failures
- Automatic retry mechanism for mobile money payments
- Graceful degradation when payment gateway is unavailable
- User-friendly error messages with retry options

### Timeout Handling
- 30-second timeout for mobile money approvals
- Automatic payment completion for stuck transactions after 5 minutes
- Retry functionality for failed payments

### Data Consistency
- Atomic operations for order and payment creation
- Rollback mechanisms for failed order creation
- Webhook idempotency handling

## Cart to Order Conversion

### Cart Storage
**File**: `/client/lib/store.ts` (Lines 63-201)

```typescript
export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product, quantity = 1) => { /* Add to cart */ },
            removeItem: (productId) => { /* Remove from cart */ },
            clearCart: () => { set({ items: [] }) },
            getTotalPrice: () => { /* Calculate total */ }
        }),
        { name: 'tisco-cart-storage' }
    )
)
```

### Order Data Mapping
**File**: `/client/app/checkout/page.tsx` (Lines 275-297)

```typescript
const orderData = {
    items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price
    })),
    shipping_address,
    payment_method,
    currency: 'TZS',
    notes: `Delivery: ${deliveryDetails}; Payment: ${paymentSummary}`,
    // Structured fields for admin visibility
    contact_phone: shippingData.phone,
    address_line_1: shippingData.address,
    city: selectedCity,
    email: shippingData.email,
}
```

## Integration Points

### ZenoPay Gateway Integration

#### Overview
ZenoPay is the primary payment gateway used for mobile money transactions in Tanzania. It provides a unified API for multiple mobile money providers including M-Pesa (Vodacom), Airtel Money, and Tigo Pesa.

#### Integration Architecture
**Library**: `/client/lib/zenopay.ts`
**API Base**: `https://api.zenopay.co.tz/`
**Authentication**: API Key-based authentication
**Supported Methods**: Mobile Money, Bank Transfers

#### Core ZenoPay Methods

##### 1. createOrder() - Payment Initiation
```typescript
const res = await client.createOrder({
    buyer_name: 'John Doe',
    buyer_phone: '0754123456',
    buyer_email: 'john@example.com',
    amount: 50000, // Amount in TZS (integer)
    order_id: 'TX1234567890ABC', // Unique reference
    webhook_url: 'https://yoursite.com/api/payments/webhooks',
    channel: 'vodacom' // Optional: specific provider
})
```

**Parameters**:
- `buyer_name`: Customer's full name
- `buyer_phone`: Mobile number (multiple formats supported)
- `buyer_email`: Customer email address
- `amount`: Payment amount in Tanzanian Shillings (integer)
- `order_id`: Unique transaction reference (alphanumeric)
- `webhook_url`: URL for payment status notifications
- `channel`: Optional provider specification (vodacom, tigo, airtel)

**Response Structure**:
```typescript
{
    status: 'success' | 'processing' | 'pending',
    message: 'Payment initiated successfully',
    data: {
        order_id: 'TX1234567890ABC',
        payment_status: 'pending',
        transaction_id: 'zeno_abc123def456'
    },
    transaction_id: 'zeno_abc123def456'
}
```

##### 2. getOrderStatus() - Status Checking
```typescript
const status = await client.getOrderStatus('TX1234567890ABC')
```

**Response Structure**:
```typescript
{
    data: [{
        payment_status: 'SUCCESS' | 'FAILED' | 'PENDING',
        status: 'COMPLETED' | 'PROCESSING' | 'CANCELLED',
        result: 'SUCCESSFUL' | 'DECLINED' | 'TIMEOUT'
    }],
    payment_status: 'SUCCESS',
    status: 'COMPLETED'
}
```

#### Phone Number Normalization
ZenoPay accepts multiple phone number formats, and the system normalizes them:

```typescript
function normalizeTzMsisdn(raw: string): string {
    const digits = String(raw || '').replace(/\D/g, '')
    if (digits.length === 10 && digits.startsWith('0')) return digits // 0754123456
    if (digits.length === 12 && digits.startsWith('255')) return `0${digits.slice(3)}` // 255754123456 → 0754123456
    if (digits.length === 9) return `0${digits}` // 754123456 → 0754123456
    throw new Error('Invalid phone format')
}
```

**Supported Input Formats**:
- `0754123456` (Local format)
- `255754123456` (E.164 without +)
- `+255754123456` (Full E.164)
- `754123456` (9-digit local)

#### Provider Channel Mapping
```typescript
function mapChannel(provider?: string): string | undefined {
    const p = (provider || '').toLowerCase().trim()
    if (p.includes('vodacom') || p.includes('m-pesa')) return 'vodacom'
    if (p.includes('tigo') || p.includes('mixx')) return 'tigo'
    if (p.includes('airtel')) return 'airtel'
    if (p.includes('halotel')) return 'halotel'
    if (p.includes('ttcl') || p.includes('t-pesa')) return 'ttcl'
    return undefined
}
```

#### Retry Logic and Fallback Strategy
The system implements a robust retry mechanism:

```typescript
// Try multiple phone formats and channel combinations
const phones = [localMsisdn, e164Msisdn, plusE164Msisdn]
const withChannelVariants = channel ? [false, true] : [false]

for (const phone of phones) {
    for (const useChan of withChannelVariants) {
        try {
            const response = await tryCreate(phone, useChan)
            // Success - use this combination
            break outer
        } catch (e) {
            // Try next combination
            continue
        }
    }
}
```

**Retry Strategy**:
1. Try local format (0754123456) without channel
2. Try local format with specific channel (vodacom/tigo/airtel)
3. Try E.164 format (255754123456) without channel
4. Try E.164 format with specific channel
5. Try +E.164 format (+255754123456) without channel
6. Try +E.164 format with specific channel

#### Webhook Integration
ZenoPay sends payment status updates via webhooks:

**Webhook Payload Structure**:
```typescript
{
    order_id: 'TX1234567890ABC', // Our transaction reference
    payment_status: 'SUCCESS' | 'FAILED' | 'PENDING',
    reference: 'mock_1234567890',
    transaction_id: 'zeno_abc123def456',
    data: {
        order_id: 'TX1234567890ABC',
        payment_status: 'SUCCESS',
        amount: '50000',
        channel: 'MPESA-TZ',
        transid: 'ABC123DEF456',
        reference: 'mock_1234567890',
        msisdn: '255754123456'
    }
}
```

**Webhook Security**:
- HMAC-SHA256 signature verification
- API key validation as fallback
- Timestamp validation (5-minute window)
- Idempotency handling

#### Error Handling

**Common Error Scenarios**:
1. **Invalid Phone Number**: Unsupported format or invalid digits
2. **Insufficient Funds**: Customer account balance too low
3. **Network Timeout**: Mobile network connectivity issues
4. **Invalid PIN**: Customer enters wrong PIN
5. **Transaction Declined**: Provider-specific rejection

**Error Response Format**:
```typescript
{
    status: 'error' | 'failed',
    message: 'Insufficient funds in customer account',
    error_code: 'INSUFFICIENT_FUNDS',
    data: null
}
```

#### Status Code Mapping
The system normalizes various ZenoPay status codes:

```typescript
const successSet = new Set(['SUCCESS', 'SUCCEEDED', 'COMPLETED', 'APPROVED', 'PAID', 'SETTLED', 'SUCCESSFUL'])
const pendingSet = new Set(['PENDING', 'PROCESSING', 'AWAITING', 'QUEUED'])
const cancelSet = new Set(['CANCELLED', 'CANCELED'])
const failSet = new Set(['FAILED', 'DECLINED', 'ERROR', 'REJECTED', 'TIMEOUT'])
```

#### Testing and Development

**Mock Webhook Endpoint**: `/api/payments/mock-webhook`
- Simulates ZenoPay webhook calls for testing
- Triggers payment completion in development
- Bypasses actual gateway integration

**Environment Configuration**:
```env
ZENOPAY_API_KEY=your_api_key_here
ZENOPAY_BASE_URL=https://api.zenopay.co.tz
ZENOPAY_REMOTE_STATUS=true
WEBHOOK_SECRET=your_webhook_secret
```

#### Performance Optimizations

1. **Connection Pooling**: Reuse HTTP connections for multiple requests
2. **Timeout Configuration**: 30-second timeout for gateway requests
3. **Retry Backoff**: Exponential backoff for failed requests
4. **Caching**: Cache successful channel/phone combinations
5. **Rate Limiting**: Prevent excessive API calls

#### Monitoring and Analytics

**Logged Events**:
- Payment initiation attempts
- Successful/failed transactions
- Retry attempts and outcomes
- Webhook reception and processing
- Gateway response times

**Key Metrics**:
- Success rate by provider (M-Pesa vs Airtel vs Tigo)
- Average transaction completion time
- Retry success rates
- Common failure reasons
- Peak transaction volumes

### Database Integration
- **Client**: Supabase with service role for server operations
- **RLS**: Row-level security for user data isolation
- **Caching**: Next.js cache tags for efficient data invalidation

### Frontend State Management
- **Cart**: Zustand store with persistence
- **UI**: React state for checkout flow
- **Sync**: Server synchronization for cart data

## Monitoring and Logging

### Payment Logs
```sql
CREATE TABLE payment_logs (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES payment_sessions(id),
    transaction_id UUID REFERENCES payment_transactions(id),
    event_type VARCHAR(50) NOT NULL,
    data JSONB,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Event Types
- `payment_initiated`: Payment request sent to gateway
- `payment_completed`: Successful payment confirmation
- `payment_failed`: Payment failure with reason
- `payment_pending`: Status update to pending
- `payment_cancelled`: Payment cancellation

## Performance Optimizations

### Caching Strategy
- Order data cached with tags for selective invalidation
- Cart synchronization with server state
- Webhook-triggered cache updates

### Database Optimization
- Indexes on frequently queried fields
- Efficient RLS policies
- Cleanup functions for expired sessions

## Future Enhancements

### Planned Features
1. Real-time payment status updates via WebSockets
2. Enhanced payment method management
3. Refund processing capabilities
4. Payment analytics and reporting
5. Multi-currency support expansion

### Technical Debt
1. Consolidate dual payment flows into single approach
2. Implement proper payment method persistence
3. Add comprehensive error recovery mechanisms
4. Enhance webhook security with additional verification layers

---

This documentation provides a complete overview of the TISCO platform's payment handling system, from initial cart interaction through final order completion, including all security measures, error handling, and integration points.
