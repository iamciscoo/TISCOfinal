-- Unify orders.payment_status allowed values and ensure paid_at exists
-- Safe to run multiple times

BEGIN;

-- Ensure payment_status column exists with default
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

ALTER TABLE orders 
  ALTER COLUMN payment_status SET DEFAULT 'pending';

-- Ensure paid_at column exists
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Drop any existing named constraint then add a unified constraint
-- Postgres default name for a CHECK created via ADD COLUMN is typically table_column_check
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders 
  ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

-- Helpful index for filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

COMMIT;
