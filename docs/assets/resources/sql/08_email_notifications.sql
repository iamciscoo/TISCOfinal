-- Create email notifications table for managing email queue
-- This table will store all email notifications to be sent to users

BEGIN;

-- Create email notifications table
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT, -- Can be null for anonymous contact messages
  template_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'pending', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_scheduled ON public.email_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created ON public.email_notifications(created_at);

-- Create push notifications table for future mobile app integration
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_tokens TEXT[],
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'pending', 'sent', 'failed')),
  sound TEXT,
  badge_count INTEGER,
  category TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for push notifications
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON public.push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON public.push_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_scheduled ON public.push_notifications(scheduled_for);

-- Add RLS policies for email notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Admin service role can do everything
CREATE POLICY "Service role can manage all email notifications" ON public.email_notifications
  FOR ALL USING (true);

CREATE POLICY "Service role can manage all push notifications" ON public.push_notifications
  FOR ALL USING (true);

-- Users can view their own notifications
CREATE POLICY "Users can view own email notifications" ON public.email_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own push notifications" ON public.push_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- Function to clean up old sent notifications (retention: 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete sent email notifications older than 30 days
  DELETE FROM public.email_notifications
  WHERE status = 'sent' AND sent_at < NOW() - INTERVAL '30 days';
  
  -- Delete failed notifications older than 7 days with max retries
  DELETE FROM public.email_notifications
  WHERE status = 'failed' AND failed_at < NOW() - INTERVAL '7 days' AND retry_count >= 3;
  
  -- Same for push notifications
  DELETE FROM public.push_notifications
  WHERE status = 'sent' AND sent_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM public.push_notifications
  WHERE status = 'failed' AND failed_at < NOW() - INTERVAL '7 days' AND retry_count >= 3;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run cleanup daily (requires pg_cron extension)
-- Note: This needs to be set up separately in Supabase dashboard
-- SELECT cron.schedule('cleanup-old-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');

COMMIT;
