-- Automation Rules Table
create table if not exists automation_rules (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  name text not null,
  trigger text not null, -- 'unreplied_time', 'status_change', 'keyword', 'sentiment'
  trigger_config jsonb default '{}'::jsonb,
  action text not null, -- 'create_draft', 'assign_tech', 'send_notification', 'create_job'
  action_config jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_automation_rules_account_active on automation_rules(account_id, is_active);

-- RLS for automation_rules
alter table automation_rules enable row level security;

create policy "Users can view automation rules for their account"
  on automation_rules for select
  using (account_id = (select account_id from users where id = auth.uid()));

create policy "Users can manage automation rules for their account"
  on automation_rules for all
  using (account_id = (select account_id from users where id = auth.uid()));

