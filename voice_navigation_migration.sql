-- Step 1: Drop table if it exists (safe to run even if table doesn't exist)
DROP TABLE IF EXISTS voice_navigation_commands CASCADE;

-- Step 2: Create the table
CREATE TABLE voice_navigation_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  page TEXT NOT NULL, -- Full route path (e.g., '/jobs', '/contacts/123', '/analytics')
  params JSONB DEFAULT '{}', -- Additional navigation parameters (jobId, contactId, etc.)
  executed BOOLEAN DEFAULT FALSE, -- Whether the command has been executed by frontend
  executed_at TIMESTAMPTZ, -- When the command was executed (NULL until executed)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour') -- Commands expire after 1 hour
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_voice_nav_commands_account_id ON voice_navigation_commands(account_id);
CREATE INDEX idx_voice_nav_commands_executed ON voice_navigation_commands(executed);
CREATE INDEX idx_voice_nav_commands_created_at ON voice_navigation_commands(created_at DESC);
CREATE INDEX idx_voice_nav_commands_expires_at ON voice_navigation_commands(expires_at);

-- Step 4: Enable RLS
ALTER TABLE voice_navigation_commands ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
CREATE POLICY "Users can view navigation commands from their account"
  ON voice_navigation_commands
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert navigation commands"
  ON voice_navigation_commands
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS checks

CREATE POLICY "Users can update execution status for their account"
  ON voice_navigation_commands
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

-- Step 6: Create functions
CREATE OR REPLACE FUNCTION cleanup_expired_voice_commands()
RETURNS void AS $$
BEGIN
  DELETE FROM voice_navigation_commands
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger function
CREATE OR REPLACE FUNCTION set_voice_command_executed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set executed_at when executed becomes true
  IF NEW.executed = true AND (OLD.executed = false OR OLD.executed IS NULL) THEN
    NEW.executed_at = NOW();
  END IF;

  -- Clear executed_at when executed becomes false (if ever needed)
  IF NEW.executed = false AND OLD.executed = true THEN
    NEW.executed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger
CREATE TRIGGER voice_navigation_commands_executed_at_trigger
  BEFORE UPDATE ON voice_navigation_commands
  FOR EACH ROW
  EXECUTE FUNCTION set_voice_command_executed_at();

-- Step 9: Add comments
COMMENT ON TABLE voice_navigation_commands IS 'Stores voice navigation commands from MCP server for frontend execution via Supabase Realtime';
COMMENT ON COLUMN voice_navigation_commands.account_id IS 'Links command to specific account for multi-tenancy';
COMMENT ON COLUMN voice_navigation_commands.page IS 'Full Next.js route path (e.g., /jobs, /contacts/123)';
COMMENT ON COLUMN voice_navigation_commands.params IS 'JSON object with additional parameters like jobId, contactId';
COMMENT ON COLUMN voice_navigation_commands.executed IS 'Whether frontend has executed this navigation command';
COMMENT ON COLUMN voice_navigation_commands.executed_at IS 'Timestamp when command was executed by frontend';
COMMENT ON COLUMN voice_navigation_commands.expires_at IS 'Commands auto-expire to prevent stale navigation requests';