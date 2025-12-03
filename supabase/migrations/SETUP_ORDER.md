# Database Setup Order

## Important: Run scripts in this order!

The security fix script requires the base schema to be applied first. Follow these steps:

## Step 1: Apply Base Schema

Choose **ONE** of these options:

### Option A: Comprehensive Schema (Recommended)
Run in Supabase SQL Editor:
```
supabase/COMPREHENSIVE_SCHEMA_FOR_ALL_PHASES.sql
```

### Option B: Basic Schema
Run in Supabase SQL Editor:
```
supabase/schema.sql
```

This creates all the base tables including:
- `accounts`
- `users`
- `contacts`
- `jobs`
- And all other core tables

## Step 2: Apply Security Fixes

After the base schema is applied, run:
```
supabase/fix-security-warnings.sql
```

This script will:
- ✅ Check that required tables exist (will error with helpful message if not)
- ✅ Fix function search_path security issues
- ✅ Add missing RLS policies

## Step 3: Apply Additional Integrations (Optional)

If you need email integrations:
- `supabase/add-gmail-integration.sql`
- `supabase/add-microsoft-integration.sql`

## Verification

After running the security fix script, you can verify:

```sql
-- Check that functions have search_path set
SELECT 
  proname as function_name,
  CASE 
    WHEN proconfig IS NULL THEN 'NOT SET'
    WHEN array_to_string(proconfig, ', ') LIKE '%search_path%' THEN 'SET'
    ELSE 'NOT SET'
  END as search_path_status
FROM pg_proc
WHERE proname IN (
  'get_user_account_id',
  'current_account_id',
  'generate_invoice_number',
  'refresh_analytics_views',
  'update_updated_at_column',
  'update_email_providers_updated_at',
  'calculate_job_total'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check RLS policies
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('job_photos', 'profiles')
ORDER BY tablename, policyname;
```

## Troubleshooting

### Error: "relation 'users' does not exist"
**Solution**: You need to run the base schema first (Step 1)

### Error: "relation 'accounts' does not exist"
**Solution**: You need to run the base schema first (Step 1)

### Functions still show search_path warnings
**Solution**: Make sure you ran `fix-security-warnings.sql` after the base schema

