-- Admin Migration: Add payment_status to service_bookings
-- Apply in Supabase SQL Editor or via CLI on the same database used by admin.
-- This migration is idempotent and safe to re-run.

-- 1) Add payment_status column to service_bookings
ALTER TABLE service_bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending','paid','failed','refunded'));

-- 2) Helpful index for filtering
CREATE INDEX IF NOT EXISTS idx_service_bookings_payment_status
  ON service_bookings(payment_status);
