# Multi-Tenant Setup Procedure

**Generated:** 21:54:49 Nov 26, 2025

## Current Architecture

The database is designed for multi-tenancy with the following structure:

### Account Isolation
- **Primary Key**: `accounts.id` (UUID)
- **Unique Identifier**: `accounts.slug` (text, unique constraint)
- **Tenant Isolation**: All tables have `account_id` column that references `accounts.id`
- **RLS Policies**: Row Level Security policies enforce account-level data isolation

### Current Tenant
- **Account Name**: "317 Plumber"
- **Slug**: `317plumber` (unique identifier)
- **Account ID**: `fde73a6a-ea84-46a7-803b-a3ae7cc09d00`
- **Inbound Email Domain**: `reply.317plumber.com`

## Procedure for Adding a Second Tenant

### Step 1: Create New Account Record

```sql
INSERT INTO accounts (
  name,
  slug,
  inbound_email_domain,
  settings,
  persona_config,
  google_review_link
) VALUES (
  'Company Name Here',           -- e.g., "ABC Plumbing"
  'abcplumbing',                 -- UNIQUE slug (lowercase, no spaces)
  'reply.abcplumbing.com',       -- Email domain for inbound emails
  '{}'::jsonb,                   -- Settings (business hours, branding, etc.)
  '{}'::jsonb,                   -- AI persona config
  NULL                           -- Google review link (optional)
) RETURNING id, slug;
```

**Critical Requirements:**
- `slug` MUST be unique (database constraint enforces this)
- `slug` should be lowercase, alphanumeric, no spaces
- `slug` is used as the tenant identifier throughout the system

### Step 2: Create Owner/Admin User for New Tenant

```sql
-- 1. Create auth user (via Supabase Admin API or SQL)
-- This would typically be done via application code or Supabase Dashboard

-- 2. Create user record in public.users table
INSERT INTO users (
  id,                    -- UUID from auth.users
  account_id,            -- The NEW account ID from Step 1
  full_name,
  role,
  avatar_url
) VALUES (
  'user-uuid-from-auth', -- From auth.users table
  'new-account-id',      -- From Step 1
  'Owner Name',
  'owner',               -- Must be: 'owner' | 'admin' | 'dispatcher' | 'tech' | 'sales'
  NULL
);
```

### Step 3: Verify Tenant Isolation

**RLS Policies** should automatically enforce:
- Users can only see data where `account_id` matches their user record's `account_id`
- All queries automatically filter by `account_id`
- No cross-tenant data leakage

**Test Query:**
```sql
-- As the new tenant's user, this should only return their account's data
SELECT * FROM contacts WHERE account_id = 'new-account-id';
```

### Step 4: Configure Tenant-Specific Settings

Update the account's `settings` JSONB field:

```sql
UPDATE accounts
SET settings = jsonb_build_object(
  'timezone', 'America/New_York',
  'businessHours', jsonb_build_object(
    'start', '08:00',
    'end', '17:00'
  ),
  'emergencyAfterHours', true,
  'brandColors', jsonb_build_object(
    'primary', '#0066CC',
    'secondary', '#FF6600'
  )
)
WHERE slug = 'abcplumbing';
```

### Step 5: Configure Email Domain (If Using Email Integration)

If using the email integration system:
- Configure DNS for `inbound_email_domain` (e.g., `reply.abcplumbing.com`)
- Set up Resend webhook to route emails to the correct account
- Update Edge Function to match emails to account by domain

## Ensuring No Tenant Overlap

### Database-Level Protections

1. **Unique Slug Constraint**
   ```sql
   -- This constraint prevents duplicate slugs
   ALTER TABLE accounts ADD CONSTRAINT accounts_slug_key UNIQUE (slug);
   ```

2. **Foreign Key Constraints**
   - All tables have `account_id` foreign key to `accounts.id`
   - Prevents orphaned records
   - Ensures referential integrity

3. **RLS Policies**
   - Row Level Security policies filter by `account_id`
   - Users can only access data from their own account
   - Applied automatically to all queries

### Application-Level Protections

1. **Account ID Retrieval Pattern**
   ```typescript
   // Standard pattern used in API routes
   const { data: user } = await supabase
     .from('users')
     .select('account_id')
     .eq('id', auth.user.id)
     .single()
   
   // All queries then filter by account_id
   const { data } = await supabase
     .from('contacts')
     .eq('account_id', user.account_id)  // Automatic tenant isolation
   ```

2. **Slug Validation**
   - Validate slug format before creation
   - Check for uniqueness before insert
   - Use slug for account lookup (not account_id in URLs)

3. **User-Account Association**
   - Each user MUST have exactly one `account_id`
   - Users cannot belong to multiple accounts
   - User's account_id determines their data access

## Script for Creating New Tenant

Here's a template script for creating a new tenant:

```typescript
// scripts/create-new-tenant.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createNewTenant(
  name: string,
  slug: string,
  ownerEmail: string,
  ownerPassword: string,
  ownerName: string
) {
  // 1. Check if slug already exists
  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('slug', slug)
    .single()
  
  if (existing) {
    throw new Error(`Account with slug "${slug}" already exists`)
  }

  // 2. Create account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert({
      name,
      slug,
      inbound_email_domain: `reply.${slug}.com`,
      settings: {},
      persona_config: {}
    })
    .select()
    .single()
  
  if (accountError) throw accountError

  // 3. Create owner user in auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true
  })
  
  if (authError) throw authError

  // 4. Create user record
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      account_id: account.id,
      full_name: ownerName,
      role: 'owner'
    })
  
  if (userError) throw userError

  return { account, userId: authUser.user.id }
}
```

## Important Considerations

### Email Domain Conflicts
- Each tenant should have a unique `inbound_email_domain`
- Email routing must match domain to account
- Consider subdomain strategy: `reply.{slug}.com`

### User Email Conflicts
- Supabase Auth allows duplicate emails across different accounts (if configured)
- Consider using account-specific email domains for users
- Or use email + account_id for unique identification

### Data Migration
- If migrating existing data, ensure all records have correct `account_id`
- Update foreign key relationships
- Verify RLS policies are working

### Testing Tenant Isolation
1. Create two test accounts
2. Create users in each account
3. Verify users can only see their own account's data
4. Verify cross-account queries return empty results
5. Test API endpoints with different user accounts

## Current Limitations

Based on code analysis:
- Some scripts hardcode `'317plumber'` slug - these need to be parameterized
- Some API routes use `DEFAULT_ACCOUNT_ID` env var - should use authenticated user's account
- Email routing may need updates to support multiple domains

## Recommendations

1. **Create a tenant management API** for account creation
2. **Parameterize all scripts** to accept account slug as parameter
3. **Add tenant selection UI** for admin users managing multiple tenants
4. **Implement tenant switching** for users who need access to multiple accounts
5. **Add tenant validation middleware** to all API routes

