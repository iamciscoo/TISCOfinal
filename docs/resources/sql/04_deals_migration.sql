-- TISCO Market - Complete Deals Feature Migration
-- Run this SQL script in your Supabase SQL Editor to add all deal functionality

-- =====================================================
-- STEP 1: Add Deal Fields to Products Table
-- =====================================================

-- Add deal-related columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_deal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deal_price DECIMAL(10,2) CHECK (deal_price >= 0),
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) CHECK (original_price >= 0);

-- Add performance index for deal queries
CREATE INDEX IF NOT EXISTS idx_products_is_deal ON products(is_deal);

-- Add constraint to ensure proper deal pricing
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_deal_pricing;
ALTER TABLE products ADD CONSTRAINT check_deal_pricing 
CHECK (
  NOT is_deal OR 
  (original_price IS NOT NULL AND deal_price IS NOT NULL AND original_price > deal_price)
);

-- =====================================================
-- STEP 2: Add Missing Product Fields (if not exists)
-- =====================================================

-- Add other product fields that may be missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS reviews_count INTEGER CHECK (reviews_count >= 0),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags TEXT[], 
ADD COLUMN IF NOT EXISTS slug VARCHAR(200);

-- Handle existing slug constraint/index properly
DO $$ 
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'products_slug_key' 
               AND table_name = 'products') THEN
        ALTER TABLE products DROP CONSTRAINT products_slug_key;
    END IF;
    
    -- Drop index if it exists
    DROP INDEX IF EXISTS products_slug_key;
    DROP INDEX IF EXISTS idx_products_slug;
END $$;

-- Create new unique index for slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;

-- Generate slugs for existing products that don't have them
UPDATE products 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '''', ''), '.', ''))
WHERE slug IS NULL AND name IS NOT NULL;

-- Ensure rating and reviews_count have no defaults and are nullable
ALTER TABLE products 
  ALTER COLUMN rating DROP DEFAULT,
  ALTER COLUMN rating DROP NOT NULL,
  ALTER COLUMN reviews_count DROP DEFAULT,
  ALTER COLUMN reviews_count DROP NOT NULL;

-- =====================================================
-- STEP 3: Update RLS Policies for Deal Fields
-- =====================================================

-- Enable RLS on products table (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with deal fields
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;

-- Recreate policies to include deal fields
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- STEP 4: Create Sample Deal Products (Optional)
-- =====================================================

-- Update some existing products to be deals (optional - for testing)
-- You can uncomment these lines if you want sample data

/*
UPDATE products 
SET 
    is_deal = true,
    original_price = price * 1.3,
    deal_price = price
WHERE id IN (
    SELECT id FROM products 
    WHERE is_deal = false 
    LIMIT 3
);
*/

-- =====================================================
-- STEP 5: Add Indexes for Performance
-- =====================================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_category_deal ON products(category_id, is_deal);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- =====================================================
-- STEP 6: Update Product Images Table (if needed)
-- =====================================================

-- Ensure product_images table exists with proper structure
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for product images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_main ON product_images(is_main);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(sort_order);

-- Enable RLS on product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_images
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON product_images;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON product_images;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON product_images;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON product_images;

CREATE POLICY "Product images are viewable by everyone" ON product_images
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON product_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON product_images
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON product_images
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- STEP 7: Create Trigger for Updated At
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to product_images table
DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify the migration worked:

-- Check if deal columns exist
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name IN ('is_deal', 'deal_price', 'original_price');

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'products' 
-- AND indexname LIKE '%deal%';

-- Check constraints
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'products'::regclass 
-- AND conname LIKE '%deal%';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- After running this migration:
-- 1. Your deals API endpoint will work
-- 2. Admin forms can create/edit deal products
-- 3. Deals page will display real deal products
-- 4. All constraints and indexes are in place

SELECT 'Deals feature migration completed successfully!' as status;
