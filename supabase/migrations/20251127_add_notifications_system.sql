-- ============================================================================
-- Add Notifications System
-- ============================================================================
-- Created: 2025-11-27
-- Purpose: Real-time notification system with triggers for job assignments,
--          tech status changes, invoices, and meeting reminders
--
-- Tables Added:
-- - notifications: Main notifications table
--
-- Triggers Added:
-- - notify_tech_on_job_assignment
-- - notify_dispatcher_on_tech_offline
-- - notify_owner_on_invoice_overdue
-- - notify_sales_on_meeting_reminder
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- job_assigned, tech_offline, invoice_overdue, meeting_reminder, etc.
  title text NOT NULL,
  message text NOT NULL,
  entity_type text, -- job, invoice, meeting, contact, etc.
  entity_id uuid, -- ID of the related entity
  action_url text, -- Link to related page (e.g., /jobs/123)
  is_read boolean DEFAULT false,
  read_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_account_id ON notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY notifications_select_own
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY notifications_delete_own
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Only admins/system can create notifications
CREATE POLICY notifications_insert_admin
  ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'owner')
      AND users.account_id = notifications.account_id
    )
  );

-- ============================================================================
-- Helper function to create a notification
-- ============================================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_account_id uuid,
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    account_id,
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    action_url,
    metadata
  ) VALUES (
    p_account_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_action_url,
    p_metadata
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger 1: Notify Tech when job is assigned
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_tech_on_job_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if tech was just assigned (not already assigned)
  IF NEW.tech_id IS NOT NULL AND (OLD.tech_id IS NULL OR OLD.tech_id != NEW.tech_id) THEN
    PERFORM create_notification(
      p_account_id := NEW.account_id,
      p_user_id := NEW.tech_id,
      p_type := 'job_assigned',
      p_title := 'New Job Assigned',
      p_message := format('You have been assigned to job: %s', NEW.title),
      p_entity_type := 'job',
      p_entity_id := NEW.id,
      p_action_url := format('/jobs/%s', NEW.id),
      p_metadata := jsonb_build_object(
        'job_id', NEW.id,
        'job_title', NEW.title,
        'status', NEW.status,
        'scheduled_date', NEW.scheduled_date
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notify_tech_on_job_assignment ON jobs;
CREATE TRIGGER trigger_notify_tech_on_job_assignment
  AFTER INSERT OR UPDATE OF tech_id ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_tech_on_job_assignment();

-- ============================================================================
-- Trigger 2: Notify Dispatcher when tech goes offline
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_dispatcher_on_tech_offline()
RETURNS TRIGGER AS $$
DECLARE
  v_dispatcher_id uuid;
BEGIN
  -- Only notify if tech just went offline (was available, now offline)
  IF NEW.status = 'offline' AND OLD.status != 'offline' THEN
    -- Find dispatcher in the same account
    SELECT id INTO v_dispatcher_id
    FROM users
    WHERE account_id = NEW.account_id
      AND role = 'dispatcher'
      AND is_active = true
    LIMIT 1;

    IF v_dispatcher_id IS NOT NULL THEN
      PERFORM create_notification(
        p_account_id := NEW.account_id,
        p_user_id := v_dispatcher_id,
        p_type := 'tech_offline',
        p_title := 'Tech Went Offline',
        p_message := format('Tech %s is now offline', NEW.name),
        p_entity_type := 'user',
        p_entity_id := NEW.id,
        p_action_url := '/dispatch/map',
        p_metadata := jsonb_build_object(
          'tech_id', NEW.id,
          'tech_name', NEW.name,
          'previous_status', OLD.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notify_dispatcher_on_tech_offline ON users;
CREATE TRIGGER trigger_notify_dispatcher_on_tech_offline
  AFTER UPDATE OF status ON users
  FOR EACH ROW
  WHEN (NEW.role = 'tech')
  EXECUTE FUNCTION notify_dispatcher_on_tech_offline();

-- ============================================================================
-- Trigger 3: Notify Owner when invoice is overdue
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_owner_on_invoice_overdue()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Only notify if invoice just became overdue
  IF NEW.status = 'overdue' AND (OLD.status IS NULL OR OLD.status != 'overdue') THEN
    -- Find owner in the same account
    SELECT id INTO v_owner_id
    FROM users
    WHERE account_id = NEW.account_id
      AND role = 'owner'
      AND is_active = true
    LIMIT 1;

    IF v_owner_id IS NOT NULL THEN
      PERFORM create_notification(
        p_account_id := NEW.account_id,
        p_user_id := v_owner_id,
        p_type := 'invoice_overdue',
        p_title := 'Invoice Overdue',
        p_message := format('Invoice #%s is now overdue (Due: %s)', NEW.invoice_number, NEW.due_date),
        p_entity_type := 'invoice',
        p_entity_id := NEW.id,
        p_action_url := format('/finance/invoices/%s', NEW.id),
        p_metadata := jsonb_build_object(
          'invoice_id', NEW.id,
          'invoice_number', NEW.invoice_number,
          'total_amount', NEW.total_amount,
          'due_date', NEW.due_date
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notify_owner_on_invoice_overdue ON invoices;
CREATE TRIGGER trigger_notify_owner_on_invoice_overdue
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_owner_on_invoice_overdue();

-- ============================================================================
-- Function: Check for upcoming meetings and send reminders
-- ============================================================================
-- This function should be called by a cron job every 5 minutes
-- It finds meetings starting in 30 minutes and creates notifications
CREATE OR REPLACE FUNCTION notify_meeting_reminders()
RETURNS void AS $$
DECLARE
  v_meeting RECORD;
  v_reminder_time timestamptz;
BEGIN
  -- Calculate time window: 25-35 minutes from now
  v_reminder_time := now() + interval '30 minutes';

  -- Find meetings starting in ~30 minutes that haven't been reminded yet
  FOR v_meeting IN
    SELECT
      m.id,
      m.account_id,
      m.user_id,
      m.title,
      m.scheduled_date,
      m.location,
      c.name as contact_name
    FROM meetings m
    LEFT JOIN contacts c ON c.id = m.contact_id
    WHERE m.scheduled_date BETWEEN now() + interval '25 minutes' AND now() + interval '35 minutes'
      AND m.status NOT IN ('cancelled', 'completed')
      AND NOT EXISTS (
        -- Don't send duplicate reminders
        SELECT 1 FROM notifications
        WHERE entity_type = 'meeting'
          AND entity_id = m.id
          AND type = 'meeting_reminder'
          AND created_at > now() - interval '1 hour'
      )
  LOOP
    PERFORM create_notification(
      p_account_id := v_meeting.account_id,
      p_user_id := v_meeting.user_id,
      p_type := 'meeting_reminder',
      p_title := 'Meeting in 30 Minutes',
      p_message := format('Meeting "%s" starts in 30 minutes%s',
        v_meeting.title,
        CASE WHEN v_meeting.contact_name IS NOT NULL
          THEN format(' with %s', v_meeting.contact_name)
          ELSE ''
        END
      ),
      p_entity_type := 'meeting',
      p_entity_id := v_meeting.id,
      p_action_url := format('/meetings/%s', v_meeting.id),
      p_metadata := jsonb_build_object(
        'meeting_id', v_meeting.id,
        'meeting_title', v_meeting.title,
        'scheduled_date', v_meeting.scheduled_date,
        'location', v_meeting.location,
        'contact_name', v_meeting.contact_name
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Mark all notifications as read for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id
    AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Delete old read notifications (cleanup)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications
  WHERE is_read = true
    AND read_at < now() - interval '30 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION notify_meeting_reminders TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO authenticated;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE notifications IS 'Real-time notification system for users';
COMMENT ON FUNCTION create_notification IS 'Helper function to create a notification (used by triggers and manual creation)';
COMMENT ON FUNCTION notify_meeting_reminders IS 'Call this function from a cron job every 5 minutes to send meeting reminders';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all notifications as read for a specific user';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Delete old read notifications to keep database clean (call from cron)';
