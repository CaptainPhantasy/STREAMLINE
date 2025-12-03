-- EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- 1. TENANCY & IAM
create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null, -- e.g. "317 Plumber"
  slug text unique not null, -- e.g. "317plumber"
  inbound_email_domain text, -- e.g. "reply.317plumber.com"
  settings jsonb default '{}'::jsonb, -- Brand colors, logo, business hours
  persona_config jsonb default '{}'::jsonb, -- AI persona configuration per tenant
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key references auth.users,
  account_id uuid references accounts(id) not null,
  full_name text,
  role text check (role in ('owner', 'admin', 'dispatcher', 'tech')),
  avatar_url text
);

-- 2. CRM CORE
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  email text, -- Primary key for email-first matching
  phone text,
  first_name text,
  last_name text,
  address text,
  created_at timestamptz default now()
);

-- 3. COMMS ENGINE (The "Podium" Killer)
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  contact_id uuid references contacts(id),
  status text default 'open' check (status in ('open', 'closed', 'snoozed')),
  subject text, -- Email subject line
  channel text default 'email',
  last_message_at timestamptz default now(),
  assigned_to uuid references users(id),
  ai_summary text -- Long-term memory summary of thread
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  conversation_id uuid references conversations(id) not null,
  direction text check (direction in ('inbound', 'outbound')),
  sender_type text check (sender_type in ('contact', 'user', 'ai_agent')),
  sender_id uuid, -- Null if contact, User ID if user
  
  -- Email Specifics
  subject text,
  body_text text,
  body_html text,
  attachments jsonb default '[]'::jsonb,
  message_id text, -- Provider ID (Message-ID header)
  in_reply_to text, -- For threading
  
  is_internal_note boolean default false,
  created_at timestamptz default now()
);

-- 4. WORKFLOW & JOBS
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  contact_id uuid references contacts(id),
  conversation_id uuid references conversations(id), -- Link chat to job
  
  status text check (status in ('lead', 'scheduled', 'en_route', 'in_progress', 'completed', 'invoiced', 'paid')),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  tech_assigned_id uuid references users(id),
  
  description text,
  total_amount integer, -- In cents
  stripe_payment_link text,
  
  created_at timestamptz default now()
);

-- 5. KNOWLEDGE BASE (For AI)
create table if not exists knowledge_docs (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  title text,
  content text, -- The raw text the AI reads
  embedding vector(1536), -- For RAG (future proofing)
  created_at timestamptz default now()
);

-- 6. LLM PROVIDERS (Multi-LLM Router)
create table if not exists llm_providers (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id),
  name text not null, -- e.g. "openai-gpt4o", "anthropic-claude", "openai-haiku"
  provider text not null, -- "openai", "anthropic", "google"
  model text not null, -- "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "gemini-pro"
  api_key_encrypted text, -- Encrypted API key (use pgcrypto)
  is_default boolean default false,
  cost_per_1k_tokens numeric(10,6), -- For cost tracking
  max_tokens integer,
  use_case text[], -- ["draft", "summary", "complex", "vision"]
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 7. AUDIT TRAIL (Immutable Logging)
create table if not exists crmai_audit (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id),
  user_id uuid references users(id),
  action text not null, -- "job_created", "status_changed", "message_sent", etc.
  entity_type text not null, -- "job", "message", "contact", etc.
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

-- INDEXES for performance
create index if not exists idx_audit_account_created on crmai_audit(account_id, created_at desc);
create index if not exists idx_audit_entity on crmai_audit(entity_type, entity_id);
create index if not exists idx_llm_providers_account on llm_providers(account_id, is_active);
create index if not exists idx_knowledge_embedding on knowledge_docs using ivfflat (embedding vector_cosine_ops);

