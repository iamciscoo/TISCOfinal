-- TISCO Market Database Updates
-- Run these commands in your Supabase SQL Editor to update the database

-- Step 1: Update Products Table with missing fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS reviews_count INTEGER CHECK (reviews_count >= 0),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2) CHECK (sale_price >= 0),
ADD COLUMN IF NOT EXISTS is_deal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deal_price DECIMAL(10,2) CHECK (deal_price >= 0),
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) CHECK (original_price >= 0),
ADD COLUMN IF NOT EXISTS tags TEXT[], 
ADD COLUMN IF NOT EXISTS slug VARCHAR(200) UNIQUE;

-- Ensure rating and reviews_count have no defaults and are nullable
ALTER TABLE products 
  ALTER COLUMN rating DROP DEFAULT,
  ALTER COLUMN rating DROP NOT NULL,
  ALTER COLUMN reviews_count DROP DEFAULT,
  ALTER COLUMN reviews_count DROP NOT NULL;

-- Generate slugs for existing products
UPDATE products 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '''', ''))
WHERE slug IS NULL;

-- Step 2: Update Orders Table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

-- Step 3: Create Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Ensure moderation support
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Step 6: Create Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  features TEXT[],
  duration VARCHAR(50),
  image TEXT,
  gallery TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 
-- Step 6b: Drop deprecated service columns (safe to rerun)
ALTER TABLE services DROP COLUMN IF EXISTS price_range;
ALTER TABLE services DROP COLUMN IF EXISTS requirements;
ALTER TABLE services DROP COLUMN IF EXISTS is_popular;

-- Step 7: Create Service Bookings table
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL,
  description TEXT,
  preferred_date DATE,
  preferred_time TIME,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  customer_name VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Update Orders table structure (careful with existing data)
-- Note: Only run this if you don't have important order data
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES addresses(id);
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address_id UUID REFERENCES addresses(id);

-- Step 9: Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_products_is_deal ON products(is_deal);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_service_id ON service_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user_id ON service_bookings(user_id);

-- Step 10: Enable RLS on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS Policies
-- Users policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);
  END IF;
END $$;

-- Addresses policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'Users can view own addresses'
  ) THEN
    CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'Users can insert own addresses'
  ) THEN
    CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'Users can update own addresses'
  ) THEN
    CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE USING (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'Users can delete own addresses'
  ) THEN
    CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- Reviews policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Anyone can read reviews'
  ) THEN
    CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Users can insert own reviews'
  ) THEN
    CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Users can update own reviews'
  ) THEN
    CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Users can delete own reviews'
  ) THEN
    CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- Services policies (public read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'Allow public read on services'
  ) THEN
    CREATE POLICY "Allow public read on services" ON services FOR SELECT USING (true);
  END IF;
END $$;

-- Service bookings policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_bookings' AND policyname = 'Users can view own bookings'
  ) THEN
    CREATE POLICY "Users can view own bookings" ON service_bookings FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_bookings' AND policyname = 'Users can insert own bookings'
  ) THEN
    CREATE POLICY "Users can insert own bookings" ON service_bookings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_bookings' AND policyname = 'Users can update own bookings'
  ) THEN
    CREATE POLICY "Users can update own bookings" ON service_bookings FOR UPDATE USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- Step 12: Insert Sample Data
-- Removed random seeding of product ratings and reviews_count to avoid fabricated data.
-- If you need to seed product merchandising fields (e.g., is_featured, is_on_sale),
-- do so explicitly without touching rating or reviews_count.

-- Insert sample services
INSERT INTO services (title, description, features, duration, image, gallery) VALUES
('PC Building Service', 'Professional custom PC building and setup service', 
 ARRAY['Hardware selection consultation', 'Professional assembly', 'OS installation and setup', 'Performance testing and optimization', 'Cable management', '1-year build warranty'], 
 '2-4 hours', '/services/pcbuild.jpeg', ARRAY['/services/pcbuild.jpeg','/services/gaming-pc-build.jpeg']),
('Software Installation & Setup', 'Complete software setup and configuration service', 
 ARRAY['Operating system setup', 'Essential software installation', 'Driver updates', 'Security software setup', 'System optimization', 'User training'], 
 '1-3 hours', '/services/software.jpeg', ARRAY['/services/software.jpeg']),
('Workstation Setup Service', 'Complete workstation setup and organization', 
 ARRAY['Ergonomic workspace design', 'Professional cable management', 'Monitor calibration', 'Lighting optimization', 'Desk organization', 'Productivity tools setup'], 
 '2-3 hours', '/services/desksetup.jpeg', ARRAY['/services/desksetup.jpeg'])
ON CONFLICT DO NOTHING;

-- Step 13: Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_bookings_updated_at ON service_bookings;
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Create Product Images table for multi-image support
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  path TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_is_main ON product_images(product_id, is_main);

-- RLS and policies
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
-- Public read (for storefront)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_images'
      AND policyname = 'Allow public read on product_images'
  ) THEN
    CREATE POLICY "Allow public read on product_images" ON product_images FOR SELECT USING (true);
  END IF;
END $$;

-- Optional: ensure at most one main image per product via trigger (enforced in API too)
-- This trigger resets other images' is_main when one is set to true
CREATE OR REPLACE FUNCTION enforce_single_main_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_main THEN
    UPDATE product_images SET is_main = FALSE WHERE product_id = NEW.product_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_main_image ON product_images;
CREATE TRIGGER trg_single_main_image
AFTER INSERT OR UPDATE OF is_main ON product_images
FOR EACH ROW EXECUTE FUNCTION enforce_single_main_image();
