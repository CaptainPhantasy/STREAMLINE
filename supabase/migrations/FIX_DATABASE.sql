-- ============================================
-- DATABASE SCHEMA FIX SCRIPT
-- Run this in Supabase SQL Editor to fix your database
-- ============================================

-- Step 1: Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Step 2: Drop problematic tables if they exist (CAREFUL!)
-- Uncomment these ONLY if you want to completely reset
-- This will DELETE ALL DATA in these tables!
/*
DROP TABLE IF EXISTS crmai_audit CASCADE;
DROP TABLE IF EXISTS llm_providers CASCADE;
DROP TABLE IF EXISTS knowledge_docs CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
*/

-- Step 3: Create/Recreate all tables with correct schema
CREATE TABLE IF NOT EXISTS accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  inbound_email_domain text,
  settings jsonb default '{}'::jsonb,
  persona_config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid primary key references auth.users,
  account_id uuid references accounts(id) not null,
  full_name text,
  role text check (role in ('owner', 'admin', 'dispatcher', 'tech')),
  avatar_url text
);

CREATE TABLE IF NOT EXISTS contacts (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  email text,
  phone text,
  first_name text,
  last_name text,
  address text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  contact_id uuid references contacts(id),
  status text default 'open' check (status in ('open', 'closed', 'snoozed')),
  subject text,
  channel text default 'email',
  last_message_at timestamptz default now(),
  assigned_to uuid references users(id),
  ai_summary text
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  conversation_id uuid references conversations(id) not null,
  direction text check (direction in ('inbound', 'outbound')),
  sender_type text check (sender_type in ('contact', 'user', 'ai_agent')),
  sender_id uuid,
  subject text,
  body_text text,
  body_html text,
  attachments jsonb default '[]'::jsonb,
  message_id text,
  in_reply_to text,
  is_internal_note boolean default false,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  contact_id uuid references contacts(id),
  conversation_id uuid references conversations(id),
  status text check (status in ('lead', 'scheduled', 'en_route', 'in_progress', 'completed', 'invoiced', 'paid')),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  tech_assigned_id uuid references users(id),
  description text,
  total_amount integer,
  stripe_payment_link text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS knowledge_docs (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  title text,
  content text,
  embedding vector(1536),
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS llm_providers (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id),
  name text not null,
  provider text not null,
  model text not null,
  api_key_encrypted text,
  is_default boolean default false,
  cost_per_1k_tokens numeric(10,6),
  max_tokens integer,
  use_case text[],
  is_active boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS crmai_audit (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id),
  user_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  gps_latitude numeric(10,8),
  gps_longitude numeric(11,8),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Step 4: Add persona_config column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='accounts' AND column_name='persona_config'
  ) THEN
    ALTER TABLE accounts ADD COLUMN persona_config jsonb default '{}'::jsonb;
    RAISE NOTICE 'Added persona_config column to accounts';
  ELSE
    RAISE NOTICE 'persona_config column already exists';
  END IF;
END $$;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_account_created ON crmai_audit(account_id, created_at desc);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON crmai_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_llm_providers_account ON llm_providers(account_id, is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_docs USING ivfflat (embedding vector_cosine_ops);

-- Step 6: Ensure 317 Plumber account exists
INSERT INTO accounts (name, slug, inbound_email_domain)
VALUES ('317 Plumber', '317plumber', 'reply.317plumber.com')
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name,
    inbound_email_domain = EXCLUDED.inbound_email_domain;

-- Step 7: Apply RLS Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmai_audit ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid AS $$
  SELECT account_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read own account" ON accounts;
CREATE POLICY "Users can read own account"
  ON accounts FOR SELECT
  USING (id IN (SELECT account_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can read same account users" ON users;
CREATE POLICY "Users can read same account users"
  ON users FOR SELECT
  USING (account_id = get_user_account_id());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can manage contacts in own account" ON contacts;
CREATE POLICY "Users can manage contacts in own account"
  ON contacts FOR ALL
  USING (account_id = get_user_account_id())
  WITH CHECK (account_id = get_user_account_id());

DROP POLICY IF EXISTS "Users can manage conversations in own account" ON conversations;
CREATE POLICY "Users can manage conversations in own account"
  ON conversations FOR ALL
  USING (account_id = get_user_account_id())
  WITH CHECK (account_id = get_user_account_id());

DROP POLICY IF EXISTS "Users can manage messages in own account" ON messages;
CREATE POLICY "Users can manage messages in own account"
  ON messages FOR ALL
  USING (account_id = get_user_account_id())
  WITH CHECK (account_id = get_user_account_id());

DROP POLICY IF EXISTS "Users can manage jobs in own account" ON jobs;
CREATE POLICY "Users can manage jobs in own account"
  ON jobs FOR ALL
  USING (account_id = get_user_account_id())
  WITH CHECK (account_id = get_user_account_id());

DROP POLICY IF EXISTS "Users can manage knowledge docs in own account" ON knowledge_docs;
CREATE POLICY "Users can manage knowledge docs in own account"
  ON knowledge_docs FOR ALL
  USING (account_id = get_user_account_id())
  WITH CHECK (account_id = get_user_account_id());

DROP POLICY IF EXISTS "Users can read llm providers in own account" ON llm_providers;
CREATE POLICY "Users can read llm providers in own account"
  ON llm_providers FOR SELECT
  USING (account_id = get_user_account_id() OR account_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage llm providers" ON llm_providers;
CREATE POLICY "Admins can manage llm providers"
  ON llm_providers FOR ALL
  USING (
    account_id = get_user_account_id() 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  )
  WITH CHECK (
    account_id = get_user_account_id() 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS "Users can read audit logs in own account" ON crmai_audit;
CREATE POLICY "Users can read audit logs in own account"
  ON crmai_audit FOR SELECT
  USING (account_id = get_user_account_id());

DROP POLICY IF EXISTS "Service role can insert audit logs" ON crmai_audit;
CREATE POLICY "Service role can insert audit logs"
  ON crmai_audit FOR INSERT
  WITH CHECK (true);

-- Verification
SELECT 'Database schema fix complete!' as status;
SELECT COUNT(*) as account_count FROM accounts WHERE slug = '317plumber';
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;

