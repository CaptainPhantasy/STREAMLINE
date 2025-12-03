# Feature-Based Verification Requirements

**Purpose**: Complete verification requirements for testing each feature/module

---

## Verification Structure

Each feature verification document must verify:

1. **Feature Definition** - What the feature does
2. **User Workflows** - Complete user journeys
3. **UI Components** - All components used
4. **API Endpoints** - All endpoints called
5. **Database Operations** - All database queries
6. **Permission Checks** - Permission requirements at each layer
7. **Data Flow** - Complete UI → API → Database flow
8. **Error Handling** - Error scenarios and handling
9. **Edge Cases** - Boundary conditions and special cases
10. **Integration Points** - How feature integrates with other features

---

## Required Sections for Each Feature

### 1. Feature Definition
- Feature name and description
- Purpose and use case
- Related pages and routes
- Related API endpoints
- Related database tables

### 2. User Workflows
- **Primary Workflow**: Main user journey
- **Secondary Workflows**: Alternative paths
- **Error Workflows**: Error handling paths
- **Edge Case Workflows**: Special scenarios

### 3. UI Components
- **Pages**: List all pages in this feature
- **Components**: List all components used
- **PermissionGates**: List all PermissionGate checks
- **Data Fetching**: How data is fetched (React Query, Fetch, etc.)
- **State Management**: How state is managed

### 4. API Endpoints
- **Endpoints Used**: List all API endpoints called
- **Request Schemas**: What data is sent
- **Response Schemas**: What data is received
- **Error Responses**: What errors can occur
- **Permission Requirements**: What permissions are needed

### 5. Database Operations
- **Tables Accessed**: List all tables queried
- **Queries**: List all database queries
- **RLS Policies**: List relevant RLS policies
- **Account Filtering**: How account_id is used
- **Data Filtering**: Any role-specific filtering

### 6. Permission Checks
- **UI Layer**: PermissionGate checks
- **API Layer**: Permission checks in routes
- **Database Layer**: RLS policy checks
- **Consistency**: Verify checks are consistent across layers

### 7. Data Flow
- **Step 1**: User interaction in UI
- **Step 2**: UI component makes API call
- **Step 3**: API route checks permissions
- **Step 4**: API route queries database
- **Step 5**: Database RLS checks account
- **Step 6**: Database returns data
- **Step 7**: API formats response
- **Step 8**: UI displays data

### 8. Error Handling
- **Network Errors**: How network failures are handled
- **API Errors**: How API errors are handled
- **Database Errors**: How database errors are handled
- **Validation Errors**: How validation errors are handled
- **Permission Errors**: How permission errors are handled

### 9. Edge Cases
- **Empty Data**: How empty states are handled
- **Null Values**: How null values are handled
- **Invalid Data**: How invalid data is handled
- **Concurrent Updates**: How concurrent updates are handled
- **Large Datasets**: How large datasets are handled

### 10. Integration Points
- **Related Features**: Features that integrate with this one
- **Shared Data**: Data shared with other features
- **Dependencies**: Features this depends on
- **Side Effects**: Effects on other features

---

## Feature-Specific Requirements

### Jobs Feature
- **MUST VERIFY**: Tech role sees only assigned jobs
- **MUST VERIFY**: Other roles see all jobs in account
- **MUST VERIFY**: Job request workflow (tech creates → dispatcher approves)
- **MUST VERIFY**: Job assignment workflow
- **MUST VERIFY**: Job status transitions
- **MUST VERIFY**: Account isolation

### Contacts Feature
- **MUST VERIFY**: All roles can view contacts (if have permission)
- **MUST VERIFY**: Create/edit/delete permissions
- **MUST VERIFY**: Account isolation
- **MUST VERIFY**: Contact history
- **MUST VERIFY**: Contact tags

### Invoices Feature
- **MUST VERIFY**: Financial permissions
- **MUST VERIFY**: Invoice creation from jobs
- **MUST VERIFY**: Payment tracking
- **MUST VERIFY**: Account isolation

### Estimates Feature
- **MUST VERIFY**: Estimate creation
- **MUST VERIFY**: Estimate conversion to job
- **MUST VERIFY**: Estimate signatures
- **MUST VERIFY**: Account isolation

### Dispatch Feature
- **MUST VERIFY**: Dispatch map displays correctly
- **MUST VERIFY**: GPS tracking works
- **MUST VERIFY**: Job assignment on map
- **MUST VERIFY**: Unassigned jobs display
- **MUST VERIFY**: Account isolation

### Sales Feature
- **MUST VERIFY**: Lead management
- **MUST VERIFY**: Meeting recording and transcription
- **MUST VERIFY**: Sales pipeline
- **MUST VERIFY**: Account isolation

### Tech Feature
- **MUST VERIFY**: Tech sees only assigned jobs
- **MUST VERIFY**: Job request creation
- **MUST VERIFY**: Parts inventory access
- **MUST VERIFY**: Time clock
- **MUST VERIFY**: Account isolation

---

## Verification Checklist

For each feature, verify:

- [ ] Feature definition matches documentation
- [ ] All user workflows work correctly
- [ ] All UI components render correctly
- [ ] All API endpoints work correctly
- [ ] All database operations work correctly
- [ ] Permission checks work at all layers
- [ ] Data flow works end-to-end
- [ ] Error handling works correctly
- [ ] Edge cases handled correctly
- [ ] Integration points work correctly
- [ ] Account isolation enforced
- [ ] No permission bypasses possible
- [ ] No data leaks between accounts

---

## Output Format

Each feature verification document should follow this structure:

```markdown
# [Feature] Verification

## Status: ⬜ NOT STARTED / 🔄 IN PROGRESS / ✅ VERIFIED / ❌ FAILED

## 1. Feature Definition
[Feature details]

## 2. User Workflows
[Workflow details]

## 3. UI Components
[Component details]

## 4. API Endpoints
[Endpoint details]

## 5. Database Operations
[Database details]

## 6. Permission Checks
[Permission details]

## 7. Data Flow
[Flow details]

## 8. Error Handling
[Error details]

## 9. Edge Cases
[Edge case details]

## 10. Integration Points
[Integration details]

## Verification Results
- Status: [Status]
- Misalignments: [List]
- Bugs Found: [List]
- Recommendations: [List]
```

---

**Remember**: Verify the complete feature, not just individual components.

12:45:00 Dec 03, 2025

