-- ============================================
-- CRITICAL PERFORMANCE FIXES
-- RUN EACH COMMAND SEPARATELY in Supabase SQL Editor
-- ============================================

-- 1. Create timezone cache table (can run with other simple commands)
CREATE TABLE IF NOT EXISTS cached_timezones (
  name TEXT PRIMARY KEY,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- 2. Enable performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 3. CRITICAL: Parts table index #1 (fixes 400ms queries)
-- Run this ALONE, wait for completion
CREATE INDEX CONCURRENTLY idx_parts_account_id ON parts(account_id);

-- 4. CRITICAL: Parts table index #2
-- Run this AFTER #3 completes
CREATE INDEX CONCURRENTLY idx_parts_account_id_created_at ON parts(account_id, created_at DESC);

-- 5. Real-time subscription index #1 (fixes 97% DB load)
CREATE INDEX CONCURRENTLY idx_realtime_subscription_entity ON realtime.subscription(entity);

-- 6. Real-time subscription index #2
CREATE INDEX CONCURRENTLY idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);

-- 7. Real-time subscription index #3
CREATE INDEX CONCURRENTLY idx_realtime_subscription_created_at ON realtime.subscription(created_at);

-- 8. Users table index #1
CREATE INDEX CONCURRENTLY idx_users_id_account_id ON users(id, account_id);

-- 9. Users table index #2
CREATE INDEX CONCURRENTLY idx_users_account_id_role ON users(account_id, role);

-- 10. Populate timezone cache (can run with other simple commands)
INSERT INTO cached_timezones (name)
SELECT name FROM pg_timezone_names
ON CONFLICT (name) DO NOTHING;

-- 11. Clean up old subscriptions
DELETE FROM realtime.subscription
WHERE created_at < NOW() - INTERVAL '24 hours';

-- 12. Vacuum parts table (run separately)
VACUUM ANALYZE parts;

-- 13. Vacuum users table (run separately)
VACUUM ANALYZE users;

-- 14. Vacuum jobs table (run separately)
VACUUM ANALYZE jobs;

-- 15. Vacuum contacts table (run separately)
VACUUM ANALYZE contacts;

-- 16. Create monitoring view (can run with other simple commands)
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

-- ========================================
-- VERIFICATION QUERIES (run these after all fixes)
-- ========================================

-- Check if indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename;

-- Test query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM parts
WHERE account_id = 'your-account-id'
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_live_tup as live_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;