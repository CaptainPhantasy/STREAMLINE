-- Add Claude Haiku 4.5 provider
-- Released: Oct 15, 2025
-- Pricing: $1/$5 per million input/output tokens
-- Model: claude-haiku-4-5
-- Best for: draft, summary, general tasks (faster and cheaper than Sonnet)

INSERT INTO llm_providers (
  name,
  provider,
  model,
  api_key_encrypted,
  is_default,
  use_case,
  max_tokens,
  is_active,
  account_id
) VALUES (
  'anthropic-claude-haiku-4-5',
  'anthropic',
  'claude-haiku-4-5',
  '', -- API key stored in env var ANTHROPIC_API_KEY
  false,
  array['draft', 'summary', 'general'],
  8192,
  true,
  null -- Global provider
)
ON CONFLICT (name, account_id) DO UPDATE
SET
  model = EXCLUDED.model,
  use_case = EXCLUDED.use_case,
  max_tokens = EXCLUDED.max_tokens,
  is_active = EXCLUDED.is_active;

-- Update routing priority: Haiku for draft/summary, Sonnet for complex
-- This is handled in the router logic, but we can mark Haiku as preferred for draft/summary

