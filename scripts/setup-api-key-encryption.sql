-- Setup API Key Encryption for LLM Providers
-- Uses pgcrypto extension for encryption

-- Ensure pgcrypto extension is enabled
create extension if not exists pgcrypto;

-- Function to encrypt API keys
create or replace function encrypt_api_key(api_key text, encryption_key text)
returns text as $$
  select encode(
    pgp_sym_encrypt(api_key, encryption_key),
    'base64'
  )
$$ language sql;

-- Function to decrypt API keys (for edge functions)
create or replace function decrypt_api_key(encrypted_key text, encryption_key text)
returns text as $$
  select pgp_sym_decrypt(
    decode(encrypted_key, 'base64'),
    encryption_key
  )
$$ language sql security definer;

-- Note: In production, store encryption_key in Supabase secrets
-- Edge functions should use SUPABASE_SERVICE_ROLE_KEY to decrypt
-- For now, API keys are stored in Supabase secrets (recommended approach)

