-- CRITICAL: Run these ONE AT A TIME in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/_/sql
-- Your project ID is in the URL: https://supabase.com/dashboard/project/expbvujyegxmxvatcjqt/sql

-- COMMAND 1: Parts table index (MOST CRITICAL - fixes 200ms queries)
CREATE INDEX CONCURRENTLY idx_parts_account_id ON parts(account_id);

-- After #1 completes, run COMMAND 2:
CREATE INDEX CONCURRENTLY idx_parts_account_id_created_at ON parts(account_id, created_at DESC);

-- COMMAND 3: Real-time subscription index #1 (fixes 97% DB load)
CREATE INDEX CONCURRENTLY idx_realtime_subscription_entity ON realtime.subscription(entity);

-- COMMAND 4: Real-time subscription index #2
CREATE INDEX CONCURRENTLY idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);

-- COMMAND 5: Real-time subscription index #3
CREATE INDEX CONCURRENTLY idx_realtime_subscription_created_at ON realtime.subscription(created_at);

-- COMMAND 6: Users table index #1
CREATE INDEX CONCURRENTLY idx_users_id_account_id ON users(id, account_id);

-- COMMAND 7: Users table index #2
CREATE INDEX CONCURRENTLY idx_users_account_id_role ON users(account_id, role);

-- COMMAND 8: VACUUM parts table
VACUUM ANALYZE parts;

-- COMMAND 9: VACUUM users table
VACUUM ANALYZE users;

-- COMMAND 10: VACUUM jobs table
VACUUM ANALYZE jobs;

-- COMMAND 11: VACUUM contacts table
VACUUM ANALYZE contacts;

-- VERIFICATION (run after all indexes created):
-- Check if indexes exist:
SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE 'idx_%' ORDER BY tablename;

-- Test query performance:
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM parts WHERE account_id = 'test' LIMIT 10;