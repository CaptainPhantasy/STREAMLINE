-- Fix RLS Performance Issues
-- Addresses: Multiple permissive policies and RLS initialization plan warnings

-- 1. Optimize get_user_account_id() function with stable volatility
-- This prevents re-evaluation for each row
-- Using CREATE OR REPLACE to avoid dropping dependent policies
create or replace function get_user_account_id()
returns uuid as $$
  select account_id from users where id = auth.uid()
$$ language sql security definer stable;

-- 2. Fix llm_providers policies - merge into single efficient policies
-- Drop all existing policies
drop policy if exists "Users can read llm providers in own account" on llm_providers;
drop policy if exists "Admins can manage llm providers" on llm_providers;

-- Single optimized SELECT policy (replaces multiple permissive policies)
create policy "Users can read llm providers"
  on llm_providers for select
  using (
    account_id = get_user_account_id() 
    or account_id is null
  );

-- Separate policies for admin actions (more efficient than "for all")
create policy "Admins can insert llm providers"
  on llm_providers for insert
  with check (
    (account_id = get_user_account_id() or account_id is null)
    and exists (
      select 1 from users 
      where id = auth.uid() 
      and role in ('owner', 'admin')
    )
  );

create policy "Admins can update llm providers"
  on llm_providers for update
  using (
    (account_id = get_user_account_id() or account_id is null)
    and exists (
      select 1 from users 
      where id = auth.uid() 
      and role in ('owner', 'admin')
    )
  )
  with check (
    (account_id = get_user_account_id() or account_id is null)
    and exists (
      select 1 from users 
      where id = auth.uid() 
      and role in ('owner', 'admin')
    )
  );

create policy "Admins can delete llm providers"
  on llm_providers for delete
  using (
    (account_id = get_user_account_id() or account_id is null)
    and exists (
      select 1 from users 
      where id = auth.uid() 
      and role in ('owner', 'admin')
    )
  );

-- 3. Optimize accounts policy to use stable function
drop policy if exists "Users can read own account" on accounts;
create policy "Users can read own account"
  on accounts for select
  using (id = get_user_account_id());

-- 4. Optimize users policy
drop policy if exists "Users can read same account users" on users;
create policy "Users can read same account users"
  on users for select
  using (account_id = get_user_account_id());

