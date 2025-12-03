# Multi-Tenant Security Assessment

**Generated:** 21:54:49 Nov 26, 2025

## Executive Summary

The current multi-tenant setup has **good foundational security** with RLS policies, but there are **several critical vulnerabilities** that need to be addressed before production use with multiple tenants.

**Overall Security Rating: ⚠️ MODERATE RISK** (needs improvements)

---

## ✅ Security Strengths

### 1. Row Level Security (RLS) Policies
- **Status**: ✅ Implemented on most tables
- **Coverage**: 28 tables have RLS policies
- **Function**: Uses `get_user_account_id()` to filter by `account_id`
- **Protection**: Prevents users from accessing other tenants' data at the database level

### 2. Database-Level Constraints
- **Unique Slug Constraint**: Prevents duplicate account slugs
- **Foreign Key Constraints**: Ensures referential integrity
- **Account ID Required**: All tenant tables require `account_id`

### 3. Account Isolation Function
```sql
get_user_account_id() -- Returns account_id for current authenticated user
```
- Used in RLS policies to filter data
- Prevents cross-tenant queries

---

## ⚠️ Critical Security Vulnerabilities

### 1. Service Role Key Usage (CRITICAL)

**Issue**: Service role key bypasses ALL RLS policies

**Found in:**
- `app/api/jobs/route.ts` (line 119-129) - **TEMPORARY** but still active
- `app/api/llm/route.ts` (line 96-97) - Service role authentication
- `app/api/llm/metrics/route.ts` (line 28-31) - Service role authentication
- Multiple scripts use service role key

**Risk**: 
- If service role key is exposed, attacker has full database access
- Can read/write data from ANY tenant
- No tenant isolation when using service role

**Recommendation**:
- Remove all service role usage from API routes
- Only use service role in:
  - Server-side scripts (not exposed to web)
  - Edge functions with proper validation
  - Admin operations with additional authorization checks

### 2. Temporary Auth Bypass (CRITICAL)

**Location**: `app/api/jobs/route.ts` (line 111-116)

```typescript
// TEMPORARY: Skip auth for voice agent testing
// const auth = await getAuthenticatedSession(request)
const auth = { user: { id: 'test-user' } } // Mock auth for testing
```

**Risk**:
- Authentication is completely disabled
- Anyone can access jobs endpoint
- No tenant isolation
- Can access/modify any tenant's jobs

**Recommendation**:
- **IMMEDIATELY** remove this bypass
- Implement proper authentication
- Use authenticated user's account_id

### 3. Hardcoded Account ID (HIGH RISK)

**Location**: `app/api/jobs/route.ts` (line 140)

```typescript
const accountId = process.env.DEFAULT_ACCOUNT_ID || 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'
```

**Risk**:
- All requests default to one account
- No tenant isolation
- If env var is missing, hardcoded account ID is used
- Works for single tenant but breaks multi-tenant

**Recommendation**:
- Always use authenticated user's account_id
- Remove DEFAULT_ACCOUNT_ID fallback
- Validate account_id matches user's account

### 4. Missing RLS Policies on Some Tables

**Tables with minimal/no RLS policies:**
- `accounts` - Only 1 policy (SELECT only)
- `contacts` - Only 1 policy
- `conversations` - Only 1 policy
- `messages` - Only 1 policy
- `knowledge_docs` - Only 1 policy
- `gps_logs` - Only 1 policy
- `voice_navigation_commands` - Only 1 policy

**Risk**:
- May allow unauthorized access if policies are incomplete
- Need to verify all CRUD operations are protected

**Recommendation**:
- Audit each table's RLS policies
- Ensure SELECT, INSERT, UPDATE, DELETE are all protected
- Test with different user accounts

### 5. Service Role in Client-Side Accessible Code

**Found in**: 
- `app/api/meetings/route.ts` (line 89) - Uses service role in API route
- `app/api/webhooks/stripe/route.ts` - Uses service role

**Risk**:
- If API route is compromised, service role key could be exposed
- Service role key should never be in client-accessible code paths

**Recommendation**:
- Use authenticated Supabase client instead
- Only use service role for server-side operations
- Add additional authorization checks

---

## 🔒 Security Best Practices Missing

### 1. Input Validation
- Need to validate `account_id` in all API requests
- Ensure user can only access their own account_id
- Prevent account_id injection attacks

### 2. Audit Logging
- `crmai_audit` table exists but may not be comprehensive
- Should log all cross-tenant access attempts
- Should log all account_id changes

### 3. Rate Limiting
- No rate limiting on API endpoints
- Could allow brute force attacks
- Could allow DoS attacks

### 4. Account Switching Protection
- No protection against users trying to switch accounts
- Should validate account_id matches user's account on every request
- Should prevent account_id manipulation

### 5. Email Domain Validation
- `inbound_email_domain` not validated
- Could allow email spoofing
- Should validate domain ownership

---

## 📋 Recommended Security Improvements

### Immediate (Before Multi-Tenant Production)

1. **Remove Auth Bypass**
   ```typescript
   // REMOVE THIS:
   const auth = { user: { id: 'test-user' } }
   
   // REPLACE WITH:
   const auth = await getAuthenticatedSession(request)
   if (!auth) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

2. **Remove Service Role from API Routes**
   - Replace with authenticated Supabase client
   - Use user's account_id from authenticated session
   - Add authorization checks for admin operations

3. **Remove DEFAULT_ACCOUNT_ID**
   - Always get account_id from authenticated user
   - Validate account_id matches user's account
   - Remove hardcoded account IDs

4. **Add Account ID Validation Middleware**
   ```typescript
   async function validateAccountAccess(
     request: Request,
     accountId: string
   ): Promise<boolean> {
     const auth = await getAuthenticatedSession(request)
     if (!auth) return false
     
     const { data: user } = await supabase
       .from('users')
       .select('account_id')
       .eq('id', auth.user.id)
       .single()
     
     return user?.account_id === accountId
   }
   ```

### Short Term (Within 1-2 Weeks)

5. **Comprehensive RLS Policy Audit**
   - Verify all tables have complete RLS coverage
   - Test with multiple tenant accounts
   - Ensure INSERT/UPDATE/DELETE are protected

6. **Add Audit Logging**
   - Log all account_id access attempts
   - Log all cross-tenant queries
   - Alert on suspicious activity

7. **Input Validation**
   - Validate all account_id parameters
   - Sanitize all user inputs
   - Prevent SQL injection (Supabase handles this, but validate anyway)

### Long Term (Within 1 Month)

8. **Rate Limiting**
   - Implement rate limiting on all API endpoints
   - Per-account rate limits
   - Per-user rate limits

9. **Security Monitoring**
   - Monitor for cross-tenant access attempts
   - Alert on service role key usage
   - Track authentication failures

10. **Penetration Testing**
    - Hire security firm to test multi-tenant isolation
    - Test with multiple tenant accounts
    - Verify RLS policies work correctly

---

## 🧪 Testing Recommendations

### Multi-Tenant Isolation Tests

1. **Create Two Test Accounts**
   ```sql
   -- Account 1
   INSERT INTO accounts (name, slug) VALUES ('Test Co 1', 'testco1');
   
   -- Account 2
   INSERT INTO accounts (name, slug) VALUES ('Test Co 2', 'testco2');
   ```

2. **Create Users in Each Account**
   - User A in Account 1
   - User B in Account 2

3. **Test Data Isolation**
   - User A should only see Account 1 data
   - User B should only see Account 2 data
   - User A should NOT see Account 2 data
   - User B should NOT see Account 1 data

4. **Test API Endpoints**
   - Test all API endpoints with both users
   - Verify account_id filtering works
   - Verify no cross-tenant data leakage

5. **Test Service Role Bypass**
   - Verify service role cannot be used from client
   - Verify service role requires additional authorization
   - Test edge cases

---

## ✅ Security Checklist

Before enabling multi-tenant production:

- [ ] Remove all auth bypasses
- [ ] Remove service role from API routes
- [ ] Remove DEFAULT_ACCOUNT_ID
- [ ] Add account_id validation middleware
- [ ] Audit all RLS policies
- [ ] Test with multiple tenant accounts
- [ ] Add audit logging
- [ ] Add input validation
- [ ] Add rate limiting
- [ ] Security penetration testing
- [ ] Document security procedures
- [ ] Train team on multi-tenant security

---

## Conclusion

The current setup has **good foundations** but needs **critical fixes** before multi-tenant production use. The main concerns are:

1. **Service role key usage** in API routes (bypasses RLS)
2. **Temporary auth bypass** still active
3. **Hardcoded account IDs** instead of user-based account_id
4. **Incomplete RLS coverage** on some tables

**Recommendation**: Fix critical vulnerabilities before adding second tenant. The system is currently safe for single-tenant use but needs improvements for multi-tenant.

