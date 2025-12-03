# Impersonation API Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                               │
│                                                                             │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ UserImpersonation │  │  Impersonation   │  │ ImpersonationBanner  │   │
│  │     Selector      │  │     Context      │  │                      │   │
│  │   (Dropdown)      │  │  (State Mgmt)    │  │   (Warning Banner)   │   │
│  └─────────┬─────────┘  └────────┬─────────┘  └──────────────────────┘   │
│            │                     │                                         │
│            └─────────────────────┴──────────────────────┐                  │
└────────────────────────────────────────────────────────┼──────────────────┘
                                                          │
                                                          │ HTTP Requests
                                                          │
┌─────────────────────────────────────────────────────────┼──────────────────┐
│                         NEXT.JS API ROUTES              │                  │
│                                                          ▼                  │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  GET /api/admin/impersonatable-users                                 │ │
│  │  ┌───────────────────────────────────────────────────────┐           │ │
│  │  │ 1. Authenticate user (getAuthenticatedSession)        │           │ │
│  │  │ 2. Verify owner role                                  │           │ │
│  │  │ 3. Query users table (same account, exclude owners)   │           │ │
│  │  │ 4. Fetch emails from auth.users (admin client)        │           │ │
│  │  │ 5. Return list with current user first               │           │ │
│  │  └───────────────────────────────────────────────────────┘           │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  POST /api/admin/impersonate                                         │ │
│  │  ┌───────────────────────────────────────────────────────┐           │ │
│  │  │ 1. Authenticate user                                  │           │ │
│  │  │ 2. Verify owner role                                  │           │ │
│  │  │ 3. Call can_impersonate_user() DB function    ────────┼───────┐   │ │
│  │  │ 4. Create audit log entry                             │       │   │ │
│  │  │ 5. Return sessionId + impersonated user details       │       │   │ │
│  │  └───────────────────────────────────────────────────────┘       │   │ │
│  └──────────────────────────────────────────────────────────────────┼───┘ │
│                                                                       │     │
│  ┌──────────────────────────────────────────────────────────────────┼───┐ │
│  │  POST /api/admin/stop-impersonate                                │   │ │
│  │  ┌───────────────────────────────────────────────────────┐       │   │ │
│  │  │ 1. Authenticate user                                  │       │   │ │
│  │  │ 2. Verify owner role                                  │       │   │ │
│  │  │ 3. Call end_impersonation_session() DB function ──────┼───────┤   │ │
│  │  │ 4. Return success confirmation                        │       │   │ │
│  │  └───────────────────────────────────────────────────────┘       │   │ │
│  └──────────────────────────────────────────────────────────────────┼───┘ │
└─────────────────────────────────────────────────────────────────────┼─────┘
                                                                       │
                                                                       │
┌──────────────────────────────────────────────────────────────────────┼────┐
│                         SUPABASE DATABASE                            ▼    │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  FUNCTIONS                                                         │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │  can_impersonate_user(real_user_id, target_user_id)       │   │  │
│  │  │  ├─ Check real user is owner                             │   │  │
│  │  │  ├─ Check target is not owner                            │   │  │
│  │  │  ├─ Check same account                                   │   │  │
│  │  │  ├─ Check not self                                       │   │  │
│  │  │  └─ Check no active sessions                            │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                     │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │  end_impersonation_session(session_id)                    │   │  │
│  │  │  ├─ Validate session belongs to caller                   │   │  │
│  │  │  ├─ Set ended_at = now()                                 │   │  │
│  │  │  └─ Calculate duration                                   │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  TABLES                                                            │  │
│  │  ┌─────────────────────────┐  ┌──────────────────────────────┐    │  │
│  │  │ users                   │  │ user_impersonation_logs      │    │  │
│  │  ├─────────────────────────┤  ├──────────────────────────────┤    │  │
│  │  │ id (uuid)              │  │ id (uuid)                    │    │  │
│  │  │ account_id (uuid)      │  │ account_id (uuid)            │    │  │
│  │  │ full_name (text)       │  │ real_user_id (uuid) ─────────┼────┤  │
│  │  │ role (text)            │  │ impersonated_user_id (uuid)  │    │  │
│  │  │ avatar_url (text)      │  │ started_at (timestamptz)     │    │  │
│  │  └─────────────────────────┘  │ ended_at (timestamptz)       │    │  │
│  │                                │ duration_seconds (integer)   │    │  │
│  │  ┌─────────────────────────┐  │ ip_address (inet)            │    │  │
│  │  │ auth.users              │  │ user_agent (text)            │    │  │
│  │  ├─────────────────────────┤  │ actions_performed (jsonb)    │    │  │
│  │  │ id (uuid)              │  │ pages_visited (text[])       │    │  │
│  │  │ email (text)           │  │ api_calls_made (jsonb)       │    │  │
│  │  └─────────────────────────┘  └──────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  RLS POLICIES                                                      │  │
│  │  ├─ Owners can view impersonation logs (same account)              │  │
│  │  ├─ Owners can create impersonation logs (own user_id)             │  │
│  │  └─ Owners can update their impersonation logs (end session)       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram: Complete Impersonation Flow

```
Owner                 Frontend             API Routes           Database
  │                      │                      │                   │
  │  1. Open dropdown    │                      │                   │
  │─────────────────────>│                      │                   │
  │                      │                      │                   │
  │                      │  GET /impersonatable-users               │
  │                      │─────────────────────>│                   │
  │                      │                      │                   │
  │                      │                      │  SELECT users     │
  │                      │                      │  (same account,   │
  │                      │                      │   exclude owners) │
  │                      │                      │──────────────────>│
  │                      │                      │                   │
  │                      │                      │  Users list       │
  │                      │                      │<──────────────────│
  │                      │                      │                   │
  │                      │                      │  Get emails from  │
  │                      │                      │  auth.users       │
  │                      │                      │──────────────────>│
  │                      │                      │                   │
  │                      │                      │  Emails           │
  │                      │                      │<──────────────────│
  │                      │                      │                   │
  │                      │  { users: [...] }    │                   │
  │                      │<─────────────────────│                   │
  │                      │                      │                   │
  │  2. Select "Tech"    │                      │                   │
  │─────────────────────>│                      │                   │
  │                      │                      │                   │
  │                      │  POST /impersonate   │                   │
  │                      │  {targetUserId}      │                   │
  │                      │─────────────────────>│                   │
  │                      │                      │                   │
  │                      │                      │  can_impersonate_ │
  │                      │                      │  user(owner, tech)│
  │                      │                      │──────────────────>│
  │                      │                      │                   │
  │                      │                      │  true ✓           │
  │                      │                      │<──────────────────│
  │                      │                      │                   │
  │                      │                      │  INSERT INTO      │
  │                      │                      │  impersonation_   │
  │                      │                      │  logs             │
  │                      │                      │──────────────────>│
  │                      │                      │                   │
  │                      │                      │  {id, started_at} │
  │                      │                      │<──────────────────│
  │                      │                      │                   │
  │                      │  { success: true,    │                   │
  │                      │    sessionId,        │                   │
  │                      │    impersonatedUser} │                   │
  │                      │<─────────────────────│                   │
  │                      │                      │                   │
  │  3. See banner       │                      │                   │
  │  "Viewing as Tech"   │                      │                   │
  │<─────────────────────│                      │                   │
  │                      │                      │                   │
  │  ... Browse as tech  │                      │                   │
  │  ... See tech data   │                      │                   │
  │                      │                      │                   │
  │  4. Click "Exit"     │                      │                   │
  │─────────────────────>│                      │                   │
  │                      │                      │                   │
  │                      │  POST /stop-         │                   │
  │                      │  impersonate         │                   │
  │                      │  {sessionId}         │                   │
  │                      │─────────────────────>│                   │
  │                      │                      │                   │
  │                      │                      │  end_impersonation│
  │                      │                      │  _session(id)     │
  │                      │                      │──────────────────>│
  │                      │                      │                   │
  │                      │                      │  UPDATE ended_at, │
  │                      │                      │  calc duration    │
  │                      │                      │                   │
  │                      │                      │  true ✓           │
  │                      │                      │<──────────────────│
  │                      │                      │                   │
  │                      │  { success: true }   │                   │
  │                      │<─────────────────────│                   │
  │                      │                      │                   │
  │  5. Return to owner  │                      │                   │
  │     view             │                      │                   │
  │<─────────────────────│                      │                   │
  │                      │                      │                   │
```

## Security Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MULTI-LAYER SECURITY VALIDATION                     │
└─────────────────────────────────────────────────────────────────────────┘

Request comes in
      │
      ▼
┌──────────────────────────────────────┐
│  LAYER 1: API Route Authentication   │
│  ┌────────────────────────────────┐  │
│  │ getAuthenticatedSession()      │  │
│  │ ├─ Check session cookie        │  │
│  │ └─ Verify with Supabase Auth   │  │
│  └────────────────────────────────┘  │
└────────────┬─────────────────────────┘
             │ ✓ Authenticated
             ▼
┌──────────────────────────────────────┐
│  LAYER 2: Role Authorization         │
│  ┌────────────────────────────────┐  │
│  │ Check user.role === 'owner'    │  │
│  │ └─ Query users table           │  │
│  └────────────────────────────────┘  │
└────────────┬─────────────────────────┘
             │ ✓ Is Owner
             ▼
┌──────────────────────────────────────┐
│  LAYER 3: Business Logic Validation  │
│  ┌────────────────────────────────┐  │
│  │ can_impersonate_user()         │  │
│  │ ├─ Owner role ✓                │  │
│  │ ├─ Not targeting owner ✓       │  │
│  │ ├─ Same account ✓              │  │
│  │ ├─ Not self ✓                  │  │
│  │ └─ No active session ✓         │  │
│  └────────────────────────────────┘  │
└────────────┬─────────────────────────┘
             │ ✓ All checks pass
             ▼
┌──────────────────────────────────────┐
│  LAYER 4: Database RLS Policies      │
│  ┌────────────────────────────────┐  │
│  │ Row Level Security enforced     │  │
│  │ ├─ Account isolation           │  │
│  │ └─ Owner-only access           │  │
│  └────────────────────────────────┘  │
└────────────┬─────────────────────────┘
             │ ✓ RLS passes
             ▼
┌──────────────────────────────────────┐
│  LAYER 5: Audit Logging              │
│  ┌────────────────────────────────┐  │
│  │ Log to impersonation_logs      │  │
│  │ ├─ Who (real_user_id)          │  │
│  │ ├─ Target (impersonated_id)    │  │
│  │ ├─ When (started_at)            │  │
│  │ ├─ Where (ip_address)           │  │
│  │ └─ How (user_agent)             │  │
│  └────────────────────────────────┘  │
└────────────┬─────────────────────────┘
             │ ✓ Logged
             ▼
      ┌─────────────┐
      │  ALLOW      │
      │  ACCESS ✓   │
      └─────────────┘
```

## Error Handling Flow

```
Request
   │
   ▼
┌─────────────────────┐
│ No session/token?   │───Yes───> 401 Unauthorized
└──────┬──────────────┘
       │ No
       ▼
┌─────────────────────┐
│ User not owner?     │───Yes───> 403 Forbidden
└──────┬──────────────┘
       │ No
       ▼
┌─────────────────────┐
│ Target is owner?    │───Yes───> 403 Cannot impersonate owner
└──────┬──────────────┘
       │ No
       ▼
┌─────────────────────┐
│ Different account?  │───Yes───> 403 Cannot impersonate
└──────┬──────────────┘
       │ No
       ▼
┌─────────────────────┐
│ Target is self?     │───Yes───> 403 Cannot impersonate self
└──────┬──────────────┘
       │ No
       ▼
┌─────────────────────┐
│ Active session?     │───Yes───> 403 Already impersonating
└──────┬──────────────┘
       │ No
       ▼
┌─────────────────────┐
│ Target not found?   │───Yes───> 404 User not found
└──────┬──────────────┘
       │ No
       ▼
┌─────────────────────┐
│ Database error?     │───Yes───> 500 Internal error
└──────┬──────────────┘
       │ No
       ▼
    SUCCESS
    200 OK
```

## Data Flow: Impersonatable Users Endpoint

```
Request: GET /api/admin/impersonatable-users
   │
   ▼
┌─────────────────────────────────┐
│ Step 1: Authenticate            │
│ └─> getAuthenticatedSession()   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Step 2: Get current user info   │
│ └─> SELECT from users           │
│     WHERE id = auth.user.id     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Step 3: Verify owner role       │
│ └─> Check role === 'owner'      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Step 4: Query users             │
│ └─> SELECT from users           │
│     WHERE account_id = current  │
│     AND id != current           │
│     AND role != 'owner'         │
│     ORDER BY role, full_name    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Step 5: Enrich with emails      │
│ └─> For each user:              │
│     getUserById(user.id)        │
│     Extract email from auth     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Step 6: Prepend current user    │
│ └─> Add current user with       │
│     isSelf: true as first item  │
└────────┬────────────────────────┘
         │
         ▼
Response: { users: [...] }
```
