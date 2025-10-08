# 🏗️ TISCO Platform Architecture - Overview

**Last Updated:** 2025-01-08  
**For:** Beginners to Advanced  

---

## 📋 What is TISCO?

TISCO (TISCOマーケット) is an **e-commerce platform** for Tanzania featuring:
- Electronics marketplace
- Mobile money payments (M-Pesa, Tigo Pesa)
- Service bookings
- Multi-language support (English/Swahili)

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   USER DEVICES                          │
│   📱 Mobile    💻 Desktop    👨‍💼 Admin Dashboard         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              NEXT.JS 15 APPLICATIONS                    │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  CLIENT APP      │      │   ADMIN APP      │        │
│  │  (React 19)      │      │   (React 19)     │        │
│  │  tiscomarket     │      │   admin.tisco    │        │
│  └────────┬─────────┘      └────────┬─────────┘        │
└───────────┼──────────────────────────┼──────────────────┘
            │                          │
┌───────────▼──────────────────────────▼──────────────────┐
│                 API ROUTES (Node.js)                    │
│  /api/orders  /api/payments  /api/products  /api/admin │
└───────────┬──────────────────────────┬──────────────────┘
            │                          │
┌───────────▼──────────────────────────▼──────────────────┐
│            EXTERNAL SERVICES                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ SUPABASE │  │ ZENOPAY  │  │SENDPULSE │             │
│  │PostgreSQL│  │ Payments │  │  Emails  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
TISCO/
├── client/              # Customer-facing app
│   ├── app/            # Pages & API routes (Next.js 15)
│   ├── components/     # Reusable UI components
│   ├── lib/            # Core business logic
│   └── store/          # Global state (Zustand)
│
├── admin/              # Admin dashboard
│   ├── src/app/        # Admin pages
│   ├── src/components/ # Admin components
│   └── src/lib/        # Admin utilities
│
└── docs/              # Documentation (this file!)
```

---

## 🎨 Technology Stack

### Frontend
- **React 19** - UI library
- **Next.js 15** - Framework (SSR, routing)
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Zustand** - State management

### Backend
- **Next.js API Routes** - Server endpoints
- **Supabase** - Database + Auth
- **SendPulse** - Email service
- **ZenoPay** - Payment gateway

---

## 📊 Key Concepts for Beginners

### 1. **Client vs Server**

```
CLIENT (Browser)              SERVER (Next.js)
─────────────────────────────────────────────
• What user sees              • Business logic
• React components            • API endpoints
• User interactions           • Database queries
• Styling (CSS)               • Authentication
```

### 2. **Components** (Building Blocks)

Think of components like LEGO blocks:

```jsx
<ProductCard>              // Reusable product display
  <ProductImage />         // Shows product photo
  <ProductName />          // Shows product name
  <ProductPrice />         // Shows price
  <AddToCartButton />      // Button to add to cart
</ProductCard>
```

### 3. **State** (Data That Changes)

```
Shopping Cart State:
• items: []                    // Empty cart
• addItem(product)            // Add product
• items: [product1]           // Cart has 1 item
• addItem(product2)           // Add another
• items: [product1, product2] // Cart has 2 items
```

### 4. **API Routes** (Backend Endpoints)

```
GET  /api/products        → Get all products
GET  /api/products/123    → Get specific product
POST /api/orders          → Create new order
GET  /api/orders          → Get user's orders
```

---

## 🔄 Complete User Journey Example

**Scenario: User buys a laptop**

```
1. User visits homepage (/)
   └→ Next.js loads page.tsx
   └→ Fetches featured products from Supabase
   └→ Renders product cards

2. User clicks "Gaming Laptop" product
   └→ Routes to /products/[id]
   └→ Fetches product details from database
   └→ Shows product page with images, specs, price

3. User clicks "Add to Cart"
   └→ Component calls addItem() from cart store
   └→ Zustand updates cart state
   └→ localStorage saves cart (persist on refresh)
   └→ Cart icon updates to show count

4. User clicks cart icon
   └→ Routes to /cart
   └→ Displays all cart items
   └→ Shows total price calculation

5. User clicks "Checkout"
   └→ Routes to /checkout
   └→ Checks if user is logged in (auth check)
   └→ If not logged in → shows login modal
   └→ If logged in → shows checkout form

6. User enters phone number & payment method
   └→ Submits checkout form

7. POST /api/orders (API endpoint)
   └→ Validates user authentication
   └→ Creates order in 'orders' table
   └→ Creates order_items in database
   └→ Calls ZenoPay API for payment

8. ZenoPay sends prompt to user's phone
   └→ User enters M-Pesa PIN
   └→ Payment confirmed

9. ZenoPay webhook → /api/payments/webhooks
   └→ Updates order status to 'paid'
   └→ Sends confirmation email (SendPulse)
   └→ Sends admin notification
   └→ Clears user's cart

10. User sees success page
    └→ Shows order confirmation
    └→ Display order number
    └→ Link to track order
```

---

## 🗄️ Database Tables (Simplified)

```
USERS                    PRODUCTS                ORDERS
─────────────────────   ───────────────────    ────────────────────
id                      id                      id
email                   name                    user_id (→ users)
full_name               price                   total_amount
phone                   description             payment_status
created_at              image_url               status
                        stock_quantity          created_at
                        category_id             
                        
                        ↓ related to ↓
                        
                     ORDER_ITEMS
                     ────────────────────
                     id
                     order_id (→ orders)
                     product_id (→ products)
                     quantity
                     price
```

---

## 🔐 Authentication Flow

```
SIGN UP:
User enters email/password → Supabase creates account 
→ User profile created in database → JWT token issued 
→ Token stored in cookie → User logged in

SIGN IN:
User enters credentials → Supabase verifies 
→ JWT token issued → Token stored in cookie 
→ User logged in

PROTECTED PAGES:
Page loads → Check if JWT cookie exists 
→ If no: redirect to login → If yes: allow access
```

---

## 💳 Payment Flow (Mobile Money)

```
1. User clicks "Pay Now"
2. POST /api/payments/sessions (create session)
3. ZenoPay API called
4. User gets prompt on phone
5. User enters M-Pesa PIN
6. Payment processed
7. Webhook → /api/payments/webhooks
8. Order status updated to 'paid'
9. Email confirmation sent
10. Admin notified
```

---

## 📧 Notification System

```
Event Happens (e.g., new order)
        ↓
notifyAdminOrderCreated() called
        ↓
Check admin recipients from database
        ↓
Filter by categories (orders, payments, etc.)
        ↓
Render email template with order data
        ↓
Send via SendPulse API
        ↓
Log notification in database
```

---

## 🚀 Performance Optimizations

### Already Implemented:
✅ **Image optimization** - LazyImage component
✅ **Bundle size reduction** - 81% smaller (37kB → 7kB)
✅ **Database indexes** - Fast queries
✅ **Structured logging** - Production-ready logs
✅ **Code splitting** - Dynamic imports

### Monitoring:
- Server-side rendering (SSR) for faster initial loads
- Static generation where possible
- API route caching
- Optimistic UI updates

---

## 📚 Documentation Index

**Detailed Guides:**
1. `CLIENT-APP-GUIDE.md` - Client architecture deep dive
2. `ADMIN-APP-GUIDE.md` - Admin dashboard explained
3. `DATABASE-GUIDE.md` - Database schema & queries
4. `API-ROUTES-GUIDE.md` - Backend endpoints
5. `AUTHENTICATION-GUIDE.md` - Auth system details
6. `PAYMENT-SYSTEM-GUIDE.md` - ZenoPay integration
7. `COMPONENT-LIBRARY.md` - Reusable components
8. `STATE-MANAGEMENT.md` - Zustand stores

---

## 🎯 Next Steps

**To understand specific parts, tag files:**
```
@/client/app/page.tsx          - Homepage
@/client/components/ui/        - UI components
@/client/lib/supabase.ts       - Database client
@/client/store/useCartStore.ts - Cart state
@/client/app/api/orders/       - Orders API
```

I'll explain any file you tag in detail!

---

**Questions? Tag a file or folder and I'll break it down!** 🚀
