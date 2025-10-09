# 🏗️ TISCO Platform - Complete Architecture Overview

**Last Updated:** 2025-01-09  
**Version:** 2.0  
**Purpose:** Comprehensive technical documentation for developers

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Dependencies](#core-dependencies)
5. [Database Architecture](#database-architecture)
6. [Authentication Flow](#authentication-flow)
7. [Payment System](#payment-system)
8. [Notification System](#notification-system)
9. [State Management](#state-management)
10. [API Routes Map](#api-routes-map)

---

## 🎯 System Overview

### What is TISCO?

TISCO (TISCOマーケット) is a **full-stack e-commerce platform** specifically designed for **Tanzania and East African markets**. It enables:

- **Electronics marketplace** with product catalog
- **Mobile money payments** (M-Pesa, Tigo Pesa, Airtel Money via ZenoPay)
- **Service bookings** for repairs and installations
- **Admin dashboard** for inventory and order management
- **Real-time notifications** via email (SendPulse)

### Key Features

- ✅ **Mobile-first design** - Optimized for African mobile users
- ✅ **PWA capabilities** - Install as mobile app
- ✅ **Multi-language support** - English & Swahili
- ✅ **Real-time cart sync** - Cart persists across devices
- ✅ **Category-based notifications** - Admins choose which alerts to receive
- ✅ **Optimized performance** - 81% bundle size reduction (37kB → 7kB)

### Architecture Type

**Monorepo with Two Applications:**
```
TISCO/
├── client/        # Customer-facing marketplace (Next.js 15)
└── admin/         # Admin dashboard (Next.js 15)
```

Both share the same **Supabase PostgreSQL** database but are deployed separately.

---

## 🛠️ Technology Stack

### Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.3 | React framework with App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **TailwindCSS** | 4.x | Utility-first CSS framework |

### Backend & Database

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database + Authentication |
| **Next.js API Routes** | Backend endpoints (serverless functions) |
| **Supabase Auth** | User authentication (email/password + OAuth) |

### State Management

| Library | Purpose |
|---------|---------|
| **Zustand** | Shopping cart state management |
| **Local Storage** | Cart persistence |
| **React Context** | Currency toggle (USD/TZS) |

### UI Components

| Library | Purpose |
|---------|---------|
| **Radix UI** | Accessible component primitives |
| **Lucide React** | Icon library |
| **Framer Motion** | Animations (client only) |
| **Recharts** | Analytics charts (admin only) |

### Third-Party Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **ZenoPay** | Mobile money payment processing | API key in `.env` |
| **SendPulse** | Email notifications | SMTP credentials in `.env` |
| **Vercel** | Hosting & deployment | `vercel.json` configs |

---

## 📂 Project Structure

### Client Application (`/client`)

```
client/
├── app/                        # Next.js 15 App Router
│   ├── page.tsx                # Homepage (/)
│   ├── layout.tsx              # Root layout
│   ├── api/                    # Backend API routes
│   │   ├── orders/             # Order management
│   │   ├── payments/           # Payment processing
│   │   │   └── mobile/
│   │   │       └── webhook/    # ⭐ ZenoPay webhook handler
│   │   ├── products/           # Product CRUD
│   │   ├── reviews/            # Product reviews
│   │   ├── service-bookings/   # Service appointments
│   │   └── notifications/      # Email notifications
│   ├── products/               # Product pages
│   ├── cart/                   # Cart page
│   ├── checkout/               # Checkout flow
│   ├── orders/                 # Order history
│   └── auth/                   # Auth callbacks
│
├── components/                 # React components
│   ├── ui/                     # Base UI components (buttons, inputs, etc.)
│   ├── auth/                   # Auth modals & forms
│   ├── shared/                 # Shared components
│   ├── Navbar.tsx              # Main navigation
│   ├── Footer.tsx              # Site footer
│   └── ProductDetail.tsx       # Product page component
│
├── lib/                        # Core business logic
│   ├── supabase-server.ts      # ⭐ Server-side database client
│   ├── supabase.ts             # Client-side database client
│   ├── store.ts                # ⭐ Zustand cart store
│   ├── logger.ts               # Logging utility
│   ├── email-templates.ts      # ⭐ All email HTML templates
│   ├── notifications/          # Notification system
│   │   ├── service.ts          # ⭐ Notification routing & category filtering
│   │   ├── sendpulse.ts        # SendPulse email delivery
│   │   └── audit.ts            # Notification audit logging
│   └── payments/               # Payment logic
│       ├── service.ts          # Payment session management
│       └── types.ts            # Payment type definitions
│
├── hooks/                      # Custom React hooks
│   ├── use-auth.tsx            # Authentication hook
│   └── use-cart-sync.ts        # Cart synchronization
│
├── middleware.ts               # Next.js middleware (auth checks)
├── next.config.ts              # Next.js configuration
└── package.json                # Dependencies
```

### Admin Dashboard (`/admin`)

```
admin/src/
├── app/                        # Admin pages
│   ├── page.tsx                # Dashboard home (analytics)
│   ├── orders/                 # Order management
│   ├── products/               # Product management
│   ├── users/                  # Customer management
│   ├── service-bookings/       # Service appointments
│   ├── reviews/                # Review moderation
│   ├── notifications/          # Notification recipient settings
│   └── api/                    # Admin API routes
│
├── components/                 # Admin UI components
│   ├── ui/                     # Base components
│   ├── charts/                 # Analytics charts
│   └── data-table.tsx          # Reusable table component
│
└── lib/                        # Admin utilities
    ├── database.ts             # Database queries
    ├── supabase.ts             # Supabase client
    └── types.ts                # Type definitions
```

---

## 📦 Core Dependencies

### Client Application

**Production Dependencies:**
```json
{
  "@supabase/ssr": "^0.7.0",          // Supabase SSR support
  "@supabase/supabase-js": "^2.55.0",  // Supabase client
  "next": "^15.5.3",                   // Next.js framework
  "react": "19.1.0",                   // React library
  "zustand": "^5.0.7",                 // State management
  "zod": "^4.0.17",                    // Schema validation
  "lucide-react": "^0.540.0",          // Icons
  "framer-motion": "^12.23.22",        // Animations
  "@radix-ui/*": "Multiple packages"   // UI primitives
}
```

**Key Points:**
- **No axios** - Uses native `fetch` API
- **No Redux** - Zustand for simpler state management
- **No Material-UI** - Custom components with Radix UI + TailwindCSS
- **Minimal bundle** - Only essential dependencies

### Admin Dashboard

**Additional Dependencies (beyond client):**
```json
{
  "@tanstack/react-table": "^8.21.3",  // Advanced table features
  "recharts": "^2.15.2",                // Charts & analytics
  "react-hook-form": "^7.55.0",         // Form management
  "next-themes": "^0.4.6",              // Dark mode support
  "sonner": "^2.0.7"                    // Toast notifications
}
```

---

## 🗄️ Database Architecture

### Schema Overview

TISCO uses **Supabase PostgreSQL** with the following core tables:

```sql
-- Main tables
users              # User accounts (synced with Supabase Auth)
products           # Product catalog
categories         # Product categories
orders             # Customer orders
order_items        # Order line items
reviews            # Product reviews
addresses          # Shipping addresses
cart_items         # Server-side cart (optional)
services           # Service offerings
service_bookings   # Service appointments
notifications      # Notification history
notification_recipients  # Admin email settings
payment_sessions   # Mobile payment tracking
payment_logs       # Payment event logs
newsletter_subscribers  # Email subscribers
contact_messages   # Contact form submissions
```

### Entity Relationships

```
users (1) ─────< (N) orders
              └──< (N) reviews
              └──< (N) addresses
              └──< (N) service_bookings

products (1) ──< (N) order_items
             └─< (N) reviews

orders (1) ────< (N) order_items

categories (1) ─< (N) products

payment_sessions (1) ─< (N) payment_logs
```

### Key Database Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,  -- Links to Supabase auth.users
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT CHECK (phone IS NULL OR length(phone) >= 10),
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT now()
)
```

#### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  deal_price DECIMAL(10,2),
  is_deal BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  category_id UUID REFERENCES categories(id),
  main_image_url TEXT,
  stock_quantity INT DEFAULT 0,
  rating DECIMAL(2,1),
  reviews_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

#### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, processing, shipped, delivered
  payment_status TEXT DEFAULT 'unpaid',  -- unpaid, paid, failed
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

#### payment_sessions
```sql
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_id UUID,  -- Initially null, set after payment success
  transaction_reference TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  status TEXT DEFAULT 'pending',  -- pending, completed, failed, expired
  provider TEXT DEFAULT 'zenopay',
  cart_snapshot JSONB,  -- Stores cart items at payment time
  customer_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### Database Indexes

**Optimized for performance:**
```sql
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_payment_sessions_ref ON payment_sessions(transaction_reference);
CREATE INDEX idx_payment_sessions_order ON payment_sessions(order_id);
```

---

## 🔐 Authentication Flow

### Authentication Provider: Supabase Auth

TISCO supports **3 authentication methods:**

1. **Email/Password** (traditional)
2. **Google OAuth** (social sign-in)
3. **Password Reset** via email magic links

### Authentication Flow Diagram

```
┌─────────────────┐
│  User Actions   │
└────────┬────────┘
         │
         ├── Sign Up ────────────┐
         ├── Sign In ────────────┤
         └── OAuth (Google) ─────┤
                                 │
                          ┌──────▼──────┐
                          │ Supabase    │
                          │   Auth      │
                          └──────┬──────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
             ┌──────▼──────┐         ┌───────▼────────┐
             │ JWT Token   │         │  Database      │
             │ (in cookie) │         │  Trigger       │
             └──────┬──────┘         └───────┬────────┘
                    │                        │
                    │                ┌───────▼────────┐
                    │                │ Create user    │
                    │                │ in public.users│
                    │                └───────┬────────┘
                    │                        │
                    └────────┬───────────────┘
                             │
                      ┌──────▼──────┐
                      │ Redirect to │
                      │  Homepage   │
                      └─────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `/lib/supabase-server.ts` | Server-side auth (API routes) |
| `/lib/supabase.ts` | Client-side auth (browser) |
| `/middleware.ts` | Route protection & session refresh |
| `/app/auth/callback/page.tsx` | OAuth callback handler |
| `/app/auth/reset-callback/page.tsx` | Password reset handler |
| `/components/auth/AuthModal.tsx` | Sign-in/sign-up UI |

### Session Management

**How it works:**
1. User signs in → Supabase returns JWT token
2. Token stored in **HTTP-only cookie** (`sb-access-token`)
3. Middleware refreshes token on every request
4. Server components read user from cookie via `getUser()`

**Security Features:**
- HTTP-only cookies (XSS protection)
- PKCE flow for OAuth (CSRF protection)
- Token rotation & refresh
- Cookie validation (UTF-8 & JWT structure checks)

---

## 💳 Payment System

### Payment Provider: ZenoPay

**ZenoPay** is a Tanzanian payment gateway supporting:
- M-Pesa (Vodacom)
- Tigo Pesa
- Airtel Money
- Halopesa

### Payment Flow

```
User Checkout ──> Create Payment Session ──> Call ZenoPay API
                                              │
                                              └──> Send M-Pesa prompt to phone
                                                   │
                                                   └──> User enters PIN
                                                        │
                                                        ├─ Success ─┐
                                                        └─ Failed ──┤
                                                                    │
ZenoPay Webhook <───────────────────────────────────────────────────┘
     │
     ├── Verify payment
     ├── Create order in database
     ├── Send confirmation emails
     └── Notify admins
```

### Key Payment Files

| File | Purpose |
|------|---------|
| `/app/api/payments/mobile/initiate/route.ts` | Start payment session |
| `/app/api/payments/mobile/webhook/route.ts` | ⭐ Receive payment confirmations |
| `/lib/payments/service.ts` | Payment logic & session management |
| `/lib/zenopay.ts` | ZenoPay API client |

### Payment Session Lifecycle

```
1. INITIATED    → User clicks "Pay with Mobile Money"
2. PENDING      → ZenoPay sends prompt to phone
3. PROCESSING   → User enters PIN
4. COMPLETED    → Payment successful → Order created
5. FAILED       → Payment declined/timeout
```

### Webhook Handler Logic (Simplified)

```typescript
// /app/api/payments/mobile/webhook/route.ts
export async function POST(req: NextRequest) {
  // 1. Parse webhook payload from ZenoPay
  const payload = await req.json()
  
  // 2. Verify payment status
  if (payload.payment_status === 'SUCCESSFUL') {
    // 3. Find payment session
    const session = await getSessionByOrderId(payload.order_id)
    
    // 4. Create order from cart snapshot
    const order = await createOrderFromSession(session)
    
    // 5. Send notifications (async)
    setImmediate(async () => {
      await notifyAdminOrderCreated(order)
      await notifyOrderConfirmation(order)
    })
  }
  
  return NextResponse.json({ success: true })
}
```

---

## 📧 Notification System

### Email Provider: SendPulse

**Features:**
- **Category-based filtering** - Admins choose notification types
- **Dark mode support** - Email templates adapt to user's theme
- **Audit logging** - All notifications tracked in database
- **Asynchronous delivery** - Non-blocking order creation

### Notification Types

| Event | Trigger | Recipients |
|-------|---------|------------|
| `order_created` | Order placed | Customer + Admins |
| `payment_success` | Payment confirmed | Customer + Admins |
| `payment_failed` | Payment declined | Customer + Admins |
| `order_status_update` | Status changed | Customer |
| `booking_created` | Service booked | Customer + Admins |
| `user_registered` | New sign-up | Customer (welcome email) |
| `contact_message_received` | Contact form | Admins |
| `review_submitted` | Review posted | Admins |

### Notification Flow

```
Event Occurs (e.g., order created)
     │
     ├──> notificationService.sendNotification()
     │    │
     │    ├──> 1. Get email template
     │    ├──> 2. Render with data
     │    ├──> 3. Save to database
     │    ├──> 4. Send via SendPulse
     │    └──> 5. Notify admins (parallel)
     │
     └──> notifyAdminsOfNewNotification()
          │
          ├──> Filter by categories
          └──> Send to matching admins
```

### Category-Based Admin Filtering

**Example:**
- Admin A subscribes to: `orders`, `payments`
- Admin B subscribes to: `contact`, `bookings`
- Event: `order_created`
- Result: Only Admin A receives notification

**Implementation:**
```typescript
// /lib/notifications/service.ts
const eventCategoryMap: Record<string, string[]> = {
  'order_created': ['order_created', 'orders'],
  'payment_success': ['payment_success', 'payments'],
  'contact_message_received': ['contact_message_received', 'contact']
}

// Filter recipients
const recipients = allAdmins.filter(admin => {
  if (admin.notification_categories.includes('all')) return true
  const eventCategories = eventCategoryMap[event]
  return eventCategories.some(cat => 
    admin.notification_categories.includes(cat)
  )
})
```

### Key Notification Files

| File | Purpose | Lines of Code |
|------|---------|---------------|
| `/lib/notifications/service.ts` | ⭐ Core notification logic | ~1,300 |
| `/lib/notifications/sendpulse.ts` | Email delivery | ~200 |
| `/lib/email-templates.ts` | ⭐ HTML email templates | ~1,800 |
| `/lib/notifications/audit.ts` | Notification audit logs | ~150 |

---

## 🗂️ State Management

### Zustand Cart Store

**Why Zustand?**
- Lightweight (2KB)
- No boilerplate
- TypeScript support
- Persistence middleware

**Cart Store Features:**
```typescript
// /lib/store.ts
interface CartStore {
  items: CartItem[]           // Cart items
  isOpen: boolean            // Sidebar visibility
  ownerId: string | null     // Cart owner (prevent cross-account merge)
  
  // Operations
  addItem(product, quantity)
  removeItem(productId)
  updateQuantity(productId, qty)
  clearCart()
  
  // Computed
  getTotalItems()
  getTotalPrice()
}
```

**Persistence:**
```typescript
persist(
  storeConfig,
  {
    name: 'tisco-cart-storage',  // localStorage key
    partialize: (state) => ({
      items: state.items,
      ownerId: state.ownerId     // Only persist these fields
    })
  }
)
```

### Currency Context

**Switch between TZS (Tanzanian Shilling) and USD:**
```typescript
// /lib/currency-context.tsx
const [currency, setCurrency] = useState<'TZS' | 'USD'>('TZS')

// Conversion rate
const exchangeRate = 2350  // 1 USD = 2350 TZS

// Usage
<PriceDisplay 
  price={product.price} 
  currency={currency} 
/>
```

---

## 🛣️ API Routes Map

### Client API Routes

```
POST   /api/auth/profile                # Update user profile
GET    /api/auth/addresses              # Get user addresses
POST   /api/auth/addresses              # Create address
PATCH  /api/auth/addresses/[id]         # Update address
DELETE /api/auth/addresses/[id]         # Delete address

GET    /api/products                    # List products (with filters)
GET    /api/products/[id]               # Get product details
GET    /api/products/search             # Search products

GET    /api/categories                  # List categories

GET    /api/orders                      # List user orders
POST   /api/orders                      # Create order (Pay at Office)
GET    /api/orders/[id]                 # Get order details
PATCH  /api/orders/[id]/status          # Update order status
POST   /api/orders/[id]/mark-paid       # Mark as paid (admin)

POST   /api/payments/mobile/initiate    # Start mobile payment
GET    /api/payments/mobile/status      # Check payment status
POST   /api/payments/mobile/webhook     # ⭐ ZenoPay webhook

GET    /api/reviews                     # Get product reviews
POST   /api/reviews                     # Submit review

GET    /api/services                    # List services
POST   /api/service-bookings            # Book service

POST   /api/contact-messages            # Submit contact form
POST   /api/newsletter                  # Subscribe to newsletter
POST   /api/unsubscribe                 # Unsubscribe from emails

POST   /api/notifications/email         # Send manual notification (admin)
POST   /api/notifications/admin-order   # Trigger admin order notification
POST   /api/notifications/welcome       # Send welcome email
```

### Admin API Routes

```
GET    /admin/api/analytics              # Dashboard stats
GET    /admin/api/products               # Product management
POST   /admin/api/products               # Create product
PATCH  /admin/api/products/[id]          # Update product
DELETE /admin/api/products/[id]          # Delete product
GET    /admin/api/orders                 # Order management
GET    /admin/api/users                  # User management
GET    /admin/api/reviews                # Review moderation
GET    /admin/api/service-bookings       # Service appointments
GET    /admin/api/notifications/recipients  # Notification settings
```

---

## 🔄 Data Flow Patterns

### Pattern 1: User Places Order (Pay at Office)

```
1. User fills checkout form → /checkout/page.tsx
2. Clicks "Place Order" → POST /api/orders/route.ts
3. Server validates user → getUser()
4. Creates order → supabase.from('orders').insert()
5. Creates order items → supabase.from('order_items').insert()
6. Sends confirmation → notificationService.sendNotification()
7. Notifies admins → notifyAdminOrderCreated()
8. Returns order ID → Redirect to /orders/[id]
```

### Pattern 2: Mobile Money Payment

```
1. User selects "Mobile Money" → /checkout/page.tsx
2. POST /api/payments/mobile/initiate → Create payment_session
3. Call ZenoPay API → ZenoPay.initiatePayment()
4. ZenoPay sends M-Pesa prompt to phone
5. User enters PIN on phone
6. ZenoPay sends webhook → POST /api/payments/mobile/webhook
7. Webhook creates order → createOrderFromSession()
8. Sends notifications (async) → notifyAdminOrderCreated()
9. Returns success → Order appears in database
```

### Pattern 3: Product Display

```
1. User visits /products → /products/page.tsx (Server Component)
2. Server fetches products → supabase.from('products').select()
3. Returns HTML with data → React hydrates on client
4. User clicks "Add to Cart" → useCartStore.addItem()
5. Cart badge updates → React re-renders subscribed components
6. Cart persists → localStorage ('tisco-cart-storage')
```

---

## 📊 Performance Optimizations

### Bundle Size Reduction

**Results:**
- **Homepage:** 37.2kB → 6.83kB (81% reduction)
- **Products page:** Optimized lazy loading
- **Image optimization:** LazyImage component with intersection observer

**Techniques:**
```typescript
// Dynamic imports
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />,
  ssr: false  // Client-only
})

// Code splitting by route (automatic with App Router)
```

### Database Query Optimization

**Indexes added:**
```sql
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
```

**Query patterns:**
```typescript
// ✅ Good: Select only needed fields
const { data } = await supabase
  .from('products')
  .select('id, name, price, main_image_url')
  .eq('is_featured', true)
  .limit(6)

// ❌ Bad: Select all fields unnecessarily
const { data } = await supabase
  .from('products')
  .select('*')  // Fetches unnecessary data
```

### Caching Strategy

**API Route Caching:**
```typescript
// /app/api/products/route.ts
export const revalidate = 3600  // Cache for 1 hour

// Manual revalidation
revalidatePath('/products')
```

---

## 🔧 Configuration Files

### Environment Variables

**Client (`.env.local`):**
```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public anon key
NEXT_PUBLIC_APP_URL=               # App URL (for emails)
SENDPULSE_CLIENT_SECRET=           # SendPulse auth
SENDPULSE_SMTP_PASSWORD=           # SendPulse SMTP
ZENOPAY_API_KEY=                   # ZenoPay API key
WEBHOOK_SECRET=                    # Webhook validation secret
ADMIN_EMAIL=                       # Default admin email
```

### Next.js Configuration

**Key settings:**
```typescript
// next.config.ts
const config = {
  images: {
    domains: ['supabase.co'],  // Allowed image hosts
    unoptimized: false,        // Enable image optimization
  },
  experimental: {
    serverActions: true,       // Enable server actions
  },
}
```

---

## 🐛 Debugging & Logging

### Logger Utility

**Centralized logging:**
```typescript
// /lib/logger.ts
import { logger } from '@/lib/logger'

logger.info('Order created', { orderId: '123' })
logger.warn('Low stock', { productId: '456' })
logger.error('Payment failed', error, { userId: '789' })
```

**Logging levels:**
- `debug` - Development only
- `info` - Normal operations
- `warn` - Potential issues
- `error` - Failures

### Common Debug Patterns

```typescript
// Database query debugging
const { data, error } = await supabase.from('orders').select()
if (error) {
  logger.error('Database query failed', error, { table: 'orders' })
}

// Payment webhook debugging
console.log(`🔔 [${webhookId}] ZenoPay webhook received`)
console.log(`📦 [${webhookId}] Payload:`, JSON.stringify(payload))
```

---

## 📚 Additional Resources

### Key Documentation Files

- **FILE-STRUCTURE-MAP.md** - Complete file directory breakdown
- **DATA-FLOW-DIAGRAMS.md** - Visual flow diagrams
- **PAYMENT_SYSTEM_GUIDE.md** - Detailed payment documentation
- **PERFORMANCE-ANALYSIS.md** - Optimization opportunities

### External Documentation

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [ZenoPay API Docs](https://zenoapi.com/docs)
- [SendPulse SMTP Docs](https://sendpulse.com/smtp)

---

## 🎯 Next Steps

### For New Developers

1. **Read this document** - Understand the architecture
2. **Explore FILE-STRUCTURE-MAP.md** - Know where files live
3. **Review DATA-FLOW-DIAGRAMS.md** - See how data moves
4. **Tag specific files** - Get detailed explanations

### For Optimization Work

1. **Check PERFORMANCE-ANALYSIS.md** - Find bottlenecks
2. **Review large files** - Identify refactoring opportunities
3. **Analyze dependencies** - Remove unused packages
4. **Test performance** - Measure improvements

---

**Documentation maintained by:** TISCO Development Team  
**Questions?** Tag any file with `@/path/to/file.ts` for detailed explanations!
