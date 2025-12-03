-- Mobile PWA Features - Database Schema
-- Phase 1: Foundation Tables for Tech, Sales, Office, Owner features
--
-- Tables added:
-- - job_gates: Workflow stages with gating logic
-- - job_photos: Photo attachments with storage paths
-- - gps_logs: Location tracking for field operations
-- - meetings: Sales meeting records with AI transcripts
-- - gate_clearances: Office manager escalation handling

-- ============================================================
-- 1. JOB_GATES: Gated workflow stages for tech jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS job_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage_name VARCHAR(50) NOT NULL,  -- 'arrival', 'diagnosis', 'work', 'completion', 'review'
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'completed', 'escalated', 'cleared'
  
  -- Gate requirements configuration
  required_fields JSONB DEFAULT '{}',  -- { photos_min: 2, gps_required: true, signature_required: true }
  
  -- Completion data
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  customer_signature_url TEXT,
  metadata JSONB DEFAULT '{}',  -- Flexible storage for custom data
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  
  -- Escalation handling
  requires_clearance BOOLEAN DEFAULT FALSE,
  escalation_notes TEXT,
  escalation_reason VARCHAR(100),  -- 'low_rating', 'tech_request', 'quality_issue'
  cleared_at TIMESTAMPTZ,
  cleared_by UUID REFERENCES users(id),
  clearance_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_gates_job_id ON job_gates(job_id);
CREATE INDEX IF NOT EXISTS idx_job_gates_status ON job_gates(status);
CREATE INDEX IF NOT EXISTS idx_job_gates_requires_clearance ON job_gates(requires_clearance) WHERE requires_clearance = TRUE;

-- ============================================================
-- 2. JOB_PHOTOS: Photo attachments for job documentation
-- ============================================================
CREATE TABLE IF NOT EXISTS job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  gate_id UUID REFERENCES job_gates(id) ON DELETE SET NULL,
  
  -- Storage information
  storage_path VARCHAR(500) NOT NULL,  -- Supabase Storage path
  storage_bucket VARCHAR(100) DEFAULT 'job-photos',
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  
  -- Photo metadata
  uploaded_by UUID REFERENCES users(id),
  caption TEXT,
  photo_type VARCHAR(50),  -- 'before', 'during', 'after', 'issue', 'completion'
  metadata JSONB DEFAULT '{}',  -- { width, height, device_info, location }
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_gate_id ON job_photos(gate_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_created_at ON job_photos(created_at);

-- ============================================================
-- 3. GPS_LOGS: Location tracking for field operations
-- ============================================================
CREATE TABLE IF NOT EXISTS gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Location data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),  -- Accuracy in meters
  altitude DECIMAL(8, 2),  -- Optional altitude in meters
  
  -- Event information
  event_type VARCHAR(20) NOT NULL,  -- 'arrival', 'departure', 'checkpoint', 'auto', 'manual'
  event_description TEXT,
  metadata JSONB DEFAULT '{}',  -- { speed, heading, battery_level, network_type }
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gps_logs_job_id ON gps_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_user_id ON gps_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_created_at ON gps_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_gps_logs_event_type ON gps_logs(event_type);

-- Spatial index for location queries (PostGIS if available)
-- CREATE INDEX IF NOT EXISTS idx_gps_logs_location ON gps_logs USING GIST (ll_to_earth(latitude, longitude));

-- ============================================================
-- 4. MEETINGS: Sales meeting records with AI transcription
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),  -- Sales person
  
  -- Meeting details
  meeting_type VARCHAR(20) NOT NULL,  -- 'in_person', 'phone', 'video', 'demo'
  title VARCHAR(200),
  meeting_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  
  -- Transcription and AI analysis
  transcript TEXT,
  ai_summary TEXT,
  action_items JSONB DEFAULT '[]',  -- [{ task, assignee, due_date, priority }]
  key_points JSONB DEFAULT '[]',  -- [{ topic, importance, details }]
  sentiment_score DECIMAL(3, 2),  -- -1.0 to 1.0
  
  -- Follow-up
  next_steps TEXT,
  follow_up_date DATE,
  outcome VARCHAR(50),  -- 'closed_won', 'closed_lost', 'follow_up', 'demo_scheduled'
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_account_id ON meetings(account_id);
CREATE INDEX IF NOT EXISTS idx_meetings_contact_id ON meetings(contact_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_follow_up_date ON meetings(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Full-text search on transcript and summary
CREATE INDEX IF NOT EXISTS idx_meetings_transcript_search ON meetings USING GIN (to_tsvector('english', COALESCE(transcript, '') || ' ' || COALESCE(ai_summary, '')));

-- ============================================================
-- 5. Updated_at trigger function (if not exists)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
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
-- 6. Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE job_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- job_gates policies
CREATE POLICY "Users can view gates for their account jobs"
  ON job_gates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN users u ON u.account_id = j.account_id
      WHERE j.id = job_gates.job_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Techs can update their assigned job gates"
  ON job_gates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN users u ON u.id = auth.uid()
      WHERE j.id = job_gates.job_id
        AND (j.tech_assigned_id = auth.uid() OR u.role IN ('admin', 'owner', 'dispatcher'))
    )
  );

CREATE POLICY "Admins can clear escalated gates"
  ON job_gates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN jobs j ON j.id = job_gates.job_id
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'owner', 'dispatcher')
        AND u.account_id = j.account_id
    )
  );

-- job_photos policies
CREATE POLICY "Users can view photos for their account jobs"
  ON job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN users u ON u.account_id = j.account_id
      WHERE j.id = job_photos.job_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can upload photos to their assigned jobs"
  ON job_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN users u ON u.id = auth.uid()
      WHERE j.id = job_photos.job_id
        AND (j.tech_assigned_id = auth.uid() OR u.role IN ('admin', 'owner'))
        AND u.account_id = j.account_id
    )
  );

-- gps_logs policies
CREATE POLICY "Users can view their own GPS logs"
  ON gps_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all account GPS logs"
  ON gps_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'owner', 'dispatcher')
        AND u.account_id = (SELECT account_id FROM users WHERE id = gps_logs.user_id)
    )
  );

CREATE POLICY "Users can insert their own GPS logs"
  ON gps_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- meetings policies
CREATE POLICY "Users can view meetings for their account"
  ON meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.account_id = meetings.account_id
    )
  );

CREATE POLICY "Sales users can insert meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.account_id = meetings.account_id
    )
  );

CREATE POLICY "Users can update their own meetings" ON meetings FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- COMPLETE
-- ============================================================
-- Run this migration to add mobile PWA feature tables
-- Then populate with seed data if needed
