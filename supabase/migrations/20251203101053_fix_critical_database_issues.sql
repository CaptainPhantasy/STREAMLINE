-- ============================================================================
-- CRITICAL DATABASE FIXES
-- Created: 2025-12-03 10:10:53 EST
-- ============================================================================
-- This migration fixes critical security and performance issues identified
-- by Supabase advisors.
-- ============================================================================

-- ============================================================================
-- CRITICAL SECURITY FIX #1: Enable RLS on public.users table
-- ============================================================================
-- Issue: public.users has RLS policies but RLS is disabled
-- Impact: Policies exist but are NOT enforced - major security vulnerability
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PERFORMANCE FIX #1: Add missing foreign key indexes
-- ============================================================================
-- These indexes improve query performance for foreign key lookups
-- ============================================================================

-- Index for job_checklist_items.completed_by
CREATE INDEX IF NOT EXISTS idx_job_checklist_items_completed_by 
ON public.job_checklist_items(completed_by);

-- Index for marketing_automations.created_by
CREATE INDEX IF NOT EXISTS idx_marketing_automations_created_by 
ON public.marketing_automations(created_by);

-- Index for marketing_automations.template_id
CREATE INDEX IF NOT EXISTS idx_marketing_automations_template_id 
ON public.marketing_automations(template_id);

-- Index for part_usage_history.used_by
CREATE INDEX IF NOT EXISTS idx_part_usage_history_used_by 
ON public.part_usage_history(used_by);

-- Index for resource_assignments.assigned_by
CREATE INDEX IF NOT EXISTS idx_resource_assignments_assigned_by 
ON public.resource_assignments(assigned_by);

-- Index for route_waypoints.account_id
CREATE INDEX IF NOT EXISTS idx_route_waypoints_account_id 
ON public.route_waypoints(account_id);

-- Index for route_waypoints.created_by
CREATE INDEX IF NOT EXISTS idx_route_waypoints_created_by 
ON public.route_waypoints(created_by);

-- ============================================================================
-- PERFORMANCE FIX #2: Remove duplicate index on signatures table
-- ============================================================================
-- Issue: Two identical indexes exist (idx_signatures_account, idx_signatures_account_id)
-- ============================================================================

-- Drop the duplicate index (keep idx_signatures_account_id as it's more descriptive)
DROP INDEX IF EXISTS public.idx_signatures_account;

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration to verify fixes)
-- ============================================================================
-- Uncomment and run these to verify the fixes:
--
-- -- Verify RLS is enabled on users table
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'users';
--
-- -- Verify indexes were created
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND indexname LIKE 'idx_%_completed_by' 
--    OR indexname LIKE 'idx_%_created_by'
--    OR indexname LIKE 'idx_%_used_by'
--    OR indexname LIKE 'idx_%_assigned_by'
--    OR indexname LIKE 'idx_route_waypoints_%';
-- ============================================================================

