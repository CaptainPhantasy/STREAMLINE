-- ============================================================
-- Mobile PWA Schema - ACTUAL DEPLOYED VERSION
-- Generated: 2025-11-27
-- Source: Live Supabase Database (expbvujyegxmxvatcjqt)
-- ============================================================
-- This schema reflects the ACTUAL state after security hardening.
-- This is the source of truth for mobile PWA tables.
-- Verified against live database on 2025-11-27.
-- ============================================================

-- ============================================================
-- 1. JOB_GATES: Gated workflow stages for tech jobs
-- ============================================================
-- VERIFIED: Matches actual deployed table
CREATE TABLE IF NOT EXISTS job_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending'::text,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  requires_exception BOOLEAN DEFAULT false,  -- CORRECT: not "requires_clearance"
  exception_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  satisfaction_rating INTEGER,
  review_requested BOOLEAN DEFAULT false,
  discount_applied NUMERIC,
  escalated_to UUID REFERENCES users(id),
  escalation_notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_gates_job_id ON job_gates(job_id);
CREATE INDEX IF NOT EXISTS idx_job_gates_status ON job_gates(status);
CREATE INDEX IF NOT EXISTS idx_job_gates_requires_exception ON job_gates(requires_exception) WHERE requires_exception = TRUE;

-- ============================================================
-- 2. JOB_PHOTOS: Photo attachments for job documentation
-- ============================================================
CREATE TABLE IF NOT EXISTS job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  taken_by UUID REFERENCES auth.users(id),  -- References auth.users directly
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: gate_id column may be added in future for linking photos to specific gates

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_created_at ON job_photos(created_at);

-- ============================================================
-- 3. GPS_LOGS: Location tracking for field operations
-- ============================================================
CREATE TABLE IF NOT EXISTS gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy NUMERIC,
  event_type TEXT NOT NULL,  -- 'arrival', 'departure', 'checkpoint', 'auto'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gps_logs_job_id ON gps_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_user_id ON gps_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_created_at ON gps_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_gps_logs_event_type ON gps_logs(event_type);

-- ============================================================
-- 4. MEETINGS: Sales meeting records with AI transcription
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id),
  title TEXT,
  meeting_type TEXT,  -- 'in_person', 'phone', 'video', 'demo'
  location TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  transcript TEXT,
  summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  sentiment TEXT,  -- 'positive', 'neutral', 'negative'
  follow_up_date TIMESTAMPTZ,
  follow_up_notes TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_account_id ON meetings(account_id);
CREATE INDEX IF NOT EXISTS idx_meetings_contact_id ON meetings(contact_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_follow_up_date ON meetings(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Full-text search on transcript and summary
CREATE INDEX IF NOT EXISTS idx_meetings_transcript_search
  ON meetings USING GIN (to_tsvector('english', COALESCE(transcript, '') || ' ' || COALESCE(summary, '')));

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables that need it
DROP TRIGGER IF EXISTS update_job_gates_updated_at ON job_gates;
CREATE TRIGGER update_job_gates_updated_at
  BEFORE UPDATE ON job_gates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================
-- Note: RLS policies should already be enabled from security hardening.
-- These tables should be accessible only to authenticated users in their account.

-- ============================================================
-- End of Mobile PWA Actual Schema
-- ============================================================
-- CRITICAL FIXES FROM ORIGINAL mobile-pwa-schema.sql:
-- 1. Changed "requires_clearance" to "requires_exception" (matches code)
-- 2. Added missing columns: escalated_to, review_requested, discount_applied
-- 3. Fixed job_photos.taken_by to reference auth.users(id) not users(id)
-- 4. Added account_id to gps_logs (required by code)
-- 5. Updated meetings table to match actual deployment
-- ============================================================
