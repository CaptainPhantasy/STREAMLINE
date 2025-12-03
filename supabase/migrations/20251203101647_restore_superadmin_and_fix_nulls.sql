-- ============================================================================
-- RESTORE SUPERADMIN & FIX NULL VALUES ONCE AND FOR ALL
-- Created: 2025-12-03 10:16:47 EST
-- ============================================================================
-- This migration:
-- 1. Restores your superadmin account with all permissions
-- 2. Fixes ALL NULL values in existing users
-- 3. Creates triggers to prevent NULL values in future users
-- 4. Fixes auth.users email_change NULL issue permanently
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: RESTORE YOUR SUPERADMIN ACCOUNT
-- ============================================================================

-- Update auth.users with superadmin permissions
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    ),
    '{account_id}',
    '"fde73a6a-ea84-46a7-803b-a3ae7cc09d00"'
  ),
  '{permissions}',
  '[
    "manage_users",
    "view_all_jobs",
    "view_assigned_jobs",
    "create_jobs",
    "edit_jobs",
    "delete_jobs",
    "assign_jobs",
    "view_estimates",
    "create_estimates",
    "edit_estimates",
    "view_parts",
    "manage_parts",
    "view_contacts",
    "create_contacts",
    "edit_contacts",
    "view_analytics",
    "view_reports",
    "view_financials",
    "view_settings",
    "manage_settings",
    "manage_dispatch",
    "manage_marketing",
    "impersonate_users",
    "manage_invoices",
    "manage_automation",
    "manage_llm_providers",
    "view_audit_log"
  ]'::jsonb
)
WHERE id = '4e7caf61-cc73-407b-b18c-407d0d04f9d3';

-- Ensure public.users record exists and is correct
INSERT INTO public.users (
  id,
  account_id,
  role,
  full_name,
  do_not_delete
)
VALUES (
  '4e7caf61-cc73-407b-b18c-407d0d04f9d3',
  'fde73a6a-ea84-46a7-803b-a3ae7cc09d00',
  'admin',
  'Douglas Talley',
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  account_id = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00',
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name, 'Douglas Talley'),
  do_not_delete = true;

-- ============================================================================
-- PART 2: FIX ALL NULL VALUES IN EXISTING USERS
-- ============================================================================

-- Fix public.users NULL values
UPDATE public.users
SET
  account_id = COALESCE(
    account_id,
    'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'::uuid
  ),
  role = COALESCE(
    role,
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = public.users.id LIMIT 1),
    'tech' -- Safe default
  ),
  full_name = COALESCE(
    full_name,
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = public.users.id LIMIT 1),
    (SELECT email FROM auth.users WHERE id = public.users.id LIMIT 1),
    'User'
  ),
  timezone = COALESCE(timezone, 'America/New_York'),
  language = COALESCE(language, 'en'),
  notification_preferences = COALESCE(notification_preferences, '{}'::jsonb),
  do_not_delete = COALESCE(do_not_delete, false)
WHERE
  account_id IS NULL
  OR role IS NULL
  OR full_name IS NULL
  OR timezone IS NULL
  OR language IS NULL
  OR notification_preferences IS NULL;

-- ============================================================================
-- PART 3: CREATE TRIGGER TO PREVENT NULL VALUES IN FUTURE USERS
-- ============================================================================

-- Function to ensure all required fields are filled on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.ensure_user_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Ensure account_id is never NULL
  NEW.account_id := COALESCE(
    NEW.account_id,
    (SELECT account_id FROM public.users WHERE id = NEW.id LIMIT 1),
    'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'::uuid
  );

  -- Ensure role is never NULL
  NEW.role := COALESCE(
    NEW.role,
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = NEW.id LIMIT 1),
    'tech' -- Safe default
  );

  -- Ensure full_name is never NULL
  NEW.full_name := COALESCE(
    NEW.full_name,
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = NEW.id LIMIT 1),
    (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1),
    'User'
  );

  -- Ensure timezone has default
  NEW.timezone := COALESCE(NEW.timezone, 'America/New_York');

  -- Ensure language has default
  NEW.language := COALESCE(NEW.language, 'en');

  -- Ensure notification_preferences has default
  NEW.notification_preferences := COALESCE(NEW.notification_preferences, '{}'::jsonb);

  -- Ensure do_not_delete has default
  NEW.do_not_delete := COALESCE(NEW.do_not_delete, false);

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_user_complete_trigger ON public.users;

-- Create trigger
CREATE TRIGGER ensure_user_complete_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_complete();

-- ============================================================================
-- PART 4: FIX auth.users email_change NULL ISSUE PERMANENTLY
-- ============================================================================

-- Fix existing NULL email_change values
UPDATE auth.users
SET email_change = ''
WHERE email_change IS NULL;

-- Create function to prevent NULL email_change
CREATE OR REPLACE FUNCTION auth.prevent_null_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Always ensure email_change is not NULL
  IF NEW.email_change IS NULL THEN
    NEW.email_change := '';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_null_email_change_trigger ON auth.users;

-- Create trigger (requires elevated privileges, but we'll try)
DO $$
BEGIN
  -- Try to create trigger, but don't fail if we don't have permissions
  BEGIN
    CREATE TRIGGER prevent_null_email_change_trigger
      BEFORE INSERT OR UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION auth.prevent_null_email_change();
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create auth.users trigger - requires elevated privileges. Run Part 4 separately.';
  END;
END $$;

-- Set default for email_change column (if we have permissions)
DO $$
BEGIN
  BEGIN
    ALTER TABLE auth.users
      ALTER COLUMN email_change SET DEFAULT '';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot alter auth.users column - requires elevated privileges. Run Part 4 separately.';
  END;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check your superadmin status
SELECT
  '✅ SUPERADMIN STATUS' as status,
  au.email,
  au.id,
  au.raw_user_meta_data->>'role' as auth_role,
  pu.role as public_role,
  jsonb_array_length(COALESCE(au.raw_user_meta_data->'permissions', '[]'::jsonb)) as permission_count,
  pu.account_id::text as account_id,
  pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.id = '4e7caf61-cc73-407b-b18c-407d0d04f9d3';

-- Check for remaining NULL values
SELECT
  'NULL Value Check' as check_type,
  COUNT(*) FILTER (WHERE account_id IS NULL) as null_account_id,
  COUNT(*) FILTER (WHERE role IS NULL) as null_role,
  COUNT(*) FILTER (WHERE full_name IS NULL) as null_full_name,
  COUNT(*) FILTER (WHERE timezone IS NULL) as null_timezone,
  COUNT(*) FILTER (WHERE language IS NULL) as null_language
FROM public.users;

-- Check auth.users email_change NULLs
SELECT
  'Email Change NULL Check' as check_type,
  COUNT(*) FILTER (WHERE email_change IS NULL) as null_email_change_count
FROM auth.users;

