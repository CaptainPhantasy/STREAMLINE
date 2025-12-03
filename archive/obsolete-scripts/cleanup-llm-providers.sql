-- ============================================================================
-- LLM Router Database Cleanup Script
-- ============================================================================
-- Purpose: Clean up llm_providers table to only include OpenAI and Anthropic
--          providers, remove duplicates, and establish unique constraints.
--
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- Step 1: Document current state (for rollback)
DO $$
DECLARE
    provider_count INTEGER;
    grok_count INTEGER;
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO provider_count FROM llm_providers;
    SELECT COUNT(*) INTO grok_count FROM llm_providers WHERE provider IN ('grok', 'xai');

    -- Count duplicates (same name and account_id)
    SELECT COUNT(*) INTO duplicate_count FROM (
        SELECT name, account_id, COUNT(*)
        FROM llm_providers
        GROUP BY name, account_id
        HAVING COUNT(*) > 1
    ) dups;

    RAISE NOTICE '=== CLEANUP REPORT ===';
    RAISE NOTICE 'Total providers before cleanup: %', provider_count;
    RAISE NOTICE 'Grok/xAI providers to remove: %', grok_count;
    RAISE NOTICE 'Duplicate entries detected: %', duplicate_count;
END $$;

-- Step 2: Create backup table (safety measure)
DROP TABLE IF EXISTS llm_providers_backup_20251125;
CREATE TABLE llm_providers_backup_20251125 AS
SELECT * FROM llm_providers;

RAISE NOTICE 'Backup created: llm_providers_backup_20251125';

-- Step 3: Remove all Grok/xAI providers
DELETE FROM llm_providers
WHERE provider IN ('grok', 'xai', 'x.ai')
   OR name ILIKE '%grok%'
   OR name ILIKE '%xai%'
   OR model ILIKE '%grok%';

-- Step 4: Remove duplicates (keep newest entry per name+account_id)
-- This uses a window function to identify the newest row
DELETE FROM llm_providers
WHERE id IN (
    SELECT id FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY name, COALESCE(account_id::text, 'null')
                ORDER BY created_at DESC
            ) as rn
        FROM llm_providers
    ) ranked
    WHERE rn > 1
);

-- Step 5: Ensure only one default provider exists (openai-gpt4o-mini)
UPDATE llm_providers
SET is_default = false
WHERE is_default = true
  AND name != 'openai-gpt4o-mini';

UPDATE llm_providers
SET is_default = true
WHERE name = 'openai-gpt4o-mini'
  AND account_id IS NULL;

-- Step 6: Upsert the 4 canonical providers
-- This ensures we have exactly the right configuration

-- OpenAI GPT-4o Mini (Default, Fast & Cheap)
INSERT INTO llm_providers (
    name,
    provider,
    model,
    api_key_encrypted,
    is_default,
    use_case,
    max_tokens,
    cost_per_1k_tokens,
    is_active,
    account_id
) VALUES (
    'openai-gpt4o-mini',
    'openai',
    'gpt-4o-mini',
    '', -- API key in env: OPENAI_API_KEY
    true,
    ARRAY['draft', 'summary', 'general', 'voice'],
    4000,
    0.00015, -- $0.15 per 1M input tokens, $0.60 per 1M output tokens (avg)
    true,
    NULL
)
ON CONFLICT (name, COALESCE(account_id::text, 'null'))
DO UPDATE SET
    provider = EXCLUDED.provider,
    model = EXCLUDED.model,
    is_default = EXCLUDED.is_default,
    use_case = EXCLUDED.use_case,
    max_tokens = EXCLUDED.max_tokens,
    cost_per_1k_tokens = EXCLUDED.cost_per_1k_tokens,
    is_active = EXCLUDED.is_active;

-- OpenAI GPT-4o (Complex & Vision)
INSERT INTO llm_providers (
    name,
    provider,
    model,
    api_key_encrypted,
    is_default,
    use_case,
    max_tokens,
    cost_per_1k_tokens,
    is_active,
    account_id
) VALUES (
    'openai-gpt4o',
    'openai',
    'gpt-4o',
    '',
    false,
    ARRAY['complex', 'vision'],
    16000,
    0.0025, -- $2.50 per 1M input tokens, $10 per 1M output tokens (avg)
    true,
    NULL
)
ON CONFLICT (name, COALESCE(account_id::text, 'null'))
DO UPDATE SET
    provider = EXCLUDED.provider,
    model = EXCLUDED.model,
    is_default = EXCLUDED.is_default,
    use_case = EXCLUDED.use_case,
    max_tokens = EXCLUDED.max_tokens,
    cost_per_1k_tokens = EXCLUDED.cost_per_1k_tokens,
    is_active = EXCLUDED.is_active;

-- Anthropic Claude Haiku 4.5 (Fast & Cheap for draft/summary)
INSERT INTO llm_providers (
    name,
    provider,
    model,
    api_key_encrypted,
    is_default,
    use_case,
    max_tokens,
    cost_per_1k_tokens,
    is_active,
    account_id
) VALUES (
    'anthropic-claude-haiku-4-5',
    'anthropic',
    'claude-haiku-4-5',
    '', -- API key in env: ANTHROPIC_API_KEY
    false,
    ARRAY['draft', 'summary', 'general'],
    8192,
    0.001, -- $1 per 1M input tokens, $5 per 1M output tokens (avg: $3/M)
    true,
    NULL
)
ON CONFLICT (name, COALESCE(account_id::text, 'null'))
DO UPDATE SET
    provider = EXCLUDED.provider,
    model = EXCLUDED.model,
    is_default = EXCLUDED.is_default,
    use_case = EXCLUDED.use_case,
    max_tokens = EXCLUDED.max_tokens,
    cost_per_1k_tokens = EXCLUDED.cost_per_1k_tokens,
    is_active = EXCLUDED.is_active;

-- Anthropic Claude Sonnet 4.5 (Complex reasoning)
INSERT INTO llm_providers (
    name,
    provider,
    model,
    api_key_encrypted,
    is_default,
    use_case,
    max_tokens,
    cost_per_1k_tokens,
    is_active,
    account_id
) VALUES (
    'anthropic-claude-sonnet-4-5',
    'anthropic',
    'claude-sonnet-4-5',
    '',
    false,
    ARRAY['complex'],
    8192,
    0.003, -- $3 per 1M input tokens, $15 per 1M output tokens (avg: $9/M)
    true,
    NULL
)
ON CONFLICT (name, COALESCE(account_id::text, 'null'))
DO UPDATE SET
    provider = EXCLUDED.provider,
    model = EXCLUDED.model,
    is_default = EXCLUDED.is_default,
    use_case = EXCLUDED.use_case,
    max_tokens = EXCLUDED.max_tokens,
    cost_per_1k_tokens = EXCLUDED.cost_per_1k_tokens,
    is_active = EXCLUDED.is_active;

-- Step 7: Add unique constraint to prevent future duplicates
-- Drop existing constraint if it exists
ALTER TABLE llm_providers
DROP CONSTRAINT IF EXISTS llm_providers_unique_name_account;

-- Add new unique constraint
-- COALESCE handles NULL account_id to ensure uniqueness works correctly
ALTER TABLE llm_providers
ADD CONSTRAINT llm_providers_unique_name_account
UNIQUE (name, COALESCE(account_id::text, 'global'));

-- Step 8: Final validation and report
DO $$
DECLARE
    final_count INTEGER;
    default_count INTEGER;
    openai_count INTEGER;
    anthropic_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM llm_providers WHERE account_id IS NULL;
    SELECT COUNT(*) INTO default_count FROM llm_providers WHERE is_default = true;
    SELECT COUNT(*) INTO openai_count FROM llm_providers WHERE provider = 'openai' AND account_id IS NULL;
    SELECT COUNT(*) INTO anthropic_count FROM llm_providers WHERE provider = 'anthropic' AND account_id IS NULL;

    RAISE NOTICE '';
    RAISE NOTICE '=== CLEANUP COMPLETE ===';
    RAISE NOTICE 'Global providers remaining: %', final_count;
    RAISE NOTICE 'Default providers: %', default_count;
    RAISE NOTICE 'OpenAI providers: %', openai_count;
    RAISE NOTICE 'Anthropic providers: %', anthropic_count;
    RAISE NOTICE '';

    -- Validation checks
    IF final_count != 4 THEN
        RAISE WARNING 'Expected 4 global providers, found %', final_count;
    END IF;

    IF default_count != 1 THEN
        RAISE WARNING 'Expected 1 default provider, found %', default_count;
    END IF;

    IF openai_count != 2 THEN
        RAISE WARNING 'Expected 2 OpenAI providers, found %', openai_count;
    END IF;

    IF anthropic_count != 2 THEN
        RAISE WARNING 'Expected 2 Anthropic providers, found %', anthropic_count;
    END IF;
END $$;

-- Display final provider list
SELECT
    name,
    provider,
    model,
    is_default,
    use_case,
    max_tokens,
    cost_per_1k_tokens,
    is_active
FROM llm_providers
WHERE account_id IS NULL
ORDER BY provider, name;

-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- To rollback this cleanup:
-- 1. DROP TABLE llm_providers;
-- 2. CREATE TABLE llm_providers AS SELECT * FROM llm_providers_backup_20251125;
-- 3. ALTER TABLE llm_providers ADD PRIMARY KEY (id);
-- ============================================================================
