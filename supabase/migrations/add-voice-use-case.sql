-- ================================================================
-- Add 'voice' use case to LLM providers
-- ================================================================
--
-- This migration adds the 'voice' use case to appropriate providers.
-- Voice requires low latency, so we prioritize:
-- 1. GPT-4o-mini (fastest, cheapest) - PRIMARY
-- 2. Claude Haiku 4.5 (fast, low cost) - SECONDARY
--
-- Use case: Voice command parsing and response generation
-- Requirements: <500ms latency, natural language understanding
-- ================================================================

-- Add 'voice' use case to openai-gpt4o-mini (primary for voice)
UPDATE llm_providers
SET use_case = array_append(use_case, 'voice'::text)
WHERE name = 'openai-gpt4o-mini'
  AND NOT ('voice' = ANY(use_case))
  AND is_active = true;

-- Add 'voice' use case to anthropic-claude-haiku-4-5 (secondary for voice)
UPDATE llm_providers
SET use_case = array_append(use_case, 'voice'::text)
WHERE name = 'anthropic-claude-haiku-4-5'
  AND NOT ('voice' = ANY(use_case))
  AND is_active = true;

-- Verify the changes
SELECT
  name,
  provider,
  model,
  use_case,
  is_default,
  is_active
FROM llm_providers
WHERE 'voice' = ANY(use_case)
ORDER BY
  CASE
    WHEN provider = 'openai' THEN 1  -- Prefer OpenAI for voice (lower latency)
    WHEN provider = 'anthropic' THEN 2
    ELSE 3
  END,
  name;

-- Expected output:
-- openai-gpt4o-mini should now include 'voice' in use_case
-- anthropic-claude-haiku-4-5 should now include 'voice' in use_case
