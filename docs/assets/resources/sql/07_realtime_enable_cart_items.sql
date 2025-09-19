-- Enable realtime for cart_items and ensure changes include full row data
-- Safe to run multiple times

BEGIN;

-- Ensure UPDATE/DELETE payloads include previous values
ALTER TABLE IF EXISTS public.cart_items REPLICA IDENTITY FULL;

-- Add table to supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication p
    JOIN pg_publication_tables pt ON pt.pubname = p.pubname
    WHERE p.pubname = 'supabase_realtime'
      AND pt.schemaname = 'public'
      AND pt.tablename = 'cart_items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items';
  END IF;
END $$;

COMMIT;
