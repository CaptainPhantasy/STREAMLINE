# API Endpoint Verification Requirements

**Purpose**: Complete verification requirements for testing all 241 API endpoints

---

## Verification Structure

Each API endpoint verification must verify:

1. **Endpoint Definition** - HTTP method, path, purpose
2. **Request Schema** - Required/optional parameters, validation
3. **Response Schema** - Response format, data structure
4. **Permission Checks** - What permissions are required
5. **Role Access** - Which roles can access
6. **Account Isolation** - How account_id is enforced
7. **Error Handling** - Error responses and status codes
8. **Edge Cases** - Boundary conditions
9. **Database Operations** - What database queries are performed
10. **Side Effects** - Effects on other data

---

## Required Sections for Each Endpoint

### 1. Endpoint Definition
- HTTP method (GET, POST, PUT, PATCH, DELETE)
- Path (e.g., `/api/jobs/[id]`)
- Purpose and use case
- Related feature/module

### 2. Request Schema
- **Required Parameters**: Parameters that must be present
- **Optional Parameters**: Parameters that may be present
- **Path Parameters**: Parameters in URL path
- **Query Parameters**: Parameters in query string
- **Body Parameters**: Parameters in request body
- **Validation Rules**: What validation is performed
- **Type Checking**: What types are expected

### 3. Response Schema
- **Success Response**: Format of successful response
- **Error Response**: Format of error response
- **Status Codes**: What status codes are returned
- **Data Structure**: Structure of response data
- **Pagination**: If pagination is used

### 4. Permission Checks
- **Required Permission**: What permission is needed
- **Permission Check Location**: Where check is performed
- **Check Method**: How check is performed (permission function vs role check)
- **Bypass Conditions**: When checks are bypassed (e.g., admin)

### 5. Role Access
- **Roles Allowed**: Which roles can access
- **Roles Blocked**: Which roles are blocked
- **Role-Specific Behavior**: Different behavior for different roles
- **Test Cases**: Test with each role

### 6. Account Isolation
- **Account ID Source**: Where account_id comes from
- **Account Filtering**: How account_id filters data
- **Cross-Account Prevention**: How cross-account access is prevented
- **RLS Enforcement**: How RLS enforces account isolation

### 7. Error Handling
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: No permission
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Server error
- **Error Messages**: What error messages are returned

### 8. Edge Cases
- **Null Values**: How null values are handled
- **Missing Parameters**: How missing parameters are handled
- **Invalid Types**: How invalid types are handled
- **Empty Results**: How empty results are handled
- **Large Datasets**: How large datasets are handled

### 9. Database Operations
- **Tables Accessed**: Which tables are queried
- **Queries Performed**: What queries are executed
- **RLS Policies**: Which RLS policies apply
- **Transactions**: If transactions are used
- **Side Effects**: What data is modified

### 10. Side Effects
- **Data Created**: What data is created
- **Data Updated**: What data is updated
- **Data Deleted**: What data is deleted
- **Notifications**: If notifications are sent
- **Audit Logs**: If audit logs are created

---

## Endpoint-Specific Requirements

### Job Endpoints
- **MUST VERIFY**: `/api/jobs` GET filters by role (tech sees only assigned)
- **MUST VERIFY**: `/api/jobs/request` POST only allows tech role
- **MUST VERIFY**: `/api/jobs/unassigned` GET requires `manage_dispatch` permission
- **MUST VERIFY**: `/api/jobs/unassigned` PATCH requires `manage_dispatch` permission
- **MUST VERIFY**: Account isolation on all job endpoints

### Contact Endpoints
- **MUST VERIFY**: Account isolation on all contact endpoints
- **MUST VERIFY**: Permission checks for create/edit/delete
- **MUST VERIFY**: Contact history endpoint works

### Invoice Endpoints
- **MUST VERIFY**: Financial permissions required
- **MUST VERIFY**: Account isolation
- **MUST VERIFY**: Invoice creation from jobs

### Settings Endpoints
- **MUST VERIFY**: `/api/settings/company` requires owner/admin (direct role check - INCONSISTENCY)
- **MUST VERIFY**: `/api/settings/automation` requires owner/admin (direct role check - INCONSISTENCY)
- **MUST VERIFY**: `/api/settings/ai/providers` requires owner/admin (direct role check - INCONSISTENCY)
- **MUST VERIFY**: Account isolation

### Tech Endpoints
- **MUST VERIFY**: `/api/tech/parts` requires tech role (direct role check - INCONSISTENCY)
- **MUST VERIFY**: `/api/tech/jobs` requires tech role
- **MUST VERIFY**: Account isolation

### Analytics Endpoints
- **MUST VERIFY**: `/api/analytics/scenario-modeling` requires owner/admin (direct role check - INCONSISTENCY)
- **MUST VERIFY**: Account isolation

---

## Verification Checklist

For each endpoint, verify:

- [ ] Endpoint definition matches documentation
- [ ] Request schema validation works
- [ ] Response schema is correct
- [ ] Permission checks work correctly
- [ ] Role access is correct
- [ ] Account isolation enforced
- [ ] Error handling works correctly
- [ ] Edge cases handled correctly
- [ ] Database operations work correctly
- [ ] Side effects are correct
- [ ] No permission bypasses possible
- [ ] No cross-account access possible

---

## Test Matrix

For each endpoint, test with:

- [ ] Admin role
- [ ] Owner role
- [ ] Dispatcher role
- [ ] Tech role
- [ ] Sales role
- [ ] CSR role
- [ ] Unauthenticated user
- [ ] User from different account

---

## Output Format

Each endpoint verification document should follow this structure:

```markdown
# [Endpoint] Verification

## Status: ⬜ NOT STARTED / 🔄 IN PROGRESS / ✅ VERIFIED / ❌ FAILED

## 1. Endpoint Definition
[Endpoint details]

## 2. Request Schema
[Request details]

## 3. Response Schema
[Response details]

## 4. Permission Checks
[Permission details]

## 5. Role Access
[Role details]

## 6. Account Isolation
[Isolation details]

## 7. Error Handling
[Error details]

## 8. Edge Cases
[Edge case details]

## 9. Database Operations
[Database details]

## 10. Side Effects
[Side effect details]

## Verification Results
- Status: [Status]
- Misalignments: [List]
- Bugs Found: [List]
- Recommendations: [List]
```

---

**Remember**: Test every endpoint with every role. Leave no gaps.

12:45:00 Dec 03, 2025

