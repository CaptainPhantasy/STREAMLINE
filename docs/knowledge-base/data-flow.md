# Data Flow Knowledge Base

**Last Updated**: 12:21:04 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Complete understanding of data flow patterns from UI → API → Database with permission checks at each layer

---

## 1. Data Flow Architecture

### 1.1 Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│         UI LAYER (Components)           │
│  - PermissionGate components            │
│  - React Query / Fetch calls            │
│  - User interactions                    │
└─────────────────┬───────────────────────┘
                  │ HTTP Request
                  │ (with auth cookies/token)
                  ↓
┌─────────────────────────────────────────┐
│         API LAYER (Route Handlers)      │
│  - getAuthenticatedSession()            │
│  - Role-based permission checks         │
│  - Business logic                       │
└─────────────────┬───────────────────────┘
                  │ Supabase Query
                  │ (with RLS enforcement)
                  ↓
┌─────────────────────────────────────────┐
│      DATABASE LAYER (PostgreSQL)        │
│  - Row Level Security (RLS) policies    │
│  - Account isolation                    │
│  - Data persistence                     │
└─────────────────────────────────────────┘
```

---

## 2. UI → API Flow

### 2.1 Authentication Flow

#### Cookie-Based Authentication (Browser)
1. User logs in via `/login`
2. Supabase sets authentication cookies
3. Components make API calls with cookies automatically included
4. API routes read cookies via `getAuthenticatedSession(request)`

#### Bearer Token Authentication (API/Service)
1. Client includes `Authorization: Bearer <token>` header
2. API routes validate token via `getAuthenticatedSession(request)`
3. Supports both custom JWT and Supabase tokens

### 2.2 API Call Patterns

#### Pattern 1: React Query (Preferred)
```tsx
// Component
const { data } = useQuery({
  queryKey: ['jobs', accountId],
  queryFn: async () => {
    const res = await fetch('/api/jobs')
    if (!res.ok) throw new Error('Failed')
    return res.json()
  },
})
```

**Flow**:
1. Component renders
2. React Query calls `queryFn`
3. `fetch('/api/jobs')` sends HTTP request with cookies
4. API route receives request
5. Response returned to React Query
6. Component re-renders with data

#### Pattern 2: Direct Fetch
```tsx
// Component
useEffect(() => {
  async function loadData() {
    const res = await fetch('/api/jobs')
    const data = await res.json()
    setJobs(data.jobs)
  }
  loadData()
}, [])
```

**Flow**:
1. Component mounts
2. `useEffect` runs
3. `fetch('/api/jobs')` sends HTTP request
4. API route processes request
5. Response updates component state

### 2.3 Permission Checks in UI

#### PermissionGate Component
```tsx
<PermissionGate requires="view_all_jobs">
  <JobsList />
</PermissionGate>
```

**Flow**:
1. PermissionGate calls `useEffectiveUser()` hook
2. Hook fetches `/api/users/me` to get current user
3. PermissionGate checks `hasPermission(user.role, 'view_all_jobs')`
4. If admin role, bypasses check (always renders)
5. Renders children if permission granted, null otherwise

**Note**: UI permission checks are for UX only, not security. API and RLS enforce actual access.

---

## 3. API → Database Flow

### 3.1 Authentication in API Routes

#### Pattern: getAuthenticatedSession()
```typescript
// API Route
export async function GET(request: Request) {
  const auth = await getAuthenticatedSession(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use auth.user.id and auth.accountId
}
```

**Flow**:
1. API route receives request
2. Calls `getAuthenticatedSession(request)`
3. Function checks:
   - Bearer token in Authorization header (if present)
   - Cookies for Supabase session (if no Bearer token)
4. Validates token/session
5. Fetches user role and account_id from database
6. Returns session object or null

### 3.2 Permission Checks in API Routes

#### Pattern 1: Role-Based Check
```typescript
// API Route
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', auth.user.id)
  .single()

if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Flow**:
1. API route authenticates user
2. Queries users table for role
3. Checks role against required roles
4. Returns 403 if not authorized
5. Continues if authorized

#### Pattern 2: Permission-Based Check
```typescript
// API Route
import { hasPermission } from '@/lib/auth/permissions'

const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', auth.user.id)
  .single()

if (!hasPermission(user.role, 'manage_users')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Flow**:
1. API route authenticates user
2. Gets user role
3. Checks permission using `hasPermission()` function
4. Returns 403 if permission denied
5. Continues if permission granted

### 3.3 Database Queries

#### Pattern: Supabase Query with RLS
```typescript
// API Route
const { data: jobs, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('account_id', auth.accountId)
  .order('created_at', { ascending: false })
```

**Flow**:
1. API route creates Supabase client
2. Builds query with filters
3. Executes query
4. RLS policies automatically filter by account_id
5. Returns filtered results
6. API route returns JSON response

**Note**: Even if API route doesn't filter by account_id, RLS policies enforce it.

---

## 4. Database RLS Enforcement

### 4.1 RLS Policy Execution

#### Example: Jobs Table Policy
```sql
CREATE POLICY "Users can manage jobs in own account"
ON jobs FOR ALL
USING (account_id = get_user_account_id())
WITH CHECK (account_id = get_user_account_id());
```

**Flow**:
1. API route executes query: `SELECT * FROM jobs`
2. PostgreSQL evaluates RLS policies
3. Policy calls `get_user_account_id()` function
4. Function returns current user's account_id
5. Policy filters rows: `WHERE account_id = get_user_account_id()`
6. Only matching rows returned

### 4.2 Account Isolation

**Pattern**: All tables use account_id for isolation

**Flow**:
1. User belongs to one account (users.account_id)
2. All data belongs to account (tables.account_id)
3. RLS policies filter by account_id
4. Users can only access data in their account
5. Cross-account access prevented by RLS

### 4.3 Helper Functions

#### get_user_account_id()
```sql
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid AS $$
  SELECT account_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Used in**: Most RLS policies for account isolation

#### current_account_id()
```sql
-- Uses app.current_account_id session variable
-- Set by application layer before queries
```

**Used in**: Some RLS policies that use session variables

---

## 5. Complete Data Flow Examples

### 5.1 Example: View Jobs List

#### Flow Diagram
```
User clicks "Jobs" link
  ↓
PermissionGate checks 'view_all_jobs' permission
  ↓ (if granted)
Component renders JobsList
  ↓
React Query calls queryFn
  ↓
fetch('/api/jobs') with cookies
  ↓
API route: GET /api/jobs
  ↓
getAuthenticatedSession(request)
  ↓ (returns session)
Query users table for role
  ↓
Check role has 'view_all_jobs' permission
  ↓ (if granted)
supabase.from('jobs').select()
  ↓
RLS policy filters by account_id
  ↓
Returns jobs for user's account
  ↓
API returns JSON: { jobs: [...] }
  ↓
React Query updates cache
  ↓
Component re-renders with jobs data
```

#### Code Flow

**Component** (`components/jobs/jobs-list.tsx`):
```tsx
<PermissionGate requires="view_all_jobs">
  <JobsList />
</PermissionGate>

// Inside JobsList
const { data } = useQuery({
  queryKey: ['jobs'],
  queryFn: async () => {
    const res = await fetch('/api/jobs')
    return res.json()
  },
})
```

**API Route** (`app/api/jobs/route.ts`):
```typescript
export async function GET(request: Request) {
  const auth = await getAuthenticatedSession(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', auth.user.id)
    .single()
  
  if (!hasPermission(user.role, 'view_all_jobs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('account_id', auth.accountId)
  
  return NextResponse.json({ jobs })
}
```

**Database RLS**:
```sql
-- Automatically applied to query
SELECT * FROM jobs
WHERE account_id = get_user_account_id()  -- Added by RLS policy
```

### 5.2 Example: Create Job

#### Flow Diagram
```
User fills job form and clicks "Create"
  ↓
Component calls mutation.mutate(jobData)
  ↓
React Query calls mutationFn
  ↓
fetch('/api/jobs', { method: 'POST', body: JSON.stringify(jobData) })
  ↓
API route: POST /api/jobs
  ↓
getAuthenticatedSession(request)
  ↓ (returns session)
Validate request body (Zod schema)
  ↓
Check role has 'create_jobs' permission
  ↓ (if granted)
supabase.from('jobs').insert({ ...jobData, account_id: auth.accountId })
  ↓
RLS policy WITH CHECK clause validates account_id
  ↓ (if valid)
Job inserted into database
  ↓
API returns JSON: { job: {...} }
  ↓
React Query invalidates ['jobs'] cache
  ↓
Component refetches jobs list
```

#### Code Flow

**Component**:
```tsx
const mutation = useMutation({
  mutationFn: async (jobData) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    })
    return res.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] })
  },
})
```

**API Route**:
```typescript
export async function POST(request: Request) {
  const auth = await getAuthenticatedSession(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await request.json()
  
  if (!hasPermission(auth.userRole, 'create_jobs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const { data: job } = await supabase
    .from('jobs')
    .insert({
      ...body,
      account_id: auth.accountId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  return NextResponse.json({ job })
}
```

**Database RLS**:
```sql
-- WITH CHECK clause validates insert
INSERT INTO jobs (account_id, ...)
VALUES (auth.accountId, ...)
-- RLS policy checks: account_id = get_user_account_id()
```

### 5.3 Example: Update Job (Tech Role)

#### Flow Diagram
```
Tech user updates job status
  ↓
PermissionGate checks 'edit_jobs' permission
  ↓ (tech has edit_jobs)
Component calls mutation
  ↓
fetch('/api/jobs/[id]', { method: 'PATCH', body: { status: 'completed' } })
  ↓
API route: PATCH /api/jobs/[id]
  ↓
getAuthenticatedSession(request)
  ↓
Check role has 'edit_jobs' permission
  ↓ (tech has edit_jobs)
Additional check: Is tech assigned to this job?
  ↓
supabase.from('jobs').update({ status: 'completed' }).eq('id', id)
  ↓
RLS policy filters by account_id
  ↓
WITH CHECK validates account_id matches
  ↓
Job updated
  ↓
API returns updated job
```

**Note**: Tech role can edit jobs, but business logic may restrict to assigned jobs only.

---

## 6. Permission Check Layers

### 6.1 Layer 1: UI (PermissionGate)

**Purpose**: UX - Hide/show UI elements  
**Enforcement**: Client-side only  
**Bypass**: Admin role bypasses all checks  
**Security**: Not secure - can be bypassed by modifying client code

**Checks**:
- User role from `/api/users/me`
- Permission mapping from `lib/auth/permissions.ts`
- Conditional rendering based on permission

### 6.2 Layer 2: API Route

**Purpose**: Business logic - Control API access  
**Enforcement**: Server-side  
**Bypass**: None (except service role)  
**Security**: Secure - enforced on server

**Checks**:
- Authentication via `getAuthenticatedSession()`
- Role validation via database query
- Permission checks via `hasPermission()` function
- Returns 401 (Unauthorized) or 403 (Forbidden) on failure

### 6.3 Layer 3: Database RLS

**Purpose**: Data security - Enforce data access  
**Enforcement**: Database-level  
**Bypass**: Service role only  
**Security**: Most secure - enforced at database level

**Checks**:
- Account isolation via `account_id` filtering
- Role-based policies for admin-only tables
- User-specific policies for user-owned data
- Automatic filtering on all queries

---

## 7. Account Isolation Flow

### 7.1 Multi-Tenant Pattern

**Principle**: All data belongs to an account, users belong to accounts

**Flow**:
1. User logs in → Gets `account_id` from users table
2. API route gets `account_id` from session
3. All queries filter by `account_id`
4. RLS policies enforce `account_id` matching
5. Cross-account access prevented

### 7.2 Account ID Propagation

```
User Login
  ↓
users table: { id: user_id, account_id: account_123 }
  ↓
Session: { user: { id: user_id }, accountId: account_123 }
  ↓
API Route: auth.accountId = account_123
  ↓
Database Query: .eq('account_id', account_123)
  ↓
RLS Policy: WHERE account_id = get_user_account_id() → account_123
  ↓
Result: Only data with account_id = account_123
```

---

## 8. Error Flow

### 8.1 Authentication Errors

**Flow**:
1. API route calls `getAuthenticatedSession(request)`
2. Returns `null` if not authenticated
3. API route returns 401 Unauthorized
4. Component receives 401 response
5. Component shows error or redirects to login

### 8.2 Permission Errors

**Flow**:
1. API route checks permission
2. Permission denied
3. API route returns 403 Forbidden
4. Component receives 403 response
5. Component shows "Access Denied" message

### 8.3 Database Errors

**Flow**:
1. Database query executed
2. RLS policy denies access
3. Supabase returns error (406 or 500)
4. API route catches error
5. API route returns 500 Internal Server Error
6. Component shows error message

### 8.4 Validation Errors

**Flow**:
1. API route validates request body
2. Validation fails (Zod schema)
3. API route returns 400 Bad Request
4. Component receives validation errors
5. Component displays field-level errors

---

## 9. Real-time Data Flow

### 9.1 Supabase Realtime Subscriptions

**Pattern**:
```tsx
useEffect(() => {
  const channel = supabase
    .channel('conversations')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `account_id=eq.${accountId}`,
    }, (payload) => {
      // Update local state
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [accountId])
```

**Flow**:
1. Component subscribes to table changes
2. Supabase Realtime monitors database
3. Change occurs (INSERT/UPDATE/DELETE)
4. RLS policies filter change by account_id
5. Only matching changes sent to client
6. Component updates local state
7. UI re-renders with new data

---

## 10. Data Consistency Checks

### 10.1 Cross-Layer Consistency

**Check**: Permission checks should be consistent across layers

**Example**:
- UI: PermissionGate checks `view_all_jobs`
- API: Route checks `hasPermission(role, 'view_all_jobs')`
- Database: RLS allows SELECT on jobs table

**Mismatch Detection**:
- UI allows access but API denies → User sees error
- API allows access but RLS denies → Database error
- RLS allows access but API denies → Inconsistent (bug)

### 10.2 Account Isolation Consistency

**Check**: All layers enforce account isolation

**Example**:
- API route filters by `account_id`
- RLS policy filters by `account_id`
- Both should match

**Mismatch Detection**:
- API filters by account_123
- RLS filters by account_456
- User sees wrong account's data (security bug)

---

**End of Data Flow Documentation**

12:21:04 Dec 03, 2025

