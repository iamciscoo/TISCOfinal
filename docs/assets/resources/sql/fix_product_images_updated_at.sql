-- Fix product_images table to include updated_at field
-- This resolves the error: record "new" has no field "updated_at"

-- Add missing updated_at field to product_images table
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for updated_at if it doesn't exist (it should exist from 04_deals_migration.sql)
DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have updated_at = created_at
UPDATE product_images 
SET updated_at = created_at 
WHERE updated_at IS NULL;
