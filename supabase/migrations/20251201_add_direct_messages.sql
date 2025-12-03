-- ================================================================
-- Add Direct Messages Table
-- ================================================================
-- Description: Creates direct_messages table for native in-app messaging
-- between users (DMs)
-- Date: 2025-12-01
-- ================================================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE direct_messages IS 'Direct messages between users within the same account';
COMMENT ON COLUMN direct_messages.content IS 'Message content/text';
COMMENT ON COLUMN direct_messages.is_read IS 'Whether the message has been read by recipient';
COMMENT ON COLUMN direct_messages.read_at IS 'Timestamp when message was read';

-- ================================================================
-- Create indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id 
  ON direct_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id 
  ON direct_messages(recipient_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_account_id 
  ON direct_messages(account_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at 
  ON direct_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_unread 
  ON direct_messages(recipient_id, is_read, created_at DESC) 
  WHERE is_read = false;

-- Composite index for conversation queries (both users)
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation 
  ON direct_messages(
    LEAST(sender_id, recipient_id),
    GREATEST(sender_id, recipient_id),
    created_at DESC
  );

-- ================================================================
-- Add trigger to update updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION update_direct_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_messages_updated_at();

-- ================================================================
-- Enable Row Level Security
-- ================================================================

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages they sent or received"
  ON direct_messages FOR SELECT
  USING (
    account_id = current_account_id() AND
    (sender_id = auth.uid() OR recipient_id = auth.uid())
  );

CREATE POLICY "Users can send messages to users in their account"
  ON direct_messages FOR INSERT
  WITH CHECK (
    account_id = current_account_id() AND
    sender_id = auth.uid() AND
    recipient_id IN (
      SELECT id FROM users WHERE account_id = current_account_id()
    )
  );

CREATE POLICY "Users can update messages they received (mark as read)"
  ON direct_messages FOR UPDATE
  USING (
    account_id = current_account_id() AND
    recipient_id = auth.uid()
  )
  WITH CHECK (
    account_id = current_account_id() AND
    recipient_id = auth.uid()
  );

-- ================================================================
-- Function to get conversation between two users
-- ================================================================

CREATE OR REPLACE FUNCTION get_conversation_messages(
  p_user1_id UUID,
  p_user2_id UUID,
  p_account_id UUID
)
RETURNS SETOF direct_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM direct_messages
  WHERE account_id = p_account_id
    AND (
      (sender_id = p_user1_id AND recipient_id = p_user2_id) OR
      (sender_id = p_user2_id AND recipient_id = p_user1_id)
    )
  ORDER BY created_at ASC;
END;
$$;

-- ================================================================
-- Function to mark messages as read
-- ================================================================

CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_account_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE direct_messages
  SET is_read = true, read_at = NOW()
  WHERE account_id = p_account_id
    AND sender_id = p_sender_id
    AND recipient_id = p_recipient_id
    AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ================================================================
-- END OF MIGRATION
-- ================================================================

