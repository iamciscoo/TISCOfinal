-- Create payment_sessions table for temporary payment data before order creation
CREATE TABLE IF NOT EXISTS payment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TZS',
    provider VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    gateway_transaction_id VARCHAR(255),
    order_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_reference ON payment_sessions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_expires ON payment_sessions(expires_at);

-- Update payment_logs table to support session_id
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES payment_sessions(id);

-- Create cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_payment_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM payment_sessions 
    WHERE expires_at < NOW() AND status IN ('pending', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_sessions_updated_at ON payment_sessions;
CREATE TRIGGER payment_sessions_updated_at
    BEFORE UPDATE ON payment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_session_timestamp();

-- RLS policies for payment_sessions
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment sessions" ON payment_sessions;
CREATE POLICY "Users can view own payment sessions" ON payment_sessions
    FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own payment sessions" ON payment_sessions;
CREATE POLICY "Users can insert own payment sessions" ON payment_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own payment sessions" ON payment_sessions;
CREATE POLICY "Users can update own payment sessions" ON payment_sessions
    FOR UPDATE USING (user_id = auth.uid()::text);
