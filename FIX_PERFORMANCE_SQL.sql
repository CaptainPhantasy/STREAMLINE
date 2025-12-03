-- ========================================
-- CRITICAL PERFORMANCE FIXES
-- Run this in your Supabase SQL Editor
-- ========================================

-- 1. FIX PARTS TABLE PERFORMANCE (Most Critical)
-- The parts table was taking 2.5-3 seconds per query!
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id ON parts(account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id_created_at ON parts(account_id, created_at DESC);

-- 2. FIX REAL-TIME SUBSCRIPTIONS (97% of database time)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_entity ON realtime.subscription(entity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_created_at ON realtime.subscription(created_at);

-- 3. CACHE TIMEZONE DATA (95 seconds per query!)
CREATE TABLE IF NOT EXISTS cached_timezones (
  name TEXT PRIMARY KEY,
  last_updated TIMESTAMP DEFAULT NOW()
);

INSERT INTO cached_timezones (name)
SELECT name FROM pg_timezone_names
ON CONFLICT (name) DO NOTHING;

-- 4. OPTIMIZE AUTH TABLES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_account_id ON users(id, account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_id_role ON users(account_id, role);

-- 5. ENABLE PERFORMANCE MONITORING
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 6. CLEAN UP OLD SUBSCRIPTIONS
DELETE FROM realtime.subscription
WHERE created_at < NOW() - INTERVAL '24 hours';

-- 7. VACUUM AND ANALYZE CRITICAL TABLES
VACUUM ANALYZE parts;
VACUUM ANALYZE users;
VACUUM ANALYZE jobs;
VACUUM ANALYZE contacts;
VACUUM ANALYZE estimates;

-- 8. VIEW TO MONITOR SLOW QUERIES
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  ROUND(mean_time::numeric, 2) as mean_time_ms,
  ROUND(total_time::numeric, 2) as total_time_ms,
  rows_read,
  ROUND((total_time / 1000)::numeric, 2) as total_time_seconds
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY total_time DESC;

-- 9. FUNCTION TO REFRESH TIMEZONE CACHE
CREATE OR REPLACE FUNCTION refresh_timezone_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cached_timezones;
  INSERT INTO cached_timezones (name)
  SELECT name FROM pg_timezone_names;
  RAISE NOTICE 'Timezone cache refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION QUERIES (Run these after the fixes)
-- ========================================

-- Check if indexes were created
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM parts
WHERE account_id = 'your-account-id-here'
LIMIT 10;

-- Check slow queries
SELECT * FROM slow_queries LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_live_tup as live_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;