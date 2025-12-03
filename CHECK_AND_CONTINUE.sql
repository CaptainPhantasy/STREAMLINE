-- CHECK CURRENT STATUS AND CONTINUE
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/expbvujyegxmxvatcjqt/sql

-- Step 1: Check which indexes already exist
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
   OR indexname LIKE '%account_id%'
ORDER BY tablename, indexname;

-- If idx_parts_account_id exists, skip to #2 below
-- If it doesn't exist, run: CREATE INDEX CONCURRENTLY idx_parts_account_id ON parts(account_id);

-- Step 2: Create remaining parts table index (if not exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id_created_at
ON parts(account_id, created_at DESC);

-- Step 3: Check real-time subscription table
SELECT * FROM pg_indexes WHERE tablename = 'subscription' AND schemaname = 'realtime';

-- Step 4: Create real-time indexes (IF NOT EXISTS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_entity
ON realtime.subscription(entity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_subscription_id
ON realtime.subscription(subscription_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_created_at
ON realtime.subscription(created_at);

-- Step 5: Create users table indexes (IF NOT EXISTS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_account_id
ON users(id, account_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_id_role
ON users(account_id, role);

-- Step 6: Run VACUUM on key tables
VACUUM ANALYZE parts;
VACUUM ANALYZE users;
VACUUM ANALYZE jobs;
VACUUM ANALYZE contacts;

-- Step 7: Test performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM parts
WHERE account_id = 'your-account-id-here'
LIMIT 10;

-- Check slow queries
SELECT * FROM slow_queries LIMIT 5;