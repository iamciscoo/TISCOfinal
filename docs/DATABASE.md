# Database Schema & Data Models

## Overview

TISCO uses Supabase (PostgreSQL) as its primary database with Row Level Security (RLS) policies for access control. The schema is optimized for e-commerce operations with proper indexing and relationships.

## Core Tables

### Users Table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email varchar UNIQUE NOT NULL,
  first_name varchar,
  last_name varchar,
  phone varchar, -- Constraint: Cannot be empty string, use NULL instead
  avatar_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  address_line_1 varchar,
  address_line_2 varchar,
  city varchar,
  state varchar,
  postal_code varchar,
  country varchar DEFAULT 'Tanzania',
  auth_user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Constraint prevents empty strings and enforces valid phone length
ALTER TABLE users ADD CONSTRAINT chk_users_phone_length 
CHECK (phone IS NULL OR (length(trim(phone)) >= 8 AND length(trim(phone)) <= 20));
```

**Key Features:**
- UUID primary key linked to auth.users
- Phone constraint prevents empty strings and enforces 8-20 character length
- Email validation via check constraint (regex pattern)
- Address fields integrated into users table (no separate addresses table in current schema)
- Avatar URL support for profile pictures

### Products Table
```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category_id uuid REFERENCES categories(id),
  main_image_url text,
  stock_quantity integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_on_sale boolean DEFAULT false,
  sale_price numeric,
  is_deal boolean DEFAULT false,
  deal_price numeric,
  original_price numeric,
  rating numeric(3,2),
  reviews_count integer DEFAULT 0,
  slug text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Features:**
- Flexible pricing (regular, sale, deal pricing)
- SEO-friendly slugs
- Cached rating/review counts for performance
- Stock management

### Categories Table
```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  status text DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  payment_status text DEFAULT 'pending', -- pending, paid, failed, refunded, cancelled
  total_amount numeric NOT NULL,
  shipping_address text NOT NULL, -- JSON string
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL, -- Price at time of purchase
  created_at timestamptz DEFAULT now()
);
```

**Note:** Admin interface accesses `price` field (not `unit_price` as initially coded)

### Cart Items Table
```sql
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);
```

### Reviews Table
```sql
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  product_id uuid NOT NULL REFERENCES products(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Addresses Table
```sql
CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text DEFAULT 'shipping', -- shipping, billing
  first_name text,
  last_name text,
  company text,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text,
  postal_code text,
  country text,
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Note**: While the addresses table exists in the schema, user address fields are also stored directly in the users table for convenience. The separate addresses table allows for multiple shipping/billing addresses per user.

## Extended Tables

### Service Bookings
```sql
CREATE TABLE service_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id uuid REFERENCES services(id),
  user_id uuid REFERENCES users(id),
  service_type text NOT NULL,
  description text,
  preferred_date date,
  preferred_time time,
  contact_email text NOT NULL,
  contact_phone text,
  customer_name text NOT NULL,
  status text DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
  total_amount numeric,
  payment_status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Product Images
```sql
CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  path text,
  is_main boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

## Relationships & Constraints

### Foreign Key Relationships
```
users (1) ←→ (N) orders
users (1) ←→ (N) cart_items  
users (1) ←→ (N) reviews
users (1) ←→ (N) addresses
users (1) ←→ (N) service_bookings

products (1) ←→ (N) order_items
products (1) ←→ (N) cart_items
products (1) ←→ (N) reviews
products (1) ←→ (N) product_images

orders (1) ←→ (N) order_items

categories (1) ←→ (N) products
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
```

## Row Level Security (RLS) Policies

### Users Table
- Users can read/update their own profile
- Admins can read all users

### Orders Table  
- Users can read their own orders
- Admins can read/update all orders

### Cart Items Table
- Users can manage their own cart items
- Real-time sync enabled

### Products Table
- Public read access
- Admin-only write access

### Reviews Table
- Users can create reviews for purchased products
- Public read access for approved reviews

## TypeScript Types

The database schema is fully typed with generated TypeScript definitions:

```typescript
// Generated from database schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null  // Never empty string due to constraint
          role: string | null
          created_at: string | null
          updated_at: string | null
        }
        // Insert and Update types...
      }
      // Other tables...
    }
  }
}
```

## Database Patterns

### Data Consistency
- **Phone Numbers**: Always use `null` instead of empty strings
- **Pricing**: Store price at time of purchase in order_items
- **Timestamps**: Automatic `created_at` and manual `updated_at`

### Supabase Relation Queries
- **Admin Queries**: Handle both `product` and `products` naming conventions
- **Defensive Coding**: `const product = item.products || item.product`
- **Explicit Field Selection**: Specify fields instead of `*` for consistency

### Performance Optimizations
- **Batch User Fetching**: `getUsersByIds()` for order/booking listings
- **Calculated Fields**: Cache rating/review counts on products
- **Pagination**: Limit and offset for large datasets
- **Graceful Fallbacks**: Return empty arrays instead of throwing errors

## Migration Notes

- Products table uses `price` field (not `unit_price`)
- Categories may or may not have `slug` field (graceful fallback implemented)
- Phone constraint prevents data integrity issues
- Order items store price snapshot for historical accuracy
