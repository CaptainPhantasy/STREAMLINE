-- ============================================================================
-- Add Estimates System (Phase 3)
-- ============================================================================
-- Created: 2025-01-27
-- Purpose: Add estimates/quotes functionality separate from invoices
--
-- Tables Added:
-- - estimates: Main estimates table
-- - estimate_items: Line items for estimates (materials, labor, etc.)
-- ============================================================================

-- Estimates table (quotes/proposals for customers)
CREATE TABLE IF NOT EXISTS estimates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  contact_id uuid REFERENCES contacts(id) NOT NULL,
  estimate_number text UNIQUE NOT NULL,
  title text, -- Brief description (e.g., "Kitchen Sink Repair")
  description text, -- Detailed scope of work
  subtotal integer DEFAULT 0, -- In cents (sum of line items)
  tax_rate numeric(5,4) DEFAULT 0.0, -- e.g., 0.08 for 8%
  tax_amount integer DEFAULT 0, -- In cents
  total_amount integer DEFAULT 0, -- In cents (subtotal + tax)
  status text CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')) DEFAULT 'draft',
  valid_until timestamptz, -- Expiration date for the estimate
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  notes text, -- Internal notes
  customer_notes text, -- Notes visible to customer
  converted_to_job_id uuid REFERENCES jobs(id), -- Track if estimate became a job
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Estimate items (line items for labor, materials, etc.)
CREATE TABLE IF NOT EXISTS estimate_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  estimate_id uuid REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
  item_type text CHECK (item_type IN ('labor', 'material', 'equipment', 'other')) DEFAULT 'material',
  name text NOT NULL, -- e.g., "PVC Pipe 2in", "Labor - Plumbing"
  description text,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text DEFAULT 'each', -- 'each', 'hour', 'ft', 'lb', etc.
  unit_price integer NOT NULL, -- In cents
  total_price integer NOT NULL, -- In cents (quantity * unit_price)
  sort_order integer DEFAULT 0, -- For ordering items in display
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on estimates
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on estimate_items
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for estimates
DO $$
BEGIN
  -- Users can view estimates for their account
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'estimates'
    AND policyname = 'Users can view estimates for their account'
  ) THEN
    CREATE POLICY "Users can view estimates for their account"
      ON estimates FOR SELECT
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;

  -- Users can manage estimates for their account
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'estimates'
    AND policyname = 'Users can manage estimates for their account'
  ) THEN
    CREATE POLICY "Users can manage estimates for their account"
      ON estimates FOR ALL
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- RLS Policies for estimate_items
DO $$
BEGIN
  -- Users can view estimate items for their account
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'estimate_items'
    AND policyname = 'Users can view estimate items for their account'
  ) THEN
    CREATE POLICY "Users can view estimate items for their account"
      ON estimate_items FOR SELECT
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;

  -- Users can manage estimate items for their account
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'estimate_items'
    AND policyname = 'Users can manage estimate items for their account'
  ) THEN
    CREATE POLICY "Users can manage estimate items for their account"
      ON estimate_items FOR ALL
      USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_estimates_account_status ON estimates(account_id, status);
CREATE INDEX IF NOT EXISTS idx_estimates_account_contact ON estimates(account_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_estimates_contact ON estimates(contact_id);
CREATE INDEX IF NOT EXISTS idx_estimates_converted_job ON estimates(converted_to_job_id) WHERE converted_to_job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_valid_until ON estimates(valid_until) WHERE status IN ('sent', 'viewed');
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate ON estimate_items(estimate_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_estimate_items_account ON estimate_items(account_id);

-- Function to auto-generate estimate numbers
CREATE OR REPLACE FUNCTION generate_estimate_number(p_account_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
  v_number text;
BEGIN
  -- Get count of estimates for this account
  SELECT COUNT(*) + 1 INTO v_count
  FROM estimates
  WHERE account_id = p_account_id;

  -- Format: EST-YYYYMM-####
  v_number := 'EST-' || to_char(now(), 'YYYYMM') || '-' || LPAD(v_count::text, 4, '0');

  RETURN v_number;
END;
$$;

-- Function to calculate estimate totals (triggered on estimate_items changes)
CREATE OR REPLACE FUNCTION update_estimate_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal integer;
  v_tax_amount integer;
  v_total integer;
  v_tax_rate numeric(5,4);
BEGIN
  -- Get the estimate's tax rate
  SELECT tax_rate INTO v_tax_rate
  FROM estimates
  WHERE id = COALESCE(NEW.estimate_id, OLD.estimate_id);

  -- Calculate subtotal from all items
  SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
  FROM estimate_items
  WHERE estimate_id = COALESCE(NEW.estimate_id, OLD.estimate_id);

  -- Calculate tax
  v_tax_amount := ROUND(v_subtotal * v_tax_rate);

  -- Calculate total
  v_total := v_subtotal + v_tax_amount;

  -- Update the estimate
  UPDATE estimates
  SET
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = v_total,
    updated_at = now()
  WHERE id = COALESCE(NEW.estimate_id, OLD.estimate_id);

  RETURN NEW;
END;
$$;

-- Trigger to auto-update estimate totals when items change
DROP TRIGGER IF EXISTS trigger_update_estimate_totals ON estimate_items;
CREATE TRIGGER trigger_update_estimate_totals
  AFTER INSERT OR UPDATE OR DELETE ON estimate_items
  FOR EACH ROW
  EXECUTE FUNCTION update_estimate_totals();

-- Comments for documentation
COMMENT ON TABLE estimates IS 'Estimates/quotes for customers (separate from invoices)';
COMMENT ON TABLE estimate_items IS 'Line items for estimates (materials, labor, etc.)';
COMMENT ON COLUMN estimates.status IS 'Status: draft (editing), sent (emailed), viewed (customer opened), accepted (approved), rejected (declined), expired (past valid_until date)';
COMMENT ON COLUMN estimates.converted_to_job_id IS 'Links to job if estimate was accepted and converted';
COMMENT ON FUNCTION generate_estimate_number IS 'Auto-generates estimate numbers in format EST-YYYYMM-####';
COMMENT ON FUNCTION update_estimate_totals IS 'Automatically recalculates estimate totals when line items change';
