-- Migration: Remove User Impersonation Feature
-- Date: 2025-11-27
-- Purpose: Drop functions and tables related to user impersonation to cleanup the database

-- Drop functions first
DROP FUNCTION IF EXISTS get_active_impersonation(uuid);
DROP FUNCTION IF EXISTS end_impersonation_session(uuid);
DROP FUNCTION IF EXISTS can_impersonate_user(uuid, uuid);
DROP FUNCTION IF EXISTS log_impersonation_action(uuid, text, jsonb);
DROP FUNCTION IF EXISTS update_impersonation_logs_updated_at();

-- Drop table (this cascades to triggers, indexes, and RLS policies)
DROP TABLE IF EXISTS user_impersonation_logs CASCADE;
