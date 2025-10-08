# User Flows Documentation

## Overview

This document traces the complete user journeys through both the client marketplace and admin dashboard, documenting step-by-step flows with code references and integration points.

## Client Application User Flows

### 1. New Customer Registration & First Purchase

#### Step 1: Homepage Landing
**File**: `/client/app/page.tsx`
```typescript
// Homepage displays featured products, categories, and hero section
const HomePage = () => {
  return (
    <div>
      <HeroSection /> {/* Hero banner with CTA */}
      <FeaturedProducts /> {/* Fetches from /api/products?featured=true */}
      <CategoryGrid /> {/* Displays product categories */}
      <WhatsAppFloat /> {/* Floating WhatsApp support */}
    </div>
  )
}
```

**Integrations**:
- `GET /api/products?featured=true` - Featured products
- `GET /api/categories` - Product categories
- WhatsApp Business API integration -precisely its just a link

#### Step 2: Product Discovery
**Navigation Options**:
1. **Browse Categories** → `/products?category={id}`
2. **Search Products** → `/search?q={query}`
3. **View Product** → `/product/{slug}`

**Product Listing Flow**:
```typescript
// /client/app/products/page.tsx
const ProductsPage = ({ searchParams }) => {
  const { data: products } = useQuery({
    queryKey: ['products', searchParams],
    queryFn: () => fetch('/api/products?' + new URLSearchParams(searchParams))
  })
  
  return <ProductGrid products={products} />
}
```

**API Call**: `GET /api/products?limit=20&offset=0&category={uuid}`

#### Step 3: Product Details & Add to Cart
**File**: `/client/app/product/[slug]/page.tsx`

**Flow**:
1. Product details loaded via `getProductBySlug()`
2. Related products displayed
3. Reviews shown (if any)
4. Add to cart functionality

```typescript
const ProductPage = ({ params }) => {
  const { addToCart } = useCart()
  
  const handleAddToCart = async () => {
    await addToCart({
      product_id: product.id,
      quantity: selectedQuantity
    })
    // Triggers cart sync across tabs
  }
}
```

**API Integration**:
- `GET /api/products/{id}` - Product details
- `POST /api/cart` - Add to cart (if authenticated)
- Local storage fallback for anonymous users

#### Step 4: User Registration (First-time)
**Trigger**: Add to cart or checkout attempt

**Registration Options**:
1. **Email/Password**: Traditional registration form
2. **Google OAuth**: One-click social login

**Email Registration Flow**:
```typescript
// /client/components/auth/ProfileDialog.tsx
const handleSignUp = async (formData) => {
  const { user, error } = await supabaseAuth.signUp(
    formData.email,
    formData.password,
    {
      data: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null // Never empty string
      }
    }
  )
  
  if (user) {
    // Create user record in database
    await fetch('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(formData)
    })
  }
}
```

**Google OAuth Flow**:
1. Click "Sign in with Google"
2. Redirect to Google OAuth consent
3. Return to `/auth/callback`
4. `PasswordResetRedirectHandler` detects OAuth parameters
5. Routes to `/auth/callback` (not reset-callback)
6. New user: Shows `ProfileDialog` with `isPasswordReset={false}`
7. Existing user: Direct redirect to home

**Database Impact**:
- User record created in `users` table
- Cart items moved from local storage to database
- Session established with JWT token

#### Step 5: Cart Management
**File**: `/client/app/cart/page.tsx`

**Features**:
- View cart items
- Update quantities
- Remove items
- Proceed to checkout

**Real-time Sync**:
```typescript
// /client/components/CartRealtime.tsx
useEffect(() => {
  if (!user) return
  
  const subscription = supabase
    .from('cart_items')
    .on('*', payload => {
      // Sync cart changes across tabs/devices
      updateCartState(payload)
    })
    .subscribe()
    
  return () => subscription.unsubscribe()
}, [user])
```

#### Step 6: Checkout Process
**File**: `/client/app/checkout/page.tsx`

**Steps**:
1. **Shipping Address** - Enter/select delivery address
2. **Payment Method** - Choose between Mobile Money or Pay at Office
3. **Order Review** - Final confirmation
4. **Order Placement** - Create order and process payment

**Mobile Money Checkout**:
```typescript
const handleMobileMoneyCheckout = async () => {
  // Create payment session
  const response = await fetch('/api/payments/create-session', {
    method: 'POST',
    body: JSON.stringify({
      items: cartItems,
      shipping_address: shippingAddress,
      phone_number: phoneNumber
    })
  })
  
  const { session_id, payment_url } = await response.json()
  
  // Redirect to ZenoPay
  window.location.href = payment_url
}
```

**Pay at Office Checkout**:
```typescript
const handlePayAtOfficeCheckout = async () => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      items: cartItems,
      shipping_address: shippingAddress,
      payment_method: 'pay_at_office'
    })
  })
  
  const order = await response.json()
  // Order created immediately
  // Customer email sent
  // Admin notification sent
  router.push(`/account/orders/${order.id}`)
}
```

#### Step 7: Payment Processing (Mobile Money)
**ZenoPay Integration**:
1. User redirected to ZenoPay payment page
2. Enters mobile money details (M-Pesa, Tigo Pesa, etc.)
3. Payment processed by ZenoPay
4. Webhook sent to `/api/payments/webhooks`

**Webhook Processing**:
```typescript
// /client/app/api/payments/webhooks/route.ts
export async function POST(req: NextRequest) {
  // Verify webhook signature
  const isValid = verifyWebhookSignature(body, signature)
  if (!isValid) return unauthorized()
  
  const payload = await req.json()
  
  if (payload.event === 'payment.success') {
    await handleSessionPaymentSuccess(payload)
    // Creates order from successful payment session
    // Sends customer confirmation email
    // Sends admin notification
  }
}
```

#### Step 8: Order Confirmation
After successful payment:
1. **Order Created** - Database record with order items
2. **Email Sent** - Order confirmation to customer
3. **Admin Notified** - Email notification to admin
4. **Redirect** - Customer redirected to order success page

### 2. Returning Customer Flow

#### Quick Purchase Flow
1. **Homepage** → Browse or search
2. **Product Selection** → Add to cart (cart synced from previous session)
3. **Checkout** → Saved addresses auto-populated
4. **Payment** → Previous payment method remembered
5. **Confirmation** → Order placed quickly

#### Account Management
**File**: `/client/app/account/page.tsx`

**Features**:
- **Order History** - View past orders and tracking
- **Profile Management** - Update personal information
- **Address Book** - Manage shipping addresses
- **Reviews** - View submitted product reviews

### 3. Service Booking Flow

#### Custom Service Request
**File**: `/client/app/services/page.tsx`

**Services Offered**:
- PC Building
- Office Setup
- Device Repair
- Game Installation

**Booking Process**:
```typescript
const handleServiceBooking = async (formData) => {
  const response = await fetch('/api/service-bookings', {
    method: 'POST',
    body: JSON.stringify({
      service_type: formData.service_type,
      description: formData.description,
      preferred_date: formData.date,
      preferred_time: formData.time,
      contact_email: user.email,
      contact_phone: formData.phone,
      customer_name: `${user.first_name} ${user.last_name}`
    })
  })
  
  // Booking confirmation sent via email
  // Admin notification sent
}
```

### 4. Review Submission Flow

#### Product Review Process
**Trigger**: Post-purchase email or account dashboard

**Requirements**:
- User must have purchased the product
- One review per user per product

```typescript
// /client/app/api/reviews/route.ts
export async function POST(req: NextRequest) {
  const { user } = await getAuthenticatedUser(req)
  
  // Verify purchase history
  const { data: purchases } = await supabase
    .from('order_items')
    .select('product_id')
    .eq('user_id', user.id)
    .eq('product_id', product_id)
  
  if (!purchases.length) {
    return forbidden('Must purchase product to review')
  }
  
  // Create review
  await supabase.from('reviews').insert({
    user_id: user.id,
    product_id,
    rating,
    title,
    comment
  })
}
```

## Admin Dashboard User Flows

### 1. Admin Login & Dashboard

#### Login Process
**File**: `/admin/src/app/login/page.tsx`

**Authentication**:
- Email/password (admin accounts only)
- Role verification after login
- Session management

#### Dashboard Overview
**File**: `/admin/src/app/page.tsx`

**Dashboard Components**:
```typescript
const DashboardPage = async () => {
  const dashboardData = await getDashboardData()
  
  return (
    <div>
      <StatsCards stats={dashboardData.stats} />
      <RevenueChart />
      <RecentOrders orders={dashboardData.recentOrders} />
      <TopProducts products={dashboardData.topProducts} />
      <RecentUsers users={dashboardData.recentUsers} />
    </div>
  )
}
```

**Key Metrics**:
- Total products, orders, users
- Revenue (product + service)
- Pending orders
- Low stock alerts

### 2. Order Management Flow

#### Order Processing Workflow
**File**: `/admin/src/app/orders/page.tsx`

**Order States**:
1. **Pending** - New orders awaiting confirmation
2. **Confirmed** - Order confirmed, being prepared
3. **Processing** - Items being picked/packed
4. **Shipped** - Order dispatched with tracking
5. **Delivered** - Order completed
6. **Cancelled** - Order cancelled

**Order Detail Management**:
```typescript
// /admin/src/app/orders/[id]/page.tsx
const OrderDetailPage = async ({ params }) => {
  const order = await getOrderById(params.id)
  
  return (
    <div>
      <OrderHeader order={order} />
      <OrderItems items={order.order_items} /> {/* Handles product name display issue */}
      <ShippingInfo address={order.shipping_address} />
      <StatusUpdateForm orderId={order.id} />
    </div>
  )
}
```

**Status Update Flow**:
```typescript
const updateOrderStatus = async (orderId, newStatus) => {
  await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus })
  })
  
  // Triggers customer email notification
  // Updates order tracking
}
```

### 3. Product Management Flow

#### Product Creation
**File**: `/admin/src/app/products/create/page.tsx`

**Product Form Fields**:
- Basic info (name, description, price)
- Category assignment
- Image uploads
- Inventory management
- SEO fields (slug, meta description)

**Product Update Process**:
```typescript
const handleProductUpdate = async (productData) => {
  const response = await fetch(`/api/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  })
  
  // Updates search index
  // Triggers cache invalidation
  // Notifies of stock changes if applicable
}
```

### 4. User Management Flow

#### Customer Support View
**File**: `/admin/src/app/users/page.tsx`

**User Information**:
- Registration details
- Order history
- Contact information
- Account status

**User Detail View**:
```typescript
// /admin/src/app/users/[id]/page.tsx
const UserDetailPage = async ({ params }) => {
  const user = await getUserById(params.id)
  const orders = await getOrdersByUser(params.id)
  const activity = await getUserMonthlyOrderActivity(params.id)
  
  return (
    <div>
      <UserProfile user={user} />
      <OrderHistory orders={orders} />
      <ActivityChart data={activity} />
    </div>
  )
}
```

### 5. Analytics & Reporting Flow

#### Revenue Analytics
**File**: `/admin/src/app/revenue/page.tsx`

**Analytics Features**:
- Revenue trends (daily, weekly, monthly)
- Product performance
- Service booking revenue
- Geographic analysis (if available)

**Data Aggregation**:
```typescript
const getRevenueAnalytics = async () => {
  const productRevenue = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .eq('payment_status', 'paid')
  
  const serviceRevenue = await supabase
    .from('service_bookings') 
    .select('total_amount, created_at')
    .eq('payment_status', 'paid')
    
  return aggregateByTimeframe(productRevenue, serviceRevenue)
}
```

## Integration Flows

### 1. Email Notification System

#### Order Confirmation Flow
```typescript
// Triggered by: Order creation (pay at office) or payment success (mobile money)
const sendOrderConfirmation = async (orderData) => {
  const template = generateOrderConfirmationEmail(orderData)
  
  await sendEmail({
    to: orderData.customer_email,
    subject: `Order Confirmation #${orderData.order_id}`,
    html: template
  })
}
```

**Email Templates** (Dark mode compatible):
- Order confirmation
- Payment success/failure
- Order status updates
- Password reset
- Welcome emails

#### Admin Notification Flow
```typescript
// /client/lib/notifications/service.ts
export const notifyAdminOrderCreated = async (orderData) => {
  const adminEmails = await getAdminEmailAddresses()
  
  for (const email of adminEmails) {
    await sendEmail({
      to: email,
      subject: `New Order: #${orderData.order_id}`,
      html: generateAdminOrderNotification(orderData)
    })
  }
}
```

### 2. Real-time Sync System

#### Cart Synchronization
```typescript
// Syncs cart across devices and tabs
const CartRealtime = () => {
  useEffect(() => {
    const subscription = supabase
      .from('cart_items')
      .on('*', (payload) => {
        updateLocalCartState(payload)
        showToast('Cart updated')
      })
      .subscribe()
  }, [])
}
```

#### Authentication Sync
```typescript
// Syncs auth state across tabs
const AuthSync = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        updateAuthState(session)
      }
    )
  }, [])
}
```

### 3. Payment Integration Flows

#### ZenoPay Mobile Money Integration
**Session Creation**:
1. User selects mobile money payment
2. System creates ZenoPay session
3. User redirected to ZenoPay portal
4. Payment processed
5. Webhook confirms payment
6. Order created and notifications sent

**Webhook Verification**:
```typescript
const verifyWebhookSignature = (body: string, signature: string) => {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}
```

This comprehensive flow documentation traces every major user journey through both applications, showing how components interact, APIs are called, and business logic is executed. Each flow is designed with error handling, security, and user experience as primary considerations.
