-- Relax NOT NULL constraints on addresses to allow minimal checkout sync
-- Run this in the Supabase SQL editor

BEGIN;

ALTER TABLE addresses
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN country DROP NOT NULL;

COMMIT;

-- Note:
-- We keep address_line_1 and city as NOT NULL so we still require a usable location.
-- This migration enables inserting a default shipping address from checkout with just
-- address_line_1, city, and phone, then enriching later in admin if desired.
