-- Test script: Insert a voice navigation command to verify the relay system
-- This will test if the frontend listener properly receives and processes navigation commands

-- Insert a test navigation command for the default account
INSERT INTO voice_navigation_commands (
  account_id,
  page,
  params,
  executed
) VALUES (
  'fde73a6a-ea84-46a7-803b-a3ae7cc09d00',  -- Default account ID from the voice navigation hook
  '/admin/settings',
  '{"test": true}',
  false
);

-- Verify the insertion
SELECT * FROM voice_navigation_commands WHERE executed = false ORDER BY created_at DESC LIMIT 1;