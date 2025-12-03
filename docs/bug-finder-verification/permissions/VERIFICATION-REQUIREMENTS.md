# Permission Verification Requirements

**Purpose**: Complete verification requirements for testing all 30+ permissions across all layers

---

## Verification Structure

Each permission verification must verify:

1. **Permission Definition** - What the permission allows
2. **Role Mappings** - Which roles have this permission
3. **UI Layer Checks** - PermissionGate usage
4. **API Layer Checks** - Permission checks in routes
5. **Database Layer Checks** - RLS policy checks
6. **Consistency** - Consistency across all layers
7. **Edge Cases** - Special scenarios
8. **Bypass Attempts** - Attempts to bypass permission

---

## Required Sections for Each Permission

### 1. Permission Definition
- Permission name and description
- What this permission allows
- Related features/modules
- Related API endpoints

### 2. Role Mappings
- **Roles With Permission**: List roles that have this permission
- **Roles Without Permission**: List roles that don't have this permission
- **Source**: Based on `ROLE_PERMISSIONS` mapping

### 3. UI Layer Checks
- **PermissionGate Usage**: Where PermissionGate is used
- **Components Protected**: Components that require this permission
- **Pages Protected**: Pages that require this permission
- **Test Cases**: Test with roles that have/don't have permission

### 4. API Layer Checks
- **Endpoints Using Permission**: API endpoints that check this permission
- **Check Method**: How permission is checked (permission function vs role check)
- **Check Location**: Where check is performed
- **Test Cases**: Test with roles that have/don't have permission

### 5. Database Layer Checks
- **RLS Policies**: RLS policies that use this permission
- **Tables Affected**: Tables with RLS policies using this permission
- **Policy Conditions**: What conditions are checked
- **Test Cases**: Test with roles that have/don't have permission

### 6. Consistency
- **UI vs API**: Verify UI and API checks match
- **API vs Database**: Verify API and Database checks match
- **UI vs Database**: Verify UI and Database checks match
- **Inconsistencies**: Document any inconsistencies found

### 7. Edge Cases
- **Admin Bypass**: Admin bypasses UI checks but not RLS
- **Impersonation**: How impersonation affects permissions
- **Missing Permission**: What happens when permission is missing
- **Invalid Role**: What happens with invalid role

### 8. Bypass Attempts
- **UI Bypass**: Attempt to access UI without permission
- **API Bypass**: Attempt to call API without permission
- **Database Bypass**: Attempt to query database without permission
- **Results**: Verify all bypass attempts fail

---

## Permission-Specific Requirements

### `manage_users`
- **MUST VERIFY**: Only admin/owner can manage users
- **MUST VERIFY**: UI PermissionGate blocks other roles
- **MUST VERIFY**: API endpoints check permission
- **MUST VERIFY**: Account isolation (can only manage users in own account)

### `view_all_jobs`
- **MUST VERIFY**: Admin/owner/dispatcher/CSR can view all jobs
- **MUST VERIFY**: Tech role CANNOT view all jobs (only assigned)
- **MUST VERIFY**: Sales role CANNOT view jobs
- **MUST VERIFY**: API filters by role (tech sees only assigned)

### `view_assigned_jobs`
- **MUST VERIFY**: Tech role can view assigned jobs
- **MUST VERIFY**: Tech sees only jobs where `tech_assigned_id = user.id`
- **MUST VERIFY**: API filters correctly
- **MUST VERIFY**: RLS enforces filtering

### `create_jobs`
- **MUST VERIFY**: Roles with permission can create jobs
- **MUST VERIFY**: Tech can create job requests (special case)
- **MUST VERIFY**: Account isolation (jobs created in user's account)

### `manage_dispatch`
- **MUST VERIFY**: Dispatcher/owner/admin can manage dispatch
- **MUST VERIFY**: Can approve/reject job requests
- **MUST VERIFY**: Can view unassigned jobs
- **MUST VERIFY**: Account isolation

### `manage_settings`
- **MUST VERIFY**: Owner/admin can manage settings
- **MUST VERIFY**: Some endpoints use direct role check (INCONSISTENCY)
- **MUST VERIFY**: Account isolation

---

## Verification Checklist

For each permission, verify:

- [ ] Permission definition matches documentation
- [ ] Role mappings are correct
- [ ] UI layer checks work correctly
- [ ] API layer checks work correctly
- [ ] Database layer checks work correctly
- [ ] Consistency across all layers
- [ ] Edge cases handled correctly
- [ ] Bypass attempts fail
- [ ] Account isolation enforced

---

## Test Matrix

For each permission, test with:

- [ ] Roles that HAVE the permission
- [ ] Roles that DON'T have the permission
- [ ] Admin role (bypasses UI but not RLS)
- [ ] Impersonated users
- [ ] Users from different accounts

---

## Output Format

Each permission verification document should follow this structure:

```markdown
# [Permission] Verification

## Status: ⬜ NOT STARTED / 🔄 IN PROGRESS / ✅ VERIFIED / ❌ FAILED

## 1. Permission Definition
[Permission details]

## 2. Role Mappings
[Role details]

## 3. UI Layer Checks
[UI details]

## 4. API Layer Checks
[API details]

## 5. Database Layer Checks
[Database details]

## 6. Consistency
[Consistency details]

## 7. Edge Cases
[Edge case details]

## 8. Bypass Attempts
[Bypass details]

## Verification Results
- Status: [Status]
- Misalignments: [List]
- Bugs Found: [List]
- Recommendations: [List]
```

---

**Remember**: Verify permission at ALL THREE LAYERS. Consistency is critical.

12:45:00 Dec 03, 2025

