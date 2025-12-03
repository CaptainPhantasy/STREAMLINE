-- ============================================================================
-- Add Parts Inventory and Calendar Systems
-- ============================================================================
-- Created: 2025-11-27
-- Purpose: Add parts/inventory management and calendar event storage
-- ============================================================================

-- ============================================================================
-- PARTS INVENTORY SYSTEM
-- ============================================================================

-- Parts table (inventory items)
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  sku text, -- Stock Keeping Unit (optional, auto-generated if empty)
  name text NOT NULL,
  description text,
  category text CHECK (category IN ('plumbing', 'electrical', 'hvac', 'hardware', 'materials', 'tools', 'consumables', 'other')) DEFAULT 'materials',
  unit text CHECK (unit IN ('each', 'box', 'case', 'ft', 'meter', 'lb', 'kg', 'gallon', 'liter', 'pair')) DEFAULT 'each',
  unit_price integer DEFAULT 0, -- In cents
  quantity_in_stock integer DEFAULT 0,
  reorder_threshold integer DEFAULT 5,
  supplier_name text,
  supplier_sku text,
  supplier_contact text,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job parts table (parts used on specific jobs)
CREATE TABLE IF NOT EXISTS job_parts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  part_id uuid REFERENCES parts(id), -- Optional reference to inventory
  name text NOT NULL,
  description text,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text DEFAULT 'each',
  unit_price integer NOT NULL DEFAULT 0, -- In cents
  total_price integer NOT NULL DEFAULT 0, -- In cents
  added_by uuid REFERENCES users(id),
  added_at timestamptz DEFAULT now(),
  notes text
);

-- Enable RLS on parts
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parts'
    AND policyname = 'Users can view parts for their account'
  ) THEN
    CREATE POLICY "Users can view parts for their account"
      ON parts FOR SELECT
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parts'
    AND policyname = 'Users can manage parts for their account'
  ) THEN
    CREATE POLICY "Users can manage parts for their account"
      ON parts FOR ALL
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- RLS Policies for job_parts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'job_parts'
    AND policyname = 'Users can view job parts for their account'
  ) THEN
    CREATE POLICY "Users can view job parts for their account"
      ON job_parts FOR SELECT
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'job_parts'
    AND policyname = 'Users can manage job parts for their account'
  ) THEN
    CREATE POLICY "Users can manage job parts for their account"
      ON job_parts FOR ALL
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Indexes for parts
CREATE INDEX IF NOT EXISTS idx_parts_account ON parts(account_id);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(account_id, category);
CREATE INDEX IF NOT EXISTS idx_parts_sku ON parts(account_id, sku);
CREATE INDEX IF NOT EXISTS idx_parts_low_stock ON parts(account_id) WHERE quantity_in_stock <= reorder_threshold;
CREATE INDEX IF NOT EXISTS idx_job_parts_job ON job_parts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_parts_account ON job_parts(account_id);

-- Function to auto-generate SKU
CREATE OR REPLACE FUNCTION generate_part_sku(p_account_id uuid, p_category text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_count integer;
BEGIN
  -- Generate prefix from category
  v_prefix := UPPER(LEFT(p_category, 3));

  -- Get count of parts in this category for this account
  SELECT COUNT(*) + 1 INTO v_count
  FROM parts
  WHERE account_id = p_account_id AND category = p_category;

  RETURN v_prefix || '-' || LPAD(v_count::text, 5, '0');
END;
$$;

-- ============================================================================
-- CALENDAR SYSTEM
-- ============================================================================

-- Calendar providers (Google, Microsoft, etc.)
CREATE TABLE IF NOT EXISTS calendar_providers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  user_id uuid REFERENCES users(id), -- NULL means account-wide
  provider text CHECK (provider IN ('google', 'microsoft', 'local')) NOT NULL,
  provider_email text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  provider text DEFAULT 'local', -- 'google', 'microsoft', 'local'
  provider_event_id text, -- ID from external provider (Google/Microsoft)
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  contact_id uuid REFERENCES contacts(id),
  job_id uuid REFERENCES jobs(id),
  conversation_id uuid,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_providers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'calendar_providers'
    AND policyname = 'Users can view calendar providers for their account'
  ) THEN
    CREATE POLICY "Users can view calendar providers for their account"
      ON calendar_providers FOR SELECT
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'calendar_providers'
    AND policyname = 'Users can manage calendar providers for their account'
  ) THEN
    CREATE POLICY "Users can manage calendar providers for their account"
      ON calendar_providers FOR ALL
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- RLS Policies for calendar_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'calendar_events'
    AND policyname = 'Users can view calendar events for their account'
  ) THEN
    CREATE POLICY "Users can view calendar events for their account"
      ON calendar_events FOR SELECT
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'calendar_events'
    AND policyname = 'Users can manage calendar events for their account'
  ) THEN
    CREATE POLICY "Users can manage calendar events for their account"
      ON calendar_events FOR ALL
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Indexes for calendar
CREATE INDEX IF NOT EXISTS idx_calendar_providers_account ON calendar_providers(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_providers_user ON calendar_providers(account_id, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_account ON calendar_events(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(account_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_contact ON calendar_events(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_job ON calendar_events(job_id) WHERE job_id IS NOT NULL;

-- Comments
COMMENT ON TABLE parts IS 'Inventory parts/materials management';
COMMENT ON TABLE job_parts IS 'Parts used on specific jobs';
COMMENT ON TABLE calendar_providers IS 'External calendar provider integrations (Google, Microsoft)';
COMMENT ON TABLE calendar_events IS 'Calendar events (synced from providers or local-only)';
