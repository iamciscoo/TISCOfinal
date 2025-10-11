# 🏦 TISCO Payment System - Complete Production Guide

**Last Updated:** January 10, 2025  
**Version:** 4.0 - Complete Production Implementation  
**Platform:** TISCO E-Commerce Platform (Next.js 15 + Supabase)  
**Payment Provider:** ZenoPay Mobile Money Tanzania  
**Email Provider:** SendPulse SMTP API  
**Status:** ✅ Production-Ready

---

## 📚 Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Payment Flows Overview](#2-payment-flows-overview)
3. [Mobile Money Flow (ZenoPay)](#3-mobile-money-flow-zenopay)
4. [Pay-at-Office Flow](#4-pay-at-office-flow)
5. [Database Schema & Operations](#5-database-schema--operations)
6. [Email Notification System](#6-email-notification-system)
7. [File & Function Reference](#7-file--function-reference)
8. [Testing & Validation](#8-testing--validation)
9. [Code Optimization Recommendations](#9-code-optimization-recommendations)

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌───────────┐
│  Customer   │───▶│TISCO Next.js │───▶│   ZenoPay   │───▶│  Mobile   │
│  (Browser)  │    │   Backend    │    │   Gateway   │    │  Networks │
└─────────────┘    └──────────────┘    └─────────────┘    └───────────┘
       │                   │                    │                  │
       │                   ▼                    │                  │
       │           ┌───────────────┐            │                  │
       │           │   Supabase    │            │                  │
       │           │   PostgreSQL  │            │                  │
       │           └───────────────┘            │                  │
       │                   │                    │                  │
       │                   ▼                    │                  │
       │           ┌───────────────┐            │                  │
       │           │   SendPulse   │            │                  │
       │           │  Email SMTP   │            │                  │
       │           └───────────────┘            │                  │
       │                                        │                  │
       └◀───────────────────────────────────────┴──────────────────┘
                     Webhook Notification
```

### 1.2 Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 15 (React 19) | Customer interface, checkout flow |
| **Backend API** | Next.js API Routes (Node.js) | Payment processing, order management |
| **Database** | Supabase (PostgreSQL) | Orders, sessions, users, notifications |
| **Payment Gateway** | ZenoPay API | Mobile money processing (M-Pesa, Tigo, Airtel, Halo) |
| **Email Service** | SendPulse SMTP API | Transactional emails |
| **Authentication** | Supabase Auth | User sessions, JWT tokens |

---

## 2. Payment Flows Overview

### 2.1 Supported Payment Methods

1. **Mobile Money (ZenoPay)** - M-Pesa, Tigo Pesa, Airtel Money, Halopesa
2. **Pay at Office** - Cash payment on pickup

### 2.2 Key Differences

| Aspect | Mobile Money | Pay at Office |
|--------|--------------|---------------|
| **Order Creation** | Pre-created, then paid via webhook | Created immediately |
| **Payment Status** | `paid` (after webhook) | `pending` |
| **Admin Notification** | Sent via webhook handler | Sent in order creation |
| **Customer Email** | Sent via webhook handler | Sent in order creation |
| **Idempotency** | Session-based with order reuse | Simple request validation |

---

## 3. Mobile Money Flow (ZenoPay)

### 3.1 Complete End-to-End Flow

```
STEP 1: Customer Checkout
├─ Customer fills shipping info
├─ Selects "Mobile Money"
├─ Chooses provider (M-Pesa/Tigo/Airtel/Halo)
├─ Enters phone number (07XX XXX XXX)
└─ Clicks "Pay Now"

STEP 2: Payment Initiation
├─ File: /client/app/api/payments/mobile/initiate/route.ts
├─ Function: POST handler
├─ Actions:
│  ├─ Authenticate user (Supabase JWT)
│  ├─ Validate amount matches cart total
│  ├─ Check for existing pending order (5min window)
│  │  └─ If found with matching items → REUSE order
│  ├─ Create/reuse order in database
│  │  ├─ Table: orders (status=pending, payment_status=pending)
│  │  └─ Table: order_items
│  ├─ Create payment session
│  │  ├─ Table: payment_sessions
│  │  ├─ Generate transaction_reference (TISCO{timestamp}{random})
│  │  └─ Check for duplicate session (60s window)
│  └─ Call ZenoPay API
│     ├─ Endpoint: POST /api/payments/mobile_money_tanzania
│     ├─ Headers: {'x-api-key': ZENOPAY_API_KEY}
│     └─ Payload: {order_id, buyer_name, buyer_phone, amount, webhook_url}
└─ Returns: {transaction_reference, session_id, order_id}

STEP 3: Customer Payment
├─ ZenoPay sends STK push to phone
├─ Customer receives payment prompt
├─ Customer enters Mobile Money PIN
└─ Mobile network processes payment

STEP 4: Webhook Callback
├─ ZenoPay calls: POST /api/payments/mobile/webhook
├─ File: /client/app/api/payments/mobile/webhook/route.ts
├─ Function: POST handler
├─ Payload from ZenoPay:
│  {
│    "order_id": "TISCO1A2B3C4D",
│    "payment_status": "COMPLETED",
│    "reference": "0936183435",
│    "amount": "50000",
│    "transid": "CEJ3I3SETSN"
│  }
├─ Actions:
│  ├─ Find payment session by order_id or transaction_reference
│  ├─ Check if already processed (idempotency)
│  ├─ If payment_status === "COMPLETED":
│  │  ├─ Update order:
│  │  │  ├─ status = 'pending' (awaiting shipment)
│  │  │  └─ payment_status = 'paid'
│  │  ├─ Update payment_session:
│  │  │  └─ status = 'completed'
│  │  ├─ Fetch user email from auth.users (NOT checkout form)
│  │  ├─ Fetch order items with product names
│  │  ├─ Send customer email (notifyOrderCreated)
│  │  └─ Send admin email (notifyAdminOrderCreated)
│  └─ Log event to payment_logs
└─ Returns: {success: true, order_id}

STEP 5: Email Notifications
├─ See Section 6 for complete email flow
└─ Customer receives order confirmation
```

### 3.2 Idempotency & Duplicate Prevention

**Order Reuse Logic** (`/client/app/api/payments/mobile/initiate/route.ts:89-143`):

```typescript
// Check for recent pending orders (last 5 minutes)
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
const { data: recentOrders } = await supabase
  .from('orders')
  .select('id, total_amount, created_at')
  .eq('user_id', userProfile.id)
  .eq('status', 'pending')
  .eq('payment_status', 'pending')
  .eq('total_amount', amount)
  .gte('created_at', fiveMinutesAgo)

// Verify cart items match (same products, quantities, prices)
for (const recentOrder of recentOrders) {
  const { data: existingItems } = await supabase
    .from('order_items')
    .select('product_id, quantity, price')
    .eq('order_id', recentOrder.id)
  
  const itemsMatch = orderData.items.every(cartItem =>
    existingItems.some(orderItem =>
      orderItem.product_id === cartItem.product_id &&
      orderItem.quantity === cartItem.quantity
