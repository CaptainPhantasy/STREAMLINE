-- ============================================================================
-- ADD NEW ROLES AND SETUP SUPER ADMIN
-- ============================================================================
-- This migration:
-- 1. Adds super_admin, manager, assistant_manager roles to users table
-- 2. Updates RLS helper functions to recognize super_admin/admin for cross-account access
-- 3. Updates RLS policies to allow super_admin/admin cross-account access
-- Initial super-admin assignment is intentionally performed out of band.
-- ============================================================================

-- ============================================================================
-- STEP 1: Update users.role CHECK constraint to include all 9 roles
-- ============================================================================

-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with all 9 roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY[
    'super_admin'::text,
    'admin'::text,
    'owner'::text,
    'manager'::text,
    'assistant_manager'::text,
    'dispatcher'::text,
    'tech'::text,
    'sales'::text,
    'csr'::text
  ]));

-- ============================================================================
-- STEP 2: Update RLS helper functions to recognize super_admin/admin
-- ============================================================================

-- Function: Check if user is super_admin or admin (cross-account access)
CREATE OR REPLACE FUNCTION is_super_admin_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Function: Check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Function: Check if user is a platform admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Function: Check if user is owner or manager (account management tier)
CREATE OR REPLACE FUNCTION is_owner_or_manager()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Function: Check if user can manage users (owner, manager, assistant_manager)
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'owner', 'manager', 'assistant_manager')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ============================================================================
-- STEP 3: Update get_user_account_id() to allow super_admin/admin cross-account
-- ============================================================================

-- For super_admin/admin: Return NULL to bypass account filtering (they can access all)
-- For others: Return their account_id
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      ) THEN NULL  -- NULL means "all accounts" for super_admin/admin
      ELSE (
        SELECT account_id FROM users WHERE id = auth.uid()
      )
    END
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ============================================================================
-- STEP 4: Update RLS policies to allow super_admin/admin cross-account access
-- ============================================================================

-- Update accounts SELECT policy: super_admin/admin can see all accounts
DROP POLICY IF EXISTS "Users can read own account" ON accounts;
CREATE POLICY "Users can read own account"
  ON accounts FOR SELECT
  USING (
    -- Super admin and admin can see all accounts
    is_super_admin_or_admin()
    OR
    -- Others can only see their own account
    id IN (SELECT account_id FROM users WHERE id = auth.uid())
  );

-- Update users SELECT policy: super_admin/admin can see all users
DROP POLICY IF EXISTS "Users can read same account users" ON users;
CREATE POLICY "Users can read same account users"
  ON users FOR SELECT
  USING (
    -- Super admin and admin can see all users
    is_super_admin_or_admin()
    OR
    -- Others can only see users in their account
    account_id = (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

-- Update users UPDATE policy: super_admin/admin can update all users
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (
    -- Super admin and admin can update any user
    is_super_admin_or_admin()
    OR
    -- Others can only update themselves
    id = auth.uid()
  )
  WITH CHECK (
    -- Super admin and admin can update any user
    is_super_admin_or_admin()
    OR
    -- Others can only update themselves
    id = auth.uid()
  );

-- ============================================================================
-- STEP 5: Update other critical RLS policies for cross-account access
-- ============================================================================

-- Contacts: super_admin/admin can see all contacts
DROP POLICY IF EXISTS "Users can manage contacts in own account" ON contacts;
CREATE POLICY "Users can manage contacts in own account"
  ON contacts FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

-- Jobs: super_admin/admin can see all jobs
DROP POLICY IF EXISTS "Users can view jobs in their account" ON jobs;
DROP POLICY IF EXISTS "Users can manage jobs in their account" ON jobs;

-- Jobs SELECT: super_admin/admin see all, others see account-scoped
CREATE POLICY "Role-based job viewing"
  ON jobs FOR SELECT
  USING (
    -- Super admin and admin can see all jobs
    is_super_admin_or_admin()
    OR
    -- Tech sees only assigned jobs
    (
      get_user_role() = 'tech'
      AND tech_assigned_id = auth.uid()
      AND (request_status IS NULL OR request_status = 'approved')
    )
    OR
    -- Others see all jobs in their account
    account_id = (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

-- Jobs INSERT/UPDATE/DELETE: super_admin/admin can manage all
CREATE POLICY "Role-based job management"
  ON jobs FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify constraint updated
DO $$
DECLARE
  v_constraint_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_constraint_def
  FROM pg_constraint
  WHERE conrelid = 'users'::regclass
    AND conname = 'users_role_check';
  
  IF v_constraint_def LIKE '%super_admin%' THEN
    RAISE NOTICE '✅ Constraint updated: %', v_constraint_def;
  ELSE
    RAISE WARNING '⚠️  Constraint may not be updated: %', v_constraint_def;
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION is_super_admin_or_admin() IS 'Returns true if user is super_admin or admin (cross-account access)';
COMMENT ON FUNCTION is_super_admin() IS 'Returns true if user is super_admin (platform owner)';
COMMENT ON FUNCTION is_admin() IS 'Returns true if user is a platform admin';
COMMENT ON FUNCTION is_owner_or_manager() IS 'Returns true if user is owner or manager (account management tier)';
COMMENT ON FUNCTION can_manage_users() IS 'Returns true if user can manage other users';
