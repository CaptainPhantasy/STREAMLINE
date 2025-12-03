-- ============================================================
-- Migration: Add Job Locations and Geocoding Support
-- ============================================================
-- Purpose: Enable dispatch map functionality with job markers
--          and geocoding cache for address-to-coordinates conversion
-- Date: 2025-11-27
-- Phase: Dispatch Map Dashboard - Phase 3
-- ============================================================

-- ============================================================
-- 1. ADD LOCATION COLUMNS TO JOBS TABLE
-- ============================================================

-- Add latitude, longitude, and geocoded_at columns to jobs table
-- These columns support displaying jobs on the dispatch map
-- and tracking when addresses were geocoded
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN jobs.latitude IS 'Job location latitude (geocoded from address)';
COMMENT ON COLUMN jobs.longitude IS 'Job location longitude (geocoded from address)';
COMMENT ON COLUMN jobs.geocoded_at IS 'Timestamp when address was last geocoded';

-- ============================================================
-- 2. CREATE GEOCODE CACHE TABLE
-- ============================================================

-- Create a cache table to avoid redundant geocoding API calls
-- Stores address-to-coordinates mappings with accuracy metadata
CREATE TABLE IF NOT EXISTS geocode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy TEXT,  -- Geocoding accuracy level (e.g., 'ROOFTOP', 'RANGE_INTERPOLATED')
  geocoded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE geocode_cache IS 'Cache for geocoded addresses to reduce API calls';
COMMENT ON COLUMN geocode_cache.address IS 'Full normalized address string (used as lookup key)';
COMMENT ON COLUMN geocode_cache.accuracy IS 'Geocoding accuracy from provider (Google Maps or Nominatim)';

-- ============================================================
-- 3. CREATE PERFORMANCE INDEXES
-- ============================================================

-- Index for jobs table location queries (WHERE latitude IS NOT NULL)
-- Partial index to only include jobs with geocoded locations
CREATE INDEX IF NOT EXISTS idx_jobs_location
ON jobs(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for geocode cache address lookups (primary lookup key)
CREATE INDEX IF NOT EXISTS idx_geocode_cache_address
ON geocode_cache(address);

-- Index for jobs completed_at column (used in stats queries)
-- Helps with performance metrics and daily stats calculations
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at
ON jobs(completed_at)
WHERE completed_at IS NOT NULL;

-- Composite index for assigned tech + status filtering
-- Optimizes queries like "get all jobs assigned to tech X with status Y"
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_tech
ON jobs(tech_assigned_id, status)
WHERE tech_assigned_id IS NOT NULL;

-- Composite index for GPS logs timestamp + user queries
-- Optimizes queries like "get recent GPS logs for user X"
-- Used by tech activity timeline in TechDetailPanel
CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp_user
ON gps_logs(created_at DESC, user_id);

-- ============================================================
-- 4. ADD ROW LEVEL SECURITY TO GEOCODE_CACHE
-- ============================================================

-- Enable RLS on geocode_cache table
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read from geocode cache
-- (No sensitive data in cache - just addresses and coordinates)
CREATE POLICY IF NOT EXISTS "Allow authenticated read access to geocode_cache"
  ON geocode_cache FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can insert/update geocode cache
-- (API endpoints will use service role to write to cache)
CREATE POLICY IF NOT EXISTS "Allow service role to write to geocode_cache"
  ON geocode_cache FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow service role to update geocode_cache"
  ON geocode_cache FOR UPDATE
  TO service_role
  USING (true);

-- ============================================================
-- 5. MIGRATION VERIFICATION QUERIES
-- ============================================================

-- Run these queries to verify the migration was successful:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'jobs' AND column_name IN ('latitude', 'longitude', 'geocoded_at');
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('jobs', 'geocode_cache', 'gps_logs');
-- SELECT * FROM geocode_cache LIMIT 1;

-- ============================================================
-- 6. ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ============================================================

/*
-- CAUTION: Only run these commands if you need to rollback this migration

-- Drop indexes
DROP INDEX IF EXISTS idx_jobs_location;
DROP INDEX IF EXISTS idx_geocode_cache_address;
DROP INDEX IF EXISTS idx_jobs_completed_at;
DROP INDEX IF EXISTS idx_jobs_assigned_tech;
DROP INDEX IF EXISTS idx_gps_logs_timestamp_user;

-- Drop geocode_cache table
DROP TABLE IF EXISTS geocode_cache;

-- Remove columns from jobs table
ALTER TABLE jobs DROP COLUMN IF EXISTS latitude;
ALTER TABLE jobs DROP COLUMN IF EXISTS longitude;
ALTER TABLE jobs DROP COLUMN IF EXISTS geocoded_at;
*/

-- ============================================================
-- END OF MIGRATION
-- ============================================================
