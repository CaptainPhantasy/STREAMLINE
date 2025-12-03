# Impersonation API - Quick Reference Card

## Quick Start

```typescript
// 1. Fetch users
const users = await fetch('/api/admin/impersonatable-users').then(r => r.json());

// 2. Start impersonating
const { sessionId } = await fetch('/api/admin/impersonate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ targetUserId: users.users[1].id })
}).then(r => r.json());

// 3. Stop impersonating
await fetch('/api/admin/stop-impersonate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});
```

## API Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/admin/impersonatable-users` | GET | List users to impersonate | Owner |
| `/api/admin/impersonate` | POST | Start impersonation | Owner |
| `/api/admin/stop-impersonate` | POST | End impersonation | Owner |

## Request/Response Formats

### GET /api/admin/impersonatable-users

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "User Name",
      "role": "admin|dispatcher|tech",
      "avatar_url": "https://...",
      "isSelf": true|false
    }
  ]
}
```

### POST /api/admin/impersonate

**Request:**
```json
{
  "targetUserId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "impersonatedUser": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "User Name",
    "role": "tech",
    "avatar_url": "https://..."
  }
}
```

### POST /api/admin/stop-impersonate

**Request:**
```json
{
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Impersonation session ended successfully"
}
```

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 401 | Unauthorized | No valid session/token |
| 403 | Forbidden | Not an owner, or trying to impersonate owner/self/different account |
| 404 | Not Found | User or session doesn't exist |
| 500 | Server Error | Database error or unexpected issue |

## Security Rules

- Only owners can impersonate
- Cannot impersonate other owners
- Cannot impersonate self
- Cannot impersonate users from different accounts
- Cannot have multiple active sessions
- All sessions are logged with IP and user agent

## Database Functions

```sql
-- Check if impersonation is allowed
SELECT can_impersonate_user(
  '00000000-0000-0000-0000-000000000001'::uuid,  -- real_user_id
  '00000000-0000-0000-0000-000000000002'::uuid   -- target_user_id
);

-- End a session
SELECT end_impersonation_session(
  '00000000-0000-0000-0000-000000000003'::uuid   -- session_id
);

-- Get active session
SELECT * FROM get_active_impersonation(
  '00000000-0000-0000-0000-000000000001'::uuid   -- real_user_id
);
```

## Audit Log Schema

```typescript
interface ImpersonationLog {
  id: string;
  account_id: string;
  real_user_id: string;
  impersonated_user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  ip_address: string | null;
  user_agent: string | null;
  actions_performed: any[];
  pages_visited: string[];
  api_calls_made: any[];
  created_at: string;
  updated_at: string;
}
```

## TypeScript Types

```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'dispatcher' | 'tech';
  avatar_url: string | null;
  isSelf?: boolean;
}

interface ImpersonateRequest {
  targetUserId: string;
}

interface ImpersonateResponse {
  success: boolean;
  sessionId: string;
  impersonatedUser: User;
}

interface StopImpersonateRequest {
  sessionId: string;
}

interface StopImpersonateResponse {
  success: boolean;
  message: string;
}
```

## React Hook Example

```typescript
function useImpersonation() {
  const [users, setUsers] = useState<User[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);

  async function fetchUsers() {
    const response = await fetch('/api/admin/impersonatable-users');
    const { users } = await response.json();
    setUsers(users);
  }

  async function startImpersonation(userId: string) {
    const response = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId }),
    });
    const data = await response.json();
    setSessionId(data.sessionId);
    setImpersonatedUser(data.impersonatedUser);
  }

  async function stopImpersonation() {
    if (!sessionId) return;
    await fetch('/api/admin/stop-impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    setSessionId(null);
    setImpersonatedUser(null);
  }

  return {
    users,
    sessionId,
    impersonatedUser,
    fetchUsers,
    startImpersonation,
    stopImpersonation,
  };
}
```

## Testing Commands

```bash
# Set your token
export TOKEN="your_access_token"

# List users
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/api/admin/impersonatable-users

# Start impersonation
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUserId":"USER_ID"}' \
  http://localhost:3002/api/admin/impersonate

# Stop impersonation
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID"}' \
  http://localhost:3002/api/admin/stop-impersonate
```

## Common Patterns

### Check if impersonating
```typescript
const isImpersonating = sessionId !== null && impersonatedUser !== null;
```

### Get current user (considering impersonation)
```typescript
const currentUser = impersonatedUser || realUser;
```

### Show banner when impersonating
```typescript
{isImpersonating && (
  <div className="bg-yellow-500 p-2">
    Viewing as {impersonatedUser.full_name}
    <button onClick={stopImpersonation}>Exit</button>
  </div>
)}
```

### Filter users for dropdown
```typescript
const selectableUsers = users.filter(u => !u.isSelf);
const selfUser = users.find(u => u.isSelf);
```

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Related Files

- **API Routes:** `/app/api/admin/*/route.ts`
- **Database Migration:** `/supabase/migrations/20251127_add_user_impersonation.sql`
- **Documentation:**
  - `AGENT_4_API_ROUTES_COMPLETION_REPORT.md`
  - `IMPERSONATION_API_SPECIFICATION.md`
  - `IMPERSONATION_FLOW_DIAGRAM.md`

## Support

For detailed documentation, see:
- API Specification: `IMPERSONATION_API_SPECIFICATION.md`
- Flow Diagrams: `IMPERSONATION_FLOW_DIAGRAM.md`
- Implementation Report: `AGENT_4_API_ROUTES_COMPLETION_REPORT.md`

---

**Quick Tips:**
- Always check `isSelf: true` in user list to identify current user
- Store `sessionId` in context or localStorage for persistence
- Display prominent warning banner when impersonating
- Clear session on logout or page refresh
- Monitor audit logs for security purposes
