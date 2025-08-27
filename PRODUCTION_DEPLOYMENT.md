# TISCO Market - Production Deployment Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Completed Features](#completed-features)
3. [Database Schema](#database-schema)
4. [Deployment Strategy](#deployment-strategy)
5. [Critical Tasks](#critical-tasks)
6. [Production Checklist](#production-checklist)
7. [Next Steps](#next-steps)

## Project Overview

TISCO Market is a comprehensive e-commerce platform built with:
- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase
- Clerk Authentication

The platform consists of two main applications:
1. Client E-commerce Frontend
2. Admin Dashboard Backend

---

## Completed Features

### Client Application (E-commerce Frontend)

#### Core E-commerce Features
- ✅ Product Catalog with categories, search, and filtering
- ✅ Real-time Shopping Cart with Zustand state management
- ✅ Clerk Authentication with user profiles
- ✅ Multi-step Checkout System
- ✅ Order Management and Tracking
- ✅ Product Reviews System
- ✅ Service Booking System
- ✅ TZS/USD Currency Conversion
- ✅ Responsive Mobile-first Design

#### Payment Integration
- ✅ Mobile Money Support (M-Pesa, Airtel Money, Tigo Pesa)
- ✅ Card Payments (Visa/Mastercard)
- ✅ Pay at Office Option
- ✅ Payment Webhook Handling

#### User Experience
- ✅ Real-time Cart Updates
- ✅ Product Search with Suggestions
- ✅ Multiple Product Images
- ✅ Flexible Delivery Options
- ✅ Notification System (Email, SMS, Push)

### Admin Dashboard

#### Content Management
- ✅ Product Management (CRUD)
- ✅ Category Management
- ✅ User Management
- ✅ Order Processing
- ✅ Service Booking Management

#### Analytics & Reporting
- ✅ Dashboard Analytics
- ✅ Revenue Charts
- ✅ Inventory Monitoring
- ✅ Cart Analytics

#### Business Operations
- ✅ Payment Tracking
- ✅ Review Moderation
- ✅ Service Costing
- ✅ Revenue Analytics

---

## Database Schema

### Core Tables (Production Ready)
\`\`\`sql
-- Essential Tables
categories
products
product_images
users
addresses
cart_items
orders
order_items
reviews
services
service_bookings

-- Advanced Tables
service_booking_costs
service_booking_cost_items
payment_methods
payment_transactions
payment_logs
\`\`\`

### Database Cleanup Required

#### Tables to Remove
\`\`\`sql
-- Remove if not actively used
DROP TABLE IF EXISTS cart_abandonment_emails CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS cart_conversions CASCADE;
DROP TABLE IF EXISTS email_notifications CASCADE;
DROP TABLE IF EXISTS sms_notifications CASCADE;
DROP TABLE IF EXISTS push_notifications CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;
\`\`\`

---

## Deployment Strategy

### Separate Repository Approach

#### Client Application (tisco-client)
\`\`\`json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk-publishable-key",
    "CLERK_SECRET_KEY": "@clerk-secret-key",
    "SUPABASE_SERVICE_ROLE": "@supabase-service-role",
    "NEXT_PUBLIC_BASE_URL": "@app-base-url",
    "WEBHOOK_SECRET": "@webhook-secret",
    "ZENOPAY_BASE_URL": "@zenopay-base-url",
    "ZENOPAY_ACCOUNT_ID": "@zenopay-account-id",
    "ZENOPAY_API_KEY": "@zenopay-api-key",
    "ZENOPAY_SECRET_KEY": "@zenopay-secret-key"
  }
}
```

#### Admin Dashboard (tisco-admin)
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE": "@supabase-service-role",
    "NEXT_PUBLIC_ADMIN_ACCESS_KEY": "@admin-access-key"
  }
}
\`\`\`

---

## Critical Tasks

### Security & Authentication
- [x] Set up environment variables
- [x] Change default admin access key
- [x] Implement proper admin authentication
 - [x] Add IP whitelist for admin access
 - [x] Add rate limiting for API endpoints

### Payment System
- [x] Integrate ZenoPay payment processor
- [x] Set up payment webhooks (code + HMAC verification)
- [x] Implement payment failure handling
- [ ] Configure webhook URL in ZenoPay dashboard
- [ ] Run end-to-end payment tests (dev + staging)

### Communication System
- [ ] Set up email service (sendpulse)
- [ ] Create email templates
- [ ] Set up notification system
---

## Production Checklist

### Pre-Deployment
- [ ] Database Migration
- [ ] Environment Variables
- [ ] Admin Security
- [ ] Payment Testing
- [ ] Email Configuration
- [ ] Domain Setup
- [ ] SSL Certificates

### Deployment Steps

1. Supabase Setup
\`\`\`bash
# Create production database
# Run migration scripts
# Configure environment
# Set up RLS policies
\`\`\`

2. Clerk Setup
\`\`\`bash
# Create production application
# Configure redirects
# Set up webhooks
\`\`\`

3. Vercel Deployment
\`\`\`bash
# Deploy client
vercel --prod

# Deploy admin
vercel --prod
\`\`\`

### Post-Deployment
- [ ] Test Core Functions
- [ ] Verify Payments
- [ ] Test Notifications
- [ ] Mobile Testing
- [ ] Admin Verification
- [ ] Performance Check
- [ ] Security Audit

---

## ZenoPay Setup Checklist

1) Environment variables (do not commit secrets)
- Set in `client/tisco_onlineshop/.env.local`:
  - `ZENOPAY_BASE_URL`
  - `ZENOPAY_ACCOUNT_ID`
  - `ZENOPAY_API_KEY`
  - `ZENOPAY_SECRET_KEY`
  - `WEBHOOK_SECRET`
  - `NEXT_PUBLIC_BASE_URL`

2) Remove legacy ClickPesa code
- Delete `client/tisco_onlineshop/lib/clickpesa.ts` (tracked via git)

3) Configure webhook in ZenoPay dashboard
- URL: `https://YOUR_DOMAIN/api/payments/webhooks`
- Secret: `WEBHOOK_SECRET`
- Header: `x-webhook-signature: sha256=<HMAC_HEX>`

4) Local webhook test
```bash
body='{"order_id":"TX123","status":"COMPLETED","transaction_id":"GW-abc"}'
sig_hex=$(printf "%s" "$body" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | awk '{print $2}')
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=$sig_hex" \
  --data "$body" \
  http://localhost:3000/api/payments/webhooks
```

5) End-to-end flow
- Start at `app/checkout/page.tsx` and initiate Mobile Money payment.
- Verify DB updates in `payment_transactions` and `orders` via webhooks.
- Poll `/api/payments/status?reference=<txn_ref>` until `COMPLETED/FAILED`.

6) Files to review
- `client/tisco_onlineshop/lib/zenopay.ts`
- `client/tisco_onlineshop/app/api/payments/process/route.ts`
- `client/tisco_onlineshop/app/api/payments/webhooks/route.ts`
- `client/tisco_onlineshop/app/api/payments/status/route.ts`
- `client/tisco_onlineshop/app/checkout/page.tsx`

---

## Next Steps

### Week 1
1. Fix admin authentication
2. Set up payment gateways
3. Configure production database
4. Deploy to Vercel

### Month 1
1. Integrate communication services
2. Set up delivery tracking
3. Implement testing
4. Add monitoring

### Quarter 1
1. Enhance inventory management
2. Add loyalty programs
3. Expand analytics
4. Develop mobile app

---

## Progress Tracking

Use this section to track the completion of each task:

\`\`\`markdown
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Admin Auth | 🟡 Pending | | |
| Payment Gateway | 🟣 In Progress | | ZenoPay integrated; webhook config + E2E tests pending |
| Database Setup | 🟡 Pending | | |
| Email Service | 🟡 Pending | | |
\`\`\`

Status Key:
- 🟢 Completed
- 🟡 Pending
- 🔴 Blocked
- 🟣 In Progress
