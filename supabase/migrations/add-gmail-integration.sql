-- Gmail Integration Schema
-- Stores OAuth tokens for Gmail API access

create table if not exists email_providers (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  user_id uuid references users(id), -- Optional: per-user connection
  provider text not null check (provider in ('resend', 'gmail', 'sendgrid', 'mailgun')),
  provider_email text not null, -- The email address used for sending
  is_active boolean default true,
  is_default boolean default false, -- Default provider for account
  
  -- OAuth tokens (for Gmail)
  access_token_encrypted text, -- Encrypted access token
  refresh_token_encrypted text, -- Encrypted refresh token
  token_expires_at timestamptz, -- When access token expires
  
  -- Provider-specific config
  config jsonb default '{}'::jsonb, -- Additional provider config
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_email_providers_account on email_providers(account_id, is_active);
create index if not exists idx_email_providers_user on email_providers(user_id) where user_id is not null;

-- Ensure only one default provider per account (partial unique index)
create unique index if not exists unique_default_per_account 
  on email_providers(account_id) 
  where is_default = true;

-- RLS Policies
alter table email_providers enable row level security;

-- Policy: Users can view email providers for their account
create policy "Users can view email providers for their account"
  on email_providers
  for select
  using (
    account_id in (
      select account_id from users where id = auth.uid()
    )
  );

-- Policy: Admins can manage email providers for their account
create policy "Admins can manage email providers for their account"
  on email_providers
  for all
  using (
    account_id in (
      select account_id from users 
      where id = auth.uid() 
      and role in ('owner', 'admin')
    )
  );

-- Function to update updated_at timestamp
create or replace function update_email_providers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_email_providers_updated_at
  before update on email_providers
  for each row
  execute function update_email_providers_updated_at();

