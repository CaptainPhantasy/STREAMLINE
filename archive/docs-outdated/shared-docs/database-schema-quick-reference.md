# Database Schema Quick Reference - Job Locations & Geocoding

**For:** Agents 11-20 (Dispatch Map Phase 3)
**Updated:** 2025-11-27
**Migration File:** `supabase/migrations/20251127_add_job_locations_and_geocoding.sql`

---

## New Columns: jobs Table

```typescript
interface Job {
  // ... existing columns ...
  latitude?: number;           // NUMERIC(10, 8) - Job location latitude
  longitude?: number;          // NUMERIC(11, 8) - Job location longitude
  geocoded_at?: string;        // TIMESTAMPTZ - When address was geocoded
}
```

**Usage:**
```typescript
// Check if job has location
if (job.latitude && job.longitude) {
  // Show on map
  markers.push({ lat: job.latitude, lng: job.longitude });
}
```

---

## New Table: geocode_cache

```typescript
interface GeocodeCache {
  id: string;                   // UUID
  address: string;              // Normalized address (UNIQUE)
  latitude: number;             // NUMERIC(10, 8)
  longitude: number;            // NUMERIC(11, 8)
  accuracy?: string;            // 'ROOFTOP', 'RANGE_INTERPOLATED', etc.
  geocoded_at: string;          // TIMESTAMPTZ
  created_at: string;           // TIMESTAMPTZ
}
```

**Usage:**
```typescript
// Check cache before geocoding
const cached = await supabase
  .from('geocode_cache')
  .select('*')
  .eq('address', normalizedAddress)
  .single();

if (cached.data) {
  // Use cached coordinates
  return { lat: cached.data.latitude, lng: cached.data.longitude };
}
```

---

## Performance Indexes

### 1. idx_jobs_location
- **Query:** Jobs with valid locations
- **Use:** Map marker fetching
```sql
SELECT * FROM jobs
WHERE latitude IS NOT NULL
AND longitude IS NOT NULL;
```

### 2. idx_geocode_cache_address
- **Query:** Cache lookups by address
- **Use:** Geocoding utility
```sql
SELECT * FROM geocode_cache
WHERE address = 'normalized address';
```

### 3. idx_jobs_completed_at
- **Query:** Jobs completed in date range
- **Use:** Daily stats, performance metrics
```sql
SELECT * FROM jobs
WHERE completed_at >= '2025-11-27'
AND completed_at < '2025-11-28';
```

### 4. idx_jobs_assigned_tech
- **Query:** Tech-specific job lists
- **Use:** TechDetailPanel, job assignment
```sql
SELECT * FROM jobs
WHERE tech_assigned_id = 'uuid'
AND status IN ('assigned', 'en_route', 'in_progress');
```

### 5. idx_gps_logs_timestamp_user
- **Query:** Recent activity for tech
- **Use:** Activity timeline, breadcrumbs
```sql
SELECT * FROM gps_logs
WHERE user_id = 'uuid'
ORDER BY created_at DESC
LIMIT 5;
```

---

## API Query Examples

### Fetch Jobs for Map
```typescript
const { data: jobs } = await supabase
  .from('jobs')
  .select('id, description, status, latitude, longitude, tech_assigned_id')
  .in('status', ['unassigned', 'assigned', 'en_route', 'in_progress'])
  .not('latitude', 'is', null)
  .not('longitude', 'is', null);
```

### Get Tech Activity
```typescript
const { data: activity } = await supabase
  .from('gps_logs')
  .select('*')
  .eq('user_id', techId)
  .order('created_at', { ascending: false })
  .limit(5);
```

### Get Daily Stats
```typescript
const today = new Date().toISOString().split('T')[0];
const { count: jobsCompleted } = await supabase
  .from('jobs')
  .select('*', { count: 'exact', head: true })
  .eq('tech_assigned_id', techId)
  .gte('completed_at', `${today}T00:00:00Z`)
  .lt('completed_at', `${today}T23:59:59Z`);
```

### Check Geocode Cache
```typescript
const { data: cached } = await supabase
  .from('geocode_cache')
  .select('latitude, longitude, accuracy')
  .eq('address', address.toLowerCase().trim())
  .single();
```

### Insert into Cache
```typescript
// Use service role client for cache writes
const { error } = await supabaseAdmin
  .from('geocode_cache')
  .insert({
    address: address.toLowerCase().trim(),
    latitude: result.lat,
    longitude: result.lng,
    accuracy: result.accuracy
  });
```

---

## TypeScript Type Definitions

### Update jobs type (lib/types/database.ts)
```typescript
export interface Job {
  id: string;
  account_id: string;
  contact_id?: string;
  conversation_id?: string;
  status: 'lead' | 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'invoiced' | 'paid';
  scheduled_start?: string;
  scheduled_end?: string;
  tech_assigned_id?: string;
  description?: string;
  total_amount?: number;
  stripe_payment_link?: string;
  created_at: string;

  // NEW FIELDS (Phase 3)
  latitude?: number;
  longitude?: number;
  geocoded_at?: string;
  completed_at?: string;
}
```

### Add geocode cache type
```typescript
export interface GeocodeCache {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  accuracy?: string;
  geocoded_at: string;
  created_at: string;
}
```

---

## Security: RLS Policies

### geocode_cache Policies
1. **READ:** All authenticated users can read cache
2. **WRITE:** Only service role can insert/update cache

**Important:** Frontend code should use READ-ONLY access. All cache writes must go through API endpoints using service role client.

```typescript
// ✅ CORRECT: Frontend reads from cache
const { data } = await supabase
  .from('geocode_cache')
  .select('*')
  .eq('address', normalizedAddress);

// ❌ WRONG: Frontend tries to write to cache
// This will fail due to RLS policy
const { error } = await supabase
  .from('geocode_cache')
  .insert({ address, latitude, longitude });

// ✅ CORRECT: API endpoint writes to cache
// (uses service role client)
const { error } = await supabaseAdmin
  .from('geocode_cache')
  .insert({ address, latitude, longitude });
```

---

## Migration Deployment

### Run Migration
```bash
# Using Supabase CLI
supabase db push

# Or using psql
psql -U postgres -h db.your-project.supabase.co -d postgres \
  -f supabase/migrations/20251127_add_job_locations_and_geocoding.sql
```

### Verify Migration
```sql
-- Check columns added
SELECT column_name FROM information_schema.columns
WHERE table_name = 'jobs'
AND column_name IN ('latitude', 'longitude', 'geocoded_at');

-- Check table created
SELECT COUNT(*) FROM geocode_cache;

-- Check indexes created
SELECT indexname FROM pg_indexes
WHERE tablename IN ('jobs', 'geocode_cache', 'gps_logs')
AND indexname LIKE 'idx_%';
```

---

## Common Issues & Solutions

### Issue 1: Jobs without locations not showing
**Cause:** Addresses not geocoded yet
**Solution:** Run batch geocoding script or geocode on-demand

### Issue 2: Geocode cache misses
**Cause:** Address format variations
**Solution:** Normalize addresses before lookup (lowercase, trim, remove extra spaces)

### Issue 3: Slow job queries
**Cause:** Missing WHERE clause for latitude/longitude
**Solution:** Always filter `WHERE latitude IS NOT NULL` to use index

### Issue 4: RLS policy blocks cache writes
**Cause:** Using regular Supabase client instead of service role
**Solution:** Use `supabaseAdmin` (service role) for cache writes

---

## Related Files

- **Migration:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/supabase/migrations/20251127_add_job_locations_and_geocoding.sql`
- **Spec:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/shared-docs/dispatch-map-phase-3-spec.md`
- **Completion Report:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/shared-docs/agent-10-database-schema-completion-report.md`

---

**Status:** ✅ Ready for use by all Phase 3 agents

*Last Updated: 2025-11-27 by Agent 10*
