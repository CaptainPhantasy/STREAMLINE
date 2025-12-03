-- Migration: Add User Impersonation Feature
-- Date: 2025-11-27
-- Purpose: Allow Owner role to impersonate other users for debugging/support

-- ============================================================================
-- TABLE: user_impersonation_logs
-- ============================================================================
-- Tracks all impersonation sessions with full audit trail

CREATE TABLE IF NOT EXISTS user_impersonation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Users involved
  real_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Owner doing the impersonation
  impersonated_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Target user being impersonated

  -- Session tracking
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz, -- NULL means session is still active
  duration_seconds integer GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL THEN EXTRACT(EPOCH FROM (ended_at - started_at))::integer
      ELSE NULL
    END
  ) STORED,

  -- Audit trail
  actions_performed jsonb DEFAULT '[]'::jsonb, -- Array of actions taken during session
  pages_visited text[] DEFAULT ARRAY[]::text[], -- Array of page URLs visited
  api_calls_made jsonb DEFAULT '[]'::jsonb, -- Array of API endpoints called

  -- Session metadata
  ip_address inet,
  user_agent text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for finding active impersonation sessions
CREATE INDEX IF NOT EXISTS idx_impersonation_active
  ON user_impersonation_logs(real_user_id, ended_at)
  WHERE ended_at IS NULL;

-- Index for audit queries by real user
CREATE INDEX IF NOT EXISTS idx_impersonation_real_user
  ON user_impersonation_logs(real_user_id, started_at DESC);

-- Index for audit queries by impersonated user
CREATE INDEX IF NOT EXISTS idx_impersonation_target_user
  ON user_impersonation_logs(impersonated_user_id, started_at DESC);

-- Index for account-level audit queries
CREATE INDEX IF NOT EXISTS idx_impersonation_account
  ON user_impersonation_logs(account_id, started_at DESC);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_impersonation_started_at
  ON user_impersonation_logs(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only owners can view impersonation logs for their account
CREATE POLICY "Owners can view impersonation logs"
  ON user_impersonation_logs FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- Policy: Only owners can insert impersonation logs (via API)
CREATE POLICY "Owners can create impersonation logs"
  ON user_impersonation_logs FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'owner'
    )
    AND real_user_id = auth.uid() -- Can only create logs for themselves
  );

-- Policy: Only owners can update their own impersonation logs (to end session)
CREATE POLICY "Owners can update their impersonation logs"
  ON user_impersonation_logs FOR UPDATE
  USING (
    real_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  )
  WITH CHECK (
    real_user_id = auth.uid()
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get active impersonation session for a user
CREATE OR REPLACE FUNCTION get_active_impersonation(p_real_user_id uuid)
RETURNS TABLE (
  id uuid,
  impersonated_user_id uuid,
  impersonated_user_email text,
  impersonated_user_name text,
  impersonated_user_role text,
  started_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uil.id,
    uil.impersonated_user_id,
    u.email,
    u.full_name,
    u.role,
    uil.started_at
  FROM user_impersonation_logs uil
  JOIN users u ON u.id = uil.impersonated_user_id
  WHERE uil.real_user_id = p_real_user_id
    AND uil.ended_at IS NULL
  ORDER BY uil.started_at DESC
  LIMIT 1;
END;
$$;

-- Function: End active impersonation session
CREATE OR REPLACE FUNCTION end_impersonation_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_impersonation_logs
  SET
    ended_at = now(),
    updated_at = now()
  WHERE id = p_session_id
    AND real_user_id = auth.uid()
    AND ended_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Function: Validate impersonation is allowed
CREATE OR REPLACE FUNCTION can_impersonate_user(
  p_real_user_id uuid,
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_real_user_role text;
  v_real_user_account_id uuid;
  v_target_user_role text;
  v_target_user_account_id uuid;
  v_active_sessions integer;
BEGIN
  -- Get real user info
  SELECT role, account_id INTO v_real_user_role, v_real_user_account_id
  FROM users WHERE id = p_real_user_id;

  -- Get target user info
  SELECT role, account_id INTO v_target_user_role, v_target_user_account_id
  FROM users WHERE id = p_target_user_id;

  -- Check if either user not found
  IF v_real_user_role IS NULL OR v_target_user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Rule 1: Real user must be owner
  IF v_real_user_role != 'owner' THEN
    RETURN false;
  END IF;

  -- Rule 2: Cannot impersonate another owner
  IF v_target_user_role = 'owner' THEN
    RETURN false;
  END IF;

  -- Rule 3: Must be same account
  IF v_real_user_account_id != v_target_user_account_id THEN
    RETURN false;
  END IF;

  -- Rule 4: Cannot impersonate self
  IF p_real_user_id = p_target_user_id THEN
    RETURN false;
  END IF;

  -- Rule 5: Cannot have multiple active impersonation sessions
  SELECT COUNT(*) INTO v_active_sessions
  FROM user_impersonation_logs
  WHERE real_user_id = p_real_user_id
    AND ended_at IS NULL;

  IF v_active_sessions > 0 THEN
    RETURN false;
  END IF;

  -- All checks passed
  RETURN true;
END;
$$;

-- Function: Log impersonation action
CREATE OR REPLACE FUNCTION log_impersonation_action(
  p_session_id uuid,
  p_action_type text,
  p_action_details jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_impersonation_logs
  SET
    actions_performed = actions_performed || jsonb_build_object(
      'timestamp', now(),
      'action_type', p_action_type,
      'details', p_action_details
    ),
    updated_at = now()
  WHERE id = p_session_id
    AND ended_at IS NULL;

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_impersonation_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_impersonation_logs_updated_at
  BEFORE UPDATE ON user_impersonation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_impersonation_logs_updated_at();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE user_impersonation_logs IS 'Audit trail for user impersonation sessions (Owner viewing as other users)';
COMMENT ON COLUMN user_impersonation_logs.real_user_id IS 'The Owner user who is performing the impersonation';
COMMENT ON COLUMN user_impersonation_logs.impersonated_user_id IS 'The user being impersonated (viewed as)';
COMMENT ON COLUMN user_impersonation_logs.started_at IS 'When the impersonation session started';
COMMENT ON COLUMN user_impersonation_logs.ended_at IS 'When the impersonation session ended (NULL = still active)';
COMMENT ON COLUMN user_impersonation_logs.actions_performed IS 'JSON array of actions performed during the impersonation session';
COMMENT ON COLUMN user_impersonation_logs.pages_visited IS 'Array of page URLs visited during the session';
COMMENT ON COLUMN user_impersonation_logs.api_calls_made IS 'JSON array of API endpoints called during the session';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_active_impersonation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION end_impersonation_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_impersonate_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION log_impersonation_action(uuid, text, jsonb) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Check if migration was successful
DO $$
BEGIN
  -- Verify table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_impersonation_logs') THEN
    RAISE EXCEPTION 'Migration failed: user_impersonation_logs table not created';
  END IF;

  -- Verify indexes exist
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'user_impersonation_logs' AND indexname = 'idx_impersonation_active') THEN
    RAISE WARNING 'Index idx_impersonation_active may not have been created';
  END IF;

  -- Verify functions exist
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'get_active_impersonation') THEN
    RAISE EXCEPTION 'Migration failed: get_active_impersonation function not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Table created: user_impersonation_logs';
  RAISE NOTICE 'Functions created: get_active_impersonation, end_impersonation_session, can_impersonate_user, log_impersonation_action';
END $$;
