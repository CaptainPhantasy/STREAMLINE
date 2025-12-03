# Verification Requirements Knowledge Base

**Last Updated**: 12:21:04 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Complete specification of what needs to be verified and how to verify it for bug finder configuration

---

## 1. Verification Scope

### 1.1 What Needs Verification

#### Permission System
- [ ] All 6 roles have correct permissions assigned
- [ ] All 30+ permissions are correctly mapped to roles
- [ ] Permission checking functions work correctly
- [ ] PermissionGate component works correctly
- [ ] Admin role bypasses PermissionGate (as designed)
- [ ] Permission checks are consistent across UI, API, and Database

#### API Endpoints
- [ ] All 241 API endpoints have authentication
- [ ] All API endpoints have permission checks (where required)
- [ ] All API endpoints enforce account isolation
- [ ] All API endpoints return correct status codes
- [ ] All API endpoints validate request data
- [ ] All API endpoints handle errors correctly

#### Database Schema
- [ ] All 80+ tables have RLS enabled
- [ ] All RLS policies are correctly defined
- [ ] All RLS policies enforce account isolation
- [ ] All foreign key constraints are correct
- [ ] All unique constraints are correct
- [ ] All check constraints are correct
- [ ] All indexes are present and optimized

#### Components
- [ ] All PermissionGate usages are correct
- [ ] All components make correct API calls
- [ ] All components handle errors correctly
- [ ] All components display correct data
- [ ] All components respect permission checks

#### Data Flow
- [ ] UI → API → Database flow works correctly
- [ ] Permission checks at each layer are consistent
- [ ] Account isolation is enforced at all layers
- [ ] Error handling works at each layer
- [ ] Real-time subscriptions work correctly

---

## 2. Verification Methods

### 2.1 Code Analysis

#### Static Analysis
- **Tool**: ESLint, TypeScript compiler
- **Purpose**: Find syntax errors, type errors, unused code
- **Scope**: All TypeScript/TSX files

#### Pattern Analysis
- **Tool**: grep, codebase_search
- **Purpose**: Find permission check patterns, API call patterns
- **Scope**: All source files

#### Dependency Analysis
- **Tool**: Manual review, dependency graphs
- **Purpose**: Understand component dependencies, API dependencies
- **Scope**: Components, API routes, database queries

### 2.2 Database Verification

#### Schema Verification
- **Method**: Query database schema directly
- **Tool**: Supabase MCP tools, SQL queries
- **Purpose**: Verify table structure, constraints, indexes
- **Queries**:
  ```sql
  -- List all tables
  SELECT * FROM information_schema.tables WHERE table_schema = 'public';
  
  -- List all RLS policies
  SELECT * FROM pg_policies WHERE schemaname = 'public';
  
  -- List all constraints
  SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';
  ```

#### RLS Policy Verification
- **Method**: Query RLS policies and test them
- **Tool**: Supabase MCP tools, SQL queries
- **Purpose**: Verify RLS policies are correct and enforced
- **Queries**:
  ```sql
  -- List all policies
  SELECT tablename, policyname, cmd, qual, with_check 
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  -- Test policy (as different user)
  SET ROLE authenticated;
  SET request.jwt.claim.sub = 'user-uuid';
  SELECT * FROM jobs; -- Should only return user's account jobs
  ```

### 2.3 API Testing

#### Endpoint Testing
- **Method**: HTTP requests to API endpoints
- **Tool**: curl, Postman, automated tests
- **Purpose**: Verify API endpoints work correctly
- **Test Cases**:
  - Authenticated requests
  - Unauthenticated requests (should return 401)
  - Requests with wrong permissions (should return 403)
  - Requests with invalid data (should return 400)
  - Requests for other account's data (should return empty/403)

#### Permission Testing
- **Method**: Test each endpoint with each role
- **Tool**: Automated test suite
- **Purpose**: Verify permission checks work correctly
- **Test Matrix**:
  - 6 roles × 241 endpoints = 1,446 test cases
  - Each test: Should endpoint allow/deny access?

### 2.4 UI Testing

#### Component Testing
- **Method**: Render components with different user roles
- **Tool**: React Testing Library, Playwright
- **Purpose**: Verify components render correctly based on permissions
- **Test Cases**:
  - Component renders with correct permissions
  - Component hides with incorrect permissions
  - Component shows error on API failure
  - Component updates on data change

#### Integration Testing
- **Method**: End-to-end user flows
- **Tool**: Playwright
- **Purpose**: Verify complete user workflows
- **Test Cases**:
  - User logs in → Sees correct dashboard
  - User navigates to page → Sees correct data
  - User performs action → Action succeeds/fails correctly
  - User tries unauthorized action → Gets error

---

## 3. Verification Test Scenarios

### 3.1 Permission Verification Scenarios

#### Scenario 1: Admin Can Access Everything
**Test**:
1. Login as admin user
2. Navigate to each page
3. Verify all pages accessible
4. Verify all API endpoints return data
5. Verify PermissionGate always renders content

**Expected**: Admin can access all features

#### Scenario 2: Tech Can Only View Assigned Jobs
**Test**:
1. Login as tech user
2. Navigate to jobs page
3. Verify only assigned jobs shown
4. Call API `/api/jobs` directly
5. Verify API returns only assigned jobs
6. Verify database query filters by `tech_assigned_id`

**Expected**: Tech sees only assigned jobs at all layers

#### Scenario 3: Dispatcher Can Assign Jobs
**Test**:
1. Login as dispatcher user
2. Navigate to dispatch map
3. Assign job to tech
4. Verify API allows assignment
5. Verify database allows update
6. Verify tech can now see job

**Expected**: Dispatcher can assign jobs, tech sees assigned job

#### Scenario 4: Sales Cannot View Jobs
**Test**:
1. Login as sales user
2. Navigate to jobs page (if accessible)
3. Verify jobs page hidden or shows error
4. Call API `/api/jobs` directly
5. Verify API returns 403 Forbidden

**Expected**: Sales cannot access jobs at UI or API level

### 3.2 Account Isolation Verification Scenarios

#### Scenario 1: User Cannot Access Other Account's Data
**Test**:
1. Login as user in account_123
2. Query jobs for account_456
3. Verify API returns empty array or 403
4. Verify database RLS prevents access
5. Try to create job with account_456
6. Verify RLS prevents insert

**Expected**: User cannot access other account's data

#### Scenario 2: Cross-Account Data Leakage
**Test**:
1. Create user in account_123
2. Create user in account_456
3. Login as account_123 user
4. Query all contacts
5. Verify only account_123 contacts returned
6. Try to update account_456 contact
7. Verify RLS prevents update

**Expected**: No cross-account data leakage

### 3.3 Permission Consistency Verification Scenarios

#### Scenario 1: UI-API Consistency
**Test**:
1. For each permission, check UI PermissionGate
2. Check corresponding API endpoint permission check
3. Verify they match
4. If UI shows feature, API should allow
5. If UI hides feature, API should deny

**Expected**: UI and API permission checks are consistent

#### Scenario 2: API-Database Consistency
**Test**:
1. For each API endpoint, check permission
2. Check corresponding RLS policy
3. Verify they match
4. If API allows, RLS should allow
5. If API denies, RLS should also deny (defense in depth)

**Expected**: API and Database permission checks are consistent

### 3.4 Error Handling Verification Scenarios

#### Scenario 1: Unauthenticated Request
**Test**:
1. Make API request without authentication
2. Verify API returns 401 Unauthorized
3. Verify error message is clear
4. Verify UI handles 401 correctly

**Expected**: Unauthenticated requests return 401

#### Scenario 2: Unauthorized Request
**Test**:
1. Login as tech user
2. Try to access admin endpoint
3. Verify API returns 403 Forbidden
4. Verify error message indicates permission issue
5. Verify UI handles 403 correctly

**Expected**: Unauthorized requests return 403

#### Scenario 3: Invalid Data
**Test**:
1. Send API request with invalid data
2. Verify API returns 400 Bad Request
3. Verify error message includes validation details
4. Verify UI displays field-level errors

**Expected**: Invalid data returns 400 with details

---

## 4. Mismatch Detection Requirements

### 4.1 What Should Be Compared

#### Permission Checks Across Layers
**Compare**:
- UI PermissionGate requirements
- API route permission checks
- Database RLS policy conditions

**Expected**: All three should be consistent

**Mismatch Detection**:
- UI allows but API denies → User sees error (UX issue)
- UI allows but RLS denies → Database error (bug)
- API allows but RLS denies → Database error (bug)
- UI denies but API allows → Security issue (if user knows endpoint)

#### Account Isolation Across Layers
**Compare**:
- API route account_id filtering
- Database RLS account_id filtering
- Component account_id usage

**Expected**: All three should filter by same account_id

**Mismatch Detection**:
- API filters by account_123 but RLS filters by account_456 → Wrong data returned (security bug)
- Component uses account_123 but API uses account_456 → Wrong data displayed (bug)

#### Role Mappings
**Compare**:
- `lib/auth/permissions.ts` role mappings
- `lib/auth/role-routes.ts` role routes
- Database users.role values
- API route role checks

**Expected**: All should use same role definitions

**Mismatch Detection**:
- Permissions file has role 'manager' but database has 'admin' → Inconsistency (bug)

### 4.2 Consistency Checks Needed

#### Check 1: Permission Definition Consistency
**Verify**:
- All permissions defined in `lib/types/permissions.ts`
- All permissions mapped in `lib/auth/permissions.ts`
- All permissions used in PermissionGate components
- All permissions checked in API routes

**Mismatch**: Permission defined but never used, or used but not defined

#### Check 2: Role Definition Consistency
**Verify**:
- Roles defined in `lib/types/permissions.ts`
- Roles used in `lib/auth/permissions.ts`
- Roles used in `lib/auth/role-routes.ts`
- Roles checked in API routes
- Roles stored in database match

**Mismatch**: Role defined but never used, or used but not defined

#### Check 3: API Endpoint Consistency
**Verify**:
- All API endpoints listed in filetree
- All API endpoints have route handlers
- All API endpoints have permission checks (where needed)
- All API endpoints enforce account isolation

**Mismatch**: Endpoint listed but doesn't exist, or exists but not listed

#### Check 4: Database Table Consistency
**Verify**:
- All tables listed in schema documentation
- All tables have RLS enabled
- All tables have RLS policies defined
- All tables have account_id column (except auth tables)

**Mismatch**: Table exists but no RLS, or RLS enabled but no policies

### 4.3 Security Boundary Checks

#### Boundary 1: Account Isolation
**Verify**:
- Users cannot access other accounts' data
- API routes filter by account_id
- RLS policies filter by account_id
- Components use correct account_id

**Security Issue**: User can access other account's data

#### Boundary 2: Role-Based Access
**Verify**:
- Users cannot access features for higher roles
- API routes check roles correctly
- RLS policies check roles correctly (where applicable)
- Components check roles correctly

**Security Issue**: User can access features they shouldn't

#### Boundary 3: Permission-Based Access
**Verify**:
- Users cannot access features without permission
- API routes check permissions correctly
- Components check permissions correctly
- Permission checks are consistent across layers

**Security Issue**: User can access features without permission

---

## 5. Edge Cases to Verify

### 5.1 Authentication Edge Cases

#### Case 1: Expired Token
**Verify**: API returns 401, user redirected to login

#### Case 2: Invalid Token
**Verify**: API returns 401, user redirected to login

#### Case 3: Missing Token
**Verify**: API returns 401, user redirected to login

#### Case 4: Token Refresh
**Verify**: Token refreshes automatically, user stays logged in

### 5.2 Permission Edge Cases

#### Case 1: User Role Changed
**Verify**: User's permissions update immediately, UI reflects new permissions

#### Case 2: Permission Removed from Role
**Verify**: Users with that role lose access, UI hides features

#### Case 3: Admin Role Bypass
**Verify**: Admin bypasses PermissionGate but NOT RLS

#### Case 4: Impersonation
**Verify**: Impersonated user's permissions are used, not real user's

### 5.3 Account Isolation Edge Cases

#### Case 1: User Switches Accounts (if supported)
**Verify**: User sees only new account's data

#### Case 2: Account Deleted
**Verify**: Users in account cannot access data, appropriate error shown

#### Case 3: User Removed from Account
**Verify**: User cannot access account data, appropriate error shown

### 5.4 Data Edge Cases

#### Case 1: Empty Results
**Verify**: UI shows empty state, not error

#### Case 2: Large Datasets
**Verify**: Pagination works, performance acceptable

#### Case 3: Concurrent Updates
**Verify**: Last write wins, or conflict resolution works

#### Case 4: Deleted Related Records
**Verify**: Foreign key constraints prevent orphaned records, or cascade deletes work

---

## 6. Integration Points to Verify

### 6.1 UI-API Integration

**Verify**:
- Components call correct API endpoints
- API endpoints return expected data format
- Error handling works end-to-end
- Loading states work correctly

### 6.2 API-Database Integration

**Verify**:
- API queries use correct table names
- API queries use correct column names
- API queries filter by account_id
- RLS policies allow API queries
- Error handling works correctly

### 6.3 Real-time Integration

**Verify**:
- Supabase Realtime subscriptions work
- RLS policies allow real-time updates
- Components update on real-time changes
- Error handling works for real-time failures

---

## 7. Performance Verification

### 7.1 Query Performance

**Verify**:
- Queries return in < 1 second for typical data sizes
- Indexes are used for account_id filtering
- RLS policies don't cause performance issues
- Pagination works for large datasets

### 7.2 API Performance

**Verify**:
- API endpoints respond in < 500ms
- Rate limiting works correctly
- Caching works correctly
- Concurrent requests handled correctly

### 7.3 UI Performance

**Verify**:
- Components render in < 100ms
- React Query caching works correctly
- Debouncing works for rapid updates
- Large lists virtualized or paginated

---

## 8. Security Verification

### 8.1 Authentication Security

**Verify**:
- Sessions expire correctly
- Tokens are validated correctly
- Password reset works securely
- Multi-factor authentication works (if enabled)

### 8.2 Authorization Security

**Verify**:
- Permission checks cannot be bypassed
- Account isolation cannot be bypassed
- Role checks cannot be bypassed
- API keys are encrypted

### 8.3 Data Security

**Verify**:
- PII is not logged
- Sensitive data is encrypted
- GDPR delete logic works
- Audit logging works correctly

---

## 9. Verification Checklist

### 9.1 Permission System Verification

- [ ] All 6 roles defined correctly
- [ ] All 30+ permissions defined correctly
- [ ] Role-to-permission mappings are correct
- [ ] Permission checking functions work correctly
- [ ] PermissionGate component works correctly
- [ ] Admin role bypasses PermissionGate (as designed)
- [ ] Permission checks are consistent across layers

### 9.2 API Verification

- [ ] All 241 endpoints have authentication
- [ ] All endpoints have permission checks (where required)
- [ ] All endpoints enforce account isolation
- [ ] All endpoints return correct status codes
- [ ] All endpoints validate request data
- [ ] All endpoints handle errors correctly

### 9.3 Database Verification

- [ ] All 80+ tables have RLS enabled
- [ ] All RLS policies are correctly defined
- [ ] All RLS policies enforce account isolation
- [ ] All constraints are correct
- [ ] All indexes are present

### 9.4 Component Verification

- [ ] All PermissionGate usages are correct
- [ ] All components make correct API calls
- [ ] All components handle errors correctly
- [ ] All components display correct data

### 9.5 Data Flow Verification

- [ ] UI → API → Database flow works correctly
- [ ] Permission checks at each layer are consistent
- [ ] Account isolation is enforced at all layers
- [ ] Error handling works at each layer

---

## 10. Bug Detection Priorities

### 10.1 Critical Bugs (Security)

**Priority**: P0 - Fix Immediately

- User can access other account's data
- User can bypass permission checks
- User can access admin features without admin role
- API endpoint missing authentication
- RLS policy missing or incorrect

### 10.2 High Priority Bugs (Functionality)

**Priority**: P1 - Fix Soon

- Permission check inconsistency across layers
- API endpoint missing permission check
- Component shows feature but API denies access
- Database query fails due to RLS
- Account isolation not enforced

### 10.3 Medium Priority Bugs (UX)

**Priority**: P2 - Fix When Possible

- UI hides feature but API allows access (security issue if user knows endpoint)
- Error messages not clear
- Loading states not shown
- Empty states not handled

### 10.4 Low Priority Bugs (Polish)

**Priority**: P3 - Fix If Time Permits

- Performance issues
- UI inconsistencies
- Missing error handling
- Missing validation

---

**End of Verification Requirements Documentation**

12:21:04 Dec 03, 2025

