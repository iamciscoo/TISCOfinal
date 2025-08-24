-- Complete fix for user address sync issues
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check current schema
DO $$
BEGIN
    RAISE NOTICE 'Checking users table schema...';
END $$;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('address_line_1', 'city', 'country', 'phone', 'first_name', 'last_name')
ORDER BY column_name;

-- Step 2: Apply all necessary migrations
BEGIN;

-- Add address fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Tanzania';

-- Ensure phone column exists and is nullable
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Relax constraints on addresses table
ALTER TABLE addresses
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN country DROP NOT NULL;

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

COMMIT;

-- Step 3: Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'Migration completed. Verifying schema...';
END $$;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('address_line_1', 'city', 'country', 'phone', 'first_name', 'last_name')
ORDER BY column_name;

-- Step 4: Show recent user data
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    address_line_1, 
    city, 
    country,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 3;
