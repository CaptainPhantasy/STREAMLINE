-- ============================================
-- DATABASE DIAGNOSIS SCRIPT
-- Run this to see what's actually wrong
-- ============================================

-- 1. Check what tables exist
SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check accounts table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'accounts'
ORDER BY ordinal_position;

-- 3. Check for missing columns in key tables
SELECT 
  'contacts' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'contacts'
ORDER BY ordinal_position;

SELECT 
  'conversations' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

SELECT 
  'messages' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

SELECT 
  'jobs' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- 4. Check foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 5. Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. Check for extra tables that shouldn't be there
SELECT 
  table_name as extra_table,
  'MIGHT BE FROM OTHER PROJECT' as note
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT IN (
    'accounts', 'users', 'contacts', 'conversations', 
    'messages', 'jobs', 'knowledge_docs', 'llm_providers', 'crmai_audit'
  )
ORDER BY table_name;

-- 7. Check if account exists
SELECT 
  id,
  name,
  slug,
  inbound_email_domain
FROM accounts
WHERE slug = '317plumber';

-- 8. Check for data integrity issues
SELECT 
  'contacts without account_id' as issue,
  COUNT(*) as count
FROM contacts
WHERE account_id IS NULL;

SELECT 
  'conversations without account_id' as issue,
  COUNT(*) as count
FROM conversations
WHERE account_id IS NULL;

SELECT 
  'messages without account_id' as issue,
  COUNT(*) as count
FROM messages
WHERE account_id IS NULL;

SELECT 
  'jobs without account_id' as issue,
  COUNT(*) as count
FROM jobs
WHERE account_id IS NULL;

