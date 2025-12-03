-- Simple Email Queue and Analytics Migration

-- Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_variables JSONB DEFAULT '{}',
  from_email TEXT,
  reply_to TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}',
  provider TEXT NOT NULL DEFAULT 'resend' CHECK (provider IN ('resend', 'gmail', 'microsoft')),
  batch_id TEXT
);

-- Email Analytics Table
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked', 'unsubscribed')),
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  queue_item_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  UNIQUE (message_id, recipient_email, event, timestamp)
);

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for email_queue
CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own account's email queue"
  ON email_queue FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their own account's email queue"
  ON email_queue FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their own account's email queue"
  ON email_queue FOR UPDATE
  USING (account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can insert email analytics"
  ON email_analytics FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON email_queue TO authenticated;
GRANT ALL ON email_queue TO service_role;
GRANT SELECT, INSERT ON email_analytics TO authenticated;
GRANT ALL ON email_analytics TO service_role;