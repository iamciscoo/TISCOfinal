-- Add address-related fields to users table for admin visibility
-- Run this in the Supabase SQL editor

BEGIN;

-- Add address fields to users table if they don't exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Tanzania';

-- Create index for faster queries on city
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

COMMIT;

-- Note:
-- These fields will be populated from the user's default shipping address
-- when orders are placed, allowing admin to see user location info directly
-- in the users table without joining to addresses table.
