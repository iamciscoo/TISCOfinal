-- Email Notifications Table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'order_confirmation', 'order_status_update', 'payment_success', 'payment_failed',
    'cart_abandonment', 'welcome_email', 'password_reset', 'shipping_notification',
    'delivery_confirmation', 'review_request'
  )),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SMS Notifications Table
CREATE TABLE IF NOT EXISTS sms_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN (
    'order_confirmation', 'order_status_update', 'payment_success', 'delivery_notification',
    'verification_code', 'appointment_reminder', 'promotional', 'cart_abandonment', 'low_stock_alert'
  )),
  message_content TEXT NOT NULL CHECK (LENGTH(message_content) <= 160),
  template_data JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Push Notifications Table
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_tokens TEXT[] NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  badge_count INTEGER,
  sound TEXT DEFAULT 'default',
  category TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'pending', 'sent', 'failed')),
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Devices Table (for push notifications)
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  app_version TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  promotional_sms BOOLEAN DEFAULT FALSE,
  order_updates BOOLEAN DEFAULT TRUE,
  payment_alerts BOOLEAN DEFAULT TRUE,
  delivery_notifications BOOLEAN DEFAULT TRUE,
  security_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL UNIQUE,
  subject_template TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SMS Templates Table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_type TEXT NOT NULL UNIQUE,
  content_template TEXT NOT NULL CHECK (LENGTH(content_template) <= 160),
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS email_notifications_user_id_idx ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS email_notifications_status_idx ON email_notifications(status);
CREATE INDEX IF NOT EXISTS email_notifications_scheduled_for_idx ON email_notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS sms_notifications_user_id_idx ON sms_notifications(user_id);
CREATE INDEX IF NOT EXISTS sms_notifications_status_idx ON sms_notifications(status);
CREATE INDEX IF NOT EXISTS sms_notifications_scheduled_for_idx ON sms_notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS push_notifications_user_id_idx ON push_notifications(user_id);
CREATE INDEX IF NOT EXISTS push_notifications_status_idx ON push_notifications(status);
CREATE INDEX IF NOT EXISTS push_notifications_scheduled_for_idx ON push_notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_devices_user_id_idx ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS user_devices_device_token_idx ON user_devices(device_token);

-- Add updated_at triggers
CREATE TRIGGER update_email_notifications_updated_at 
  BEFORE UPDATE ON email_notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_notifications_updated_at 
  BEFORE UPDATE ON sms_notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_notifications_updated_at 
  BEFORE UPDATE ON push_notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_devices_updated_at 
  BEFORE UPDATE ON user_devices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON email_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_templates_updated_at 
  BEFORE UPDATE ON sms_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Email Notifications Policies
CREATE POLICY "Users can view own email notifications" ON email_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own email notifications" ON email_notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- SMS Notifications Policies
CREATE POLICY "Users can view own SMS notifications" ON sms_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own SMS notifications" ON sms_notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Push Notifications Policies
CREATE POLICY "Users can view own push notifications" ON push_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own push notifications" ON push_notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- User Devices Policies
CREATE POLICY "Users can manage own devices" ON user_devices
  FOR ALL USING (auth.uid()::text = user_id);

-- Notification Preferences Policies
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid()::text = user_id);

-- Templates are publicly readable but only admins can modify
CREATE POLICY "Anyone can read email templates" ON email_templates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can read SMS templates" ON sms_templates
  FOR SELECT USING (is_active = TRUE);

-- Insert default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create notification preferences
-- Note: This assumes there's a users table with id field
-- CREATE TRIGGER create_notification_preferences_trigger
--   AFTER INSERT ON users
--   FOR EACH ROW
--   EXECUTE FUNCTION create_default_notification_preferences();

-- Insert default email templates
INSERT INTO email_templates (template_type, subject_template, html_content, text_content, variables) VALUES
  ('order_confirmation', 'Order Confirmation - #{order_id}', 
   '<h1>Thank you for your order!</h1><p>Your order #{order_id} has been confirmed.</p>', 
   'Thank you for your order! Your order #{order_id} has been confirmed.',
   '{"order_id": "string", "customer_name": "string", "total": "number"}'),
  ('order_status_update', 'Order Status Update - #{order_id}',
   '<h1>Order Status Update</h1><p>Your order #{order_id} status: #{status}</p>',
   'Order Status Update - Your order #{order_id} status: #{status}',
   '{"order_id": "string", "status": "string", "tracking_url": "string"}'),
  ('payment_success', 'Payment Successful - #{order_id}',
   '<h1>Payment Confirmed</h1><p>Payment for order #{order_id} successful.</p>',
   'Payment Confirmed - Payment for order #{order_id} successful.',
   '{"order_id": "string", "amount": "number", "currency": "string"}')
ON CONFLICT (template_type) DO NOTHING;

-- Insert default SMS templates  
INSERT INTO sms_templates (message_type, content_template, variables) VALUES
  ('order_confirmation', 'TISCO: Order #{order_id} confirmed. Total: #{total}', 
   '{"order_id": "string", "total": "string"}'),
  ('order_status_update', 'TISCO: Order #{order_id} status: #{status}', 
   '{"order_id": "string", "status": "string"}'),
  ('verification_code', 'TISCO: Your verification code is #{code}', 
   '{"code": "string"}'),
  ('delivery_notification', 'TISCO: Order #{order_id} out for delivery', 
   '{"order_id": "string", "estimated_time": "string"}')
ON CONFLICT (message_type) DO NOTHING;
