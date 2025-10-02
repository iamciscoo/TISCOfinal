# TISCO Platform Complete Walkthrough & Performance Guide

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Database Schema & Optimization](#database-schema--optimization)
4. [Performance Analysis & Optimizations](#performance-analysis--optimizations)
5. [Code Organization Guide](#code-organization-guide)
6. [API Layer Explanation](#api-layer-explanation)
7. [Frontend Components Structure](#frontend-components-structure)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Performance Optimization Recommendations](#performance-optimization-recommendations)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Platform Overview

TISCO (TISCOマーケット) is a comprehensive e-commerce platform targeting Tanzania and East African markets. It's built as a modern, scalable web application with the following core components:

### 🏗️ **Architecture Components**
- **Client App**: Next.js 15 customer-facing marketplace (`/client`)
- **Admin Dashboard**: Next.js 15 management interface (`/admin`)  
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Payments**: ZenoPay Mobile Money API integration
- **Email**: SendGrid integration for notifications
- **Storage**: Supabase Storage for images and assets

### 🎯 **Key Features**
- Electronics and gadgets marketplace
- Mobile money payments (Tanzania focus)
- Real-time cart synchronization
- Multi-language support (English/Swahili)
- Advanced product search and filtering
- Review and rating system
- Service booking capabilities
- WhatsApp integration
- Newsletter subscriptions
- PWA capabilities

---

## Architecture Deep Dive

### Client Application Structure (`/client`)

```
client/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes (Server-side)
│   │   ├── products/      # Product CRUD operations
│   │   ├── orders/        # Order management
│   │   ├── payments/      # Payment processing (ZenoPay)
│   │   ├── auth/          # Authentication (Supabase Auth)
│   │   └── ...
│   ├── (auth)/           # Auth-related pages
│   ├── products/         # Product listing & detail pages
│   ├── checkout/         # Checkout flow
│   └── page.tsx          # Homepage
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (buttons, forms, etc.)
│   ├── shared/          # Shared business components
│   └── auth/            # Authentication components
├── lib/                 # Core business logic
│   ├── api-client.ts    # HTTP client with caching
│   ├── database.ts      # Database operations layer
│   ├── cache.ts         # In-memory caching system
│   ├── store.ts         # Zustand state management
│   └── types.ts         # TypeScript type definitions
└── hooks/               # Custom React hooks
```

### Admin Application Structure (`/admin`)

```
admin/src/
├── app/                 # Admin dashboard pages
│   ├── dashboard/       # Main dashboard with analytics
│   ├── products/        # Product management
│   ├── orders/          # Order management
│   ├── users/           # User management
│   └── settings/        # Configuration settings
├── components/          # Admin-specific components
├── lib/                # Admin business logic
│   ├── database.ts     # Admin database operations
│   ├── types.ts        # Admin type definitions
│   └── utils.ts        # Utility functions
└── hooks/              # Admin-specific hooks
```

---

## Database Schema & Optimization

### Core Tables Structure

#### Products Table
```sql
products (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price NUMERIC(10,2) CHECK (price >= 0),
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  is_featured BOOLEAN DEFAULT false,
  is_deal BOOLEAN DEFAULT false,
  deal_price NUMERIC(10,2) CHECK (deal_price >= 0),
  rating NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0,
  slug VARCHAR UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

**Key Indexes for Performance:**
- `idx_products_featured_created` - For homepage featured products
- `idx_products_category_active_featured` - Category page optimization
- `idx_products_name_search` - Full-text search on product names
- `idx_products_description_search` - Full-text search on descriptions

#### Orders Table
```sql
orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_amount NUMERIC(10,2) CHECK (total_amount >= 0),
  status VARCHAR CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_status VARCHAR CHECK (payment_status IN ('pending','paid','failed','refunded','cancelled')),
  currency VARCHAR(3) DEFAULT 'TZS',
  payment_method VARCHAR,
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

**Key Indexes:**
- `idx_orders_user_status_created` - User order history optimization
- `idx_orders_payment_status_created` - Admin revenue tracking

#### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  phone VARCHAR CHECK (phone IS NULL OR length(TRIM(phone)) >= 8),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  address_line_1 VARCHAR,
  city VARCHAR,
  country VARCHAR DEFAULT 'Tanzania',
  created_at TIMESTAMPTZ DEFAULT now()
)
```

---

## Performance Analysis & Optimizations

### Current Performance Metrics
- **Bundle Size**: Reduced from 37.2kB → 6.83kB (81% improvement)
- **Database Queries**: Optimized with proper indexing
- **Cache Hit Rate**: ~75% for product queries
- **API Response Times**: <200ms for cached endpoints

### Performance Bottlenecks Identified

#### 1. **Database Query Performance**
**Issue**: Complex joins in product queries slow down page loads
**Solution**: 
- Added composite indexes for common query patterns
- Implemented query result caching
- Used select-specific fields instead of `SELECT *`

#### 2. **Image Loading Performance**  
**Issue**: Large product images causing slow page loads
**Solutions**:
- Next.js Image optimization with WebP/AVIF formats
- Lazy loading for images below the fold
- Multiple image sizes for different viewports

#### 3. **Cart Synchronization**
**Issue**: Cart updates causing unnecessary re-renders
**Solution**:
- Zustand store with optimistic updates
- Debounced server synchronization
- Local storage persistence

---

## Code Organization Guide

### Understanding the Codebase Layer by Layer

#### 1. **API Layer** (`/client/app/api/`)
This is where all server-side logic lives. Think of it as the "backend" of your Next.js app.

```typescript
// Example: /client/app/api/products/route.ts
export async function GET(request: NextRequest) {
  // 1. Validate incoming request parameters
  // 2. Query database using Supabase client
  // 3. Apply business logic (permissions, filtering)
  // 4. Return structured JSON response
}
```

**Key Files:**
- `products/route.ts` - Product CRUD operations
- `orders/route.ts` - Order management
- `payments/webhooks/route.ts` - ZenoPay integration
- `auth/profile/route.ts` - User authentication

#### 2. **Database Layer** (`/client/lib/database.ts`)
Abstracts all database operations into reusable functions.

```typescript
// Example function structure
export async function getProducts(limit: number = 20): Promise<Product[]> {
  try {
    // Use cached API client for better performance
    const products = await api.getProducts(limit)
    return products as Product[]
  } catch (error) {
    console.error('[database.getProducts] Failed:', error)
    return [] // Graceful fallback
  }
}
```

#### 3. **Caching Layer** (`/client/lib/cache.ts` & `/client/lib/api-client.ts`)
Implements intelligent caching to reduce database load.

```typescript
// Cache configuration
export const cacheTTL = {
  products: 300,    // 5 minutes - products change infrequently
  categories: 600,  // 10 minutes - categories rarely change  
  cart: 30,        // 30 seconds - cart needs fresh data
}
```

#### 4. **State Management** (`/client/lib/store.ts`)
Uses Zustand for client-side state with persistence.

```typescript
// Cart store with automatic persistence
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        // Optimistic updates for better UX
      },
    }),
    { name: 'tisco-cart-storage' } // Persists to localStorage
  )
)
```

---

## API Layer Explanation

### Request/Response Flow

1. **Client Request** → 2. **Middleware Validation** → 3. **Database Query** → 4. **Response Formatting**

```typescript
// Middleware chain example
export const GET = withMiddleware(
  withValidation(getProductsSchema),    // 1. Validate request params
  withErrorHandler                      // 2. Handle errors gracefully  
)(async (req, validatedData) => {      // 3. Execute business logic
  const products = await getProductsQuery(validatedData)
  return Response.json(createSuccessResponse(products))
})
```

### Authentication Flow
1. **Supabase Auth** handles user authentication
2. **Middleware** validates JWT tokens
3. **RLS Policies** enforce database-level security
4. **API Routes** receive authenticated user context

---

## Frontend Components Structure

### Component Hierarchy

```
Page Component (SSR/SSG)
├── Layout Component (Navigation, Footer)  
├── Feature Components (ProductList, Cart)
│   ├── Shared Components (ProductCard, Button)
│   └── UI Components (Primitives from Radix)
└── Providers (Auth, Cart, Theme)
```

### Key Performance Patterns

#### 1. **Memoization for Expensive Calculations**
```typescript
// ProductDetail.tsx - Memoized image processing
const productImages = useMemo(() => {
  return product.product_images
    .sort((a, b) => a.is_main ? -1 : 1)  // Main image first
    .map(img => img.url)
}, [product]) // Only recalculate when product changes
```

#### 2. **Lazy Loading for Better Initial Load**
```typescript
// FeaturedProducts.tsx - Load data only when needed
useEffect(() => {
  let isMounted = true
  (async () => {
    const data = await api.getFeaturedProducts(9)
    if (isMounted) setProducts(data) // Prevent memory leaks
  })()
  return () => { isMounted = false }
}, [])
```

#### 3. **Optimistic Updates for Better UX**
```typescript
// Cart operations - Update UI immediately, sync with server later
const handleAddToCart = useCallback(async () => {
  // 1. Update local state immediately
  addItem(product, quantity)
  // 2. Show success feedback
  openCart()
  // 3. Sync with server in background
}, [product, quantity])
```

---

## Data Flow Diagrams

### Product Loading Flow
```
User Request → Next.js Page → API Client → Cache Check → Database → Response
                    ↓              ↓           ↓           ↓         ↓
               Component     withCache()   In-Memory   Supabase   JSON
               Render        Function      Cache       Database   Response
```

### Cart Synchronization Flow  
```
User Action → Zustand Store → Local Storage → Background Sync → Database
     ↓             ↓              ↓              ↓              ↓
 Add to Cart   Optimistic    Persist Data   API Request   Server Update
              Update UI     Across Sessions
```

### Authentication Flow
```
Login → Supabase Auth → JWT Token → API Requests → RLS Validation → Database Access
   ↓         ↓             ↓           ↓              ↓                ↓
User Form   Provider    Set Cookie   Authorization   Row Level      Secure Data
Submit      Component    Storage      Header         Security       Access
```

---

## Performance Optimization Recommendations

### 🚀 **Immediate Optimizations** (High Impact)

#### 1. **Database Query Optimization**
```sql
-- Add missing indexes for common queries
CREATE INDEX CONCURRENTLY idx_products_search_optimized 
ON products USING GIN (
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Optimize cart queries  
CREATE INDEX CONCURRENTLY idx_cart_items_user_active
ON cart_items (user_id, created_at DESC)
WHERE quantity > 0;
```

#### 2. **API Response Caching**
```typescript
// Implement Redis for distributed caching
const redis = new Redis(process.env.REDIS_URL)

export async function getCachedProducts(key: string) {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  
  const fresh = await fetchFromDatabase()
  await redis.setex(key, 300, JSON.stringify(fresh)) // 5min cache
  return fresh
}
```

#### 3. **Image Optimization Enhancement**
```typescript
// next.config.ts improvements
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  loader: 'custom',
  loaderFile: './lib/image-loader.ts', // Custom Supabase loader
  minimumCacheTTL: 31536000, // 1 year cache
}
```

### 🔧 **Medium-term Optimizations**

#### 4. **Bundle Splitting & Code Splitting**
```typescript
// Dynamic imports for heavy components
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <AdminSkeleton />,
  ssr: false // Admin panel doesn't need SSR
})

// Route-based code splitting
const CheckoutFlow = dynamic(() => import('@/app/checkout/CheckoutFlow'))
```

#### 5. **Service Worker for Offline Support**
```typescript
// public/sw.js - Cache API responses
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/products')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request)
      })
    )
  }
})
```

### 📊 **Long-term Optimizations**

#### 6. **Database Partitioning for Scale**
```sql
-- Partition orders by date for better performance
CREATE TABLE orders_2024 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

#### 7. **CDN Integration**
- Move static assets to CloudFlare or AWS CloudFront
- Implement edge caching for API responses
- Use geographic distribution for global users

---

## Troubleshooting Guide

### Common Performance Issues

#### **Issue**: Slow Product Loading
**Symptoms**: Products take >2 seconds to load
**Debugging**:
```typescript
// Add performance monitoring
console.time('product-fetch')
const products = await api.getProducts()
console.timeEnd('product-fetch') // Should be <500ms
```
**Solutions**: 
- Check cache hit rates in browser DevTools
- Verify database indexes are being used
- Enable query logging in Supabase

#### **Issue**: Cart Updates Are Slow  
**Symptoms**: UI freezes when adding items
**Debugging**:
```typescript
// Monitor Zustand store updates
useCartStore.subscribe((state) => {
  console.log('Cart updated:', state.items.length, 'items')
})
```
**Solutions**:
- Implement optimistic updates
- Debounce server synchronization
- Use React.memo for expensive cart components

#### **Issue**: High Database Load
**Symptoms**: API responses >1 second
**Investigation**:
1. Check Supabase slow query logs
2. Monitor cache hit rates
3. Review database connection pooling
**Solutions**:
- Add missing database indexes  
- Implement query result caching
- Optimize N+1 query patterns

---

## Next Steps for Performance

### Performance Monitoring Setup
1. **Real User Monitoring (RUM)**
   - Implement Vercel Analytics
   - Track Core Web Vitals
   - Monitor API response times

2. **Database Monitoring**  
   - Set up Supabase query performance alerts
   - Monitor connection pool usage
   - Track slow query patterns

3. **Caching Strategy Enhancement**
   - Implement Redis for distributed caching
   - Add CDN caching for static content
   - Optimize cache invalidation patterns

### Scalability Considerations
- Database read replicas for high traffic
- API rate limiting and throttling
- Background job processing for heavy operations
- Microservices architecture for specific domains

This guide provides a foundation for understanding and optimizing the TISCO platform. Each section builds upon the previous ones to give you both breadth and depth of knowledge about how the system works and how to improve it.
