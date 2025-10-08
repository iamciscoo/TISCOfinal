# 🔄 TISCO Data Flow Diagrams

**Purpose:** Understand how data moves through the system

---

## 📊 Complete Purchase Flow

```
USER → Browse Products → View Details → Add to Cart → Checkout → Payment → Order Created

┌──────────┐
│  User    │ Opens homepage
│ (Browser)│
└────┬─────┘
     │ GET /
     ↓
┌────────────────┐
│  app/page.tsx  │ Fetches products from Supabase
└────┬───────────┘
     │
     ↓
┌──────────────────────────────────────┐
│  Shows Product Grid                  │
│  User clicks product → /products/123 │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│  Product Details Page                │
│  User clicks "Add to Cart"           │
└────┬─────────────────────────────────┘
     │ calls cart.addItem()
     ↓
┌──────────────────────────────────────┐
│  useCartStore (Zustand)              │
│  • Adds item to cart array           │
│  • Saves to localStorage             │
│  • Updates UI (cart count badge)     │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│  User goes to /checkout              │
│  Enters phone, address, payment      │
│  Clicks "Place Order"                │
└────┬─────────────────────────────────┘
     │ POST /api/orders
     ↓
┌──────────────────────────────────────┐
│  API Route: /api/orders/route.ts    │
│  1. Validates user authentication    │
│  2. Creates order in database        │
│  3. Creates order_items              │
│  4. Sends confirmation email         │
│  5. Notifies admins                  │
│  6. Returns order ID                 │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│  Success Page                        │
│  Shows order confirmation            │
└──────────────────────────────────────┘
```

---

## 💳 Payment Flow (Mobile Money)

```
Checkout → Create Session → ZenoPay → User Phone → Webhook → Order Created

User submits checkout
     ↓
POST /api/payment/sessions
     ↓
┌─────────────────────────────────┐
│  Create session in database     │
│  Call ZenoPay API               │
└────┬────────────────────────────┘
     │
     ↓
┌─────────────────────────────────┐
│  ZenoPay sends prompt to phone  │
│  User enters M-Pesa PIN         │
│  Payment confirmed              │
└────┬────────────────────────────┘
     │ ZenoPay sends webhook
     ↓
POST /api/payments/webhooks
     ↓
┌─────────────────────────────────┐
│  Webhook Handler                │
│  1. Validates signature         │
│  2. Creates order               │
│  3. Updates payment status      │
│  4. Sends notifications (async) │
└─────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
Sign Up/In → Supabase Auth → JWT Token → Session Active

User enters credentials
     ↓
supabase.auth.signUp() or signInWithOAuth()
     ↓
┌────────────────────────────────┐
│  Supabase creates account      │
│  Generates JWT token           │
│  Stores in cookie              │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Database trigger creates      │
│  user profile in public.users  │
└────┬───────────────────────────┘
     │
     ↓
User logged in
```

---

## 📧 Email Notification Flow

```
Event (order created) → Notification Service → Render Template → SendPulse → Email Delivered

Order created
     ↓
notificationService.sendNotification()
     ↓
┌────────────────────────────────┐
│  1. Get email template         │
│  2. Render with data           │
│  3. Save to database           │
│  4. Send via SendPulse         │
│  5. Notify admins (parallel)   │
└────────────────────────────────┘
```

---

## 🗄️ Database Query Flow

```
Page Request → Server Component → Supabase Client → PostgreSQL → JSON Response

User visits /orders
     ↓
/orders/page.tsx (server)
     ↓
const orders = await supabase
  .from('orders')
  .select('*, order_items(*, products(*))')
  .eq('user_id', user.id)
     ↓
PostgreSQL executes query (uses index)
     ↓
Returns JSON data
     ↓
React renders page
```

---

## 🔄 Cart State Flow

```
Add Item → Zustand Store → LocalStorage → UI Updates

User clicks "Add to Cart"
     ↓
cart.addItem(product)
     ↓
┌────────────────────────────────┐
│  Zustand updates state:        │
│  • items: [...items, newItem]  │
│  • total: recalculated         │
│  • localStorage: persisted     │
└────┬───────────────────────────┘
     │
     ↓
React re-renders all subscribed components:
• Cart badge (count)
• Cart drawer (items list)
• Checkout (summary)
```

---

**For detailed explanations of specific flows, tag the relevant files!** 🎯
