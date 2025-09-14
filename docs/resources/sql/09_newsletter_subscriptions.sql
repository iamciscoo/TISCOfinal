-- Newsletter subscriptions table and policies
-- This migration handles existing tables and adds missing columns safely

BEGIN;

-- Create table if it doesn't exist (basic structure)
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'newsletter_subscriptions' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.newsletter_subscriptions ADD COLUMN source TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'newsletter_subscriptions' 
    AND column_name = 'is_subscribed'
  ) THEN
    ALTER TABLE public.newsletter_subscriptions ADD COLUMN is_subscribed BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'newsletter_subscriptions' 
    AND column_name = 'unsubscribed_at'
  ) THEN
    ALTER TABLE public.newsletter_subscriptions ADD COLUMN unsubscribed_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'newsletter_subscriptions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.newsletter_subscriptions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Constraints / Indexes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_newsletter_email_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_newsletter_email_unique ON public.newsletter_subscriptions (LOWER(email));
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_newsletter_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_newsletter_set_updated_at
    BEFORE UPDATE ON public.newsletter_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role: unrestricted
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'newsletter_subscriptions' AND policyname = 'Service role can manage all newsletter rows'
  ) THEN
    CREATE POLICY "Service role can manage all newsletter rows" ON public.newsletter_subscriptions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Optional read access for authenticated users to list nothing (deny by default). No public writes.
-- We intentionally do not add INSERT/UPDATE policies for anon/auth users because server routes use the service role.

COMMIT;
