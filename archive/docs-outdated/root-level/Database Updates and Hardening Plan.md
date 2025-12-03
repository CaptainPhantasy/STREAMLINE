# Database Updates and Hardening Plan
# Passwords & Users Portion Overview
This plan addresses multiple database improvements:
1. 1	Standardize test user passwords to TestPass123! (excluding protected admin users)
2. 2	Complete user profile fields (full_name and phone numbers)
3. 3	Remove legacy profiles table system
4. 4	Implement multi-tenant security hardening

⠀Tasks
### 1. Standardize Test User Passwords
Update all scripts that create test users to use TestPass123! as the standard password, EXCEPT for the two protected admin users:
* •	douglastalley1977@gmail.com (Douglas Talley - owner)
* •	ryan@317plumber.com (Ryan Galbraith - owner)

⠀All other users (including test@317plumber.com, cecily@317plumber.com, etc.) are test users and will receive TestPass123!.
Files to update:
* •	scripts/verify-test-users.ts (already updated with STANDARD_TEST_PASSWORD constant)
* •	tests/utils/auth-helpers.ts - Update password from TestPassword123! to TestPass123!
* •	scripts/reset-test-passwords.ts - Update password from Password123! to TestPass123! for non-admin users only
* •	scripts/setup-auth.ts - Update password from TestPassword123! to TestPass123!
* •	scripts/test-llm-router-comprehensive.ts - Update password to TestPass123!
* •	scripts/test-llm-router-api.ts - Update password to TestPass123!
* •	scripts/test-e2e-flows.ts - Update password to TestPass123!
* •	scripts/test-authenticated-endpoints.ts - Update password to TestPass123!
* •	scripts/fix-admin-role.ts - Update default password to TestPass123!
* •	tests/e2e/full-day-workflow.spec.ts - Update TEST_PASSWORD constant
* •	tests/e2e/marketing-save.spec.ts - Update TEST_PASSWORD constant

⠀2. Create Password Reset Script (Excluding Protected Admin Users)
Create **scripts/set-standard-test-passwords.ts**:
* •	Query all users from database
* •	Identify protected admin users (ONLY these two):
* •	douglastalley1977@gmail.com (owner)
* •	ryan@317plumber.com (owner)
* •	For all other users (including other owner/admin roles), update passwords to TestPass123!
* •	Use Supabase Admin API to update passwords
* •	Log which users were updated and which were skipped (protected users)

⠀3. Complete User Profile Fields
Create **scripts/complete-user-profiles.ts**:
* •	Query all users and their auth data
* •	For each user, check and update:
* **•	full_name**: Ensure it's populated
* •	Douglas Talley: Set to "Douglas Talley"
* •	Use proper names from existing data or email prefix if missing
* **•	phone** (in auth.users.phone): Add phone numbers
* •	Douglas Talley: Set to "8123405761"
* •	Test users: Generate mock phone numbers using pattern 317555XXXX where XXXX is unique per user
* •	Existing team users: Use pattern 317555XXXX for mock numbers
* •	Update both public.users.full_name and auth.users.phone fields
* •	Phone numbers stored without formatting: 8123405761 (not 812-340-5761)

⠀4. Update User Creation Scripts to Include Phone Numbers
Update scripts that create new users to include phone number generation:
* **•	scripts/setup-317plumber-users.ts**: Add phone number generation when creating users
* **•	scripts/verify-test-users.ts**: Add phone number when creating test users
* **•	tests/utils/auth-helpers.ts**: Add phone number when creating test users for Playwright

⠀5. Remove Legacy Profiles Table System
The profiles table is empty (0 rows) and from an older testing round. It should be removed:
Update Foreign Keys:
* •	Change job_gates.completed_by foreign key from profiles.id to users.id
* •	Change job_photos.taken_by foreign key from profiles.id to users.id

⠀Update Code References:
* •	app/api/photos/route.ts: Change query from profiles to users table (line 58-62)
* •	app/api/tech/gates/route.ts: Change query from profiles to users table (line 35-39)

⠀Drop Legacy Schema:
* •	Drop foreign key constraints on job_gates and job_photos
* •	Drop the profiles table
* •	Drop the user_role enum type (if not used elsewhere)

⠀Create Migration Script: scripts/remove-legacy-profiles-table.ts to safely perform all steps
### 6. Multi-Tenant Security Hardening
Critical Security Fixes (IMMEDIATE):
6.1. Remove Auth Bypass in Jobs API
* •	File: app/api/jobs/route.ts (line 111-116)
* •	Remove temporary auth bypass
* •	Restore proper authentication: const auth = await getAuthenticatedSession(request)
* •	Add proper error handling for unauthorized requests

⠀6.2. Remove Service Role from API Routes
* •	File: app/api/jobs/route.ts (line 119-129)
* •	Replace service role client with authenticated Supabase client
* •	Use authenticated user's account_id instead of DEFAULT_ACCOUNT_ID
* •	Remove hardcoded account ID fallback

⠀6.3. Remove DEFAULT_ACCOUNT_ID Usage
* •	File: app/api/jobs/route.ts (line 140)
* •	Always get account_id from authenticated user
* •	Remove: process.env.DEFAULT_ACCOUNT_ID || 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'
* •	Replace with: Get account_id from user's record

⠀6.4. Add Account ID Validation Middleware
* •	Create utility function: lib/auth/validate-account-access.ts
* •	Validate that user's account_id matches any account_id in request
* •	Prevent account_id manipulation attacks
* •	Use in all API routes that accept account_id parameter

⠀6.5. Secure Service Role Usage
* •	Review all service role key usage
* •	Remove from client-accessible API routes
* •	Only use in:
* •	Server-side scripts (not exposed to web)
* •	Edge functions with proper validation
* •	Admin operations with additional authorization checks
* •	Files to review:
* •	app/api/llm/route.ts
* •	app/api/llm/metrics/route.ts
* •	app/api/meetings/route.ts
* •	app/api/webhooks/stripe/route.ts

⠀Security Improvements (SHORT TERM):
6.6. Comprehensive RLS Policy Audit
* •	Verify all tables have complete RLS coverage
* •	Ensure SELECT, INSERT, UPDATE, DELETE are all protected
* •	Test with multiple tenant accounts
* •	Document any missing policies

⠀6.7. Add Audit Logging
* •	Log all account_id access attempts
* •	Log all cross-tenant queries
* •	Alert on suspicious activity
* •	Use existing crmai_audit table

⠀6.8. Input Validation
* •	Validate all account_id parameters in API routes
* •	Sanitize all user inputs
* •	Prevent account_id injection

⠀7. Fix Database Security Warnings
Address all security warnings from Supabase Database Insights:
7.1. Fix Function Search Path Mutable
* •	Function: public.update_meetings_updated_at
* •	Issue: Function has mutable search_path (security risk)
* •	Fix: Set search_path parameter in function definition
* •	Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

⠀7.2. Move Extension from Public Schema
* •	Extension: vector (currently in public schema)
* •	Issue: Extensions should not be in public schema
* •	Fix: Move vector extension to a separate schema (e.g., extensions schema)
* •	Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

⠀7.3. Secure Materialized Views
* •	Views: public.contact_analytics and public.job_analytics
* •	Issue: Materialized views are accessible via Data APIs (anon/authenticated roles)
* •	Fix: Add RLS policies or revoke access from anon/authenticated roles
* •	Options:
* •	Add RLS policies to filter by account_id
* •	Revoke SELECT from anon, authenticated roles
* •	Create API endpoints instead of direct access
* •	Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0016_materialized_view_in_api

⠀7.4. Enable Leaked Password Protection
* •	Issue: Supabase Auth leaked password protection is disabled
* •	Fix: Enable HaveIBeenPwned.org password checking in Supabase Dashboard
* •	Location: Supabase Dashboard → Authentication → Password Security
* •	Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

⠀7.5. Add RLS Policies to job_photos Table
* •	Table: public.job_photos
* •	Issue: RLS is enabled but no policies exist
* •	Fix: Create RLS policies for SELECT, INSERT, UPDATE, DELETE
* •	Policies should filter by account_id using get_user_account_id()
* •	Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

⠀Create Migration Script: scripts/fix-database-security-warnings.ts to address all warnings
### 8. Update Documentation
* **•	docs/TEST_USERS.md**: Update with correct password TestPass123! and note about protected admin users
* **•	docs/CURRENT_USERS_LIST.md**: Add note about phone number format and protected admin user password policy
* **•	docs/MULTI_TENANT_SETUP_PROCEDURE.md**: Already created
* **•	docs/MULTI_TENANT_SECURITY_ASSESSMENT.md**: Already created

⠀Implementation Details
### Protected Admin Users
ONLY TWO users are protected from password changes:
* •	douglastalley1977@gmail.com (owner) - Douglas Talley
* •	ryan@317plumber.com (owner) - Ryan Galbraith

⠀All other users (including test@317plumber.com, cecily@317plumber.com, etc.) are test users and will receive TestPass123!.
### Phone Number Format
* •	Store phone numbers without formatting: 8123405761 (not 812-340-5761)
* •	Generate test user phones as: 317555XXXX where XXXX is unique per user
* •	Use deterministic method (hash of user ID or email, or sequential)

⠀Legacy Profiles Table
* •	Currently empty (0 rows)
* •	Has foreign key references from job_gates and job_photos
* •	Code still references it but queries return null
* •	Safe to remove after updating foreign keys and code

⠀Security Priority
1. 1	CRITICAL (Before multi-tenant): Remove auth bypass, remove service role from API routes, remove DEFAULT_ACCOUNT_ID
2. 2	HIGH: Add account ID validation, secure service role usage
3. 3	MEDIUM: RLS audit, audit logging, input validation

⠀Execution Order
1. 1	Update all password constants in scripts (Task 1)
2. 2	Create password reset script (Task 2)
3. 3	Create profile completion script (Task 3)
4. 4	Update user creation scripts to include phone (Task 4)
5. 5	Remove legacy profiles table system (Task 5)
6. 6	Implement critical security fixes (Task 6.1-6.5)
7. 7	Implement security improvements (Task 6.6-6.8)
8. 8	Update documentation (Task 7)
9. 9	Run scripts/complete-user-profiles.ts to fix existing users
10. 10	Run scripts/set-standard-test-passwords.ts to standardize non-admin passwords
11. 11	Test multi-tenant isolation with security fixes

⠀Testing
After implementation:
* •	Verify protected admin users still have their original passwords
* •	Verify all other users have TestPass123! password
* •	Verify all users have full_name populated
* •	Verify all users have phone numbers (Douglas: 8123405761, others: mock numbers)
* •	Verify legacy profiles table is removed
* •	Verify auth bypass is removed
* •	Verify service role is not used in API routes
* •	Verify account_id validation works
* •	Test login with updated credentials
* •	Test multi-tenant isolation with two test accounts


### 3. Remove DEFAULT_ACCOUNT_ID Usage
File: app/api/jobs/route.ts (line 140)
* •	Always get account_id from authenticated user
* •	Remove: process.env.DEFAULT_ACCOUNT_ID || 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'
* •	Replace with: Get account_id from user's record

⠀4. Add Account ID Validation Middleware
New File: lib/auth/validate-account-access.ts
* •	Create utility function to validate account access
* •	Validate that user's account_id matches any account_id in request
* •	Prevent account_id manipulation attacks
* •	Use in all API routes that accept account_id parameter

⠀User Management Standardization
### 5. Standardize Test User Passwords
Standard Password: TestPass123! (for all test users)
Protected Admin Users (DO NOT change passwords):
* •	douglastalley1977@gmail.com (Douglas Talley - owner)
* •	ryan@317plumber.com (Ryan Galbraith - owner)

⠀Files to update:
* •	tests/utils/auth-helpers.ts - Update from TestPassword123! to TestPass123!
* •	scripts/reset-test-passwords.ts - Update from Password123! to TestPass123! (non-admin only)
* •	scripts/setup-auth.ts - Update from TestPassword123! to TestPass123!
* •	scripts/test-llm-router-comprehensive.ts - Update to TestPass123!
* •	scripts/test-llm-router-api.ts - Update to TestPass123!
* •	scripts/test-e2e-flows.ts - Update to TestPass123!
* •	scripts/test-authenticated-endpoints.ts - Update to TestPass123!
* •	scripts/fix-admin-role.ts - Update default password to TestPass123!
* •	tests/e2e/full-day-workflow.spec.ts - Update TEST_PASSWORD constant
* •	tests/e2e/marketing-save.spec.ts - Update TEST_PASSWORD constant

⠀6. Create Password Reset Script
New File: scripts/set-standard-test-passwords.ts
* •	Query all users from database
* •	Identify protected admin users (ONLY the two listed above)
* •	For all other users, update passwords to TestPass123!
* •	Use Supabase Admin API to update passwords
* •	Log which users were updated and which were skipped

⠀7. Complete User Profile Fields
New File: scripts/complete-user-profiles.ts
* •	Query all users and their auth data
* •	For each user, check and update:
* •	full_name: Ensure populated
  * ◦	Douglas Talley: Set to "Douglas Talley"
  * ◦	Use proper names from existing data or email prefix if missing
* •	phone (in auth.users.phone): Add phone numbers
  * ◦	Douglas Talley: Set to "8123405761"
  * ◦	Test users: Generate mock phone numbers using pattern 317555XXXX where XXXX is unique per user
  * ◦	Existing team users: Use pattern 317555XXXX for mock numbers
* •	Update both public.users.full_name and auth.users.phone fields
* •	Phone format: Store without formatting: 8123405761 (not 812-340-5761)

⠀8. Update User Creation Scripts to Include Phone Numbers
Files to update:
* •	scripts/setup-317plumber-users.ts - Add phone number generation when creating users
* •	scripts/verify-test-users.ts - Add phone number when creating test users
* •	tests/utils/auth-helpers.ts - Add phone number when creating test users for Playwright

⠀Legacy System Cleanup
### 9. Remove Legacy Profiles Table System
The profiles table is empty (0 rows) and from an older testing round.
Steps:
1. 1	Update Foreign Keys:
* •	Change job_gates.completed_by foreign key from profiles.id to users.id
* •	Change job_photos.taken_by foreign key from profiles.id to users.id
1. 2	Update Code References:
* •	app/api/photos/route.ts (line 58-62): Change query from profiles to users table
* •	app/api/tech/gates/route.ts (line 35-39): Change query from profiles to users table
1. 3	Drop Legacy Schema:
* •	Drop foreign key constraints on job_gates and job_photos
* •	Drop the profiles table
* •	Drop the user_role enum type (if not used elsewhere)

⠀New File: scripts/remove-legacy-profiles-table.ts - Safely perform all steps
### 10. Fix Function Search Path Issues
Function: public.update_meetings_updated_at
* •	Add SET search_path = '' to prevent search_path injection
* •	Use fully qualified table names (e.g., public.meetings)
* •	Verify all other functions have search_path set (check fix-security-warnings.sql)

⠀File: supabase/database-hardening.sql
### 11. Add RLS Policies to job_photos Table
Table: public.job_photos
* •	RLS is enabled but no policies exist
* •	Create RLS policies for SELECT, INSERT, UPDATE, DELETE
* •	Policies should filter by account_id using get_user_account_id()

⠀File: supabase/database-hardening.sql
### 12. Secure Materialized Views
Views: public.contact_analytics and public.job_analytics
* •	Currently accessible via Data APIs (anon/authenticated roles)
* •	Solution: Create secure wrapper functions:
* •	get_job_analytics(account_id uuid) - Returns analytics for specific account
* •	get_contact_analytics(account_id uuid) - Returns analytics for specific account
* •	Revoke SELECT from anon/authenticated roles on views
* •	Update API routes to use these functions

⠀Files to Update:
* •	app/api/analytics/jobs/route.ts - Use secure function instead of direct view
* •	app/api/analytics/contacts/route.ts - Use secure function instead of direct view

⠀File: supabase/database-hardening.sql
### 13. Move Vector Extension from Public Schema
Extension: vector (currently in public schema)
* •	Create extensions schema if not exists
* •	Move extension: ALTER EXTENSION vector SET SCHEMA extensions
* •	Update any code that references vector functions to use extensions.vector
* •	Note: May require updating embedding queries in knowledge_docs table

⠀File: supabase/database-hardening.sql
### 14. Enable Leaked Password Protection
Action: Manual configuration in Supabase Dashboard
* •	Navigate to: Settings > Auth > Password
* •	Enable "Leaked Password Protection"
* •	Document the change in migration notes

⠀File: supabase/database-hardening.sql (add comment/note)
# Security Improvements (SHORT TERM)
### 15. Comprehensive RLS Policy Audit
* •	Verify all tables have complete RLS coverage
* •	Ensure SELECT, INSERT, UPDATE, DELETE are all protected
* •	Test with multiple tenant accounts
* •	Document any missing policies

⠀16. Add Audit Logging
* •	Log all account_id access attempts
* •	Log all cross-tenant queries
* •	Alert on suspicious activity
* •	Use existing crmai_audit table

⠀17. Input Validation
* •	Validate all account_id parameters in API routes
* •	Sanitize all user inputs
* •	Prevent account_id injection

⠀Documentation Updates
### 18. Update Documentation
Files to update:
* •	docs/TEST_USERS.md - Update with correct password TestPass123! and note about protected admin users
* •	docs/CURRENT_USERS_LIST.md - Add note about phone number format and protected admin user password policy
* •	docs/MULTI_TENANT_SETUP_PROCEDURE.md - Already created
* •	docs/MULTI_TENANT_SECURITY_ASSESSMENT.md - Already created
* •	New: docs/DATABASE_HARDENING.md - Document all security improvements

⠀Files to Create/Modify
### New Files
1. 1	supabase/database-hardening.sql - Main migration script for security fixes
2. 2	scripts/set-standard-test-passwords.ts - Standardize test user passwords
3. 3	scripts/complete-user-profiles.ts - Complete user profile fields
4. 4	scripts/remove-legacy-profiles-table.ts - Remove legacy profiles system
5. 5	lib/auth/validate-account-access.ts - Account ID validation utility
6. 6	docs/DATABASE_HARDENING.md - Documentation of changes

⠀Files to Update
1. 1	app/api/jobs/route.ts - Remove auth bypass, service role, DEFAULT_ACCOUNT_ID
2. 2	app/api/llm/route.ts - Review and remove service role if possible
3. 3	app/api/llm/metrics/route.ts - Review and remove service role if possible
4. 4	app/api/meetings/route.ts - Review and remove service role if possible
5. 5	app/api/webhooks/stripe/route.ts - Review and remove service role if possible
6. 6	app/api/photos/route.ts - Change profiles to users table
7. 7	app/api/tech/gates/route.ts - Change profiles to users table
8. 8	app/api/analytics/jobs/route.ts - Use secure analytics function
9. 9	app/api/analytics/contacts/route.ts - Use secure analytics function
10. 10	tests/utils/auth-helpers.ts - Update password and add phone
11. 11	scripts/reset-test-passwords.ts - Update password (non-admin only)
12. 12	scripts/setup-auth.ts - Update password
13. 13	scripts/test-llm-router-comprehensive.ts - Update password
14. 14	scripts/test-llm-router-api.ts - Update password
15. 15	scripts/test-e2e-flows.ts - Update password
16. 16	scripts/test-authenticated-endpoints.ts - Update password
17. 17	scripts/fix-admin-role.ts - Update default password
18. 18	scripts/setup-317plumber-users.ts - Add phone number generation
19. 19	scripts/verify-test-users.ts - Add phone number generation
20. 20	tests/e2e/full-day-workflow.spec.ts - Update TEST_PASSWORD
21. 21	tests/e2e/marketing-save.spec.ts - Update TEST_PASSWORD
22. 22	supabase/fix-security-warnings.sql - Add missing function fixes
23. 23	docs/TEST_USERS.md - Update password info
24. 24	docs/CURRENT_USERS_LIST.md - Add phone number format info

⠀Execution Order
1. 1	CRITICAL SECURITY (Execute First):
* •	Remove auth bypass (Task 1)
* •	Remove service role from API routes (Task 2)
* •	Remove DEFAULT_ACCOUNT_ID usage (Task 3)
* •	Add account ID validation (Task 4)
1. 2	User Management:
* •	Update all password constants in scripts (Task 5)
* •	Create password reset script (Task 6)
* •	Create profile completion script (Task 7)
* •	Update user creation scripts to include phone (Task 8)
1. 3	Legacy Cleanup:
* •	Remove legacy profiles table system (Task 9)
1. 4	Database Security Hardening:
* •	Fix function search path (Task 10)
* •	Add RLS policies to job_photos (Task 11)
* •	Secure materialized views (Task 12)
* •	Move vector extension (Task 13)
* •	Enable leaked password protection (Task 14)
1. 5	Security Improvements:
* •	RLS audit (Task 15)
* •	Audit logging (Task 16)
* •	Input validation (Task 17)
1. 6	Documentation:
* •	Update all documentation (Task 18)
1. 7	Post-Implementation:
* •	Run scripts/complete-user-profiles.ts to fix existing users
* •	Run scripts/set-standard-test-passwords.ts to standardize non-admin passwords
* •	Test multi-tenant isolation with security fixes

⠀Testing Strategy
1. 1	Security Testing:
* •	Verify auth bypass is removed
* •	Verify service role is not used in API routes
* •	Verify account_id validation works
* •	Test multi-tenant isolation with two test accounts
1. 2	User Management Testing:
* •	Verify protected admin users still have their original passwords
* •	Verify all other users have TestPass123! password
* •	Verify all users have full_name populated
* •	Verify all users have phone numbers (Douglas: 8123405761, others: mock numbers)
* •	Test login with updated credentials
1. 3	Legacy Cleanup Testing:
* •	Verify legacy profiles table is removed
* •	Verify foreign keys updated correctly
* •	Verify code references updated
1. 4	Database Security Testing:
* •	RLS Testing: Verify users can only access job_photos from their account
* •	Function Testing: Test that update_meetings_updated_at works correctly
* •	Analytics Testing: Verify analytics functions return correct data with account filtering
* •	Extension Testing: Verify vector operations still work after schema move
1. 5	Integration Testing:
* •	Run full test suite to ensure no breaking changes
* •	Test all API endpoints with updated security

⠀Success Criteria
* •	All critical security fixes implemented (auth bypass removed, service role removed)
* •	All test users have standardized password TestPass123! (except protected admins)
* •	All users have complete profile fields (full_name and phone)
* •	Legacy profiles table removed
* •	All linter warnings resolved (0 security warnings)
* •	All RLS policies tested and working
* •	All functions have SET search_path = ''
* •	Materialized views secured via functions
* •	Vector extension in dedicated schema
* •	Leaked password protection enabled
* •	All tests passing
* •	No breaking changes to existing functionality
* •	Multi-tenant isolation verified
