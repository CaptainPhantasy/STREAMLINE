# Security Verification Requirements

**Purpose**: Complete verification requirements for testing all security boundaries

---

## Verification Structure

Each security verification must verify:

1. **Account Isolation** - Users cannot access other accounts' data
2. **Permission Checks** - All layers enforce permissions
3. **Role Boundaries** - Users cannot access other roles' features
4. **RLS Policies** - Database enforces access control
5. **Permission Bypasses** - Attempts to bypass permissions fail
6. **Cross-Account Access** - Attempts to access other accounts fail
7. **Data Leakage** - No data leaks between accounts
8. **Authentication** - Authentication is required and enforced

---

## Required Sections for Each Security Check

### 1. Account Isolation
- **UI Layer**: Verify UI doesn't show other accounts' data
- **API Layer**: Verify API filters by account_id
- **Database Layer**: Verify RLS enforces account isolation
- **Test Cases**: Attempt to access other accounts' data

### 2. Permission Checks
- **UI Layer**: Verify PermissionGate blocks unauthorized access
- **API Layer**: Verify API routes check permissions
- **Database Layer**: Verify RLS policies check permissions
- **Consistency**: Verify checks are consistent across layers

### 3. Role Boundaries
- **UI Layer**: Verify roles cannot access other roles' pages
- **API Layer**: Verify roles cannot access other roles' endpoints
- **Database Layer**: Verify roles cannot access other roles' data
- **Test Cases**: Attempt to access other roles' features

### 4. RLS Policies
- **Policy Coverage**: Verify all tables have RLS enabled
- **Policy Correctness**: Verify policies enforce correct access
- **Account Filtering**: Verify account_id filtering works
- **Role Filtering**: Verify role-specific filtering works

### 5. Permission Bypasses
- **UI Bypass**: Attempt to bypass PermissionGate
- **API Bypass**: Attempt to bypass API permission checks
- **Database Bypass**: Attempt to bypass RLS policies
- **Results**: Verify all bypass attempts fail

### 6. Cross-Account Access
- **UI Access**: Attempt to access other account's UI
- **API Access**: Attempt to access other account's API
- **Database Access**: Attempt to query other account's data
- **Results**: Verify all attempts fail

### 7. Data Leakage
- **Response Filtering**: Verify responses don't include other accounts' data
- **Query Filtering**: Verify queries don't return other accounts' data
- **Cache Isolation**: Verify cache doesn't leak data between accounts
- **Log Isolation**: Verify logs don't leak data between accounts

### 8. Authentication
- **Required**: Verify authentication is required for all protected routes
- **Token Validation**: Verify tokens are validated correctly
- **Session Management**: Verify sessions are managed correctly
- **Expiration**: Verify tokens/sessions expire correctly

---

## Security-Specific Requirements

### Account Isolation
- **MUST VERIFY**: Users cannot see other accounts' data in UI
- **MUST VERIFY**: API endpoints filter by account_id
- **MUST VERIFY**: RLS policies enforce account_id filtering
- **MUST VERIFY**: No data leaks between accounts

### Permission Checks
- **MUST VERIFY**: UI PermissionGate blocks unauthorized access
- **MUST VERIFY**: API routes check permissions
- **MUST VERIFY**: RLS policies check permissions
- **MUST VERIFY**: Consistency across all layers

### Role Boundaries
- **MUST VERIFY**: Tech cannot access dispatcher features
- **MUST VERIFY**: Sales cannot access tech features
- **MUST VERIFY**: CSR cannot access admin features
- **MUST VERIFY**: Roles cannot access other roles' endpoints

### RLS Policies
- **MUST VERIFY**: All tables have RLS enabled
- **MUST VERIFY**: All policies use `get_user_account_id()`
- **MUST VERIFY**: Policies enforce account isolation
- **MUST VERIFY**: Policies enforce role-specific access

### Permission Bypasses
- **MUST VERIFY**: Cannot bypass PermissionGate (except admin)
- **MUST VERIFY**: Cannot bypass API permission checks
- **MUST VERIFY**: Cannot bypass RLS policies
- **MUST VERIFY**: Admin bypasses UI but NOT RLS

### Cross-Account Access
- **MUST VERIFY**: Cannot access other accounts' UI
- **MUST VERIFY**: Cannot access other accounts' API
- **MUST VERIFY**: Cannot query other accounts' data
- **MUST VERIFY**: Cannot modify other accounts' data

---

## Verification Checklist

For each security check, verify:

- [ ] Account isolation enforced at all layers
- [ ] Permission checks work at all layers
- [ ] Role boundaries enforced
- [ ] RLS policies work correctly
- [ ] Permission bypasses fail
- [ ] Cross-account access fails
- [ ] No data leakage
- [ ] Authentication required and enforced

---

## Attack Scenarios

Test these attack scenarios:

- [ ] **Account Enumeration**: Attempt to enumerate other accounts
- [ ] **Permission Escalation**: Attempt to gain higher permissions
- [ ] **Role Confusion**: Attempt to access other roles' features
- [ ] **Data Exfiltration**: Attempt to extract other accounts' data
- [ ] **SQL Injection**: Attempt SQL injection attacks
- [ ] **XSS Attacks**: Attempt cross-site scripting attacks
- [ ] **CSRF Attacks**: Attempt cross-site request forgery attacks
- [ ] **Session Hijacking**: Attempt to hijack sessions

---

## Output Format

Each security verification document should follow this structure:

```markdown
# [Security Check] Verification

## Status: ⬜ NOT STARTED / 🔄 IN PROGRESS / ✅ VERIFIED / ❌ FAILED

## 1. Account Isolation
[Isolation details]

## 2. Permission Checks
[Permission details]

## 3. Role Boundaries
[Boundary details]

## 4. RLS Policies
[Policy details]

## 5. Permission Bypasses
[Bypass details]

## 6. Cross-Account Access
[Access details]

## 7. Data Leakage
[Leakage details]

## 8. Authentication
[Auth details]

## Verification Results
- Status: [Status]
- Vulnerabilities Found: [List]
- Bugs Found: [List]
- Recommendations: [List]
```

---

**Remember**: Security is critical. Test all boundaries thoroughly.

12:45:00 Dec 03, 2025

