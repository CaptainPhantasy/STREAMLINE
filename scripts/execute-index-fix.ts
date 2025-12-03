#!/usr/bin/env tsx

/**
 * Execute Index Fixes via Supabase REST API
 * Uses the service role key from .env.local to run commands directly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a direct REST client (bypassing the client library limitations)
async function executeRawSQL(sql: string): Promise<boolean> {
  try {
    console.log(`Executing: ${sql.substring(0, 80)}...`);

    // Use the pgadmin endpoint which allows raw SQL execution
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`Failed: ${error}`);

      // Try alternative endpoint
      return await executeViaPostgrestREST(sql);
    }

    console.log('✅ Success');
    return true;
  } catch (error) {
    console.log(`Error: ${(error as Error).message}`);
    return false;
  }
}

async function executeViaPostgrestREST(sql: string): Promise<boolean> {
  try {
    // Use a direct RPC call approach
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Accept-Profile': 'public',
        'Content-Profile': 'public'
      },
      body: JSON.stringify({
        command: sql
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`Alternative method failed: ${error}`);
      return false;
    }

    console.log('✅ Success via alternative method');
    return true;
  } catch (error) {
    console.log(`Alternative method error: ${(error as Error).message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Executing Index Fixes Using Service Role Key');
  console.log('==============================================\n');

  const commands = [
    // CREATE TABLES and EXTENSIONS
    'CREATE TABLE IF NOT EXISTS cached_timezones (name TEXT PRIMARY KEY, last_updated TIMESTAMP DEFAULT NOW());',
    'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;',

    // Since CREATE INDEX CONCURRENTLY can't be run via API,
    // we'll create regular indexes instead
    'CREATE INDEX IF NOT EXISTS idx_parts_account_id ON parts(account_id);',
    'CREATE INDEX IF NOT EXISTS idx_parts_account_id_created_at ON parts(account_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_realtime_subscription_entity ON realtime.subscription(entity);',
    'CREATE INDEX IF NOT EXISTS idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);',
    'CREATE INDEX IF NOT EXISTS idx_realtime_subscription_created_at ON realtime.subscription(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_users_id_account_id ON users(id, account_id);',
    'CREATE INDEX IF NOT EXISTS idx_users_account_id_role ON users(account_id, role);',

    // CLEANUP
    'INSERT INTO cached_timezones (name) SELECT name FROM pg_timezone_names ON CONFLICT (name) DO NOTHING;',
    'DELETE FROM realtime.subscription WHERE created_at < NOW() - INTERVAL \\'24 hours\\';',

    // ANALYZE
    'ANALYZE parts;',
    'ANALYZE users;',
    'ANALYZE jobs;',
    'ANALYZE contacts;'
  ];

  console.log('Note: Using CREATE INDEX (not CONCURRENTLY) due to API limitations');
  console.log('This may briefly lock tables but will complete faster\n');

  let successCount = 0;

  for (let i = 0; i < commands.length; i++) {
    console.log(`\n[${i + 1}/${commands.length}]`);
    if (await executeRawSQL(commands[i])) {
      successCount++;
    }
  }

  console.log(`\n✅ Completed: ${successCount}/${commands.length} commands executed successfully`);

  // Test performance
  console.log('\n📊 Testing Performance After Fixes:');

  const tables = ['parts', 'users', 'jobs', 'contacts'];
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  for (const table of tables) {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        const duration = Date.now() - start;
        const status = duration < 50 ? '✅ Fast' : duration < 200 ? '⚠️ OK' : '🔴 Slow';
        console.log(`   ${status} ${table}: ${duration}ms`);
      }
    } catch (e) {
      console.log(`   ❌ ${table}: Error`);
    }
  }

  // Check if indexes were created
  console.log('\n📋 Checking Created Indexes:');
  try {
    const { data: indexes } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .like('indexname', 'idx_%');

    if (indexes && indexes.length > 0) {
      indexes.forEach((idx: any) => {
        console.log(`   ✅ ${idx.indexname} on ${idx.tablename}`);
      });
    } else {
      console.log('   ⚠️  Could not verify indexes (pg_indexes might not be accessible via REST API)');
    }
  } catch (e) {
    console.log('   ⚠️  Could not verify indexes via API');
  }

  console.log('\n✨ All fixes attempted! Check if performance has improved.');
}

main().catch(console.error);