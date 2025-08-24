-- Debug and fix user address sync issues
-- Run this in Supabase SQL Editor

-- 1. Check if address columns exist in users table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('address_line_1', 'city', 'country', 'phone')
ORDER BY column_name;

-- 2. Apply migrations if columns don't exist
BEGIN;

-- Add address fields to users table if they don't exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Tanzania';

-- Relax NOT NULL constraints on addresses table
ALTER TABLE addresses
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN country DROP NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

COMMIT;

-- 3. Check current user data to see what's missing
SELECT id, email, first_name, last_name, phone, address_line_1, city, country, created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check recent orders to see if they have user_id
SELECT id, user_id, total_amount, shipping_address, created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
