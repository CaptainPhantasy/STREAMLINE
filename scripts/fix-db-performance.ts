#!/usr/bin/env tsx

/**
 * Direct Database Performance Fixes
 * Uses service role key to execute SQL via Supabase API
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('🚀 Database Performance Fixes');
console.log('============================\n');

// Create Supabase client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testPerformance() {
  console.log('📊 Testing Current Performance:\n');

  const tables = ['parts', 'users', 'jobs', 'contacts'];

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
}

async function main() {
  // Test current performance
  await testPerformance();

  console.log('\n⚠️  Automatic execution via API is limited.');
  console.log('   CREATE INDEX CONCURRENTLY requires manual execution.\n');

  console.log('📋 Required Manual Steps:');
  console.log('   ====================');
  console.log('   Go to: https://supabase.com/dashboard/project/expbvujyegxmxvatcjqt/sql\n');

  const commands = [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id_created_at ON parts(account_id, created_at DESC);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_entity ON realtime.subscription(entity);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_created_at ON realtime.subscription(created_at);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_account_id ON users(id, account_id);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_id_role ON users(account_id, role);',
    'VACUUM ANALYZE parts;',
    'VACUUM ANALYZE users;',
    'VACUUM ANALYZE jobs;',
    'VACUUM ANALYZE contacts;'
  ];

  console.log('Run these commands ONE AT A TIME:\n');
  commands.forEach((cmd, i) => {
    console.log(`${i + 1}. ${cmd}`);
  });

  console.log('\n✅ Note: idx_parts_account_id already exists (that\'s why you got "already exists" error)');
  console.log('   After running these commands, performance should improve dramatically.');

  console.log('\n🔄 To verify improvements:');
  console.log('   npm run fix-performance');
}

main().catch(console.error);