import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function fixDatabaseSchema() {
  console.log('🔧 Fixing Database Schema\n')
  console.log(`📍 Supabase URL: ${supabaseUrl.substring(0, 30)}...\n`)

  try {
    // Step 1: Check current state
    console.log('1️⃣ Checking current database state...')
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      })
      .catch(() => {
        // RPC might not exist, try direct query
        return supabase.from('accounts').select('id').limit(0)
      })

    // Step 2: Read the correct schema
    console.log('\n2️⃣ Reading correct schema files...')
    const schemaSQL = readFileSync(join(process.cwd(), 'supabase/schema.sql'), 'utf-8')
    const rlsSQL = readFileSync(join(process.cwd(), 'supabase/rls-policies.sql'), 'utf-8')
    const personaSQL = readFileSync(join(process.cwd(), 'supabase/add-persona-config.sql'), 'utf-8')

    // Step 3: Create a comprehensive fix script
    console.log('\n3️⃣ Creating fix script...')
    
    const fixScript = `
-- ============================================
-- DATABASE SCHEMA FIX SCRIPT
-- This script will reset the database to the correct schema
-- ============================================

-- Step 1: Drop all existing tables (CAREFUL - this deletes data!)
-- Uncomment the lines below if you want to completely reset
/*
DROP TABLE IF EXISTS crmai_audit CASCADE;
DROP TABLE IF EXISTS llm_providers CASCADE;
DROP TABLE IF EXISTS knowledge_docs CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
*/

-- Step 2: Recreate schema from schema.sql
${schemaSQL}

-- Step 3: Apply RLS policies
${rlsSQL}

-- Step 4: Add persona_config if missing
${personaSQL}

-- Step 5: Verify account exists
DO $$
DECLARE
  account_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO account_count FROM accounts WHERE slug = '317plumber';
  IF account_count = 0 THEN
    INSERT INTO accounts (name, slug, inbound_email_domain)
    VALUES ('317 Plumber', '317plumber', 'reply.317plumber.com')
    ON CONFLICT (slug) DO NOTHING;
    RAISE NOTICE 'Created 317 Plumber account';
  ELSE
    RAISE NOTICE '317 Plumber account already exists';
  END IF;
END $$;

-- Step 6: Verify extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

SELECT 'Database schema fix complete!' as status;
`

    // Step 4: Save fix script to file
    const fixScriptPath = join(process.cwd(), 'supabase/fix-schema.sql')
    require('fs').writeFileSync(fixScriptPath, fixScript)
    
    console.log('✅ Fix script created: supabase/fix-schema.sql')
    console.log('\n📋 Next Steps:')
    console.log('   1. Review the fix script: supabase/fix-schema.sql')
    console.log('   2. Go to Supabase Dashboard → SQL Editor')
    console.log('   3. Copy and paste the contents of fix-schema.sql')
    console.log('   4. Review carefully (especially DROP statements)')
    console.log('   5. Run the script')
    console.log('\n⚠️  WARNING: The DROP statements are commented out by default.')
    console.log('   Uncomment them ONLY if you want to completely reset the database.')
    console.log('   This will DELETE ALL DATA!')
    
    // Step 5: Also create a safer "add missing" script
    const safeFixScript = `
-- ============================================
-- SAFE DATABASE SCHEMA FIX (Non-destructive)
-- This script only adds missing tables/columns
-- ============================================

-- Recreate schema (IF NOT EXISTS - safe)
${schemaSQL}

-- Apply RLS policies (will update if exists)
${rlsSQL}

-- Add persona_config if missing
${personaSQL}

-- Ensure account exists
DO $$
DECLARE
  account_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO account_count FROM accounts WHERE slug = '317plumber';
  IF account_count = 0 THEN
    INSERT INTO accounts (name, slug, inbound_email_domain)
    VALUES ('317 Plumber', '317plumber', 'reply.317plumber.com')
    ON CONFLICT (slug) DO NOTHING;
    RAISE NOTICE 'Created 317 Plumber account';
  ELSE
    RAISE NOTICE '317 Plumber account already exists';
  END IF;
END $$;

SELECT 'Safe schema fix complete!' as status;
`

    const safeFixScriptPath = join(process.cwd(), 'supabase/fix-schema-safe.sql')
    require('fs').writeFileSync(safeFixScriptPath, safeFixScript)
    
    console.log('\n✅ Safe fix script created: supabase/fix-schema-safe.sql')
    console.log('   This version is non-destructive - try this first!')
    
    // Step 6: Verify current state
    console.log('\n4️⃣ Checking current database state...')
    const checkQueries = [
      { name: 'accounts', query: 'SELECT COUNT(*) FROM accounts' },
      { name: 'contacts', query: 'SELECT COUNT(*) FROM contacts' },
      { name: 'conversations', query: 'SELECT COUNT(*) FROM conversations' },
      { name: 'messages', query: 'SELECT COUNT(*) FROM messages' },
      { name: 'jobs', query: 'SELECT COUNT(*) FROM jobs' },
    ]

    for (const { name, query } of checkQueries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: query })
        if (error) {
          console.log(`   ⚠️  ${name}: Table may not exist or error: ${error.message}`)
        } else {
          console.log(`   ✅ ${name}: Table exists`)
        }
      } catch (err: any) {
        // Try direct query
        const { error } = await supabase.from(name).select('id').limit(1)
        if (error) {
          console.log(`   ❌ ${name}: ${error.message}`)
        } else {
          console.log(`   ✅ ${name}: Table exists`)
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Fix scripts created!')
    console.log('\n📝 Recommended approach:')
    console.log('   1. Try supabase/fix-schema-safe.sql first (non-destructive)')
    console.log('   2. If that doesn\'t work, use supabase/fix-schema.sql')
    console.log('   3. Review both scripts in Supabase SQL Editor before running')
    console.log('='.repeat(60))

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error('\n📝 Manual fix required:')
    console.error('   1. Go to Supabase Dashboard → SQL Editor')
    console.error('   2. Run supabase/schema.sql')
    console.error('   3. Run supabase/rls-policies.sql')
    console.error('   4. Run supabase/add-persona-config.sql')
  }
}

fixDatabaseSchema().catch(console.error)

