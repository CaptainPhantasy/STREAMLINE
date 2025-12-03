-- ================================================================
-- Create Owner Account for Ryan Galbraith (317Plumber CEO)
-- and Mark Douglas Talley as Protected
-- ================================================================
-- Description: 
-- 1. Creates owner account for Ryan Galbraith with protected status
--    Email: Ryan@317plumber.com
--    Password: TestPass123!
--    Role: owner
--    Protected: YES (do_not_delete = true)
-- 2. Marks Douglas Talley as protected (DO NOT DELETE)
--    Email: DouglasTalley1977@gmail.com
--    Protected: YES (do_not_delete = true)
-- Date: 2025-12-01
-- ================================================================

-- Step 1: Add do_not_delete column to users table if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS do_not_delete BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.do_not_delete IS 'If true, this user cannot be deleted. Used for pilot users and critical accounts.';

-- Step 2: Get the 317plumber account ID
DO $$
DECLARE
  v_account_id UUID;
  v_user_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- Find the 317plumber account
  SELECT id INTO v_account_id
  FROM accounts
  WHERE slug = '317plumber'
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION '317plumber account not found. Please create the account first.';
  END IF;

  -- Check if user already exists in auth.users
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'Ryan@317plumber.com'
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    -- Create auth user using Supabase Auth extension
    -- Note: This requires the auth.users table to be accessible
    -- We'll use the auth.users table directly with proper password hashing
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'Ryan@317plumber.com',
      crypt('TestPass123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ryan Galbraith"}'::jsonb
    )
    RETURNING id INTO v_auth_user_id;

    RAISE NOTICE 'Created auth user for Ryan@317plumber.com with ID: %', v_auth_user_id;
  ELSE
    RAISE NOTICE 'Auth user already exists for Ryan@317plumber.com with ID: %', v_auth_user_id;
    
    -- Update password to ensure it's correct
    UPDATE auth.users
    SET encrypted_password = crypt('TestPass123!', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at = COALESCE(confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_auth_user_id;
  END IF;

  -- Check if user record exists in public.users
  SELECT id INTO v_user_id
  FROM users
  WHERE id = v_auth_user_id;

  IF v_user_id IS NULL THEN
    -- Create user record in public.users
    INSERT INTO users (
      id,
      account_id,
      full_name,
      role,
      do_not_delete
    )
    VALUES (
      v_auth_user_id,
      v_account_id,
      'Ryan Galbraith',
      'owner',
      true
    );

    RAISE NOTICE 'Created user record for Ryan Galbraith';
  ELSE
    -- Update existing user record to ensure correct settings
    UPDATE users
    SET account_id = v_account_id,
        full_name = 'Ryan Galbraith',
        role = 'owner',
        do_not_delete = true
    WHERE id = v_user_id;

    RAISE NOTICE 'Updated user record for Ryan Galbraith';
  END IF;

END $$;

-- Step 3: Mark Douglas Talley as DO NOT DELETE
UPDATE users
SET do_not_delete = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'DouglasTalley1977@gmail.com'
);

-- Step 4: Verify both users were created/updated correctly
SELECT 
  u.id,
  u.full_name,
  u.role,
  u.do_not_delete,
  u.account_id,
  a.name as account_name,
  a.slug as account_slug,
  au.email
FROM users u
JOIN accounts a ON u.account_id = a.id
JOIN auth.users au ON u.id = au.id
WHERE au.email IN ('Ryan@317plumber.com', 'DouglasTalley1977@gmail.com')
ORDER BY au.email;

-- ================================================================
-- END OF MIGRATION
-- ================================================================

