-- ROW LEVEL SECURITY POLICIES
-- Default deny, then allow based on account_id membership

-- Enable RLS on all tables
alter table accounts enable row level security;
alter table users enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table jobs enable row level security;
alter table knowledge_docs enable row level security;
alter table llm_providers enable row level security;
alter table crmai_audit enable row level security;

-- Helper function to get user's account_id
create or replace function get_user_account_id()
returns uuid as $$
  select account_id from users where id = auth.uid()
$$ language sql security definer;

-- ACCOUNTS: Users can read their own account
drop policy if exists "Users can read own account" on accounts;
create policy "Users can read own account"
  on accounts for select
  using (id in (select account_id from users where id = auth.uid()));

-- USERS: Users can read users in their account
drop policy if exists "Users can read same account users" on users;
create policy "Users can read same account users"
  on users for select
  using (account_id = get_user_account_id());

drop policy if exists "Users can update own profile" on users;
create policy "Users can update own profile"
  on users for update
  using (id = auth.uid());

-- CONTACTS: Users can CRUD contacts in their account
drop policy if exists "Users can manage contacts in own account" on contacts;
create policy "Users can manage contacts in own account"
  on contacts for all
  using (account_id = get_user_account_id())
  with check (account_id = get_user_account_id());

-- CONVERSATIONS: Users can CRUD conversations in their account
drop policy if exists "Users can manage conversations in own account" on conversations;
create policy "Users can manage conversations in own account"
  on conversations for all
  using (account_id = get_user_account_id())
  with check (account_id = get_user_account_id());

-- MESSAGES: Users can CRUD messages in their account
drop policy if exists "Users can manage messages in own account" on messages;
create policy "Users can manage messages in own account"
  on messages for all
  using (account_id = get_user_account_id())
  with check (account_id = get_user_account_id());

-- JOBS: Users can CRUD jobs in their account
drop policy if exists "Users can manage jobs in own account" on jobs;
create policy "Users can manage jobs in own account"
  on jobs for all
  using (account_id = get_user_account_id())
  with check (account_id = get_user_account_id());

-- KNOWLEDGE_DOCS: Users can CRUD knowledge docs in their account
drop policy if exists "Users can manage knowledge docs in own account" on knowledge_docs;
create policy "Users can manage knowledge docs in own account"
  on knowledge_docs for all
  using (account_id = get_user_account_id())
  with check (account_id = get_user_account_id());

-- LLM_PROVIDERS: Users can read providers in their account, admins can manage
drop policy if exists "Users can read llm providers in own account" on llm_providers;
create policy "Users can read llm providers in own account"
  on llm_providers for select
  using (account_id = get_user_account_id() or account_id is null);

drop policy if exists "Admins can manage llm providers" on llm_providers;
create policy "Admins can manage llm providers"
  on llm_providers for all
  using (
    account_id = get_user_account_id() 
    and exists (select 1 from users where id = auth.uid() and role in ('owner', 'admin'))
  )
  with check (
    account_id = get_user_account_id() 
    and exists (select 1 from users where id = auth.uid() and role in ('owner', 'admin'))
  );

-- AUDIT: Users can read audit logs in their account, system can insert
drop policy if exists "Users can read audit logs in own account" on crmai_audit;
create policy "Users can read audit logs in own account"
  on crmai_audit for select
  using (account_id = get_user_account_id());

-- Service role can insert audit logs (for Edge Functions)
drop policy if exists "Service role can insert audit logs" on crmai_audit;
create policy "Service role can insert audit logs"
  on crmai_audit for insert
  with check (true);

