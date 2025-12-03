-- ============================================================================
-- ENFORCE ROLE-BASED RLS POLICIES
-- ============================================================================
-- This migration replaces generic account-based policies with role-specific
-- policies that match the permission system defined in lib/auth/permissions.ts
--
-- Key Changes:
-- 1. Jobs: Tech can only see assigned jobs (approved/pending, not rejected)
-- 2. Jobs: Sales cannot see jobs at all
-- 3. Jobs: CSR can see all jobs but cannot edit/delete
-- 4. Jobs: Only admin/owner can delete jobs
-- 5. Contacts: Tech can only view (not edit/delete)
-- 6. Contacts: Sales can view/edit (not delete)
-- 7. Users: Only admin/owner can manage users
-- 8. Invoices: CSR can create but not edit/delete
-- 9. Estimates: Sales can view/create but not edit/delete
-- 10. All tables: Role-based access matching permission system
-- ============================================================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user has specific role(s)
CREATE OR REPLACE FUNCTION user_has_role(allowed_roles text[])
RETURNS boolean AS $$
  SELECT get_user_role() = ANY(allowed_roles)
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin or owner
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS boolean AS $$
  SELECT get_user_role() IN ('admin', 'owner')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- JOBS TABLE - Role-Based Policies
-- ============================================================================

-- Drop existing generic policy
DROP POLICY IF EXISTS "Users can manage jobs in own account" ON jobs;

-- SELECT: View jobs based on role
-- Admin/Owner/Dispatcher/CSR: View all jobs in account
-- Tech: View only assigned jobs (approved or null request_status, not pending/rejected)
-- Sales: Cannot view jobs
CREATE POLICY "Role-based job viewing"
  ON jobs FOR SELECT
  USING (
    account_id = get_user_account_id()
    AND (
      -- Admin/Owner/Dispatcher/CSR can see all jobs
      user_has_role(ARRAY['admin', 'owner', 'dispatcher', 'csr'])
      OR
      -- Tech can only see assigned jobs that are approved or have no request_status
      (
        get_user_role() = 'tech'
        AND tech_assigned_id = auth.uid()
        AND (request_status IS NULL OR request_status = 'approved')
      )
    )
    -- Sales role is excluded (if sales, the OR above is false, so this whole expression is false)
  );

-- INSERT: Create jobs
-- Admin/Owner/Dispatcher/Tech/CSR can create jobs
-- Sales cannot create jobs
CREATE POLICY "Role-based job creation"
  ON jobs FOR INSERT
  WITH CHECK (
    account_id = get_user_account_id()
    AND user_has_role(ARRAY['admin', 'owner', 'dispatcher', 'tech', 'csr'])
  );

-- UPDATE: Edit jobs
-- Admin/Owner/Dispatcher/Tech can edit jobs
-- CSR cannot edit jobs (can only view/create)
-- Sales cannot edit jobs
CREATE POLICY "Role-based job editing"
  ON jobs FOR UPDATE
  USING (
    account_id = get_user_account_id()
    AND (
      -- Admin/Owner/Dispatcher can edit any job
      user_has_role(ARRAY['admin', 'owner', 'dispatcher'])
      OR
      -- Tech can only edit assigned jobs
      (
        user_has_role(ARRAY['tech'])
        AND tech_assigned_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    account_id = get_user_account_id()
    AND (
      user_has_role(ARRAY['admin', 'owner', 'dispatcher'])
      OR
      (
        user_has_role(ARRAY['tech'])
        AND tech_assigned_id = auth.uid()
      )
    )
  );

-- DELETE: Delete jobs
-- Only Admin/Owner can delete jobs
CREATE POLICY "Only admins can delete jobs"
  ON jobs FOR DELETE
  USING (
    account_id = get_user_account_id()
    AND is_admin_or_owner()
  );

-- ============================================================================
-- CONTACTS TABLE - Role-Based Policies
-- ============================================================================

-- Drop existing generic policy
DROP POLICY IF EXISTS "Users can manage contacts in own account" ON contacts;

-- SELECT: View contacts
-- All roles can view contacts (except sales - wait, sales CAN view contacts)
CREATE POLICY "Role-based contact viewing"
  ON contacts FOR SELECT
  USING (
    account_id = get_user_account_id()
    AND user_has_role(ARRAY['admin', 'owner', 'dispatcher', 'tech', 'sales', 'csr'])
  );

-- INSERT: Create contacts
-- Admin/Owner/Dispatcher/Sales/CSR can create contacts
-- Tech cannot create contacts (view only)
CREATE POLICY "Role-based contact creation"
  ON contacts FOR INSERT
  WITH CHECK (
    account_id = get_user_account_id()
    AND user_has_role(ARRAY['admin', 'owner', 'dispatcher', 'sales', 'csr'])
  );

-- UPDATE: Edit contacts
-- Admin/Owner/Dispatcher/Sales/CSR can edit contacts
-- Tech cannot edit contacts (view only)
CREATE POLICY "Role-based contact editing"
  ON contacts FOR UPDATE
  USING (
    account_id = get_user_account_id()
    AND user_has_role(ARRAY['admin', 'owner', 'dispatcher', 'sales', 'csr'])
  )
  WITH CHECK (
    account_id = get_user_account_id()
    AND user_has_role(ARRAY['admin', 'owner', 'dispatcher', 'sales', 'csr'])
  );

-- DELETE: Delete contacts
-- Only Admin/Owner can delete contacts
CREATE POLICY "Only admins can delete contacts"
  ON contacts FOR DELETE
  USING (
    account_id = get_user_account_id()
    AND is_admin_or_owner()
  );

-- ============================================================================
-- USERS TABLE - Role-Based Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read same account users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- SELECT: View users
-- All users can view users in their account (for team member lists)
CREATE POLICY "Users can view same account users"
  ON users FOR SELECT
  USING (account_id = get_user_account_id());

-- UPDATE: Update users
-- Users can update their own profile
-- Admin/Owner can update any user in their account
CREATE POLICY "Role-based user updates"
  ON users FOR UPDATE
  USING (
    -- Users can update their own profile
    id = auth.uid()
    OR
    -- Admin/Owner can update any user in their account
    (
      account_id = get_user_account_id()
      AND is_admin_or_owner()
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR
    (
      account_id = get_user_account_id()
      AND is_admin_or_owner()
    )
  );

-- INSERT: Create users
-- Only Admin/Owner can create users (via API, but RLS enforces)
CREATE POLICY "Only admins can create users"
  ON users FOR INSERT
  WITH CHECK (
    account_id = get_user_account_id()
    AND is_admin_or_owner()
  );

-- DELETE: Delete users
-- Only Admin/Owner can delete users
CREATE POLICY "Only admins can delete users"
  ON users FOR DELETE
  USING (
    account_id = get_user_account_id()
    AND is_admin_or_owner()
  );

-- ============================================================================
-- INVOICES TABLE - Role-Based Policies
-- ============================================================================

-- Check if invoices table exists and has RLS enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    -- Drop existing generic policies if they exist
    DROP POLICY IF EXISTS "Users can view invoices for their account" ON invoices;
    DROP POLICY IF EXISTS "Users can manage invoices for their account" ON invoices;

    -- SELECT: View invoices
    -- Admin/Owner/CSR can view invoices
    -- Dispatcher has view_financials permission but may have limited access
    CREATE POLICY "Role-based invoice viewing"
      ON invoices FOR SELECT
      USING (
        account_id = get_user_account_id()
        AND user_has_role(ARRAY['admin', 'owner', 'csr', 'dispatcher'])
      );

    -- INSERT: Create invoices
    -- Admin/Owner/CSR can create invoices
    CREATE POLICY "Role-based invoice creation"
      ON invoices FOR INSERT
      WITH CHECK (
        account_id = get_user_account_id()
        AND user_has_role(ARRAY['admin', 'owner', 'csr'])
      );

    -- UPDATE: Edit invoices
    -- Only Admin/Owner can edit invoices
    CREATE POLICY "Only admins can edit invoices"
      ON invoices FOR UPDATE
      USING (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      )
      WITH CHECK (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      );

    -- DELETE: Delete invoices
    -- Only Admin/Owner can delete invoices
    CREATE POLICY "Only admins can delete invoices"
      ON invoices FOR DELETE
      USING (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      );
  END IF;
END $$;

-- ============================================================================
-- ESTIMATES TABLE - Role-Based Policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'estimates') THEN
    -- Drop existing generic policies if they exist
    DROP POLICY IF EXISTS "Users can view estimates for their account" ON estimates;
    DROP POLICY IF EXISTS "Users can create estimates for their account" ON estimates;
    DROP POLICY IF EXISTS "Users can update estimates for their account" ON estimates;
    DROP POLICY IF EXISTS "Users can delete estimates for their account" ON estimates;

    -- SELECT: View estimates
    -- Admin/Owner/Dispatcher/Sales/CSR can view estimates
    CREATE POLICY "Role-based estimate viewing"
      ON estimates FOR SELECT
      USING (
        account_id = get_user_account_id()
        AND user_has_role(ARRAY['admin', 'owner', 'dispatcher', 'sales', 'csr'])
      );

    -- INSERT: Create estimates
    -- Admin/Owner/Sales can create estimates
    CREATE POLICY "Role-based estimate creation"
      ON estimates FOR INSERT
      WITH CHECK (
        account_id = get_user_account_id()
        AND user_has_role(ARRAY['admin', 'owner', 'sales'])
      );

    -- UPDATE: Edit estimates
    -- Only Admin/Owner can edit estimates
    CREATE POLICY "Only admins can edit estimates"
      ON estimates FOR UPDATE
      USING (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      )
      WITH CHECK (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      );

    -- DELETE: Delete estimates
    -- Only Admin/Owner can delete estimates
    CREATE POLICY "Only admins can delete estimates"
      ON estimates FOR DELETE
      USING (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      );
  END IF;
END $$;

-- ============================================================================
-- PARTS TABLE - Role-Based Policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parts') THEN
    -- Drop existing generic policies if they exist
    DROP POLICY IF EXISTS "Users can manage parts for their account" ON parts;

    -- SELECT: View parts
    -- Admin/Owner/Dispatcher can view parts (view_parts permission)
    CREATE POLICY "Role-based parts viewing"
      ON parts FOR SELECT
      USING (
        account_id = get_user_account_id()
        AND user_has_role(ARRAY['admin', 'owner', 'dispatcher'])
      );

    -- INSERT/UPDATE/DELETE: Manage parts
    -- Only Admin/Owner can manage parts
    CREATE POLICY "Only admins can manage parts"
      ON parts FOR ALL
      USING (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      )
      WITH CHECK (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      );
  END IF;
END $$;

-- ============================================================================
-- CAMPAIGNS TABLE - Role-Based Policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    -- Drop existing generic policies if they exist
    DROP POLICY IF EXISTS "Users can view campaigns for their account" ON campaigns;
    DROP POLICY IF EXISTS "Users can manage campaigns for their account" ON campaigns;

    -- SELECT: View campaigns
    -- Admin/Owner/Sales can view campaigns (view_marketing permission)
    CREATE POLICY "Role-based campaign viewing"
      ON campaigns FOR SELECT
      USING (
        account_id = get_user_account_id()
        AND user_has_role(ARRAY['admin', 'owner', 'sales'])
      );

    -- INSERT/UPDATE/DELETE: Manage campaigns
    -- Only Admin/Owner can manage campaigns (manage_marketing permission)
    CREATE POLICY "Only admins can manage campaigns"
      ON campaigns FOR ALL
      USING (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      )
      WITH CHECK (
        account_id = get_user_account_id()
        AND is_admin_or_owner()
      );
  END IF;
END $$;

-- ============================================================================
-- CONVERSATIONS & MESSAGES - Keep existing (all roles can manage)
-- ============================================================================
-- These tables already have appropriate policies - all authenticated users
-- in the account can manage conversations and messages

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- This migration ensures that:
-- 1. Tech users automatically get restricted job access (assigned only)
-- 2. Sales users automatically cannot see jobs
-- 3. CSR users automatically can see all jobs but cannot edit
-- 4. Contact permissions match role capabilities
-- 5. User management is restricted to admin/owner
-- 6. Financial permissions match role capabilities
-- 7. All permissions are enforced at the database level automatically
--
-- When a new user is created with a role, they automatically inherit
-- the correct database permissions without manual fixes.

