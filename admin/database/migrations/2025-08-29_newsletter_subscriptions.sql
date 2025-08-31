-- Migration: Create newsletter_subscriptions table
-- Purpose: Record emails submitted via newsletter signup (minimal implementation)

-- 1) Table
create table if not exists public.newsletter_subscriptions (
  id bigserial primary key,
  email text not null,
  created_at timestamptz not null default now()
);

comment on table public.newsletter_subscriptions is 'Emails collected from footer newsletter signup.';
comment on column public.newsletter_subscriptions.email is 'Subscriber email (unique, case-insensitive via index).';

-- 2) Ensure unique emails (case-insensitive)
create unique index if not exists newsletter_subscriptions_email_ci_idx
  on public.newsletter_subscriptions (lower(email));

-- 3) Enable Row Level Security
alter table public.newsletter_subscriptions enable row level security;

-- 4) RLS policy: allow inserts from any public role (anon/auth) so client can submit
--    No SELECT/UPDATE/DELETE policies are added, so reads are blocked by default.
--    Service role (used by server-side/admin) bypasses RLS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'newsletter_subscriptions'
      AND policyname = 'Allow insert to anyone'
  ) THEN
    CREATE POLICY "Allow insert to anyone"
      ON public.newsletter_subscriptions
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END
$$;
