-- Migration: Create contact_messages table for Contact Us form submissions
-- Purpose: Store user-submitted messages with minimal public insert and admin-only read/manage

-- 1) Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','responded','closed')),
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.contact_messages IS 'Contact page messages submitted by visitors.';
COMMENT ON COLUMN public.contact_messages.email IS 'Sender email';
COMMENT ON COLUMN public.contact_messages.status IS 'Message status lifecycle: new, read, responded, closed';
COMMENT ON COLUMN public.contact_messages.response IS 'Admin response (stored for record-keeping; sending handled elsewhere)';
COMMENT ON COLUMN public.contact_messages.responded_by IS 'Admin user id (Clerk user id) who responded';

-- 2) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email_ci ON public.contact_messages(LOWER(email));

-- 3) Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 4) RLS policy: allow inserts from any public role (anon/auth) so client can submit
--    No SELECT/UPDATE/DELETE policies are added, so reads are blocked by default.
--    Service role (used by server-side/admin) bypasses RLS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_messages'
      AND policyname = 'Allow insert to anyone'
  ) THEN
    CREATE POLICY "Allow insert to anyone"
      ON public.contact_messages
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END
$$;

-- 5) updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER trg_update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
