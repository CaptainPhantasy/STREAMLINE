-- ============================================================
-- Geocoding Support for Dispatch Map Dashboard
-- Generated: 2025-11-27
-- Purpose: Add geocoding cache and location fields to jobs table
-- ============================================================

-- ============================================================
-- 1. Add location fields to jobs table
-- ============================================================

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_location
ON jobs(latitude, longitude)
WHERE latitude IS NOT NULL;

-- Add index for jobs needing geocoding
CREATE INDEX IF NOT EXISTS idx_jobs_need_geocoding
ON jobs(id)
WHERE latitude IS NULL AND status IN ('lead', 'scheduled', 'en_route', 'in_progress');

-- ============================================================
-- 2. Create geocode_cache table
-- ============================================================

CREATE TABLE IF NOT EXISTS geocode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy TEXT,
  provider TEXT DEFAULT 'google_maps', -- 'google_maps', 'nominatim', etc.
  formatted_address TEXT,
  geocoded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for geocode_cache
CREATE INDEX IF NOT EXISTS idx_geocode_cache_address ON geocode_cache(address);
CREATE INDEX IF NOT EXISTS idx_geocode_cache_location ON geocode_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_geocode_cache_created_at ON geocode_cache(created_at);

-- ============================================================
-- 3. Add trigger to update updated_at column
-- ============================================================

DROP TRIGGER IF EXISTS update_geocode_cache_updated_at ON geocode_cache;
CREATE TRIGGER update_geocode_cache_updated_at
  BEFORE UPDATE ON geocode_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. Create helper function to normalize addresses
-- ============================================================

CREATE OR REPLACE FUNCTION normalize_address(address_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Normalize address for cache lookup
  -- Remove extra spaces, convert to lowercase, trim
  RETURN LOWER(TRIM(REGEXP_REPLACE(address_text, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on geocode_cache
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read from cache
CREATE POLICY "Authenticated users can read geocode_cache"
ON geocode_cache
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert into cache
CREATE POLICY "Authenticated users can insert into geocode_cache"
ON geocode_cache
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role has full access to geocode_cache"
ON geocode_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 6. Create view for jobs needing geocoding
-- ============================================================

CREATE OR REPLACE VIEW jobs_needing_geocoding AS
SELECT
  j.id,
  j.account_id,
  j.contact_id,
  c.address,
  j.status,
  j.scheduled_start,
  j.created_at
FROM jobs j
LEFT JOIN contacts c ON j.contact_id = c.id
WHERE
  j.latitude IS NULL
  AND c.address IS NOT NULL
  AND c.address != ''
  AND j.status IN ('lead', 'scheduled', 'en_route', 'in_progress')
ORDER BY j.scheduled_start ASC NULLS LAST, j.created_at DESC;

-- ============================================================
-- 7. Create function to get cached geocode result
-- ============================================================

CREATE OR REPLACE FUNCTION get_cached_geocode(address_text TEXT)
RETURNS TABLE(
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  accuracy TEXT,
  formatted_address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.latitude,
    gc.longitude,
    gc.accuracy,
    gc.formatted_address
  FROM geocode_cache gc
  WHERE gc.address = normalize_address(address_text)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 8. Create stats view for geocoding status
-- ============================================================

CREATE OR REPLACE VIEW geocoding_stats AS
SELECT
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) AS geocoded_jobs,
  COUNT(*) FILTER (WHERE latitude IS NULL) AS pending_geocoding,
  COUNT(*) AS total_jobs,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE latitude IS NOT NULL) / NULLIF(COUNT(*), 0),
    2
  ) AS geocoded_percentage
FROM jobs
WHERE status IN ('lead', 'scheduled', 'en_route', 'in_progress');

-- ============================================================
-- End of Geocoding Support Migration
-- ============================================================

-- SUMMARY:
-- ✅ Added latitude, longitude, geocoded_at columns to jobs table
-- ✅ Created geocode_cache table with proper indexes
-- ✅ Added RLS policies for security
-- ✅ Created helper functions for address normalization and cache lookup
-- ✅ Created views for monitoring geocoding status
-- ✅ Added indexes for performance

-- NEXT STEPS:
-- 1. Run this migration: psql -U postgres -d your_db -f add-geocoding-support.sql
-- 2. Implement geocoding.ts utility (lib/dispatch/geocoding.ts)
-- 3. Run batch geocoding script to geocode existing jobs
-- 4. Update dispatch map to use job locations
