# API Endpoints Documentation

## Overview

TISCO uses Next.js API routes for both client and admin applications. All endpoints follow RESTful conventions with proper error handling, validation, and caching.

## Client API Endpoints (`/client/app/api/`)

### Products API

#### `GET /api/products`
**Purpose**: Retrieve paginated product listings with filtering

**Query Parameters**:
- `limit`: Number of products (1-100, default: 20)
- `offset`: Starting position (default: 0)
- `category`: UUID filter by category
- `featured`: Boolean filter for featured products

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Description",
      "price": 99.99,
      "image_url": "https://...",
      "stock_quantity": 10,
      "is_featured": true,
      "rating": 4.5,
      "reviews_count": 23,
      "categories": {
        "id": "uuid",
        "name": "Category Name"
      },
      "product_images": [
        {
          "url": "https://...",
          "is_main": true,
          "sort_order": 0
        }
      ]
    }
  ]
}
```

**Caching**: 10 minutes (`s-maxage=600`)

#### `GET /api/products/[id]`
**Purpose**: Get single product details

**Response**: Single product object with full details

#### `GET /api/products/featured`
**Purpose**: Get featured products for homepage

**Response**: Array of featured products

#### `GET /api/products/search`
**Purpose**: Search products by query

**Query Parameters**:
- `q`: Search query string
- `category`: Category filter
- `sort`: Sort by (price, name, rating, date)

**Note**: Implements full-text search across product names and descriptions

### Categories API

#### `GET /api/categories`
**Purpose**: Get all product categories

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "description": "Electronic devices",
      "image_url": "https://...",
      "product_count": 45
    }
  ]
}
```

**Caching**: 10 minutes

### Orders API

#### `POST /api/orders`
**Purpose**: Create new order (Pay at Office)

**Request Body**:
```json
{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_line_1": "123 Main St",
    "city": "Dar es Salaam",
    "phone": "+255..."
  },
  "payment_method": "pay_at_office"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "status": "pending",
    "total_amount": 199.98,
    "tracking_number": "TISCO-12345"
  }
}
```

**Flow**: Creates order → Sends customer email → Notifies admin

#### `GET /api/orders/user`
**Purpose**: Get user's order history

**Authentication**: Required (Supabase Auth)

**Response**: Array of user's orders with items

#### `GET /api/orders/[id]`
**Purpose**: Get specific order details

**Authentication**: Required (order owner or admin)

#### `PATCH /api/orders/[id]`
**Purpose**: Update order status (Admin only)

### Payments API

#### `POST /api/payments/initiate`
**Purpose**: Initiate ZenoPay mobile money payment

**Note**: The actual endpoint is `/api/payments/initiate`, not `/api/payments/create-session`

**Request Body**:
```json
{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 1
    }
  ],
  "shipping_address": { /* address object */ },
  "phone_number": "+255748123456"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "session_id": "zenopay_session_id",
    "payment_url": "https://zenopay.co.tz/pay/...",
    "expires_at": "2024-01-01T12:00:00Z"
  }
}
```

#### `POST /api/payments/webhooks`
**Purpose**: Handle ZenoPay payment webhooks

**Authentication**: HMAC signature verification or API key

**Webhook Events**:
- `payment.success` - Payment completed
- `payment.failed` - Payment failed
- `session.expired` - Payment session expired

**Processing Flow**:
1. Verify webhook signature/API key
2. Parse payment data
3. Update order status
4. Create order if session-based payment
5. Send email notifications
6. Notify admin

**Key Functions**:
- `handleSessionPaymentSuccess()` - Creates order from successful payment
- `handleTransactionUpdate()` - Updates existing order payment status

#### `GET /api/payments/status/[session_id]`
**Purpose**: Check payment session status

### Authentication API

#### `POST /api/auth/profile`
**Purpose**: Update user profile

**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+255748123456", // Never empty string, use null
  "password": "new_password" // Optional
}
```

**Note**: Phone field uses `null` instead of empty strings due to DB constraint

#### `GET /api/auth/session`
**Purpose**: Get current user session

### Reviews API

#### `POST /api/reviews`
**Purpose**: Submit product review

**Request Body**:
```json
{
  "product_id": "uuid",
  "rating": 5,
  "title": "Great product!",
  "comment": "Really satisfied with the purchase"
}
```

**Authentication**: Required

**Business Logic**: 
- User must have purchased the product
- One review per user per product
- Creates user record if doesn't exist (phone: null pattern)

#### `GET /api/reviews/product/[id]`
**Purpose**: Get reviews for specific product

### Service Bookings API

#### `POST /api/service-bookings`
**Purpose**: Book a service (PC building, repair, etc.)

**Request Body**:
```json
{
  "service_type": "PC Building",
  "description": "Custom gaming PC",
  "preferred_date": "2024-01-15",
  "preferred_time": "10:00",
  "contact_email": "user@email.com",
  "contact_phone": "+255...",
  "customer_name": "John Doe"
}
```

#### `GET /api/service-bookings/user`
**Purpose**: Get user's service bookings

### Newsletter API

#### `POST /api/newsletter/subscribe`
**Purpose**: Subscribe to newsletter

**Request Body**:
```json
{
  "email": "user@email.com",
  "name": "John Doe"
}
```

#### `POST /api/newsletter/unsubscribe`
**Purpose**: Unsubscribe from newsletter

### Contact & Support

#### `POST /api/contact-messages`
**Purpose**: Submit contact form

#### `GET /api/unsubscribe/[token]`
**Purpose**: Unsubscribe from emails via token

### Notifications API

#### `POST /api/notifications/order-created`
**Purpose**: Send order confirmation emails

#### `POST /api/notifications/payment-success`
**Purpose**: Send payment success notifications

#### `POST /api/notifications/payment-failed`
**Purpose**: Send payment failure notifications

#### `POST /api/notifications/manual`
**Purpose**: Send manual admin notifications

## Admin API Endpoints (`/admin/src/app/api/`)

### Dashboard Analytics

#### `GET /api/analytics/dashboard`
**Purpose**: Get admin dashboard data

**Response**:
```json
{
  "stats": {
    "totalProducts": 150,
    "totalOrders": 1200,
    "totalUsers": 850,
    "totalRevenue": 125000,
    "productRevenue": 100000,
    "serviceRevenue": 25000,
    "pendingOrders": 15,
    "lowStockProducts": 8
  },
  "recentOrders": [...],
  "topProducts": [...],
  "recentUsers": [...]
}
```

#### `GET /api/analytics/revenue`
**Purpose**: Get revenue analytics

#### `GET /api/analytics/orders`
**Purpose**: Get order analytics

### Admin Product Management

#### `POST /api/products`
**Purpose**: Create new product

#### `PUT /api/products/[id]`
**Purpose**: Update product

#### `DELETE /api/products/[id]`
**Purpose**: Delete product

### Admin Order Management

#### `GET /api/orders`
**Purpose**: Get all orders (admin view)

#### `PATCH /api/orders/[id]/status`
**Purpose**: Update order status

**Request Body**:
```json
{
  "status": "confirmed", // pending, confirmed, processing, shipped, delivered, cancelled
  "tracking_number": "TRACK123" // Optional
}
```

### Admin User Management

#### `GET /api/users`
**Purpose**: Get all users

#### `GET /api/users/[id]`
**Purpose**: Get specific user details

#### `PATCH /api/users/[id]`
**Purpose**: Update user details

### Admin Notifications

#### `POST /api/notifications/manual-email`
**Purpose**: Send manual email notifications to specific recipients

**Request Body**:
```json
{
  "recipient_email": "user@email.com",
  "subject": "Notification Subject",
  "title": "Email Title",
  "message": "Email message content",
  "priority": "high"
}
```

#### `GET /api/admin/notifications`
**Purpose**: Get notification history and logs

#### `GET /api/admin/notifications/stats`
**Purpose**: Get notification statistics

## API Middleware & Patterns

### Error Handling
```typescript
// Standardized error responses
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* additional info */ }
}
```

### Validation
- **Zod schemas** for request validation
- **Type safety** with TypeScript
- **Sanitization** of user inputs

### Authentication Flow
1. **Client requests** with Supabase session token
2. **Server validates** token with Supabase
3. **RLS policies** enforce data access rules
4. **Service role** for admin operations

### Caching Strategy
- **Product listings**: 10 minutes
- **Categories**: 10 minutes  
- **User-specific data**: No caching
- **CDN headers** for static content

### Rate Limiting
- **Webhook endpoints**: Signature verification
- **Public APIs**: Usage monitoring
- **Admin APIs**: Role-based access control

### Database Patterns
- **Batch operations** for performance
- **Graceful fallbacks** for missing data
- **Defensive coding** for Supabase relation naming
- **Transaction consistency** for order creation

## Security Features

### Webhook Security
```typescript
// HMAC signature verification
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')
```

### Input Validation
- **Zod schemas** for type safety
- **SQL injection** prevention via Supabase
- **XSS protection** via input sanitization

### Access Control
- **Row Level Security** at database level
- **JWT token validation** for protected routes
- **Role-based permissions** for admin functions

This comprehensive API documentation provides a complete overview of all endpoints, their purposes, request/response formats, and security considerations.
