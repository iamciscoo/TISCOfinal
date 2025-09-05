-- 06_cart_analytics_updates.sql
-- Safe, idempotent updates for cart analytics and admin APIs
-- Apply this script in Supabase SQL Editor. It only adds missing objects and updates existing ones.

-- 1) Ensure helper trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Add updated_at to cart_items and maintain it via trigger
ALTER TABLE IF EXISTS cart_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helpful indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_cart_items_updated_at ON cart_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_created_at ON cart_items(user_id, created_at DESC);

-- 3) Create table to track abandonment emails referenced by admin API
CREATE TABLE IF NOT EXISTS cart_abandonment_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cart_abandonment_emails ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cart_abandonment_emails_user_sent ON cart_abandonment_emails(user_id, sent_at DESC);

-- 4) Optional conversions table used by analytics (keep if you want conversion metrics)
CREATE TABLE IF NOT EXISTS cart_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversion_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items_added INTEGER NOT NULL DEFAULT 0,
  items_updated INTEGER NOT NULL DEFAULT 0,
  guest_items_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cart_conversions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cart_conversions_date ON cart_conversions(conversion_date DESC);

-- 5) View to support SQL-first cart activity queries
CREATE OR REPLACE VIEW cart_user_activity AS
SELECT 
  user_id,
  MAX(COALESCE(updated_at, created_at)) AS last_activity,
  MIN(created_at) AS created_first_at
FROM cart_items
GROUP BY user_id;

-- 6) RPC for cart abandonment analytics used by admin analytics API
-- Computes abandonment rate over [start_date, end_date], with a 24h inactivity cutoff.
CREATE OR REPLACE FUNCTION get_cart_abandonment_analytics(
  start_date TIMESTAMPTZ,
  end_date   TIMESTAMPTZ
) RETURNS TABLE (
  abandonment_rate NUMERIC,
  abandoned_carts  INTEGER,
  active_carts     INTEGER,
  total_carts      INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH activity AS (
    SELECT user_id, MAX(COALESCE(updated_at, created_at)) AS last_activity
    FROM cart_items
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY user_id
  ), stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE last_activity >= end_date - INTERVAL '24 hours') AS active_carts,
      COUNT(*) FILTER (WHERE last_activity <  end_date - INTERVAL '24 hours') AS abandoned_carts
    FROM activity
  )
  SELECT 
    CASE WHEN (active_carts + abandoned_carts) > 0
      THEN (abandoned_carts::NUMERIC / (active_carts + abandoned_carts)) * 100
      ELSE 0 END AS abandonment_rate,
    abandoned_carts,
    active_carts,
    (active_carts + abandoned_carts) AS total_carts
  FROM stats;
END;
$$ LANGUAGE plpgsql;
