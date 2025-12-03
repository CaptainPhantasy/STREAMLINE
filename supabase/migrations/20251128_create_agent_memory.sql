-- Create agent_memory table for 72-hour persistent memory
-- This enables the voice agent to recall conversation context

-- 1. Create the Memory Table
create table agent_memory (
  id uuid default gen_random_uuid() primary key,
  phone_number text not null,
  contact_id uuid references contacts(id), -- Links to real contact if known
  intent text, -- e.g. "job_creation", "scheduling", "dispatch"
  conversation_summary text, -- "User is describing a leak under the sink"
  staging_data jsonb default '{}'::jsonb, -- Partial data: {"address": "123 Main"}
  last_active_at timestamptz default now(),
  created_at timestamptz default now(),

  -- Enforce one active memory row per phone number
  constraint unique_active_memory unique (phone_number)
);

-- 2. Create Index for Speed (Critical for Voice Latency)
create index idx_memory_phone_lookup on agent_memory(phone_number);
create index idx_memory_last_active on agent_memory(last_active_at);

-- 3. Enable RLS (Security)
alter table agent_memory enable row level security;

-- 4. Create RLS Policies
create policy "Allow full access to agent_memory" on agent_memory
  for all using (true) with check (true);

-- 5. Add helpful comment for documentation
comment on table agent_memory is 'Stores transient conversation state for voice agent to resume context within 72 hours';