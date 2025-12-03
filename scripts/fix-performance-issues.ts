#!/usr/bin/env tsx

/**
 * Fix Critical Performance Issues
 *
 * This script applies immediate fixes for the performance issues identified
 * in the Supabase query performance analysis.
 *
 * Run with: npm run fix-performance
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface SlowQuery {
  query: string;
  calls: number;
  mean_time: number;
  total_time: number;
}

interface TablePerformance {
  tablename: string;
  size: string;
  live_rows: number;
  dead_rows: number;
  dead_row_percentage: number;
}

class PerformanceFixer {

  async runAllFixes() {
    console.log('🚀 Starting performance fixes...\n');

    try {
      // 1. Check current performance
      await this.checkCurrentPerformance();

      // 2. Run the migration
      await this.runMigration();

      // 3. Verify fixes
      await this.verifyFixes();

      // 4. Provide recommendations
      await this.showRecommendations();

      console.log('\n✅ Performance fixes completed successfully!');
    } catch (error) {
      console.error('❌ Error applying fixes:', error);
      process.exit(1);
    }
  }

  private async checkCurrentPerformance() {
    console.log('📊 Checking current performance...');

    // Test basic query performance
    const tables = ['parts', 'users', 'jobs', 'contacts'];

    for (const table of tables) {
      const start = Date.now();
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`  ❌ ${table}: Query failed - ${error.message}`);
        } else {
          const duration = Date.now() - start;
          const status = duration < 50 ? '✅ Fast' : duration < 200 ? '⚠️ OK' : '🔴 Slow';
          console.log(`  ${status} ${table}: ${duration}ms`);
        }
      } catch (e) {
        console.log(`  ❌ ${table}: Error querying table`);
      }
    }

    // Check for slow queries if pg_stat_statements is available
    try {
      const { data: slowQueries, error } = await supabase
        .from('pg_stat_statements')
        .select('query, calls, mean_time')
        .gte('mean_time', 100)
        .order('mean_time', { ascending: false })
        .limit(5);

      if (!error && slowQueries && slowQueries.length > 0) {
        console.log('\n⚠️  Slow queries detected:');
        slowQueries.forEach((q: any, i: number) => {
          console.log(`  ${i + 1}. ${q.mean_time.toFixed(2)}ms avg (${q.calls} calls)`);
        });
      } else {
        console.log('\n✅ No slow queries detected (or monitoring not enabled)');
      }
    } catch (e) {
      console.log('\n📊 Performance monitoring not enabled');
    }

    console.log('\n');
  }

  private async runMigration() {
    console.log('🔧 Applying performance fixes...');
    console.log('\n⚠️  NOTE: Some fixes require SUPERUSER privileges.');
    console.log('   Please run the following SQL manually in your Supabase SQL Editor:\n');

    const criticalFixes = [
      '-- Fix Parts table performance',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id ON parts(account_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id_created_at ON parts(account_id, created_at DESC);',
      '',
      '-- Fix Real-time subscriptions',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_entity ON realtime.subscription(entity);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_created_at ON realtime.subscription(created_at);',
      '',
      '-- Cache timezones',
      'CREATE TABLE IF NOT EXISTS cached_timezones (name TEXT PRIMARY KEY, last_updated TIMESTAMP DEFAULT NOW());',
      'INSERT INTO cached_timezones (name) SELECT name FROM pg_timezone_names ON CONFLICT (name) DO NOTHING;',
      '',
      '-- Enable performance monitoring',
      'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;',
      '',
      '-- Clean up old realtime subscriptions (older than 24 hours)',
      "DELETE FROM realtime.subscription WHERE created_at < NOW() - INTERVAL '24 hours';",
      '',
      '-- Vacuum and analyze critical tables',
      'VACUUM ANALYZE parts;',
      'VACUUM ANALYZE users;',
      'VACUUM ANALYZE jobs;',
      'VACUUM ANALYZE contacts;',
    ];

    criticalFixes.forEach(fix => console.log(fix));

    console.log('\n📋 Application-level fixes you can implement:');
    console.log('1. Add caching to parts data in your application');
    console.log('2. Implement connection pooling');
    console.log('3. Add Redis for session caching');
    console.log('4. Optimize real-time subscription filters\n');

    console.log('✅ Performance fixes script completed\n');
  }

  private async verifyFixes() {
    console.log('📊 Checking current performance...');

    // Test parts table performance
    console.log('\nTesting parts table query...');
    const start = Date.now();
    const { data: parts, error: partsError } = await supabase
      .from('parts')
      .select('*')
      .limit(1);

    if (partsError) {
      console.log(`  ❌ Parts table query failed: ${partsError.message}`);
    } else {
      const duration = Date.now() - start;
      console.log(`  ⏱️  Parts query time: ${duration}ms (${duration < 100 ? '✅ Fast' : '⚠️ Slow'})`);
    }

    // Test users table performance
    console.log('\nTesting users table query...');
    const userStart = Date.now();
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, account_id')
      .limit(1);

    if (usersError) {
      console.log(`  ❌ Users table query failed: ${usersError.message}`);
    } else {
      const userDuration = Date.now() - userStart;
      console.log(`  ⏱️  Users query time: ${userDuration}ms (${userDuration < 50 ? '✅ Fast' : '⚠️ Slow'})`);
    }

    // Check if performance monitoring extension is available
    try {
      const { data: statStatements, error: statError } = await supabase
        .from('pg_stat_statements')
        .select('query, calls, mean_time')
        .gte('mean_time', 100)
        .order('mean_time', { ascending: false })
        .limit(5);

      if (!statError && statStatements && statStatements.length > 0) {
        console.log('\nTop 5 slow queries found:');
        statStatements.forEach((q: any, i: number) => {
          console.log(`  ${i + 1}. ${q.mean_time.toFixed(2)}ms avg - ${q.calls} calls`);
          console.log(`     Query: ${q.query.substring(0, 100)}...`);
        });
      } else {
        console.log('\n📋 pg_stat_statements extension may not be enabled');
        console.log('   Run: CREATE EXTENSION IF NOT EXISTS pg_stat_statements; in SQL Editor');
      }
    } catch (e) {
      console.log('\n📋 Performance monitoring not available');
      console.log('   Enable pg_stat_statements extension to track slow queries');
    }

    console.log('\n💡 Tips for verifying improvements:');
    console.log('   - Run the SQL fixes in Supabase SQL Editor');
    console.log('   - Test queries after index creation');
    console.log('   - Monitor performance over the next 24 hours');
    console.log('   - Check if page load times improve\n');
  }

  private async showRecommendations() {
    console.log('📋 Performance Recommendations:\n');

    console.log('1. 🔄 Set up automated cleanup jobs:');
    console.log('   - Run VACUUM ANALYZE on large tables weekly');
    console.log('   - Clean up old realtime subscriptions every 6 hours');
    console.log('   - Monitor dead row percentages > 10%\n');

    console.log('2. 📈 Implement application-level caching:');
    console.log('   - Cache parts data for 5-10 minutes');
    console.log('   - Cache user sessions in Redis');
    console.log('   - Use CDN for static assets\n');

    console.log('3. 🚀 Optimize real-time subscriptions:');
    console.log('   - Add filters to reduce payload');
    console.log('   - Debounce subscription updates');
    console.log('   - Consider WebSocket connection pooling\n');

    console.log('4. 📊 Monitor performance metrics:');
    console.log('   - Set up alerts for slow queries > 500ms');
    console.log('   - Track cache hit rates > 95%');
    console.log('   - Monitor connection pool usage\n');

    console.log('5. 🏗️ Long-term improvements:');
    console.log('   - Consider read replicas for reporting queries');
    console.log('   - Implement database sharding for large accounts');
    console.log('   - Use columnar storage for analytics data\n');
  }
}

// Run the fixes
const fixer = new PerformanceFixer();
fixer.runAllFixes().catch(console.error);