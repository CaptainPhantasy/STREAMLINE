-- ================================================================
-- Add Resource Scheduling Tables
-- ================================================================
-- Description: Creates resources and resource_assignments tables
-- for scheduling techs, vehicles, and equipment
-- Date: 2025-12-01
-- ================================================================

-- Create resources table (techs, vehicles, equipment)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('tech', 'vehicle', 'equipment')),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id), -- For tech resources
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional resource-specific data
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, resource_type, name)
);

COMMENT ON TABLE resources IS 'Schedulable resources (techs, vehicles, equipment)';
COMMENT ON COLUMN resources.resource_type IS 'Type of resource: tech, vehicle, or equipment';
COMMENT ON COLUMN resources.user_id IS 'Links to users table for tech resources';
COMMENT ON COLUMN resources.metadata IS 'Resource-specific data (e.g., vehicle capacity, equipment specs)';

-- Create resource_assignments table
CREATE TABLE IF NOT EXISTS resource_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE resource_assignments IS 'Assignments of resources to jobs';

-- Create working_hours table
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_id, day_of_week)
);

COMMENT ON TABLE working_hours IS 'Working hours configuration per resource';
COMMENT ON COLUMN working_hours.day_of_week IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday';

-- ================================================================
-- Create indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_resources_account_type 
  ON resources(account_id, resource_type);

CREATE INDEX IF NOT EXISTS idx_resources_user_id 
  ON resources(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource_id 
  ON resource_assignments(resource_id);

CREATE INDEX IF NOT EXISTS idx_resource_assignments_job_id 
  ON resource_assignments(job_id);

CREATE INDEX IF NOT EXISTS idx_resource_assignments_account_id 
  ON resource_assignments(account_id);

CREATE INDEX IF NOT EXISTS idx_working_hours_resource_id 
  ON working_hours(resource_id);

CREATE INDEX IF NOT EXISTS idx_working_hours_account_id 
  ON working_hours(account_id);

-- Composite index for conflict detection
CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource_job 
  ON resource_assignments(resource_id, job_id);

-- ================================================================
-- Add triggers
-- ================================================================

CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_resources_updated_at();

CREATE TRIGGER update_working_hours_updated_at
  BEFORE UPDATE ON working_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_resources_updated_at();

-- ================================================================
-- Function to detect scheduling conflicts
-- ================================================================

CREATE OR REPLACE FUNCTION check_scheduling_conflicts(
  p_resource_id UUID,
  p_job_id UUID,
  p_job_start TIMESTAMPTZ,
  p_job_end TIMESTAMPTZ
)
RETURNS TABLE (
  conflict_type TEXT,
  conflicting_job_id UUID,
  conflict_details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- Check for double-booking (same resource, overlapping times)
  FOR v_conflict IN
    SELECT 
      j.id as job_id,
      j.scheduled_start,
      j.scheduled_end,
      CASE
        WHEN p_job_start < j.scheduled_end AND p_job_end > j.scheduled_start
        THEN 'time_overlap'
        ELSE NULL
      END as conflict_type
    FROM resource_assignments ra
    JOIN jobs j ON j.id = ra.job_id
    WHERE ra.resource_id = p_resource_id
      AND ra.job_id != p_job_id
      AND j.scheduled_start IS NOT NULL
      AND j.scheduled_end IS NOT NULL
      AND j.status NOT IN ('completed', 'cancelled')
      AND p_job_start < j.scheduled_end
      AND p_job_end > j.scheduled_start
  LOOP
    RETURN QUERY SELECT
      'double_booking'::TEXT,
      v_conflict.job_id,
      format('Resource already assigned to job %s from %s to %s',
        v_conflict.job_id,
        v_conflict.scheduled_start,
        v_conflict.scheduled_end
      )::TEXT;
  END LOOP;

  -- Check working hours
  DECLARE
    v_day_of_week INTEGER;
    v_start_time TIME;
    v_end_time TIME;
    v_is_available BOOLEAN;
  BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_job_start);
    v_start_time := p_job_start::TIME;
    v_end_time := p_job_end::TIME;

    SELECT is_available INTO v_is_available
    FROM working_hours
    WHERE resource_id = p_resource_id
      AND day_of_week = v_day_of_week
      AND start_time <= v_start_time
      AND end_time >= v_end_time;

    IF v_is_available IS NULL OR v_is_available = false THEN
      RETURN QUERY SELECT
        'outside_working_hours'::TEXT,
        NULL::UUID,
        format('Job scheduled outside resource working hours for day %s', v_day_of_week)::TEXT;
    END IF;
  END;
END;
$$;

-- ================================================================
-- Enable Row Level Security
-- ================================================================

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

-- Resources policies
CREATE POLICY "Users can view resources for their account"
  ON resources FOR SELECT
  USING (account_id = current_account_id());

CREATE POLICY "Users can manage resources for their account"
  ON resources FOR ALL
  USING (account_id = current_account_id());

-- Resource assignments policies
CREATE POLICY "Users can view resource assignments for their account"
  ON resource_assignments FOR SELECT
  USING (account_id = current_account_id());

CREATE POLICY "Users can manage resource assignments for their account"
  ON resource_assignments FOR ALL
  USING (account_id = current_account_id());

-- Working hours policies
CREATE POLICY "Users can view working hours for their account"
  ON working_hours FOR SELECT
  USING (account_id = current_account_id());

CREATE POLICY "Users can manage working hours for their account"
  ON working_hours FOR ALL
  USING (account_id = current_account_id());

-- ================================================================
-- END OF MIGRATION
-- ================================================================

