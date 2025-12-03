-- Calendar Providers Table
-- Similar structure to email_providers for OAuth token storage

CREATE TABLE IF NOT EXISTS calendar_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_email TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_id, provider)
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, provider, provider_event_id)
);

-- Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'voice')),
  reminder_time TEXT NOT NULL, -- e.g., "2 days before", "morning of", ISO 8601 datetime
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Action Items Table (for Carl Vision)
CREATE TABLE IF NOT EXISTS email_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('meeting', 'promise', 'deadline', 'action')),
  extracted_text TEXT NOT NULL,
  parsed_date DATE,
  parsed_time TIME,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_providers_account ON calendar_providers(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_providers_user ON calendar_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_account ON calendar_events(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_contact ON calendar_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_job ON calendar_events(job_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_reminders_account ON reminders(account_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_email_action_items_message ON email_action_items(message_id);
CREATE INDEX IF NOT EXISTS idx_email_action_items_status ON email_action_items(status);

-- RLS Policies
ALTER TABLE calendar_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_action_items ENABLE ROW LEVEL SECURITY;

-- Calendar Providers RLS
CREATE POLICY "Users can view their account's calendar providers"
  ON calendar_providers FOR SELECT
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert calendar providers for their account"
  ON calendar_providers FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their account's calendar providers"
  ON calendar_providers FOR UPDATE
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their account's calendar providers"
  ON calendar_providers FOR DELETE
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

-- Calendar Events RLS
CREATE POLICY "Users can view their account's calendar events"
  ON calendar_events FOR SELECT
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert calendar events for their account"
  ON calendar_events FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their account's calendar events"
  ON calendar_events FOR UPDATE
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their account's calendar events"
  ON calendar_events FOR DELETE
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

-- Reminders RLS
CREATE POLICY "Users can view their account's reminders"
  ON reminders FOR SELECT
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert reminders for their account"
  ON reminders FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their account's reminders"
  ON reminders FOR UPDATE
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their account's reminders"
  ON reminders FOR DELETE
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

-- Email Action Items RLS
CREATE POLICY "Users can view their account's email action items"
  ON email_action_items FOR SELECT
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert email action items for their account"
  ON email_action_items FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their account's email action items"
  ON email_action_items FOR UPDATE
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their account's email action items"
  ON email_action_items FOR DELETE
  USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

