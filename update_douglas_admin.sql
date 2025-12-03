-- Update Douglas Talley's role to ADMIN (Super Admin)
-- Email: douglastalley1977@gmail.com
-- User ID: 4e7caf61-cc73-407b-b18c-407d0d04f9d3

-- First, check if the user exists
SELECT id, email, role FROM users WHERE email = 'douglastalley1977@gmail.com';

-- Update the users table to set role as admin
UPDATE users
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'douglastalley1977@gmail.com';

-- If there's an account_users table, update it too
UPDATE account_users
SET role = 'admin',
    updated_at = NOW()
WHERE user_id = '4e7caf61-cc73-407b-b18c-407d0d04f9d3';

-- Verify the update
SELECT email, role, created_at, updated_at FROM users WHERE email = 'douglastalley1977@gmail.com';