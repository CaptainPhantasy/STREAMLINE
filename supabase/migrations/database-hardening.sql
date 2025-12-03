-- Database Hardening & Security Fixes
-- Generated: 2025-11-26

-- ==========================================
-- 1. Fix Function Search Paths (Security)
-- ==========================================

-- Fix update_meetings_updated_at
CREATE OR REPLACE FUNCTION public.update_meetings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==========================================
-- 2. Secure Materialized Views
-- ==========================================

-- Revoke direct access to materialized views
REVOKE SELECT ON public.contact_analytics FROM anon, authenticated;
REVOKE SELECT ON public.job_analytics FROM anon, authenticated;

-- Create secure wrapper function for job analytics
CREATE OR REPLACE FUNCTION public.get_job_analytics(account_id uuid)
RETURNS SETOF public.job_analytics
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.job_analytics
  WHERE account_id = $1;
$$;

-- Create secure wrapper function for contact analytics
CREATE OR REPLACE FUNCTION public.get_contact_analytics(account_id uuid)
RETURNS SETOF public.contact_analytics
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.contact_analytics
  WHERE account_id = $1;
$$;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.get_job_analytics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_analytics(uuid) TO authenticated;

-- ==========================================
-- 3. Add RLS to job_photos
-- ==========================================

ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view photos for jobs in their account
CREATE POLICY "Users can view photos from their account"
ON public.job_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.users u ON u.account_id = j.account_id
    WHERE j.id = job_photos.job_id
    AND u.id = auth.uid()
  )
);

-- Policy: Users can insert photos for jobs in their account
CREATE POLICY "Users can insert photos for their account"
ON public.job_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.users u ON u.account_id = j.account_id
    WHERE j.id = job_photos.job_id
    AND u.id = auth.uid()
  )
);

-- Policy: Users can update photos for jobs in their account
CREATE POLICY "Users can update photos for their account"
ON public.job_photos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.users u ON u.account_id = j.account_id
    WHERE j.id = job_photos.job_id
    AND u.id = auth.uid()
  )
);

-- Policy: Users can delete photos for jobs in their account
CREATE POLICY "Users can delete photos for their account"
ON public.job_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.users u ON u.account_id = j.account_id
    WHERE j.id = job_photos.job_id
    AND u.id = auth.uid()
  )
);

-- ==========================================
-- 4. Move Vector Extension (Best Practice)
-- ==========================================

CREATE SCHEMA IF NOT EXISTS extensions;
-- Move vector extension to extensions schema
-- Note: This might fail if dependent objects exist. Usually safer to do in dashboard or initial setup.
-- ALTER EXTENSION vector SET SCHEMA extensions;

-- ==========================================
-- 5. Legacy Cleanup (Profiles Table)
-- ==========================================

-- Drop foreign keys referencing profiles
ALTER TABLE IF EXISTS public.job_gates 
  DROP CONSTRAINT IF EXISTS job_gates_completed_by_fkey;

ALTER TABLE IF EXISTS public.job_photos 
  DROP CONSTRAINT IF EXISTS job_photos_taken_by_fkey;

-- Add new foreign keys referencing users
ALTER TABLE IF EXISTS public.job_gates
  ADD CONSTRAINT job_gates_completed_by_fkey 
  FOREIGN KEY (completed_by) REFERENCES auth.users(id);

ALTER TABLE IF EXISTS public.job_photos
  ADD CONSTRAINT job_photos_taken_by_fkey 
  FOREIGN KEY (taken_by) REFERENCES auth.users(id);

-- Drop the profiles table
DROP TABLE IF EXISTS public.profiles;
