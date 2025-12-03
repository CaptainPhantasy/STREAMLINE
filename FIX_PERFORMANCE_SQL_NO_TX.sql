-- ========================================
-- PERFORMANCE FIXES (No Transaction Version)
-- Run each section separately in Supabase SQL Editor
-- ========================================

-- SECTION 1: Create Tables (can run in transaction)
CREATE TABLE IF NOT EXISTS cached_timezones (
  name TEXT PRIMARY KEY,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- SECTION 2: Enable Extensions (can run in transaction)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- SECTION 3: CRITICAL INDEXES (RUN EACH ONE SEPARATELY!)
-- DO NOT run all at once - copy/paste each line individually

-- Parts table indexes (CRITICAL - fixes 400ms queries)
CREATE INDEX CONCURRENTLY idx_parts_account_id ON parts(account_id);
-- After this completes, run:
CREATE INDEX CONCURRENTLY idx_parts_account_id_created_at ON parts(account_id, created_at DESC);

-- Real-time subscription indexes (CRITICAL - fixes 97% DB usage)
-- After parts indexes complete, run:
CREATE INDEX CONCURRENTLY idx_realtime_subscription_entity ON realtime.subscription(entity);
CREATE INDEX CONCURRENTLY idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);
CREATE INDEX CONCURRENTLY idx_realtime_subscription_created_at ON realtime.subscription(created_at);

-- Users table indexes
CREATE INDEX CONCURRENTLY idx_users_id_account_id ON users(id, account_id);
CREATE INDEX CONCURRENTLY idx_users_account_id_role ON users(account_id, role);

-- SECTION 4: Clean up (can run in transaction)
INSERT INTO cached_timezones (name)
SELECT name FROM pg_timezone_names
ON CONFLICT (name) DO NOTHING;

DELETE FROM realtime.subscription
WHERE created_at < NOW() - INTERVAL '24 hours';

-- SECTION 5: Vacuum tables (RUN EACH ONE SEPARATELY)
VACUUM ANALYZE parts;
VACUUM ANALYZE users;
VACUUM ANALYZE jobs;
VACUUM ANALYZE contacts;

-- SECTION 6: Create monitoring views (can run in transaction)
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

-- Refresh timezone cache function
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
-- QUICK VERIFICATION
-- Run these to verify improvements
-- ========================================

-- Check if indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename;

-- Test query performance with EXPLAIN
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM parts
WHERE account_id = 'test-account-id'
LIMIT 10;

-- Check for slow queries
SELECT * FROM slow_queries LIMIT 10;