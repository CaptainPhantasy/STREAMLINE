-- Create missing estimates table for CRM quotes/proposals
-- This table is referenced by sales analytics but was missing

CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  estimate_number TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  subtotal INTEGER DEFAULT 0,
  tax_rate NUMERIC(5,4) DEFAULT 0.0,
  tax_amount INTEGER DEFAULT 0,
  total_amount INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')) DEFAULT 'draft',
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_estimates_account_id ON estimates(account_id);
CREATE INDEX IF NOT EXISTS idx_estimates_contact_id ON estimates(contact_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at);

-- Enable Row Level Security
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view estimates for their account" ON estimates
  FOR SELECT USING (auth.uid() = created_by OR account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create estimates for their account" ON estimates
  FOR INSERT WITH CHECK (account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update estimates for their account" ON estimates
  FOR UPDATE USING (account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete estimates for their account" ON estimates
  FOR DELETE USING (account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

-- Add comments for documentation
COMMENT ON TABLE estimates IS 'CRM quotes/proposals sent to customers';
COMMENT ON COLUMN estimates.estimate_number IS 'Unique estimate number like EST-2025-001';
COMMENT ON COLUMN estimates.status IS 'Current status of the estimate';
COMMENT ON COLUMN estimates.valid_until IS 'Expiration date for the estimate';