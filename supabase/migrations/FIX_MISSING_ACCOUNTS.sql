-- ============================================
-- FIX MISSING ACCOUNTS TABLE
-- Run this to add the missing accounts table
-- ============================================

-- Create accounts table (it's missing!)
CREATE TABLE IF NOT EXISTS accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  inbound_email_domain text,
  settings jsonb default '{}'::jsonb,
  persona_config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Add persona_config if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='accounts' AND column_name='persona_config'
  ) THEN
    ALTER TABLE accounts ADD COLUMN persona_config jsonb default '{}'::jsonb;
    RAISE NOTICE 'Added persona_config column to accounts';
  END IF;
END $$;

-- Enable RLS on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for accounts
DROP POLICY IF EXISTS "Users can read own account" ON accounts;
CREATE POLICY "Users can read own account"
  ON accounts FOR SELECT
  USING (id IN (SELECT account_id FROM users WHERE id = auth.uid()));

-- Create the 317 Plumber account
INSERT INTO accounts (name, slug, inbound_email_domain)
VALUES ('317 Plumber', '317plumber', 'reply.317plumber.com')
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name,
    inbound_email_domain = EXCLUDED.inbound_email_domain;

-- Fix foreign key constraints on other tables
-- Make sure they reference accounts correctly
DO $$
BEGIN
  -- Fix contacts table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contacts_account_id_fkey'
  ) THEN
    ALTER TABLE contacts 
    ADD CONSTRAINT contacts_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES accounts(id);
  END IF;

  -- Fix conversations table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_account_id_fkey'
  ) THEN
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES accounts(id);
  END IF;

  -- Fix messages table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_account_id_fkey'
  ) THEN
    ALTER TABLE messages 
    ADD CONSTRAINT messages_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES accounts(id);
  END IF;

  -- Fix jobs table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'jobs_account_id_fkey'
  ) THEN
    ALTER TABLE jobs 
    ADD CONSTRAINT jobs_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES accounts(id);
  END IF;
END $$;

-- Verification
SELECT 'Accounts table created!' as status;
SELECT * FROM accounts WHERE slug = '317plumber';
SELECT COUNT(*) as account_count FROM accounts;

