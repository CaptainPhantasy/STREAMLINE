-- Seed default LLM providers for the system
-- These are global defaults that can be overridden per account

insert into llm_providers (name, provider, model, api_key_encrypted, is_default, use_case, max_tokens, is_active, account_id)
values
  ('openai-gpt4o-mini', 'openai', 'gpt-4o-mini', '', true, array['draft', 'summary', 'general'], 4000, true, null),
  ('openai-gpt4o', 'openai', 'gpt-4o', '', false, array['complex', 'vision'], 16000, true, null),
  ('openai-haiku', 'openai', 'gpt-4o-mini', '', false, array['summary'], 2000, true, null)
on conflict do nothing;

