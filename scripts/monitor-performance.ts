#!/usr/bin/env tsx

/**
 * Performance Monitoring Script
 *
 * Continuously monitors database performance and sends alerts
 * when thresholds are exceeded.
 *
 * Run with: npm run monitor-performance
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

interface PerformanceAlert {
  type: 'slow_query' | 'high_connections' | 'dead_rows' | 'cache_miss';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
}

class PerformanceMonitor {
  private alerts: PerformanceAlert[] = [];
  private readonly THRESHOLDS = {
    slowQueryMs: 500,
    maxConnections: 80,
    deadRowPercentage: 10,
    cacheHitRate: 95,
  };

  async startMonitoring(intervalMinutes = 5) {
    console.log(`📊 Starting performance monitoring (checking every ${intervalMinutes} minutes)...`);
    console.log('Press Ctrl+C to stop\n');

    const interval = setInterval(async () => {
      await this.runChecks();
    }, intervalMinutes * 60 * 1000);

    // Run initial check
    await this.runChecks();

    // Cleanup on exit
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n👋 Performance monitoring stopped');
      process.exit(0);
    });
  }

  private async runChecks() {
    console.log(`\n🔍 Performance check at ${new Date().toLocaleTimeString()}`);
    this.alerts = [];

    // Check 1: Slow queries
    await this.checkSlowQueries();

    // Check 2: Connection usage
    await this.checkConnections();

    // Check 3: Table dead rows
    await this.checkTableHealth();

    // Check 4: Cache performance
    await this.checkCachePerformance();

    // Report results
    this.reportResults();
  }

  private async checkSlowQueries() {
    try {
      const { data, error } = await this.supabase
        .from('pg_stat_statements')
        .select('query, calls, mean_time, total_time')
        .gte('mean_time', this.THRESHOLDS.slowQueryMs)
        .order('mean_time', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        data.forEach((query: any) => {
          this.alerts.push({
            type: 'slow_query',
            severity: query.mean_time > 1000 ? 'critical' : 'warning',
            message: `Slow query detected`,
            value: query.mean_time,
            threshold: this.THRESHOLDS.slowQueryMs,
          });
          console.log(`  ⚠️  Slow query: ${query.mean_time.toFixed(2)}ms avg (${query.calls} calls)`);
        });
      }
    } catch (error) {
      console.warn('  Could not check slow queries');
    }
  }

  private async checkConnections() {
    try {
      const { data, error } = await this.supabase
        .from('pg_stat_activity')
        .select('state')
        .eq('state', 'active');

      if (data) {
        const activeConnections = data.length;
        const usagePercentage = (activeConnections / 100) * 100; // Assuming 100 max connections

        if (usagePercentage > this.THRESHOLDS.maxConnections) {
          this.alerts.push({
            type: 'high_connections',
            severity: usagePercentage > 90 ? 'critical' : 'warning',
            message: `High connection usage`,
            value: usagePercentage,
            threshold: this.THRESHOLDS.maxConnections,
          });
          console.log(`  🚨 High connection usage: ${activeConnections} active (${usagePercentage.toFixed(1)}%)`);
        } else {
          console.log(`  ✅ Connection usage: ${activeConnections} active (${usagePercentage.toFixed(1)}%)`);
        }
      }
    } catch (error) {
      console.warn('  Could not check connections');
    }
  }

  private async checkTableHealth() {
    try {
      const { data, error } = await this.supabase
        .from('pg_stat_user_tables')
        .select('tablename, n_live_tup, n_dead_tup')
        .order('n_live_tup', { ascending: false })
        .limit(10);

      if (data) {
        let highDeadRowsFound = false;
        data.forEach((table: any) => {
          const deadPercentage = table.n_dead_tup / (table.n_live_tup + table.n_dead_tup) * 100;
          if (deadPercentage > this.THRESHOLDS.deadRowPercentage && table.n_live_tup > 1000) {
            if (!highDeadRowsFound) {
              console.log('  ⚠️  Tables with high dead row percentage:');
              highDeadRowsFound = true;
            }
            console.log(`    - ${table.tablename}: ${deadPercentage.toFixed(1)}% dead rows`);
            this.alerts.push({
              type: 'dead_rows',
              severity: deadPercentage > 20 ? 'critical' : 'warning',
              message: `High dead row percentage in ${table.tablename}`,
              value: deadPercentage,
              threshold: this.THRESHOLDS.deadRowPercentage,
            });
          }
        });

        if (!highDeadRowsFound) {
          console.log('  ✅ All tables have acceptable dead row percentages');
        }
      }
    } catch (error) {
      console.warn('  Could not check table health');
    }
  }

  private async checkCachePerformance() {
    try {
      // Check overall cache hit rate
      const { data, error } = await this.supabase
        .from('pg_stat_database')
        .select('blks_hit, blks_read')
        .eq('datname', 'postgres')
        .single();

      if (data) {
        const hitRate = (data.blks_hit / (data.blks_hit + data.blks_read)) * 100;

        if (hitRate < this.THRESHOLDS.cacheHitRate) {
          this.alerts.push({
            type: 'cache_miss',
            severity: hitRate < 90 ? 'critical' : 'warning',
            message: `Low cache hit rate`,
            value: hitRate,
            threshold: this.THRESHOLDS.cacheHitRate,
          });
          console.log(`  ⚠️  Cache hit rate: ${hitRate.toFixed(1)}% (threshold: ${this.THRESHOLDS.cacheHitRate}%)`);
        } else {
          console.log(`  ✅ Cache hit rate: ${hitRate.toFixed(1)}%`);
        }
      }
    } catch (error) {
      console.warn('  Could not check cache performance');
    }
  }

  private reportResults() {
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical');
    const warningAlerts = this.alerts.filter(a => a.severity === 'warning');

    console.log('\n📋 Summary:');

    if (criticalAlerts.length === 0 && warningAlerts.length === 0) {
      console.log('  ✅ All performance metrics are within normal ranges');
    } else {
      if (criticalAlerts.length > 0) {
        console.log(`  🚨 ${criticalAlerts.length} critical issue${criticalAlerts.length > 1 ? 's' : ''} found`);
        criticalAlerts.forEach(alert => {
          console.log(`     - ${alert.message}: ${alert.value.toFixed(2)} (threshold: ${alert.threshold})`);
        });
      }

      if (warningAlerts.length > 0) {
        console.log(`  ⚠️  ${warningAlerts.length} warning${warningAlerts.length > 1 ? 's' : ''}`);
        warningAlerts.forEach(alert => {
          console.log(`     - ${alert.message}: ${alert.value.toFixed(2)} (threshold: ${alert.threshold})`);
        });
      }

      // Suggest actions
      console.log('\n💡 Suggested actions:');
      this.suggestActions();
    }
  }

  private suggestActions() {
    this.alerts.forEach(alert => {
      switch (alert.type) {
        case 'slow_query':
          console.log('   - Run EXPLAIN ANALYZE on slow queries to identify missing indexes');
          console.log('   - Consider adding composite indexes for frequently queried columns');
          break;

        case 'high_connections':
          console.log('   - Check for connection leaks in the application');
          console.log('   - Implement connection pooling (PgBouncer)');
          console.log('   - Consider increasing max_connections in postgresql.conf');
          break;

        case 'dead_rows':
          console.log('   - Run VACUUM ANALYZE on affected tables');
          console.log('   - Consider adjusting autovacuum settings for high-traffic tables');
          console.log('   - Schedule regular VACUUM during off-peak hours');
          break;

        case 'cache_miss':
          console.log('   - Increase shared_buffers in postgresql.conf');
          console.log('   - Review and optimize frequently accessed queries');
          console.log('   - Consider implementing application-level caching');
          break;
      }
    });
  }

  // Generate performance report
  async generateReport() {
    console.log('\n📊 Generating detailed performance report...\n');

    // Slow queries
    const { data: slowQueries } = await this.supabase
      .from('pg_stat_statements')
      .select('query, calls, mean_time, total_time')
      .gte('mean_time', 100)
      .order('total_time', { ascending: false })
      .limit(10);

    if (slowQueries) {
      console.log('Top 10 Slowest Queries (by total time):');
      console.log('=========================================');
      slowQueries.forEach((q: any, i: number) => {
        console.log(`\n${i + 1}. Query: ${q.query.substring(0, 100)}...`);
        console.log(`   Calls: ${q.calls.toLocaleString()}`);
        console.log(`   Mean time: ${q.mean_time.toFixed(2)}ms`);
        console.log(`   Total time: ${(q.total_time / 1000).toFixed(2)}s`);
      });
    }

    // Table statistics
    const { data: tableStats } = await this.supabase
      .from('pg_stat_user_tables')
      .select('tablename, n_live_tup, n_dead_tup, n_tup_ins, n_tup_upd, n_tup_del')
      .order('n_live_tup', { ascending: false })
      .limit(15);

    if (tableStats) {
      console.log('\n\nTable Statistics:');
      console.log('==================');
      tableStats.forEach((table: any) => {
        const totalChanges = table.n_tup_ins + table.n_tup_upd + table.n_tup_del;
        const deadPercentage = (table.n_dead_tup / (table.n_live_tup + table.n_dead_tup)) * 100;

        console.log(`\n${table.tablename}:`);
        console.log(`  Live rows: ${table.n_live_tup.toLocaleString()}`);
        console.log(`  Dead rows: ${table.n_dead_tup.toLocaleString()} (${deadPercentage.toFixed(1)}%)`);
        console.log(`  Total changes: ${totalChanges.toLocaleString()}`);
        console.log(`  Inserts: ${table.n_tup_ins.toLocaleString()}`);
        console.log(`  Updates: ${table.n_tup_upd.toLocaleString()}`);
        console.log(`  Deletes: ${table.n_tup_del.toLocaleString()}`);
      });
    }

    console.log('\n\nReport generated at:', new Date().toISOString());
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitor = new PerformanceMonitor();

  if (args.includes('--report')) {
    await monitor.generateReport();
  } else if (args.includes('--once')) {
    await monitor.runChecks();
  } else {
    const interval = args.includes('--interval')
      ? parseInt(args[args.indexOf('--interval') + 1]) || 5
      : 5;

    await monitor.startMonitoring(interval);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { PerformanceMonitor };