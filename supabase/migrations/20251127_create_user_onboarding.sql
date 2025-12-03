-- Create user_onboarding_status table
-- Tracks onboarding progress for each user

CREATE TABLE IF NOT EXISTS user_onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'dispatcher', 'tech', 'sales')),
  current_step INT DEFAULT 0,
  steps_completed JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one onboarding record per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_role ON user_onboarding_status(role);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding_status(completed_at) WHERE completed_at IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_onboarding_timestamp
  BEFORE UPDATE ON user_onboarding_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();

-- RLS Policies
ALTER TABLE user_onboarding_status ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding status
CREATE POLICY "Users can view own onboarding status"
  ON user_onboarding_status
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own onboarding status
CREATE POLICY "Users can update own onboarding status"
  ON user_onboarding_status
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own onboarding status
CREATE POLICY "Users can insert own onboarding status"
  ON user_onboarding_status
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins and owners can view all onboarding statuses
CREATE POLICY "Admins can view all onboarding statuses"
  ON user_onboarding_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Comments for documentation
COMMENT ON TABLE user_onboarding_status IS 'Tracks user onboarding progress and completion status';
COMMENT ON COLUMN user_onboarding_status.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN user_onboarding_status.role IS 'User role for role-specific onboarding flows';
COMMENT ON COLUMN user_onboarding_status.current_step IS 'Current step index in onboarding flow';
COMMENT ON COLUMN user_onboarding_status.steps_completed IS 'Array of completed step IDs';
COMMENT ON COLUMN user_onboarding_status.completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN user_onboarding_status.dismissed_at IS 'Timestamp when user dismissed/skipped onboarding';
