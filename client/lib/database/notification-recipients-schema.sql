-- Notification Recipients table for product-specific admin notifications
-- This table stores admin recipients who should receive notifications for specific products or categories

CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  department TEXT,
  notification_categories TEXT[] DEFAULT ARRAY['all'],
  assigned_product_ids TEXT[],  -- Product IDs for product-specific notifications
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_recipients_email ON notification_recipients(email);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_active ON notification_recipients(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_products ON notification_recipients USING GIN(assigned_product_ids);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_categories ON notification_recipients USING GIN(notification_categories);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_created_at ON notification_recipients(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER update_notification_recipients_updated_at 
    BEFORE UPDATE ON notification_recipients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for notification_recipients
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Admin users can manage notification recipients
CREATE POLICY "Admin can manage notification recipients" ON notification_recipients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Service role can access all (for server-side operations)
CREATE POLICY "Service role can access notification recipients" ON notification_recipients
    FOR ALL USING (
        auth.role() = 'service_role'
    );

-- Insert initial admin recipient if none exist
INSERT INTO notification_recipients (email, name, notification_categories, is_active)
SELECT 'francisjacob08@gmail.com', 'Francis Jacob', ARRAY['all'], true
WHERE NOT EXISTS (SELECT 1 FROM notification_recipients WHERE email = 'francisjacob08@gmail.com');

INSERT INTO notification_recipients (email, name, notification_categories, is_active)  
SELECT 'info@tiscomarket.store', 'TISCO Admin', ARRAY['all'], true
WHERE NOT EXISTS (SELECT 1 FROM notification_recipients WHERE email = 'info@tiscomarket.store');

-- Add comments for documentation
COMMENT ON TABLE notification_recipients IS 'Admin recipients for product-specific and category-based notifications';
COMMENT ON COLUMN notification_recipients.email IS 'Recipient email address (unique)';
COMMENT ON COLUMN notification_recipients.name IS 'Optional display name for the recipient';
COMMENT ON COLUMN notification_recipients.is_active IS 'Whether this recipient should receive notifications';
COMMENT ON COLUMN notification_recipients.department IS 'Optional department for organization';
COMMENT ON COLUMN notification_recipients.notification_categories IS 'Array of notification categories this recipient subscribes to';
COMMENT ON COLUMN notification_recipients.assigned_product_ids IS 'Array of product IDs for product-specific notifications (overrides categories)';
