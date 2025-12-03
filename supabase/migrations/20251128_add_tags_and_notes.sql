-- Migration: Add Tags and Notes System
-- Date: 2025-11-28
-- Purpose: Implement tagging and notes functionality for contacts and jobs
-- Status: FOR REVIEW - DO NOT RUN WITHOUT APPROVAL

-- ==========================================
-- TAGS SYSTEM
-- ==========================================

-- Create tags table for storing tag definitions
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  UNIQUE(account_id, name)
);

-- Create indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_account_id ON public.tags(account_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON public.tags(created_at);

-- Create contact_tag_assignments junction table
CREATE TABLE IF NOT EXISTS public.contact_tag_assignments (
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  PRIMARY KEY (contact_id, tag_id)
);

-- Create indexes for contact_tag_assignments
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact_id ON public.contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag_id ON public.contact_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_assigned_at ON public.contact_tag_assignments(assigned_at);

-- ==========================================
-- NOTES SYSTEM
-- ==========================================

-- Create notes table for storing note content
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'email', 'meeting', 'internal', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  is_pinned BOOLEAN DEFAULT FALSE
);

-- Create indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_account_id ON public.notes(account_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON public.notes(note_type);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON public.notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_content_gin ON public.notes USING gin(to_tsvector('english', content));

-- Create contact_notes junction table
CREATE TABLE IF NOT EXISTS public.contact_notes (
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, note_id)
);

-- Create indexes for contact_notes
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON public.contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_note_id ON public.contact_notes(note_id);

-- Create job_notes junction table
CREATE TABLE IF NOT EXISTS public.job_notes (
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, note_id)
);

-- Create indexes for job_notes
CREATE INDEX IF NOT EXISTS idx_job_notes_job_id ON public.job_notes(job_id);
CREATE INDEX IF NOT EXISTS idx_job_notes_note_id ON public.job_notes(note_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all new tables
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;

-- Tags RLS Policies
CREATE POLICY "Users can view tags from their account" ON public.tags
  FOR SELECT USING (auth.uid() IS NOT NULL AND account_id = current_setting('app.current_account_id')::UUID);

CREATE POLICY "Users can create tags for their account" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND account_id = current_setting('app.current_account_id')::UUID);

CREATE POLICY "Users can update tags from their account" ON public.tags
  FOR UPDATE USING (auth.uid() IS NOT NULL AND account_id = current_setting('app.current_account_id')::UUID);

CREATE POLICY "Users can delete tags from their account" ON public.tags
  FOR DELETE USING (auth.uid() IS NOT NULL AND account_id = current_setting('app.current_account_id')::UUID);

-- Contact Tag Assignments RLS Policies
CREATE POLICY "Users can view contact tags from their account" ON public.contact_tag_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = contact_tag_assignments.contact_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

CREATE POLICY "Users can create contact tags for contacts in their account" ON public.contact_tag_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = contact_tag_assignments.contact_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

CREATE POLICY "Users can delete contact tags from their account" ON public.contact_tag_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = contact_tag_assignments.contact_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

-- Notes RLS Policies
CREATE POLICY "Users can view notes from their account" ON public.notes
  FOR SELECT USING (auth.uid() IS NOT NULL AND account_id = current_setting('app.current_account_id')::UUID);

CREATE POLICY "Users can create notes for their account" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND account_id = current_setting('app.current_account_id')::UUID);

CREATE POLICY "Users can update notes from their account" ON public.notes
  FOR UPDATE USING (auth.uid() IS NOT NULL AND account_id = current_setting('app.current_account_id')::UUID);

CREATE POLICY "Users can delete notes from their account" ON public.notes
  FOR DELETE USING (auth.uid() IS NOT NULL AND account_id = current_setting('app.current_account_id')::UUID);

-- Contact Notes RLS Policies
CREATE POLICY "Users can view contact notes from their account" ON public.contact_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = contact_notes.contact_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

CREATE POLICY "Users can create contact notes for contacts in their account" ON public.contact_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = contact_notes.contact_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

CREATE POLICY "Users can delete contact notes from their account" ON public.contact_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = contact_notes.contact_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

-- Job Notes RLS Policies
CREATE POLICY "Users can view job notes from their account" ON public.job_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_notes.job_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

CREATE POLICY "Users can create job notes for jobs in their account" ON public.job_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_notes.job_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

CREATE POLICY "Users can delete job notes from their account" ON public.job_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_notes.job_id
      AND account_id = current_setting('app.current_account_id')::UUID
    )
  );

-- ==========================================
-- TRIGGERS AND FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp on notes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notes updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to get all tags for a contact
CREATE OR REPLACE FUNCTION public.get_contact_tags(p_contact_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT,
  description TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.color,
    t.description,
    cta.assigned_at
  FROM public.contact_tag_assignments cta
  JOIN public.tags t ON cta.tag_id = t.id
  WHERE cta.contact_id = p_contact_id
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all notes for a contact
CREATE OR REPLACE FUNCTION public.get_contact_notes(p_contact_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  note_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_by_name TEXT,
  is_pinned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.content,
    n.note_type,
    n.created_at,
    n.updated_at,
    n.created_by,
    u.first_name || ' ' || u.last_name as created_by_name,
    n.is_pinned
  FROM public.contact_notes cn
  JOIN public.notes n ON cn.note_id = n.id
  LEFT JOIN public.users u ON n.created_by = u.id
  WHERE cn.contact_id = p_contact_id
  ORDER BY n.is_pinned DESC, n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all notes for a job
CREATE OR REPLACE FUNCTION public.get_job_notes(p_job_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  note_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_by_name TEXT,
  is_pinned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.content,
    n.note_type,
    n.created_at,
    n.updated_at,
    n.created_by,
    u.first_name || ' ' || u.last_name as created_by_name,
    n.is_pinned
  FROM public.job_notes jn
  JOIN public.notes n ON jn.note_id = n.id
  LEFT JOIN public.users u ON n.created_by = u.id
  WHERE jn.job_id = p_job_id
  ORDER BY n.is_pinned DESC, n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- SAMPLE DATA (FOR TESTING - REMOVE IN PRODUCTION)
-- ==========================================

-- This section is commented out - uncomment for testing only
/*
-- Insert sample tags for the default account (if it exists)
DO $$
DECLARE
  v_default_account_id UUID;
BEGIN
  SELECT id INTO v_default_account_id
  FROM public.accounts
  WHERE name = '317 Plumber'
  LIMIT 1;

  IF v_default_account_id IS NOT NULL THEN
    INSERT INTO public.tags (account_id, name, color, description) VALUES
    (v_default_account_id, 'VIP Customer', '#FF6B6B', 'High-value customer requiring special attention'),
    (v_default_account_id, 'Repeat Customer', '#4ECDC4', 'Customer who has used our services before'),
    (v_default_account_id, 'Warranty', '#45B7D1', 'Job under warranty'),
    (v_default_account_id, 'Follow-up Required', '#96CEB4', 'Requires follow-up call or visit'),
    (v_default_account_id, 'Payment Issue', '#FFEAA7', 'Payment overdue or disputed')
    ON CONFLICT (account_id, name) DO NOTHING;
  END IF;
END $$;
*/

-- ==========================================
-- MIGRATION VERIFICATION
-- ==========================================

-- Verification queries to run after migration
/*
-- Verify tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('tags', 'contact_tag_assignments', 'notes', 'contact_notes', 'job_notes');

-- Verify indexes were created
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('tags', 'contact_tag_assignments', 'notes', 'contact_notes', 'job_notes');

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('tags', 'contact_tag_assignments', 'notes', 'contact_notes', 'job_notes');

-- Verify policies were created
SELECT policyname, tablename FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('tags', 'contact_tag_assignments', 'notes', 'contact_notes', 'job_notes');
*/