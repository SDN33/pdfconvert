-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'welcome_premium' or 'welcome_free'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resend_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can read all logs
CREATE POLICY "Service role can read email logs"
ON email_logs FOR SELECT
TO service_role
USING (true);

-- Policy: Service role can insert logs
CREATE POLICY "Service role can insert email logs"
ON email_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Comment the table
COMMENT ON TABLE email_logs IS 'Logs of all emails sent by the Edge Functions';
COMMENT ON COLUMN email_logs.email IS 'Recipient email address';
COMMENT ON COLUMN email_logs.type IS 'Email type (welcome_premium, welcome_free, etc.)';
COMMENT ON COLUMN email_logs.sent_at IS 'Timestamp when email was sent';
COMMENT ON COLUMN email_logs.resend_id IS 'Resend API response ID for tracking';
