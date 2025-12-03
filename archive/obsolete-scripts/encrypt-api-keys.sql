-- ================================================================
-- API Key Encryption Script for LLM Router Security
-- ================================================================
-- This script implements encryption for LLM provider API keys using pgcrypto
-- Part of the LLM Router Security Hardening initiative
--
-- USAGE:
--   1. Ensure pgcrypto extension is enabled (already done in schema.sql)
--   2. Set encryption key as environment variable: POSTGRES_ENCRYPTION_KEY
--   3. Run this script to migrate existing unencrypted keys
--   4. Use key-manager.ts for all future key operations
--
-- SECURITY NOTES:
--   - Uses AES-256 encryption via pgcrypto
--   - Encryption key should be stored in secure environment variables
--   - Never commit the encryption key to version control
--   - Rotate encryption key periodically using rotate-encryption-key.sql
-- ================================================================

-- Ensure pgcrypto extension is enabled
create extension if not exists pgcrypto;

-- Create encryption key table (stores metadata about key rotation)
create table if not exists encryption_keys (
  id uuid primary key default uuid_generate_v4(),
  key_version integer not null unique,
  created_at timestamptz default now() not null,
  rotated_at timestamptz,
  is_active boolean default true,
  notes text
);

-- Insert initial encryption key version
insert into encryption_keys (key_version, is_active, notes)
values (1, true, 'Initial encryption key version')
on conflict (key_version) do nothing;

-- Add encrypted_api_key column if it doesn't exist (bytea for encrypted data)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'llm_providers'
    and column_name = 'encrypted_api_key'
  ) then
    alter table llm_providers add column encrypted_api_key bytea;
  end if;
end $$;

-- Add key_version column to track which encryption key was used
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'llm_providers'
    and column_name = 'key_version'
  ) then
    alter table llm_providers add column key_version integer default 1;
  end if;
end $$;

-- Function to encrypt API keys
-- Usage: SELECT encrypt_api_key('sk-1234567890', 'your-encryption-password');
create or replace function encrypt_api_key(api_key text, encryption_password text)
returns bytea
language plpgsql
security definer
as $$
begin
  if api_key is null or api_key = '' then
    return null;
  end if;

  -- Use AES-256 encryption with the provided password
  return pgp_sym_encrypt(api_key, encryption_password, 'cipher-algo=aes256');
end;
$$;

-- Function to decrypt API keys
-- Usage: SELECT decrypt_api_key(encrypted_api_key, 'your-encryption-password');
create or replace function decrypt_api_key(encrypted_key bytea, encryption_password text)
returns text
language plpgsql
security definer
as $$
begin
  if encrypted_key is null then
    return null;
  end if;

  -- Decrypt using the provided password
  return pgp_sym_decrypt(encrypted_key, encryption_password, 'cipher-algo=aes256');
exception
  when others then
    -- Return null if decryption fails (wrong password or corrupted data)
    raise warning 'Failed to decrypt API key: %', sqlerrm;
    return null;
end;
$$;

-- Migration function to encrypt existing unencrypted keys
-- This should be run ONCE after deployment
-- IMPORTANT: Set POSTGRES_ENCRYPTION_KEY environment variable before running
create or replace function migrate_unencrypted_keys(encryption_password text)
returns table(
  provider_id uuid,
  provider_name text,
  status text
)
language plpgsql
security definer
as $$
declare
  rec record;
  encrypted_key bytea;
begin
  -- Loop through all providers with unencrypted keys
  for rec in
    select id, name, api_key_encrypted
    from llm_providers
    where api_key_encrypted is not null
      and api_key_encrypted != ''
      and encrypted_api_key is null
  loop
    begin
      -- Encrypt the key
      encrypted_key := encrypt_api_key(rec.api_key_encrypted, encryption_password);

      -- Update the provider record
      update llm_providers
      set
        encrypted_api_key = encrypted_key,
        key_version = 1,
        api_key_encrypted = null -- Clear the old unencrypted field
      where id = rec.id;

      provider_id := rec.id;
      provider_name := rec.name;
      status := 'migrated';
      return next;

    exception when others then
      provider_id := rec.id;
      provider_name := rec.name;
      status := 'failed: ' || sqlerrm;
      return next;
    end;
  end loop;

  return;
end;
$$;

-- Key rotation function
-- Rotates encryption key for all providers to a new key version
create or replace function rotate_encryption_keys(
  old_password text,
  new_password text,
  new_key_version integer
)
returns table(
  provider_id uuid,
  provider_name text,
  status text
)
language plpgsql
security definer
as $$
declare
  rec record;
  decrypted_key text;
  re_encrypted_key bytea;
begin
  -- Mark old key version as inactive
  update encryption_keys
  set is_active = false, rotated_at = now()
  where is_active = true;

  -- Insert new key version
  insert into encryption_keys (key_version, is_active, notes)
  values (new_key_version, true, 'Key rotation at ' || now()::text)
  on conflict (key_version) do update
  set is_active = true;

  -- Loop through all providers with encrypted keys
  for rec in
    select id, name, encrypted_api_key, key_version
    from llm_providers
    where encrypted_api_key is not null
  loop
    begin
      -- Decrypt with old password
      decrypted_key := decrypt_api_key(rec.encrypted_api_key, old_password);

      if decrypted_key is null then
        provider_id := rec.id;
        provider_name := rec.name;
        status := 'failed: could not decrypt with old password';
        return next;
        continue;
      end if;

      -- Re-encrypt with new password
      re_encrypted_key := encrypt_api_key(decrypted_key, new_password);

      -- Update the provider record
      update llm_providers
      set
        encrypted_api_key = re_encrypted_key,
        key_version = new_key_version
      where id = rec.id;

      provider_id := rec.id;
      provider_name := rec.name;
      status := 'rotated to version ' || new_key_version;
      return next;

    exception when others then
      provider_id := rec.id;
      provider_name := rec.name;
      status := 'failed: ' || sqlerrm;
      return next;
    end;
  end loop;

  return;
end;
$$;

-- Grant execute permissions to authenticated users
grant execute on function encrypt_api_key(text, text) to authenticated;
grant execute on function decrypt_api_key(bytea, text) to authenticated;

-- Restrict migration and rotation functions to service role only
revoke execute on function migrate_unencrypted_keys(text) from public;
revoke execute on function rotate_encryption_keys(text, text, integer) from public;

-- Create index on key_version for faster lookups
create index if not exists idx_llm_providers_key_version on llm_providers(key_version);

-- ================================================================
-- MANUAL MIGRATION INSTRUCTIONS
-- ================================================================
-- After running this script, execute the migration function:
--
-- SELECT * FROM migrate_unencrypted_keys('your-secure-encryption-password');
--
-- Verify all keys were migrated:
-- SELECT id, name, provider,
--        (encrypted_api_key IS NOT NULL) as has_encrypted_key,
--        key_version
-- FROM llm_providers;
--
-- IMPORTANT: Store 'your-secure-encryption-password' in:
--   - Environment variable: POSTGRES_ENCRYPTION_KEY
--   - Secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)
--   - Never commit to version control
-- ================================================================

comment on table encryption_keys is 'Tracks encryption key versions for key rotation';
comment on column llm_providers.encrypted_api_key is 'AES-256 encrypted API key (use decrypt_api_key function)';
comment on column llm_providers.key_version is 'References encryption_keys.key_version for key rotation';
comment on function encrypt_api_key is 'Encrypts an API key using AES-256';
comment on function decrypt_api_key is 'Decrypts an API key encrypted with encrypt_api_key';
comment on function migrate_unencrypted_keys is 'One-time migration of unencrypted keys to encrypted format';
comment on function rotate_encryption_keys is 'Rotates all API keys to a new encryption key version';
