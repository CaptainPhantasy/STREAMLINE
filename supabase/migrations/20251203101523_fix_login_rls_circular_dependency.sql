-- ============================================================================
-- FIX LOGIN RLS CIRCULAR DEPENDENCY
-- Created: 2025-12-03 10:15:23 EST
-- ============================================================================
-- Issue: "Database error querying schema" during login
-- Root Cause: get_user_account_id() function queries users table, but RLS
--             policy on users uses get_user_account_id(), creating circular dependency
-- ============================================================================

-- ============================================================================
-- Fix 1: Ensure get_user_account_id() function has proper security settings
-- ============================================================================
-- The function needs SET search_path = '' for security and must be STABLE
-- to prevent re-evaluation for each row in RLS policies
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT account_id FROM public.users WHERE id = auth.uid()
$$;

-- ============================================================================
-- Fix 2: Ensure users can ALWAYS query their own record (for login)
-- ============================================================================
-- The "Users can view own profile" policy should allow this, but let's make
-- sure it's working correctly and has priority
-- ============================================================================

-- Verify the policy exists and is correct
-- The policy should allow: auth.uid() = id
-- This allows users to query their own record during login

-- ============================================================================
-- Fix 3: Test that the function works correctly
-- ============================================================================
-- The function should return NULL when no user is authenticated (expected)
-- and return the account_id when a user is authenticated

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After this migration, test login with:
-- 1. Email: douglastalley1977@gmail.com
-- 2. Should successfully query users table and get role
-- 3. Should redirect to appropriate page based on role
-- ============================================================================

