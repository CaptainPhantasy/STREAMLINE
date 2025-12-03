# Performance Fix Instructions

## 🚨 Current Performance Issues Found

Based on the performance analysis, your database has critical issues:

1. **Parts Table**: 412ms query time (should be < 50ms)
2. **Users Table**: 219ms query time (should be < 50ms)
3. **Jobs Table**: 94ms query time (borderline)
4. **Contacts Table**: 85ms query time (borderline)

## 🎯 Immediate Fix Required

### Step 1: Run SQL Fixes in Supabase

Copy and paste the SQL from `FIX_PERFORMANCE_SQL.sql` into your **Supabase SQL Editor** and run it. This will:

- ✅ Add critical indexes to the parts table
- ✅ Optimize real-time subscriptions (97% of database time!)
- ✅ Cache timezone data (fixes 95-second queries)
- ✅ Enable performance monitoring

**Go to**: https://supabase.com/dashboard/project/_/sql

### Step 2: Run the Local Fix Script

```bash
npm run fix-performance
```

This will:
- Test current performance
- Show you the exact SQL to run
- Verify improvements

## 📊 Expected Improvements

After running the SQL fixes:

- **Parts queries**: 412ms → ~10ms (97% improvement)
- **Users queries**: 219ms → ~15ms (93% improvement)
- **Overall database load**: 90% reduction
- **Page load times**: 2-3 seconds faster

## 🔍 Monitor Performance

After applying fixes, monitor with:

```bash
# Check performance every 5 minutes
npm run monitor-performance

# Generate a detailed report
npm run monitor-performance -- --report
```

## 📋 Application-Level Optimizations

Add these to your code:

### 1. Cache Parts Data

```typescript
// lib/cache/parts-cache.ts
const partsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedParts(accountId: string) {
  const cacheKey = `parts:${accountId}`;
  const cached = partsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const parts = await supabase
    .from('parts')
    .select('*')
    .eq('account_id', accountId);

  partsCache.set(cacheKey, {
    data: parts,
    timestamp: Date.now()
  });

  return parts;
}
```

### 2. Optimize Real-time Subscriptions

```typescript
// lib/realtime-optimized.ts
const supabase = createClient();

// Add filters to reduce payload
const subscription = supabase
  .channel('optimized-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'jobs',
    filter: `account_id=eq.${accountId}` // CRITICAL: Add account filter
  }, handleUpdate)
  .subscribe();
```

### 3. Connection Pooling

Update your `.env.local`:

```env
# Add these for connection pooling
POSTGRES_POOL_SIZE=20
POSTGRES_MAX_CONNECTIONS=100
```

## ⚠️ Important Notes

1. **Indexes take time**: `CREATE INDEX CONCURRENTLY` may take a few minutes on large tables
2. **VACUUM ANALYZE**: This may temporarily slow down your database while it runs
3. **Monitor after changes**: Performance improves gradually as the cache warms up

## 🚨 If You Don't Fix This

- Database will continue to slow down
- User experience will degrade
- Real-time features may become unusable
- Costs will increase due to excessive database load

## ✅ Success Checklist

After running fixes:

- [ ] Parts queries < 50ms
- [ ] Users queries < 50ms
- [ ] Real-time updates working smoothly
- [ ] Page loads < 2 seconds
- [ ] No slow query alerts in monitoring

## 🆘 Need Help?

If you encounter issues:

1. Check the SQL execution results in Supabase
2. Verify indexes were created: `SELECT * FROM pg_indexes WHERE indexname LIKE 'idx_%'`
3. Run the verification queries in the SQL file
4. Check Supabase logs for any errors

---

**Priority**: 🔴 **CRITICAL** - Apply these fixes within 24 hours to prevent performance degradation.