# Data Flow Verification Requirements

**Purpose**: Complete verification requirements for testing data flows through UI → API → Database

---

## Verification Structure

Each data flow verification must verify:

1. **Flow Definition** - What data flows through the system
2. **UI Layer** - How data is displayed and collected
3. **API Layer** - How data is transmitted and validated
4. **Database Layer** - How data is stored and retrieved
5. **Account Isolation** - How account_id flows through layers
6. **Permission Checks** - How permissions are checked at each layer
7. **Error Propagation** - How errors flow through layers
8. **Data Consistency** - How data consistency is maintained

---

## Required Sections for Each Data Flow

### 1. Flow Definition
- Feature/module this flow belongs to
- Purpose of the flow
- Data entities involved
- Flow direction (UI → API → Database or reverse)

### 2. UI Layer
- **Data Display**: How data is displayed to user
- **Data Collection**: How data is collected from user
- **Data Validation**: Client-side validation performed
- **API Calls**: How UI calls API endpoints
- **Error Display**: How errors are displayed to user
- **Loading States**: How loading states are handled

### 3. API Layer
- **Request Handling**: How requests are received
- **Authentication**: How authentication is verified
- **Permission Checks**: How permissions are checked
- **Data Validation**: Server-side validation performed
- **Account Filtering**: How account_id is extracted and used
- **Database Queries**: How database is queried
- **Response Formatting**: How responses are formatted
- **Error Handling**: How errors are handled

### 4. Database Layer
- **RLS Policies**: Which RLS policies apply
- **Account Filtering**: How account_id filters data
- **Queries**: What queries are executed
- **Transactions**: If transactions are used
- **Data Integrity**: How data integrity is maintained
- **Error Handling**: How database errors are handled

### 5. Account Isolation
- **Account ID Source**: Where account_id comes from
- **Account ID Flow**: How account_id flows through layers
- **Account Filtering**: How account_id filters at each layer
- **Cross-Account Prevention**: How cross-account access is prevented

### 6. Permission Checks
- **UI Layer**: PermissionGate checks
- **API Layer**: Permission checks in routes
- **Database Layer**: RLS policy checks
- **Consistency**: Verify checks are consistent

### 7. Error Propagation
- **UI Errors**: How UI errors are handled
- **API Errors**: How API errors are handled
- **Database Errors**: How database errors are handled
- **Error Flow**: How errors propagate through layers

### 8. Data Consistency
- **Data Validation**: Validation at each layer
- **Data Transformation**: How data is transformed between layers
- **Data Integrity**: How data integrity is maintained
- **Concurrent Updates**: How concurrent updates are handled

---

## Flow-Specific Requirements

### Job Creation Flow
- **MUST VERIFY**: UI collects job data
- **MUST VERIFY**: API validates job data
- **MUST VERIFY**: API sets account_id from user
- **MUST VERIFY**: Database stores job with account_id
- **MUST VERIFY**: RLS enforces account isolation
- **MUST VERIFY**: Response returns created job

### Job Request Flow (Tech)
- **MUST VERIFY**: Tech creates request in UI
- **MUST VERIFY**: API sets `request_status: 'pending'`
- **MUST VERIFY**: Tech cannot see pending request in assigned jobs
- **MUST VERIFY**: Dispatcher can see pending request
- **MUST VERIFY**: Dispatcher approves/rejects
- **MUST VERIFY**: Approved job becomes visible to tech

### Contact Creation Flow
- **MUST VERIFY**: UI collects contact data
- **MUST VERIFY**: API validates contact data
- **MUST VERIFY**: API sets account_id from user
- **MUST VERIFY**: Database stores contact with account_id
- **MUST VERIFY**: RLS enforces account isolation

### Invoice Creation Flow
- **MUST VERIFY**: UI collects invoice data
- **MUST VERIFY**: API validates invoice data
- **MUST VERIFY**: API sets account_id from user
- **MUST VERIFY**: Database stores invoice with account_id
- **MUST VERIFY**: RLS enforces account isolation
- **MUST VERIFY**: Financial permissions checked

### Job Assignment Flow
- **MUST VERIFY**: Dispatcher assigns job to tech
- **MUST VERIFY**: API updates `tech_assigned_id`
- **MUST VERIFY**: Database updates job record
- **MUST VERIFY**: Tech can now see assigned job
- **MUST VERIFY**: Old tech loses access if reassigned

---

## Verification Checklist

For each data flow, verify:

- [ ] Flow definition matches documentation
- [ ] UI layer works correctly
- [ ] API layer works correctly
- [ ] Database layer works correctly
- [ ] Account isolation enforced at all layers
- [ ] Permission checks work at all layers
- [ ] Error propagation works correctly
- [ ] Data consistency maintained
- [ ] No data leaks between accounts
- [ ] No permission bypasses possible

---

## Test Scenarios

For each flow, test:

- [ ] **Happy Path**: Normal operation
- [ ] **Error Path**: Error handling
- [ ] **Permission Denied**: Permission errors
- [ ] **Account Mismatch**: Cross-account access attempts
- [ ] **Invalid Data**: Invalid input handling
- [ ] **Concurrent Updates**: Concurrent modification handling

---

## Output Format

Each data flow verification document should follow this structure:

```markdown
# [Feature] Data Flow Verification

## Status: ⬜ NOT STARTED / 🔄 IN PROGRESS / ✅ VERIFIED / ❌ FAILED

## 1. Flow Definition
[Flow details]

## 2. UI Layer
[UI details]

## 3. API Layer
[API details]

## 4. Database Layer
[Database details]

## 5. Account Isolation
[Isolation details]

## 6. Permission Checks
[Permission details]

## 7. Error Propagation
[Error details]

## 8. Data Consistency
[Consistency details]

## Verification Results
- Status: [Status]
- Misalignments: [List]
- Bugs Found: [List]
- Recommendations: [List]
```

---

**Remember**: Trace data through the entire stack. Verify every step.

12:45:00 Dec 03, 2025

