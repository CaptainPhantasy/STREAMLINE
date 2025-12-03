-- Performance Optimization Fixes
-- Based on query performance analysis from Supabase

-- ============================================================================
-- CRITICAL FIXES - Run immediately
-- ============================================================================

-- 1. Fix Parts Table Performance (Major Issue: 2.5s avg query time)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id
ON parts(account_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id_created_at
ON parts(account_id, created_at DESC);

-- 2. Optimize Real-time Subscriptions (97% of query time)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_entity
ON realtime.subscription(entity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_subscription_id
ON realtime.subscription(subscription_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_created_at
ON realtime.subscription(created_at);

-- 3. Cache Timezone Data (95s avg query time)
CREATE TABLE IF NOT EXISTS cached_timezones (
  name TEXT PRIMARY KEY,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Insert timezone data if table is empty
INSERT INTO cached_timezones (name)
SELECT name
FROM pg_timezone_names
WHERE name NOT IN (SELECT name FROM cached_timezones);

-- Create function to refresh timezone cache
CREATE OR REPLACE FUNCTION refresh_timezone_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cached_timezones;
  INSERT INTO cached_timezones (name)
  SELECT name FROM pg_timezone_names;
  RAISE NOTICE 'Timezone cache refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Enable pg_stat_statements for query monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create view for slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  ROUND(mean_time::numeric, 2) as mean_time_ms,
  ROUND(total_time::numeric, 2) as total_time_ms,
  rows_read,
  ROUND(cache_hit_rate::numeric, 2) as cache_hit_rate,
  ROUND((total_time / 1000)::numeric, 2) as total_time_seconds
FROM pg_stat_statements
WHERE mean_time > 100 -- queries taking >100ms
ORDER BY total_time DESC;

-- Create view for table sizes and activity
CREATE OR REPLACE VIEW table_performance AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_tup_ins as total_inserts,
  n_tup_upd as total_updates,
  n_tup_del as total_deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  ROUND((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0) * 100), 2) as dead_row_percentage,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- CLEANUP JOBS
-- ============================================================================

-- Function to clean up old realtime subscriptions
CREATE OR REPLACE FUNCTION cleanup_old_subscriptions()
RETURNS void AS $$
BEGIN
  -- Delete subscriptions older than 24 hours
  DELETE FROM realtime.subscription
  WHERE created_at < NOW() - INTERVAL '24 hours';

  RAISE NOTICE 'Cleaned up old subscriptions at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a job to run cleanup (requires pg_cron extension)
-- This will only work if pg_cron is installed
SELECT cron.schedule(
  'cleanup-subscriptions',
  '0 */6 * * *', -- Every 6 hours
  'SELECT cleanup_old_subscriptions();'
);

-- ============================================================================
-- VACUUM AND ANALYZE
-- ============================================================================

-- Immediately VACUUM and ANALYZE critical tables
VACUUM ANALYZE parts;
VACUUM ANALYZE realtime.subscription;

-- ============================================================================
-- ADDITIONAL OPTIMIZATIONS
-- ============================================================================

-- Add indexes for common PostgREST queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_account_id
ON users(id, account_id);

-- Add index for auth tables (frequently queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id
ON auth.sessions(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_id
ON auth.sessions(id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_identities_user_id
ON auth.identities(user_id);

-- Create composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_id_role
ON users(account_id, role);

-- ============================================================================
-- PERFORMANCE STATISTICS RESET
-- ============================================================================

-- Reset pg_stat_statements to start fresh monitoring
SELECT pg_stat_statements_reset();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify indexes were created
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;