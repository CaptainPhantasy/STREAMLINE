# Role-Based Verification Requirements

**Purpose**: Complete verification requirements for testing each user role

---

## Verification Structure

Each role verification document must verify:

1. **Role Capabilities** - What the role CAN do
2. **Role Restrictions** - What the role CANNOT do
3. **Permission Boundaries** - Where permissions are checked
4. **UI Access** - Which pages/components are accessible
5. **API Access** - Which endpoints are accessible
6. **Database Access** - What data is accessible via RLS
7. **Edge Cases** - Special behaviors and exceptions
8. **Misalignments** - Any deviations from expected behavior

---

## Required Sections for Each Role

### 1. Role Definition
- Role name and description
- Default route after login
- Intended use case

### 2. Expected Capabilities
- List of all things this role SHOULD be able to do
- Based on `ROLE_PERMISSIONS` mapping
- Based on expected behavior documentation

### 3. Expected Restrictions
- List of all things this role SHOULD NOT be able to do
- Based on permission system
- Based on expected behavior documentation

### 4. UI Verification
- **Pages Accessible**: List all pages this role can access
- **Pages Blocked**: List all pages this role cannot access
- **Components Visible**: List components that should be visible
- **Components Hidden**: List components that should be hidden
- **PermissionGate Checks**: Verify all PermissionGate components work correctly

**CRITICAL - Visual/UX Verification** (MUST DO FOR EVERY PAGE):
- **Visual Rendering**: Actually render each page and verify:
  * Content is visible (not white text on white background)
  * Text has proper contrast (WCAG AA minimum)
  * Colors are correct and visible
  * Font sizes are readable
  * Components render correctly (not broken, not missing)
  * Images/icons load and display correctly
  * Layout is correct (things appear where they should)
- **UI/UX Usability**: Verify humans can actually use it:
  * Buttons are visible and clickable
  * Links are visible and clickable
  * Forms are usable (inputs visible, labels visible)
  * Navigation is usable
  * Interactive elements are discoverable
  * Error messages are visible and readable
- **Responsive Design**: Test on different screen sizes:
  * Desktop (1920x1080, 1366x768)
  * Tablet (768x1024)
  * Mobile (375x667, 414x896)
- **Accessibility**: Verify keyboard navigation, focus indicators, screen reader compatibility

**If ANY visual/UX issue found**: FIX IT IMMEDIATELY, document fix, re-test

### 5. API Verification
- **Endpoints Accessible**: List all API endpoints this role can access
- **Endpoints Blocked**: List all API endpoints this role cannot access
- **Permission Checks**: Verify permission checks at API layer
- **Request/Response**: Verify request/response schemas work correctly
- **Error Handling**: Verify error responses are correct

### 6. Database Verification
- **Tables Accessible**: List tables this role can query
- **Tables Blocked**: List tables this role cannot query
- **RLS Policies**: Verify RLS policies enforce correct access
- **Account Isolation**: Verify account_id filtering works
- **Data Filtering**: Verify role-specific data filtering (e.g., tech sees only assigned jobs)

### 7. Special Behaviors
- **Admin Bypass**: Admin role bypasses PermissionGate (but not RLS)
- **Tech Job Filtering**: Tech sees only assigned jobs
- **Job Requests**: Tech can create requests, dispatcher approves
- **Impersonation**: Owner/admin can impersonate
- **Account Isolation**: All roles scoped to their account

### 8. Edge Cases
- **Null Values**: How system handles null/undefined values
- **Missing Permissions**: What happens when permissions are missing
- **Invalid Data**: How system handles invalid requests
- **Concurrent Access**: How system handles concurrent operations
- **State Transitions**: How system handles state changes

### 9. Test Cases
- **Happy Path**: Normal operation scenarios
- **Error Cases**: Error handling scenarios
- **Boundary Cases**: Edge cases and boundaries
- **Security Cases**: Security-related scenarios

### 10. Fixes Applied
- **Code Bugs Fixed**: List all code bugs fixed
- **Visual Bugs Fixed**: List all visual/rendering bugs fixed
- **UX Issues Fixed**: List all usability issues fixed
- **Fix Verification**: Verify all fixes work correctly

### 11. Verification Results
- **Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
- **Functional Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
- **Visual/UX Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
- **Misalignments**: List any deviations from expected behavior (that couldn't be fixed)
- **Bugs Found**: List any bugs discovered (that couldn't be fixed)
- **Recommendations**: Suggestions for fixes (if any remain)

---

## Role-Specific Requirements

### Admin Role
- **MUST VERIFY**: Bypasses PermissionGate but NOT RLS
- **MUST VERIFY**: Can access all features in their account
- **MUST VERIFY**: Cannot access other accounts' data
- **MUST VERIFY**: Can manage users, settings, LLM providers
- **MUST VERIFY**: Can view audit logs

### Owner Role
- **MUST VERIFY**: Same permissions as admin but scoped to account
- **MUST VERIFY**: Can impersonate users in their account
- **MUST VERIFY**: Cannot access other accounts' data
- **MUST VERIFY**: Can manage all users in their account

### Dispatcher Role
- **MUST VERIFY**: Can view all jobs (not just assigned)
- **MUST VERIFY**: Can assign jobs to techs
- **MUST VERIFY**: Can approve/reject job requests
- **MUST VERIFY**: Can view dispatch map and GPS tracking
- **MUST VERIFY**: Cannot manage users or financials (view only)

### Tech Role
- **MUST VERIFY**: Can only view assigned jobs
- **MUST VERIFY**: Cannot view all jobs
- **MUST VERIFY**: Can create job requests (pending approval)
- **MUST VERIFY**: Cannot see pending requests in assigned jobs list
- **MUST VERIFY**: Cannot assign jobs to others
- **MUST VERIFY**: Mobile-only role

### Sales Role
- **MUST VERIFY**: Can view/create/edit contacts
- **MUST VERIFY**: Can view estimates
- **MUST VERIFY**: Cannot view jobs
- **MUST VERIFY**: Can view marketing data (read-only)
- **MUST VERIFY**: Mobile-only role

### CSR Role
- **MUST VERIFY**: Can view all jobs (to assist customers)
- **MUST VERIFY**: Can create jobs and invoices
- **MUST VERIFY**: Cannot edit jobs
- **MUST VERIFY**: Can view dispatch map
- **MUST VERIFY**: Owner/admin can also access CSR dashboard

---

## Verification Checklist

For each role, verify:

FUNCTIONAL VERIFICATION:
- [ ] Role definition matches documentation
- [ ] Default route is correct
- [ ] All expected capabilities work
- [ ] All expected restrictions are enforced
- [ ] UI pages accessible/blocked correctly
- [ ] API endpoints accessible/blocked correctly
- [ ] Database RLS policies enforce correctly
- [ ] Account isolation works
- [ ] Permission checks work at all layers
- [ ] Special behaviors work as expected
- [ ] Edge cases handled correctly
- [ ] Error handling works correctly
- [ ] No permission bypasses possible
- [ ] No cross-account access possible

VISUAL/UX VERIFICATION (CRITICAL - MUST DO):
- [ ] All pages visually inspected (actually render and check)
- [ ] Text contrast verified (not white on white, WCAG AA minimum)
- [ ] Colors verified (visible, correct, not clashing)
- [ ] Font sizes verified (readable, not too small/large)
- [ ] Components render correctly (not broken, not missing)
- [ ] Images/icons load and display correctly
- [ ] Layout verified (correct, things appear where they should)
- [ ] Buttons/links visible and clickable
- [ ] Forms usable (inputs visible, labels visible)
- [ ] Navigation usable (humans can navigate)
- [ ] Responsive design tested (desktop, tablet, mobile)
- [ ] Accessibility verified (keyboard nav, focus indicators)

FIXES:
- [ ] All code bugs fixed
- [ ] All visual bugs fixed
- [ ] All UX issues fixed
- [ ] All fixes re-tested and verified

---

## Output Format

Each role verification document should follow this structure:

```markdown
# [Role] Verification

## Status: ⬜ NOT STARTED / 🔄 IN PROGRESS / ✅ VERIFIED / ❌ FAILED

## 1. Role Definition
[Role details]

## 2. Expected Capabilities
[List]

## 3. Expected Restrictions
[List]

## 4. UI Verification
[Results]

## 5. API Verification
[Results]

## 6. Database Verification
[Results]

## 7. Special Behaviors
[Results]

## 8. Edge Cases
[Results]

## 9. Test Cases
[Results]

## 10. Verification Results
- Status: [Status]
- Misalignments: [List]
- Bugs Found: [List]
- Recommendations: [List]
```

---

**Remember**: Leave no stone unturned. Verify EVERYTHING.

12:45:00 Dec 03, 2025

