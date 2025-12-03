-- Fix Security Warnings from Supabase Database Linter
-- This script addresses all security warnings identified by the linter
-- 
-- IMPORTANT: This script only fixes functions and tables that actually exist.
-- It checks for existence before attempting to fix anything.

-- ============================================
-- 1. Fix Function Search Path Issues
-- ============================================
-- Add SET search_path = '' to all functions to prevent search_path injection attacks
-- Only fixes functions that actually exist in the database

-- Fix get_user_account_id function (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_user_account_id'
  ) THEN
    -- Function exists, update it with search_path fix
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_user_account_id()
    RETURNS uuid
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = ''''
    STABLE
    AS $func$
      SELECT account_id FROM public.users WHERE id = auth.uid()
    $func$';
  END IF;
END $$;

-- Fix current_account_id function (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'current_account_id'
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION current_account_id()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = ''''
    AS $func$
      SELECT account_id FROM public.users WHERE id = auth.uid()
    $func$';
  END IF;
END $$;

-- Fix generate_invoice_number function (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'generate_invoice_number'
  ) THEN
    -- Check if invoices table exists before fixing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
      EXECUTE '
      CREATE OR REPLACE FUNCTION generate_invoice_number(account_id_param uuid)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''''
      AS $func$
      DECLARE
        prefix text;
        next_num integer;
        invoice_num text;
      BEGIN
        SELECT COALESCE(LEFT(slug, 3), LEFT(name, 3)) INTO prefix
        FROM public.accounts WHERE id = account_id_param;
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM ''[0-9]+$'') AS integer)), 0) + 1
        INTO next_num
        FROM public.invoices
        WHERE account_id = account_id_param;
        
        invoice_num := UPPER(prefix) || ''-'' || TO_CHAR(now(), ''YYYYMMDD'') || ''-'' || LPAD(next_num::text, 4, ''0'');
        
        RETURN invoice_num;
      END;
      $func$';
    END IF;
  END IF;
END $$;

-- Fix refresh_analytics_views function (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'refresh_analytics_views'
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION refresh_analytics_views()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''''
    AS $func$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = ''job_analytics'') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY job_analytics;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = ''contact_analytics'') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY contact_analytics;
      END IF;
    END;
    $func$';
  END IF;
END $$;

-- Fix update_updated_at_column function (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = ''''
    AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$';
  END IF;
END $$;

-- Fix update_email_providers_updated_at function (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_email_providers_updated_at'
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION update_email_providers_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = ''''
    AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$';
  END IF;
END $$;

-- Fix calculate_job_total function (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'calculate_job_total'
  ) THEN
    -- Check if required tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_materials')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_entries') THEN
      EXECUTE '
      CREATE OR REPLACE FUNCTION calculate_job_total(job_id_param uuid)
      RETURNS integer
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''''
      STABLE
      AS $func$
      DECLARE
        base_amount integer;
        materials_total integer;
        time_total integer;
      BEGIN
        SELECT COALESCE(total_amount, 0) INTO base_amount
        FROM public.jobs WHERE id = job_id_param;
        
        SELECT COALESCE(SUM(total_cost), 0) INTO materials_total
        FROM public.job_materials WHERE job_id = job_id_param;
        
        SELECT COALESCE(SUM(duration_minutes * hourly_rate / 60), 0) INTO time_total
        FROM public.time_entries 
        WHERE job_id = job_id_param AND is_billable = true AND hourly_rate IS NOT NULL;
        
        RETURN base_amount + materials_total + time_total;
      END;
      $func$';
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. Add Missing RLS Policies
-- ============================================
-- Only adds policies for tables that actually exist

-- RLS Policies for job_photos table (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_photos') THEN
    -- Check if account_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'job_photos' 
      AND column_name = 'account_id'
    ) THEN
      -- Check if policies already exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'job_photos'
        AND policyname = 'Users can view job photos for their account'
      ) THEN
        CREATE POLICY "Users can view job photos for their account"
          ON public.job_photos
          FOR SELECT
          USING (
            account_id IN (
              SELECT account_id FROM public.users WHERE id = auth.uid()
            )
          );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'job_photos'
        AND policyname = 'Users can manage job photos for their account'
      ) THEN
        CREATE POLICY "Users can manage job photos for their account"
          ON public.job_photos
          FOR ALL
          USING (
            account_id IN (
              SELECT account_id FROM public.users WHERE id = auth.uid()
            )
          );
      END IF;
    END IF;
  END IF;
END $$;

-- RLS Policies for profiles table (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Check if policies already exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'profiles'
      AND policyname = 'Users can view their own profile'
    ) THEN
      CREATE POLICY "Users can view their own profile"
        ON public.profiles
        FOR SELECT
        USING (id = auth.uid());

      CREATE POLICY "Users can update their own profile"
        ON public.profiles
        FOR UPDATE
        USING (id = auth.uid());
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. Notes on Other Warnings
-- ============================================

-- Extension in Public Schema (vector extension)
-- This is acceptable for vector similarity search functionality
-- The extension is needed for the knowledge_docs embedding column
-- No action needed - this is intentional

-- Materialized Views in API
-- job_analytics and contact_analytics are intentionally accessible via API
-- They are used for dashboard analytics and are filtered by account_id
-- Consider adding RLS policies if you want to restrict access further

-- Leaked Password Protection
-- This should be enabled in Supabase Dashboard:
-- Settings > Auth > Password > Enable "Leaked Password Protection"
-- This is a dashboard setting, not a SQL change

-- ============================================
-- Verification Queries (Optional)
-- ============================================

-- Verify functions have search_path set
-- SELECT 
--   proname as function_name,
--   CASE 
--     WHEN proconfig IS NULL THEN 'NOT SET'
--     WHEN array_to_string(proconfig, ', ') LIKE '%search_path%' THEN 'SET'
--     ELSE 'NOT SET'
--   END as search_path_status
-- FROM pg_proc
-- WHERE proname IN (
--   'get_user_account_id',
--   'current_account_id',
--   'generate_invoice_number',
--   'refresh_analytics_views',
--   'update_updated_at_column',
--   'update_email_providers_updated_at',
--   'calculate_job_total'
-- )
-- AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verify RLS policies exist
-- SELECT 
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('job_photos', 'profiles')
-- ORDER BY tablename, policyname;
