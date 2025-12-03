-- ============================================================================
-- FIX RECOVERY_TOKEN NULL ISSUE (THE ACTUAL LOGIN PROBLEM)
-- Created: 2025-12-03 10:22:51 EST
-- ============================================================================
-- The REAL error was: "sql: Scan error on column index 31, name \"recovery_token\": converting NULL to string is unsupported"
-- This was causing 500 errors on /auth/v1/token (login endpoint)
-- ============================================================================

BEGIN;

-- Fix existing NULL recovery_token values
UPDATE auth.users
SET recovery_token = ''
WHERE recovery_token IS NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After this migration, login should work. The error was NOT email_change,
-- it was recovery_token having NULL values that Supabase Auth Go code
-- cannot handle.
-- ============================================================================

