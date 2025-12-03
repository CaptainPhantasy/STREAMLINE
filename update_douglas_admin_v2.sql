-- Update Douglas Talley to ADMIN role
-- Based on Supabase auth structure, role is stored in user_metadata

-- Step 1: Check the current user metadata
SELECT id, email, raw_user_meta_data as metadata
FROM auth.users
WHERE email = 'douglastalley1977@gmail.com';

-- Step 2: Update the user metadata to set role as admin
UPDATE auth.users
SET raw_user_meta_data =
  raw_user_meta_data ||
  jsonb_build_object('role', 'admin', 'email_verified', true),
  updated_at = NOW()
WHERE email = 'douglastalley1977@gmail.com';

-- Step 3: Check if there's a profiles table to update
-- This checks if the table exists first
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
    ) THEN
        UPDATE profiles
        SET role = 'admin',
            updated_at = NOW()
        WHERE user_id = '4e7caf61-cc73-407b-b18c-407d0d04f9d3';
    END IF;
END $$;

-- Step 4: Verify the update
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'douglastalley1977@gmail.com';

-- Note: After this update, you may need to:
-- 1. Log out of the application
-- 2. Clear browser cookies for localhost:3000
-- 3. Log back in to see the new admin role