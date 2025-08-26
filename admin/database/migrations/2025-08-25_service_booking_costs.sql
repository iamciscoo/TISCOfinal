-- Admin Migration: Service Booking Costs
-- Apply in Supabase SQL Editor or via CLI on the same database used by admin.
-- This migration is idempotent and safe to re-run.

-- 1) Add total_amount column to service_bookings for summary display (if missing)
ALTER TABLE service_bookings
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0 CHECK (total_amount >= 0);

-- 2) Create service_booking_costs table (one per booking)
CREATE TABLE IF NOT EXISTS service_booking_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE REFERENCES service_bookings(id) ON DELETE CASCADE,
  service_fee DECIMAL(10,2) DEFAULT 0 CHECK (service_fee >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
  currency VARCHAR(3) DEFAULT 'TZS',
  subtotal DECIMAL(12,2) DEFAULT 0 CHECK (subtotal >= 0),
  total DECIMAL(12,2) DEFAULT 0 CHECK (total >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_service_booking_costs_booking_id ON service_booking_costs(booking_id);

-- 3) Create service_booking_cost_items table (many per cost)
CREATE TABLE IF NOT EXISTS service_booking_cost_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_id UUID NOT NULL REFERENCES service_booking_costs(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) DEFAULT 'unit',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_service_booking_cost_items_cost_id ON service_booking_cost_items(cost_id);

-- 4) updated_at trigger for service_booking_costs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_service_booking_costs_updated_at ON service_booking_costs;
CREATE TRIGGER trg_update_service_booking_costs_updated_at
BEFORE UPDATE ON service_booking_costs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5) RLS: keep private (admin uses service role). Enable but do not open public policies.
ALTER TABLE service_booking_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_booking_cost_items ENABLE ROW LEVEL SECURITY;

-- If you later need limited client access, add policies that join through service_bookings.user_id.

-- 6) Optional helper view (commented): Uncomment if you want a flattened view
-- CREATE OR REPLACE VIEW service_booking_costs_with_items AS
-- SELECT c.*, json_agg(ci.*) AS items
-- FROM service_booking_costs c
-- LEFT JOIN service_booking_cost_items ci ON ci.cost_id = c.id
-- GROUP BY c.id;
