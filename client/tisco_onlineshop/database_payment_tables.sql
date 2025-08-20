-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'mobile_money', 'bank_transfer', 'cash_on_delivery')),
  provider TEXT NOT NULL,
  account_number TEXT,
  account_name TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  last_four_digits TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'awaiting_verification')),
  payment_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  transaction_reference TEXT NOT NULL UNIQUE,
  gateway_transaction_id TEXT,
  failure_reason TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Payment Logs Table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  data JSONB,
  user_id TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cart Abandonment Emails Table
CREATE TABLE IF NOT EXISTS cart_abandonment_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL DEFAULT 'abandonment_reminder',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- User Sessions Table (for cleanup)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS payment_methods_is_default_idx ON payment_methods(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS payment_transactions_order_id_idx ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS payment_transactions_user_id_idx ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS payment_transactions_reference_idx ON payment_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS payment_logs_transaction_id_idx ON payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS cart_abandonment_emails_user_id_idx ON cart_abandonment_emails(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions(expires_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_methods_updated_at 
  BEFORE UPDATE ON payment_methods 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at 
  BEFORE UPDATE ON payment_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_abandonment_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Payment Methods Policies
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own payment methods" ON payment_methods
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE USING (auth.uid()::text = user_id);

-- Payment Transactions Policies
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own payment transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Payment Logs Policies (read-only for users)
CREATE POLICY "Users can view own payment logs" ON payment_logs
  FOR SELECT USING (auth.uid()::text = user_id);

-- Cart Abandonment Emails Policies
CREATE POLICY "Users can view own abandonment emails" ON cart_abandonment_emails
  FOR SELECT USING (auth.uid()::text = user_id);

-- User Sessions Policies
CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (auth.uid()::text = user_id);

-- Add payment_status and paid_at columns to orders table if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create function for cart abandonment analytics
CREATE OR REPLACE FUNCTION get_cart_abandonment_analytics(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  abandonment_rate DECIMAL,
  total_carts INTEGER,
  abandoned_carts INTEGER,
  recovered_carts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH cart_stats AS (
    SELECT 
      COUNT(DISTINCT user_id) FILTER (WHERE created_at >= start_date AND created_at <= end_date) as total_cart_users,
      COUNT(DISTINCT user_id) FILTER (WHERE created_at >= start_date AND created_at <= end_date AND updated_at < (now() - INTERVAL '24 hours')) as abandoned_cart_users,
      COUNT(DISTINCT cc.user_id) FILTER (WHERE cc.conversion_date >= start_date AND cc.conversion_date <= end_date) as converted_users
    FROM cart_items ci
    LEFT JOIN cart_conversions cc ON ci.user_id = cc.user_id::text
  )
  SELECT 
    CASE WHEN total_cart_users > 0 
         THEN (abandoned_cart_users::DECIMAL / total_cart_users::DECIMAL) * 100 
         ELSE 0 END as abandonment_rate,
    total_cart_users as total_carts,
    abandoned_cart_users as abandoned_carts,
    converted_users as recovered_carts
  FROM cart_stats;
END;
$$ LANGUAGE plpgsql;
