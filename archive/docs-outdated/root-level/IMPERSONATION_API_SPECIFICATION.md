# Impersonation API Specification

## Overview
This document provides the complete API specification for the user impersonation feature. All endpoints require owner-level authentication.

---

## Authentication
All endpoints require authentication via session cookie or Bearer token:

```bash
# Cookie-based (browser)
Cookie: sb-<project>-auth-token=...

# Bearer token (API)
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. GET /api/admin/impersonatable-users

Retrieves a list of users that the authenticated owner can impersonate.

#### Request
- **Method:** GET
- **Authentication:** Required (Owner role only)
- **Headers:** Standard authentication headers

#### Response

**Success (200 OK):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "owner@example.com",
      "full_name": "Current User",
      "role": "owner",
      "avatar_url": "https://...",
      "isSelf": true
    },
    {
      "id": "uuid",
      "email": "admin@example.com",
      "full_name": "Admin User",
      "role": "admin",
      "avatar_url": "https://...",
      "isSelf": false
    },
    {
      "id": "uuid",
      "email": "dispatcher@example.com",
      "full_name": "Dispatcher User",
      "role": "dispatcher",
      "avatar_url": null,
      "isSelf": false
    },
    {
      "id": "uuid",
      "email": "tech@example.com",
      "full_name": "Tech User",
      "role": "tech",
      "avatar_url": null,
      "isSelf": false
    }
  ]
}
```

**Notes:**
- First user in array is always the current user with `isSelf: true`
- Users are sorted by role (admin, dispatcher, tech), then by full_name
- Only includes users from the same account
- Excludes other owners
- Empty array if no impersonatable users exist

**Error Responses:**

```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "error": "Forbidden: Only owners can impersonate users"
}

// 404 Not Found
{
  "error": "User not found"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error"
}
```

#### Example Usage

```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/api/admin/impersonatable-users
```

```typescript
// Frontend usage
const response = await fetch('/api/admin/impersonatable-users');
const { users } = await response.json();
```

---

### 2. POST /api/admin/impersonate

Starts an impersonation session with a target user.

#### Request
- **Method:** POST
- **Authentication:** Required (Owner role only)
- **Content-Type:** application/json

**Body:**
```json
{
  "targetUserId": "uuid"
}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "sessionId": "uuid",
  "impersonatedUser": {
    "id": "uuid",
    "email": "tech@example.com",
    "full_name": "Tech User",
    "role": "tech",
    "avatar_url": null
  }
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "error": "targetUserId is required"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not an owner
{
  "error": "Forbidden: Only owners can impersonate users"
}

// 403 Forbidden - Cannot impersonate this user
{
  "error": "Forbidden: Cannot impersonate this user"
}
// Reasons this can fail:
// - Target is an owner
// - Target is from different account
// - Target is self
// - Already have an active impersonation session

// 404 Not Found
{
  "error": "Target user not found"
}

// 500 Internal Server Error
{
  "error": "Failed to validate impersonation permission"
}
// or
{
  "error": "Failed to create impersonation session"
}
// or
{
  "error": "Internal Server Error"
}
```

#### Security Validations

The endpoint performs the following validations:
1. User is authenticated
2. User has owner role
3. Target user exists
4. `can_impersonate_user()` database function returns true, which checks:
   - Real user is owner
   - Target user is not owner
   - Both users in same account
   - Real user is not target user (not self)
   - No active impersonation session exists

#### Audit Logging

Creates an entry in `user_impersonation_logs` table with:
- `account_id` - Account ID
- `real_user_id` - Owner performing impersonation
- `impersonated_user_id` - Target user being impersonated
- `started_at` - Timestamp when session started
- `ip_address` - IP address of request (from x-forwarded-for or x-real-ip headers)
- `user_agent` - Browser/client user agent string

#### Example Usage

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUserId":"550e8400-e29b-41d4-a716-446655440000"}' \
  http://localhost:3002/api/admin/impersonate
```

```typescript
// Frontend usage
const response = await fetch('/api/admin/impersonate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ targetUserId: userId }),
});
const { success, sessionId, impersonatedUser } = await response.json();
```

---

### 3. POST /api/admin/stop-impersonate

Ends an active impersonation session.

#### Request
- **Method:** POST
- **Authentication:** Required (Owner role only)
- **Content-Type:** application/json

**Body:**
```json
{
  "sessionId": "uuid"
}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Impersonation session ended successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "error": "sessionId is required"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "error": "Forbidden: Only owners can manage impersonation sessions"
}

// 404 Not Found
{
  "error": "Session not found or already ended"
}
// Reasons:
// - Session ID doesn't exist
// - Session already has ended_at timestamp
// - Session belongs to different user

// 500 Internal Server Error
{
  "error": "Failed to end impersonation session"
}
// or
{
  "error": "Internal Server Error"
}
```

#### Database Updates

Calls `end_impersonation_session()` database function which:
- Sets `ended_at` timestamp to current time
- Updates `updated_at` timestamp
- Triggers duration calculation (generated column)
- Validates session belongs to authenticated user

#### Example Usage

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"550e8400-e29b-41d4-a716-446655440000"}' \
  http://localhost:3002/api/admin/stop-impersonate
```

```typescript
// Frontend usage
const response = await fetch('/api/admin/stop-impersonate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId }),
});
const { success, message } = await response.json();
```

---

## Complete Flow Example

### Starting and Ending Impersonation

```typescript
// 1. Get list of users
const usersResponse = await fetch('/api/admin/impersonatable-users');
const { users } = await usersResponse.json();

// 2. Find user to impersonate
const targetUser = users.find(u => u.role === 'tech' && !u.isSelf);

// 3. Start impersonation
const startResponse = await fetch('/api/admin/impersonate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ targetUserId: targetUser.id }),
});
const { sessionId, impersonatedUser } = await startResponse.json();

// 4. Store session ID (localStorage, context, etc.)
localStorage.setItem('impersonationSessionId', sessionId);

// 5. Later... end impersonation
const endResponse = await fetch('/api/admin/stop-impersonate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId }),
});
const { success } = await endResponse.json();

// 6. Clear stored session
localStorage.removeItem('impersonationSessionId');
```

---

## Error Handling

### Frontend Error Handling Pattern

```typescript
async function impersonateUser(userId: string) {
  try {
    const response = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId }),
    });

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 401:
          // Redirect to login
          window.location.href = '/login';
          break;
        case 403:
          // Show permission error
          toast.error(error.error);
          break;
        case 404:
          // User not found
          toast.error('User not found');
          break;
        default:
          // Generic error
          toast.error('Failed to start impersonation');
      }

      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Impersonation error:', error);
    toast.error('Network error');
    return null;
  }
}
```

---

## Security Notes

### Authorization Flow
1. **Session Validation:** All requests validated via `getAuthenticatedSession()`
2. **Role Check:** User role must be 'owner'
3. **Database Validation:** `can_impersonate_user()` enforces business rules
4. **RLS Policies:** Row-level security ensures data isolation

### Audit Trail
All impersonation actions are logged with:
- Who performed the action (real_user_id)
- Who was impersonated (impersonated_user_id)
- When it happened (started_at, ended_at)
- How long it lasted (duration_seconds)
- Where it came from (ip_address)
- What client was used (user_agent)

### Rate Limiting Considerations
No rate limiting is currently implemented on these endpoints. Consider adding:
- Rate limit on impersonation attempts (e.g., 10 per minute)
- Alert on suspicious patterns (many users impersonated quickly)
- Monitoring for security anomalies

---

## Database Schema Reference

### user_impersonation_logs Table

```sql
CREATE TABLE user_impersonation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  real_user_id uuid NOT NULL REFERENCES users(id),
  impersonated_user_id uuid NOT NULL REFERENCES users(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer GENERATED ALWAYS AS (...) STORED,
  actions_performed jsonb DEFAULT '[]'::jsonb,
  pages_visited text[] DEFAULT ARRAY[]::text[],
  api_calls_made jsonb DEFAULT '[]'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Database Functions

```sql
-- Check if impersonation is allowed
can_impersonate_user(
  p_real_user_id uuid,
  p_target_user_id uuid
) RETURNS boolean

-- End an impersonation session
end_impersonation_session(
  p_session_id uuid
) RETURNS boolean

-- Get active impersonation session (not used by API yet)
get_active_impersonation(
  p_real_user_id uuid
) RETURNS TABLE (...)

-- Log impersonation action (not used by API yet)
log_impersonation_action(
  p_session_id uuid,
  p_action_type text,
  p_action_details jsonb
) RETURNS boolean
```

---

## Testing

### Manual Testing Commands

```bash
# Set your access token
export TOKEN="your_access_token_here"

# Test 1: Get impersonatable users
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/api/admin/impersonatable-users

# Test 2: Start impersonation (replace USER_ID)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUserId":"USER_ID"}' \
  http://localhost:3002/api/admin/impersonate

# Test 3: Stop impersonation (replace SESSION_ID)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID"}' \
  http://localhost:3002/api/admin/stop-impersonate
```

### Expected Test Results

1. **As Owner:**
   - GET /impersonatable-users → 200 with user list
   - POST /impersonate → 200 with session ID
   - POST /stop-impersonate → 200 with success message

2. **As Non-Owner (Admin/Dispatcher/Tech):**
   - All endpoints → 403 Forbidden

3. **Unauthenticated:**
   - All endpoints → 401 Unauthorized

4. **Invalid Scenarios:**
   - Impersonate owner → 403
   - Impersonate self → 403
   - Impersonate user from other account → 403
   - Start second session while one active → 403
   - End non-existent session → 404
   - End another user's session → 404

---

## Version History

- **v1.0** (2025-11-27): Initial implementation
  - Three endpoints created
  - Full security validation
  - Audit logging
  - Enhanced user list (includes self)

---

## Related Documentation

- **Implementation Report:** `AGENT_4_API_ROUTES_COMPLETION_REPORT.md`
- **Database Migration:** `supabase/migrations/20251127_add_user_impersonation.sql`
- **Frontend Context:** (To be created by Agent 5)
- **UI Components:** (To be created by Agent 6)
