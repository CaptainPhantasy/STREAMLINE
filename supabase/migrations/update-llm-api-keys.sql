-- Update LLM Providers with API Keys
-- Run this after setting up your Supabase project
-- Note: In production, use pgcrypto to encrypt these keys
-- IMPORTANT: Replace the placeholder values below with your actual API keys

-- Update OpenAI providers
-- Replace 'YOUR_OPENAI_API_KEY' with your actual OpenAI API key
update llm_providers 
set api_key_encrypted = 'YOUR_OPENAI_API_KEY'
where provider = 'openai';

-- Add Anthropic Claude providers if they don't exist
-- Replace 'YOUR_ANTHROPIC_API_KEY' with your actual Anthropic API key

-- Claude Sonnet 3.5 - Best for complex tasks
insert into llm_providers (name, provider, model, api_key_encrypted, is_default, use_case, max_tokens, is_active, account_id)
values
  ('anthropic-claude-3-5-sonnet', 'anthropic', 'claude-3-5-sonnet-20241022', 'YOUR_ANTHROPIC_API_KEY', false, array['complex', 'general'], 8192, true, null)
on conflict (name, account_id) do nothing;

-- Claude Haiku 4.5 - NEW! Faster and cheaper, ideal for draft/summary tasks
-- Released: Oct 15, 2025
-- Pricing: $1/$5 per million input/output tokens
-- See: https://www.anthropic.com/news/claude-haiku-4-5
insert into llm_providers (name, provider, model, api_key_encrypted, is_default, use_case, max_tokens, is_active, account_id)
values
  ('anthropic-claude-haiku-4-5', 'anthropic', 'claude-haiku-4-5', 'YOUR_ANTHROPIC_API_KEY', false, array['draft', 'summary', 'general'], 8192, true, null)
on conflict (name, account_id) do nothing;

-- Update Anthropic if it exists
-- Replace 'YOUR_ANTHROPIC_API_KEY' with your actual Anthropic API key
update llm_providers 
set api_key_encrypted = 'YOUR_ANTHROPIC_API_KEY'
where provider = 'anthropic';

