-- ============================================================================
-- COMPREHENSIVE RLS AUDIT: SUPER_ADMIN FULL ACCESS + ROLE HIERARCHY
-- ============================================================================
-- This migration ensures:
-- 1. super_admin and admin have FULL, UNRESTRICTED access to ALL tables
-- 2. All other roles have appropriate access based on permission hierarchy
-- 3. Consistent use of helper functions across all policies
--
-- Role Hierarchy (most to least privileged):
-- - super_admin: Platform owner (Douglas) - FULL access to ALL accounts
-- - admin: Legacy AI team - FULL access to ALL accounts  
-- - owner: Client account owner - FULL access to their account
-- - manager: Client manager - FULL access to their account (same as owner)
-- - assistant_manager: Limited account access
-- - dispatcher: Dispatch operations, job assignment
-- - tech: Field technician, assigned jobs only
-- - sales: Sales representative, contacts/estimates
-- - csr: Customer service, contacts/jobs/invoices
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure helper functions exist and are correct
-- ============================================================================

-- Function: Check if user is super_admin or admin (cross-account access)
CREATE OR REPLACE FUNCTION is_super_admin_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function: Get user's account_id (returns NULL for super_admin/admin)
-- Note: This function is used in policies where is_super_admin_or_admin() is checked FIRST
-- So when this function is called, we know the user is NOT super_admin/admin
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid AS $$
  SELECT account_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function: Get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function: Check if user has specific role(s)
CREATE OR REPLACE FUNCTION user_has_role(allowed_roles text[])
RETURNS boolean AS $$
  SELECT get_user_role() = ANY(allowed_roles)
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function: Check if user is admin or owner
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS boolean AS $$
  SELECT get_user_role() IN ('admin', 'owner', 'super_admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function: Check if user is owner or manager
CREATE OR REPLACE FUNCTION is_owner_or_manager()
RETURNS boolean AS $$
  SELECT get_user_role() IN ('owner', 'manager', 'super_admin', 'admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 2: ACCOUNTS TABLE - Super admin/admin see all, others see own
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own account" ON accounts;
CREATE POLICY "Super admin/admin can see all accounts, others see own"
  ON accounts FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR id IN (SELECT account_id FROM users WHERE id = auth.uid())
  );

-- ============================================================================
-- STEP 3: USERS TABLE - Super admin/admin see all, others see account-scoped
-- ============================================================================

-- SELECT: Super admin/admin see all users, others see account-scoped
DROP POLICY IF EXISTS "Users can read same account users" ON users;
DROP POLICY IF EXISTS "Users can view same account users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Super admin/admin see all users, others see account-scoped"
  ON users FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR id = auth.uid()  -- Always can see self
    OR account_id = get_user_account_id()
  );

-- INSERT: Super admin/admin can create anywhere, others account-scoped with role restrictions
DROP POLICY IF EXISTS "Only admins can create users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Super admin/admin can create anywhere, others account-scoped with role restrictions"
  ON users FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR id = auth.uid()  -- Can create own profile
    OR (
      account_id = get_user_account_id()
      AND (
        -- Owner can create: manager, assistant_manager, dispatcher, tech, sales, csr
        (
          get_user_role() = 'owner'
          AND role IN ('manager', 'assistant_manager', 'dispatcher', 'tech', 'sales', 'csr')
        )
        OR
        -- Manager can create: assistant_manager, dispatcher, tech, sales, csr
        (
          get_user_role() = 'manager'
          AND role IN ('assistant_manager', 'dispatcher', 'tech', 'sales', 'csr')
        )
        OR
        -- Assistant Manager can create: dispatcher, tech, sales, csr
        (
          get_user_role() = 'assistant_manager'
          AND role IN ('dispatcher', 'tech', 'sales', 'csr')
        )
      )
    )
  );

-- UPDATE: Super admin/admin can update all, others account-scoped with role restrictions
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Role-based user updates" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Super admin/admin can update all, others account-scoped with role restrictions"
  ON users FOR UPDATE
  USING (
    is_super_admin_or_admin()
    OR id = auth.uid()  -- Can always update self
    OR (
      account_id = get_user_account_id()
      AND (
        -- Owner/Manager can update any user in their account
        is_owner_or_manager()
        OR
        -- Assistant Manager can update operational roles only (dispatcher, tech, sales, csr)
        (
          get_user_role() = 'assistant_manager'
          AND role IN ('dispatcher', 'tech', 'sales', 'csr')
        )
      )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR id = auth.uid()  -- Can always update self
    OR (
      account_id = get_user_account_id()
      AND (
        -- Owner/Manager can update any user in their account
        is_owner_or_manager()
        OR
        -- Assistant Manager can update operational roles only (dispatcher, tech, sales, csr)
        (
          get_user_role() = 'assistant_manager'
          AND role IN ('dispatcher', 'tech', 'sales', 'csr')
        )
      )
    )
  );

-- DELETE: Super admin/admin can delete all, others owner/manager only (assistant_manager cannot delete)
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
CREATE POLICY "Super admin/admin can delete all, others owner/manager only"
  ON users FOR DELETE
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()  -- Only owner/manager can delete, not assistant_manager
    )
  );

-- ============================================================================
-- STEP 4: CONTACTS TABLE - Super admin/admin see all, others account-scoped
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage contacts in own account" ON contacts;
DROP POLICY IF EXISTS "Role-based contact viewing" ON contacts;
DROP POLICY IF EXISTS "Role-based contact creation" ON contacts;
DROP POLICY IF EXISTS "Role-based contact editing" ON contacts;
DROP POLICY IF EXISTS "Only admins can delete contacts" ON contacts;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all contacts, others role-based"
  ON contacts FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'tech', 'sales', 'csr'])
    )
  );

-- INSERT: Super admin/admin can create anywhere, others role-based
CREATE POLICY "Super admin/admin can create anywhere, others role-based"
  ON contacts FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'sales', 'csr'])
    )
  );

-- UPDATE: Super admin/admin can update all, others role-based
CREATE POLICY "Super admin/admin can update all, others role-based"
  ON contacts FOR UPDATE
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'sales', 'csr'])
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'sales', 'csr'])
    )
  );

-- DELETE: Super admin/admin can delete all, others owner/manager only
CREATE POLICY "Super admin/admin can delete all, others owner/manager only"
  ON contacts FOR DELETE
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- ============================================================================
-- STEP 5: CONVERSATIONS TABLE - Super admin/admin see all, others account-scoped
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage conversations in own account" ON conversations;
CREATE POLICY "Super admin/admin see all conversations, others account-scoped"
  ON conversations FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- ============================================================================
-- STEP 6: MESSAGES TABLE - Super admin/admin see all, others account-scoped
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage messages in own account" ON messages;
CREATE POLICY "Super admin/admin see all messages, others account-scoped"
  ON messages FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- ============================================================================
-- STEP 7: JOBS TABLE - Super admin/admin see all, others role-based
-- ============================================================================

DROP POLICY IF EXISTS "Role-based job viewing" ON jobs;
DROP POLICY IF EXISTS "Role-based job management" ON jobs;
DROP POLICY IF EXISTS "Role-based job creation" ON jobs;
DROP POLICY IF EXISTS "Role-based job editing" ON jobs;
DROP POLICY IF EXISTS "Only admins can delete jobs" ON jobs;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all jobs, others role-based"
  ON jobs FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'csr'])
        OR (
          get_user_role() = 'tech'
          AND tech_assigned_id = auth.uid()
          AND (request_status IS NULL OR request_status = 'approved')
        )
      )
    )
  );

-- INSERT: Super admin/admin can create anywhere, others role-based
CREATE POLICY "Super admin/admin can create anywhere, others role-based"
  ON jobs FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'tech', 'csr'])
    )
  );

-- UPDATE: Super admin/admin can update all, others role-based
CREATE POLICY "Super admin/admin can update all, others role-based"
  ON jobs FOR UPDATE
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
        OR (
          get_user_role() = 'tech'
          AND tech_assigned_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
        OR (
          get_user_role() = 'tech'
          AND tech_assigned_id = auth.uid()
        )
      )
    )
  );

-- DELETE: Super admin/admin can delete all, others owner/manager only
CREATE POLICY "Super admin/admin can delete all, others owner/manager only"
  ON jobs FOR DELETE
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- ============================================================================
-- STEP 8: INVOICES TABLE - Super admin/admin see all, others role-based
-- ============================================================================

DROP POLICY IF EXISTS "Role-based invoice viewing" ON invoices;
DROP POLICY IF EXISTS "Role-based invoice creation" ON invoices;
DROP POLICY IF EXISTS "Only admins can edit invoices" ON invoices;
DROP POLICY IF EXISTS "Only admins can delete invoices" ON invoices;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all invoices, others role-based"
  ON invoices FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'csr', 'dispatcher'])
    )
  );

-- INSERT: Super admin/admin can create anywhere, others role-based
CREATE POLICY "Super admin/admin can create anywhere, others role-based"
  ON invoices FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'csr'])
    )
  );

-- UPDATE/DELETE: Super admin/admin can manage all, others owner/manager only
CREATE POLICY "Super admin/admin can manage all invoices, others owner/manager only"
  ON invoices FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- ============================================================================
-- STEP 9: PAYMENTS TABLE - Super admin/admin see all, others role-based
-- ============================================================================

DROP POLICY IF EXISTS "Role-based payments viewing" ON payments;
DROP POLICY IF EXISTS "Only admins can manage payments" ON payments;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all payments, others role-based"
  ON payments FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'csr', 'dispatcher'])
    )
  );

-- INSERT/UPDATE/DELETE: Super admin/admin can manage all, others owner/manager only
CREATE POLICY "Super admin/admin can manage all payments, others owner/manager only"
  ON payments FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- ============================================================================
-- STEP 10: ESTIMATES TABLE - Super admin/admin see all, others role-based
-- ============================================================================

DROP POLICY IF EXISTS "Role-based estimate viewing" ON estimates;
DROP POLICY IF EXISTS "Role-based estimate creation" ON estimates;
DROP POLICY IF EXISTS "Only admins can edit estimates" ON estimates;
DROP POLICY IF EXISTS "Only admins can delete estimates" ON estimates;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all estimates, others role-based"
  ON estimates FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'sales', 'csr'])
    )
  );

-- INSERT: Super admin/admin can create anywhere, others role-based
CREATE POLICY "Super admin/admin can create anywhere, others role-based"
  ON estimates FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'sales'])
    )
  );

-- UPDATE/DELETE: Super admin/admin can manage all, others owner/manager only
CREATE POLICY "Super admin/admin can manage all estimates, others owner/manager only"
  ON estimates FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- ============================================================================
-- STEP 11: PARTS TABLE - Super admin/admin see all, others role-based
-- ============================================================================

DROP POLICY IF EXISTS "Role-based parts viewing" ON parts;
DROP POLICY IF EXISTS "Only admins can manage parts" ON parts;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all parts, others role-based"
  ON parts FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
    )
  );

-- INSERT/UPDATE/DELETE: Super admin/admin can manage all, others owner/manager only
CREATE POLICY "Super admin/admin can manage all parts, others owner/manager only"
  ON parts FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- ============================================================================
-- STEP 12: GPS_LOGS TABLE - Super admin/admin see all, others role-based
-- ============================================================================

DROP POLICY IF EXISTS "Role-based GPS logs viewing" ON gps_logs;
DROP POLICY IF EXISTS "Role-based GPS logs creation" ON gps_logs;
DROP POLICY IF EXISTS "Users can manage own gps_logs" ON gps_logs;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all GPS logs, others role-based"
  ON gps_logs FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
        OR (
          get_user_role() = 'tech'
          AND user_id = auth.uid()
        )
      )
    )
  );

-- INSERT: Super admin/admin can create anywhere, others role-based
CREATE POLICY "Super admin/admin can create anywhere, others role-based"
  ON gps_logs FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
        OR (
          get_user_role() = 'tech'
          AND user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- STEP 13: TIME_ENTRIES TABLE - Super admin/admin see all, others role-based
-- ============================================================================

DROP POLICY IF EXISTS "Role-based time entries viewing" ON time_entries;
DROP POLICY IF EXISTS "Role-based time entries management" ON time_entries;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all time entries, others role-based"
  ON time_entries FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        is_admin_or_owner()
        OR (
          get_user_role() = 'tech'
          AND user_id = auth.uid()
        )
      )
    )
  );

-- INSERT/UPDATE/DELETE: Super admin/admin can manage all, others role-based
CREATE POLICY "Super admin/admin can manage all time entries, others role-based"
  ON time_entries FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        is_admin_or_owner()
        OR (
          get_user_role() = 'tech'
          AND user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        is_admin_or_owner()
        OR (
          get_user_role() = 'tech'
          AND user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- STEP 14: MEETINGS TABLE - Super admin/admin see all, others role-based
-- ============================================================================

DROP POLICY IF EXISTS "Role-based meetings viewing" ON meetings;
DROP POLICY IF EXISTS "Role-based meetings creation" ON meetings;
DROP POLICY IF EXISTS "Role-based meetings editing" ON meetings;
DROP POLICY IF EXISTS "Only admins can delete meetings" ON meetings;
DROP POLICY IF EXISTS "Users can view own account meetings" ON meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;

-- SELECT: Super admin/admin see all, others role-based
CREATE POLICY "Super admin/admin see all meetings, others role-based"
  ON meetings FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'tech', 'sales', 'csr'])
    )
  );

-- INSERT: Super admin/admin can create anywhere, others role-based
CREATE POLICY "Super admin/admin can create anywhere, others role-based"
  ON meetings FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'sales'])
    )
  );

-- UPDATE: Super admin/admin can update all, others role-based
CREATE POLICY "Super admin/admin can update all, others role-based"
  ON meetings FOR UPDATE
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        is_admin_or_owner()
        OR (
          get_user_role() = 'sales'
          AND user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        is_admin_or_owner()
        OR (
          get_user_role() = 'sales'
          AND user_id = auth.uid()
        )
      )
    )
  );

-- DELETE: Super admin/admin can delete all, others owner/manager only
CREATE POLICY "Super admin/admin can delete all, others owner/manager only"
  ON meetings FOR DELETE
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- ============================================================================
-- STEP 15: JOB-RELATED TABLES - Super admin/admin see all, others role-based
-- ============================================================================

-- JOB_PHOTOS
DROP POLICY IF EXISTS "Role-based job photo viewing" ON job_photos;
DROP POLICY IF EXISTS "Role-based job photo creation" ON job_photos;
DROP POLICY IF EXISTS "Role-based job photo editing" ON job_photos;
DROP POLICY IF EXISTS "Role-based job photo deletion" ON job_photos;

CREATE POLICY "Super admin/admin see all job photos, others role-based"
  ON job_photos FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_photos.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'csr'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
                AND (j.request_status IS NULL OR j.request_status = 'approved')
              )
            )
          )
        )
    )
  );

CREATE POLICY "Super admin/admin can create job photos anywhere, others role-based"
  ON job_photos FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_photos.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
              )
            )
          )
        )
    )
  );

CREATE POLICY "Super admin/admin can update job photos anywhere, others role-based"
  ON job_photos FOR UPDATE
  USING (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_photos.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
              )
            )
          )
        )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_photos.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
              )
            )
          )
        )
    )
  );

CREATE POLICY "Super admin/admin can delete job photos anywhere, others role-based"
  ON job_photos FOR DELETE
  USING (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_photos.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
              )
            )
          )
        )
    )
  );

-- JOB_MATERIALS
DROP POLICY IF EXISTS "Role-based job materials viewing" ON job_materials;
DROP POLICY IF EXISTS "Role-based job materials management" ON job_materials;

CREATE POLICY "Super admin/admin see all job materials, others role-based"
  ON job_materials FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_materials.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'csr'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
              AND (j.request_status IS NULL OR j.request_status = 'approved')
            )
          )
      )
    )
  );

CREATE POLICY "Super admin/admin can manage job materials anywhere, others role-based"
  ON job_materials FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_materials.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
            )
          )
      )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_materials.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
            )
          )
      )
    )
  );

-- JOB_PARTS
DROP POLICY IF EXISTS "Role-based job parts viewing" ON job_parts;
DROP POLICY IF EXISTS "Role-based job parts management" ON job_parts;

CREATE POLICY "Super admin/admin see all job parts, others role-based"
  ON job_parts FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_parts.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'csr'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
              AND (j.request_status IS NULL OR j.request_status = 'approved')
            )
          )
      )
    )
  );

CREATE POLICY "Super admin/admin can manage job parts anywhere, others role-based"
  ON job_parts FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_parts.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
            )
          )
      )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_parts.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
            )
          )
      )
    )
  );

-- JOB_GATES
DROP POLICY IF EXISTS "Role-based job gates viewing" ON job_gates;
DROP POLICY IF EXISTS "Role-based job gates management" ON job_gates;
DROP POLICY IF EXISTS "Role-based job gates updating" ON job_gates;

CREATE POLICY "Super admin/admin see all job gates, others role-based"
  ON job_gates FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_gates.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'csr'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
                AND (j.request_status IS NULL OR j.request_status = 'approved')
              )
            )
          )
        )
    )
  );

CREATE POLICY "Super admin/admin can manage job gates anywhere, others role-based"
  ON job_gates FOR ALL
  USING (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_gates.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
              )
            )
          )
        )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_gates.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
              )
            )
          )
        )
    )
  );

-- JOB_NOTES
DROP POLICY IF EXISTS "Role-based job notes viewing" ON job_notes;
DROP POLICY IF EXISTS "Role-based job notes management" ON job_notes;

CREATE POLICY "Super admin/admin see all job notes, others role-based"
  ON job_notes FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_notes.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'csr'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
                AND (j.request_status IS NULL OR j.request_status = 'approved')
              )
            )
          )
        )
    )
  );

CREATE POLICY "Super admin/admin can manage job notes anywhere, others role-based"
  ON job_notes FOR ALL
  USING (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_notes.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
              )
            )
          )
        )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_notes.job_id
        AND (
          is_super_admin_or_admin()
          OR (
            j.account_id = get_user_account_id()
            AND (
              user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
              OR (
                get_user_role() = 'tech'
                AND j.tech_assigned_id = auth.uid()
              )
            )
          )
        )
    )
  );

-- JOB_CHECKLIST_ITEMS
DROP POLICY IF EXISTS "Role-based checklist items viewing" ON job_checklist_items;
DROP POLICY IF EXISTS "Role-based checklist items management" ON job_checklist_items;

CREATE POLICY "Super admin/admin see all checklist items, others role-based"
  ON job_checklist_items FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_checklist_items.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher', 'csr'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
              AND (j.request_status IS NULL OR j.request_status = 'approved')
            )
          )
      )
    )
  );

CREATE POLICY "Super admin/admin can manage checklist items anywhere, others role-based"
  ON job_checklist_items FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_checklist_items.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
            )
          )
      )
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_checklist_items.job_id
          AND (
            user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
            OR (
              get_user_role() = 'tech'
              AND j.tech_assigned_id = auth.uid()
            )
          )
      )
    )
  );

-- ============================================================================
-- STEP 16: REMAINING TABLES - Super admin/admin see all, others account-scoped
-- ============================================================================

-- KNOWLEDGE_DOCS
DROP POLICY IF EXISTS "Users can manage knowledge docs in own account" ON knowledge_docs;
CREATE POLICY "Super admin/admin see all knowledge docs, others account-scoped"
  ON knowledge_docs FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- LLM_PROVIDERS
DROP POLICY IF EXISTS "Users can read llm providers in own account" ON llm_providers;
DROP POLICY IF EXISTS "Admins can manage llm providers" ON llm_providers;
CREATE POLICY "Super admin/admin see all LLM providers, others account-scoped"
  ON llm_providers FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
    OR account_id IS NULL  -- Global providers
  );
CREATE POLICY "Super admin/admin can manage all LLM providers, others account-scoped"
  ON llm_providers FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- CRMAI_AUDIT
DROP POLICY IF EXISTS "Users can read audit logs in own account" ON crmai_audit;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON crmai_audit;
CREATE POLICY "Super admin/admin see all audit logs, others account-scoped"
  ON crmai_audit FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );
CREATE POLICY "Service role can insert audit logs"
  ON crmai_audit FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS anyway

-- AUTOMATION_RULES
DROP POLICY IF EXISTS "Users can manage automation rules for their account" ON automation_rules;
CREATE POLICY "Super admin/admin see all automation rules, others account-scoped"
  ON automation_rules FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- CAMPAIGNS
DROP POLICY IF EXISTS "Role-based campaign viewing" ON campaigns;
DROP POLICY IF EXISTS "Only admins can manage campaigns" ON campaigns;
CREATE POLICY "Super admin/admin see all campaigns, others role-based"
  ON campaigns FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'sales'])
    )
  );
CREATE POLICY "Super admin/admin can manage all campaigns, others owner/manager only"
  ON campaigns FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- CAMPAIGN_RECIPIENTS
DROP POLICY IF EXISTS "Users can manage campaign recipients for their account" ON campaign_recipients;
CREATE POLICY "Super admin/admin see all campaign recipients, others account-scoped"
  ON campaign_recipients FOR ALL
  USING (
    is_super_admin_or_admin()
    OR campaign_id IN (
      SELECT id FROM campaigns
      WHERE account_id = get_user_account_id()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR campaign_id IN (
      SELECT id FROM campaigns
      WHERE account_id = get_user_account_id()
    )
  );

-- EMAIL_TEMPLATES
DROP POLICY IF EXISTS "Users can manage email templates for their account" ON email_templates;
CREATE POLICY "Super admin/admin see all email templates, others account-scoped"
  ON email_templates FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- EMAIL_QUEUE
DROP POLICY IF EXISTS "Users can view their own account's email queue" ON email_queue;
DROP POLICY IF EXISTS "Users can insert their own account's email queue" ON email_queue;
DROP POLICY IF EXISTS "Users can update their own account's email queue" ON email_queue;
CREATE POLICY "Super admin/admin see all email queue, others account-scoped"
  ON email_queue FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- EMAIL_ANALYTICS
DROP POLICY IF EXISTS "Service role can insert email analytics" ON email_analytics;
CREATE POLICY "Super admin/admin see all email analytics, others account-scoped"
  ON email_analytics FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR queue_item_id IN (
      SELECT id FROM email_queue
      WHERE account_id = get_user_account_id()
    )
  );
CREATE POLICY "Service role can insert email analytics"
  ON email_analytics FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS anyway

-- EMAIL_PROVIDERS
DROP POLICY IF EXISTS "Admins can manage email providers for their account" ON email_providers;
CREATE POLICY "Super admin/admin see all email providers, others account-scoped"
  ON email_providers FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );
CREATE POLICY "Super admin/admin can manage all email providers, others owner/manager only"
  ON email_providers FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- CALENDAR_PROVIDERS
DROP POLICY IF EXISTS "Users can manage calendar providers for their account" ON calendar_providers;
CREATE POLICY "Super admin/admin see all calendar providers, others account-scoped"
  ON calendar_providers FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- CALENDAR_EVENTS
DROP POLICY IF EXISTS "Users can manage calendar events for their account" ON calendar_events;
CREATE POLICY "Super admin/admin see all calendar events, others account-scoped"
  ON calendar_events FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- CALL_LOGS
DROP POLICY IF EXISTS "Users can manage call logs for their account" ON call_logs;
CREATE POLICY "Super admin/admin see all call logs, others account-scoped"
  ON call_logs FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications for users" ON notifications;
CREATE POLICY "Super admin/admin see all notifications, others own only"
  ON notifications FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR user_id = auth.uid()
  );
CREATE POLICY "Super admin/admin can update all notifications, others own only"
  ON notifications FOR UPDATE
  USING (
    is_super_admin_or_admin()
    OR user_id = auth.uid()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR user_id = auth.uid()
  );
CREATE POLICY "System can create notifications for users"
  ON notifications FOR INSERT
  WITH CHECK (true);  -- Service role/system can insert

-- NOTES
DROP POLICY IF EXISTS "Users can view notes from their account" ON notes;
DROP POLICY IF EXISTS "Users can create notes for their account" ON notes;
DROP POLICY IF EXISTS "Users can update notes from their account" ON notes;
DROP POLICY IF EXISTS "Users can delete notes from their account" ON notes;
CREATE POLICY "Super admin/admin see all notes, others account-scoped"
  ON notes FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- CONTACT_NOTES
DROP POLICY IF EXISTS "Users can view contact notes from their account" ON contact_notes;
DROP POLICY IF EXISTS "Users can create contact notes for contacts in their account" ON contact_notes;
DROP POLICY IF EXISTS "Users can delete contact notes from their account" ON contact_notes;
CREATE POLICY "Super admin/admin see all contact notes, others account-scoped"
  ON contact_notes FOR ALL
  USING (
    is_super_admin_or_admin()
    OR contact_id IN (
      SELECT id FROM contacts
      WHERE account_id = get_user_account_id()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR contact_id IN (
      SELECT id FROM contacts
      WHERE account_id = get_user_account_id()
    )
  );

-- CONTACT_TAGS
DROP POLICY IF EXISTS "Users can manage contact tags for their account" ON contact_tags;
CREATE POLICY "Super admin/admin see all contact tags, others account-scoped"
  ON contact_tags FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- CONTACT_TAG_ASSIGNMENTS
DROP POLICY IF EXISTS "Users can manage contact tag assignments for their account" ON contact_tag_assignments;
CREATE POLICY "Super admin/admin see all contact tag assignments, others account-scoped"
  ON contact_tag_assignments FOR ALL
  USING (
    is_super_admin_or_admin()
    OR contact_id IN (
      SELECT id FROM contacts
      WHERE account_id = get_user_account_id()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR contact_id IN (
      SELECT id FROM contacts
      WHERE account_id = get_user_account_id()
    )
  );

-- TAGS
DROP POLICY IF EXISTS "Users can view tags from their account" ON tags;
DROP POLICY IF EXISTS "Users can create tags for their account" ON tags;
DROP POLICY IF EXISTS "Users can update tags from their account" ON tags;
DROP POLICY IF EXISTS "Users can delete tags from their account" ON tags;
CREATE POLICY "Super admin/admin see all tags, others account-scoped"
  ON tags FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- SIGNATURES
DROP POLICY IF EXISTS "Users can manage signatures for their account" ON signatures;
CREATE POLICY "Super admin/admin see all signatures, others account-scoped"
  ON signatures FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- ACCOUNT_SETTINGS
DROP POLICY IF EXISTS "Users can view account settings for their account" ON account_settings;
DROP POLICY IF EXISTS "Owner and admin can insert account settings" ON account_settings;
DROP POLICY IF EXISTS "Owner and admin can update account settings" ON account_settings;
DROP POLICY IF EXISTS "Only owner can delete account settings" ON account_settings;
CREATE POLICY "Super admin/admin see all account settings, others account-scoped"
  ON account_settings FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );
CREATE POLICY "Super admin/admin can manage all account settings, others owner/manager only"
  ON account_settings FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND is_owner_or_manager()
    )
  );

-- USER_PROFILE_PHOTOS
DROP POLICY IF EXISTS "Users can view profile photos for their account" ON user_profile_photos;
DROP POLICY IF EXISTS "Users can manage their own profile photos" ON user_profile_photos;
CREATE POLICY "Super admin/admin see all profile photos, others account-scoped"
  ON user_profile_photos FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );
CREATE POLICY "Super admin/admin can manage all profile photos, others own only"
  ON user_profile_photos FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_id = auth.uid()
    )
  );

-- DIRECT_MESSAGES
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages to users in their account" ON direct_messages;
DROP POLICY IF EXISTS "Users can update messages they received (mark as read)" ON direct_messages;
CREATE POLICY "Super admin/admin see all direct messages, others own only"
  ON direct_messages FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
  );
CREATE POLICY "Super admin/admin can send messages anywhere, others account-scoped"
  ON direct_messages FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND sender_id = auth.uid()
      AND recipient_id IN (
        SELECT id FROM users
        WHERE account_id = get_user_account_id()
      )
    )
  );
CREATE POLICY "Super admin/admin can update all messages, others own only"
  ON direct_messages FOR UPDATE
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND recipient_id = auth.uid()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND recipient_id = auth.uid()
    )
  );

-- JOB_CHECKLIST_TEMPLATES
DROP POLICY IF EXISTS "Users can view checklist templates for their account" ON job_checklist_templates;
DROP POLICY IF EXISTS "Users can manage checklist templates for their account" ON job_checklist_templates;
CREATE POLICY "Super admin/admin see all checklist templates, others account-scoped"
  ON job_checklist_templates FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- RESOURCES
DROP POLICY IF EXISTS "Users can view resources for their account" ON resources;
DROP POLICY IF EXISTS "Users can manage resources for their account" ON resources;
CREATE POLICY "Super admin/admin see all resources, others account-scoped"
  ON resources FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- RESOURCE_ASSIGNMENTS
DROP POLICY IF EXISTS "Users can view resource assignments for their account" ON resource_assignments;
DROP POLICY IF EXISTS "Users can manage resource assignments for their account" ON resource_assignments;
CREATE POLICY "Super admin/admin see all resource assignments, others account-scoped"
  ON resource_assignments FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- WORKING_HOURS
DROP POLICY IF EXISTS "Users can view working hours for their account" ON working_hours;
DROP POLICY IF EXISTS "Users can manage working hours for their account" ON working_hours;
CREATE POLICY "Super admin/admin see all working hours, others account-scoped"
  ON working_hours FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- SUPPLIERS
DROP POLICY IF EXISTS "Users can view suppliers for their account" ON suppliers;
DROP POLICY IF EXISTS "Users can manage suppliers for their account" ON suppliers;
CREATE POLICY "Super admin/admin see all suppliers, others account-scoped"
  ON suppliers FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- INVENTORY_LOCATIONS
DROP POLICY IF EXISTS "Users can view locations for their account" ON inventory_locations;
DROP POLICY IF EXISTS "Users can manage locations for their account" ON inventory_locations;
CREATE POLICY "Super admin/admin see all inventory locations, others account-scoped"
  ON inventory_locations FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- PART_BUNDLES
DROP POLICY IF EXISTS "Users can view bundles for their account" ON part_bundles;
DROP POLICY IF EXISTS "Users can manage bundles for their account" ON part_bundles;
CREATE POLICY "Super admin/admin see all part bundles, others account-scoped"
  ON part_bundles FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- PART_BUNDLE_ITEMS
DROP POLICY IF EXISTS "Users can view bundle items for their account" ON part_bundle_items;
DROP POLICY IF EXISTS "Users can manage bundle items for their account" ON part_bundle_items;
CREATE POLICY "Super admin/admin see all part bundle items, others account-scoped"
  ON part_bundle_items FOR ALL
  USING (
    is_super_admin_or_admin()
    OR bundle_id IN (
      SELECT id FROM part_bundles
      WHERE account_id = get_user_account_id()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR bundle_id IN (
      SELECT id FROM part_bundles
      WHERE account_id = get_user_account_id()
    )
  );

-- PART_USAGE_HISTORY
DROP POLICY IF EXISTS "Users can view usage history for their account" ON part_usage_history;
DROP POLICY IF EXISTS "Users can create usage history for their account" ON part_usage_history;
CREATE POLICY "Super admin/admin see all part usage history, others account-scoped"
  ON part_usage_history FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- GEOFENCES
DROP POLICY IF EXISTS "Users can view geofences for their account" ON geofences;
DROP POLICY IF EXISTS "Users can manage geofences for their account" ON geofences;
CREATE POLICY "Super admin/admin see all geofences, others account-scoped"
  ON geofences FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- MARKETING_AUTOMATIONS
DROP POLICY IF EXISTS "Users can view automations for their account" ON marketing_automations;
DROP POLICY IF EXISTS "Users can manage automations for their account" ON marketing_automations;
CREATE POLICY "Super admin/admin see all marketing automations, others account-scoped"
  ON marketing_automations FOR ALL
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );

-- ROUTE_WAYPOINTS
DROP POLICY IF EXISTS "Technicians can view their own route waypoints" ON route_waypoints;
DROP POLICY IF EXISTS "Dispatchers can view all route waypoints in account" ON route_waypoints;
DROP POLICY IF EXISTS "Admins can manage all route waypoints" ON route_waypoints;
CREATE POLICY "Super admin/admin see all route waypoints, others role-based"
  ON route_waypoints FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
        OR (
          get_user_role() = 'tech'
          AND technician_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Super admin/admin can manage all route waypoints, others owner/manager/dispatcher only"
  ON route_waypoints FOR ALL
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND user_has_role(ARRAY['owner', 'manager', 'assistant_manager', 'dispatcher'])
    )
  );

-- VOICE_NAVIGATION_COMMANDS
DROP POLICY IF EXISTS "Users can view navigation commands from their account" ON voice_navigation_commands;
DROP POLICY IF EXISTS "Users can update execution status for their account" ON voice_navigation_commands;
DROP POLICY IF EXISTS "Service role can insert navigation commands" ON voice_navigation_commands;
CREATE POLICY "Super admin/admin see all voice navigation commands, others account-scoped"
  ON voice_navigation_commands FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );
CREATE POLICY "Super admin/admin can update all voice navigation commands, others account-scoped"
  ON voice_navigation_commands FOR UPDATE
  USING (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR account_id = get_user_account_id()
  );
CREATE POLICY "Service role can insert navigation commands"
  ON voice_navigation_commands FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS anyway

-- LLM_USAGE_LOGS
DROP POLICY IF EXISTS "Users can view their own LLM usage" ON llm_usage_logs;
DROP POLICY IF EXISTS "Admins can view all LLM usage in account" ON llm_usage_logs;
DROP POLICY IF EXISTS "System can insert LLM usage logs" ON llm_usage_logs;
CREATE POLICY "Super admin/admin see all LLM usage logs, others own only"
  ON llm_usage_logs FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        is_admin_or_owner()
        OR user_id = auth.uid()
      )
    )
  );
CREATE POLICY "System can insert LLM usage logs"
  ON llm_usage_logs FOR INSERT
  WITH CHECK (true);  -- Service role/system can insert

-- ============================================================================
-- STEP 17: TABLES WITHOUT account_id - Handle separately
-- ============================================================================

-- AGENT_MEMORY (no account_id, contact-based)
DROP POLICY IF EXISTS "Allow full access to agent_memory" ON agent_memory;
CREATE POLICY "Super admin/admin see all agent memory, others contact-scoped"
  ON agent_memory FOR SELECT
  USING (
    is_super_admin_or_admin()
    OR contact_id IN (
      SELECT id FROM contacts
      WHERE account_id = get_user_account_id()
    )
  );
CREATE POLICY "Super admin/admin can manage all agent memory, others contact-scoped"
  ON agent_memory FOR ALL
  USING (
    is_super_admin_or_admin()
    OR contact_id IN (
      SELECT id FROM contacts
      WHERE account_id = get_user_account_id()
    )
  )
  WITH CHECK (
    is_super_admin_or_admin()
    OR contact_id IN (
      SELECT id FROM contacts
      WHERE account_id = get_user_account_id()
    )
  );

-- COMPLIANCE_RULES (no account_id, global)
DROP POLICY IF EXISTS "Users can read compliance rules" ON compliance_rules;
DROP POLICY IF EXISTS "Admins can manage compliance rules" ON compliance_rules;
CREATE POLICY "Super admin/admin see all compliance rules, others read-only"
  ON compliance_rules FOR SELECT
  USING (true);  -- Everyone can read
CREATE POLICY "Super admin/admin can manage all compliance rules"
  ON compliance_rules FOR ALL
  USING (is_super_admin_or_admin())
  WITH CHECK (is_super_admin_or_admin());

-- COMPLIANCE_CHECKS (has account_id)
-- Note: This table may not exist yet, but we'll create policies if it does
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_checks') THEN
    CREATE POLICY "Super admin/admin see all compliance checks, others account-scoped"
      ON compliance_checks FOR SELECT
      USING (
        is_super_admin_or_admin()
        OR account_id = get_user_account_id()
      );
    CREATE POLICY "Super admin/admin can manage all compliance checks, others account-scoped"
      ON compliance_checks FOR ALL
      USING (
        is_super_admin_or_admin()
        OR account_id = get_user_account_id()
      )
      WITH CHECK (
        is_super_admin_or_admin()
        OR account_id = get_user_account_id()
      );
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify helper functions exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin_or_admin') THEN
    RAISE EXCEPTION 'Helper function is_super_admin_or_admin() not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_account_id') THEN
    RAISE EXCEPTION 'Helper function get_user_account_id() not found';
  END IF;
  RAISE NOTICE '✅ All helper functions verified';
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION is_super_admin_or_admin() IS 'Returns true if user is super_admin or admin (cross-account access)';
COMMENT ON FUNCTION get_user_account_id() IS 'Returns user account_id, or NULL for super_admin/admin (meaning all accounts)';
COMMENT ON FUNCTION get_user_role() IS 'Returns current user role';
COMMENT ON FUNCTION user_has_role(allowed_roles text[]) IS 'Returns true if user has any of the specified roles';
COMMENT ON FUNCTION is_admin_or_owner() IS 'Returns true if user is admin, owner, or super_admin';
COMMENT ON FUNCTION is_owner_or_manager() IS 'Returns true if user is owner, manager, super_admin, or admin';

