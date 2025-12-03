# Expected Behavior Knowledge Base

**Last Updated**: 13:29:46 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Complete understanding of expected system behavior for each role, permission, and component

---

## 1. Expected Permission Behavior Matrix

### 1.1 Role Capabilities Matrix

#### Super Admin Role
**Should Be Able To**:
- ✅ Access ALL features and data in ALL accounts at ALL times
- ✅ Manage all users in ANY account (create, edit, delete, impersonate)
- ✅ View all jobs, contacts, invoices, etc. in ANY account
- ✅ Manage system settings in ANY account
- ✅ Configure LLM providers in ANY account
- ✅ View audit logs for ALL accounts
- ✅ Bypass RLS for cross-account operations
- ✅ Create accounts and initial owners
- ✅ Create admin users (team members)

**Should NOT Be Able To**:
- ❌ Nothing - super_admin has unrestricted access

**Special Behavior**:
- Super admin bypasses RLS for cross-account operations (uses service role client)
- Super admin can access any account at any time for support/maintenance
- Only one user: Douglas (platform owner)
- Created manually in database (not through normal user creation flow)

#### Admin Role
**Should Be Able To**:
- ✅ Access ALL features and data in ALL accounts at ALL times
- ✅ Manage all users in ANY account (create, edit, delete, impersonate)
- ✅ View all jobs, contacts, invoices, etc. in ANY account
- ✅ Manage system settings in ANY account
- ✅ Configure LLM providers in ANY account
- ✅ View audit logs for ALL accounts
- ✅ Bypass RLS for cross-account operations
- ✅ Bypass all PermissionGate checks (special behavior)
- ✅ Create accounts and initial owners
- ✅ Create admin users (team members)

**Should NOT Be Able To**:
- ❌ Nothing - admin has unrestricted access (same as super_admin)

**Special Behavior**:
- Admin role bypasses PermissionGate component checks
- Admin role bypasses RLS for cross-account operations (uses service role client)
- Admin can access any account at any time for support/maintenance
- Multiple users: Legacy AI team members
- Created by: super_admin or existing admin

#### Owner Role
**Should Be Able To**:
- ✅ Access all features and data in their account
- ✅ Manage all users in their account (create: manager, assistant_manager, dispatcher, tech, sales, csr)
- ✅ Impersonate users in their account
- ✅ View all jobs, contacts, invoices, etc. in their account
- ✅ Manage system settings for their account
- ✅ Configure LLM providers for their account
- ✅ View audit logs for their account

**Should NOT Be Able To**:
- ❌ Access data from other accounts (RLS enforced)
- ❌ Create super_admin, admin, or other owners
- ❌ Bypass database RLS

**Special Behavior**:
- Owner has same permissions as admin but scoped to their account
- Owner can create: manager, assistant_manager, dispatcher, tech, sales, csr
- Owner cannot create: super_admin, admin, or other owners
- Created by: super_admin or admin (during account setup)

#### Manager Role
**Should Be Able To**:
- ✅ Access all features and data in their account (same as owner)
- ✅ Manage users in their account (create: assistant_manager, dispatcher, tech, sales, csr)
- ✅ Impersonate users in their account
- ✅ View all jobs, contacts, invoices, etc. in their account
- ✅ Manage system settings for their account
- ✅ Configure LLM providers for their account
- ✅ View audit logs for their account

**Should NOT Be Able To**:
- ❌ Access data from other accounts (RLS enforced)
- ❌ Create super_admin, admin, owner, or other managers
- ❌ Bypass database RLS

**Special Behavior**:
- Manager has same permissions as owner (account-scoped)
- Manager can create: assistant_manager, dispatcher, tech, sales, csr
- Manager cannot create: super_admin, admin, owner, or other managers
- Created by: owner only
- Use case: Delegated account management, daily operations

#### Assistant Manager Role
**Should Be Able To**:
- ✅ Access most features and data in their account (limited subset)
- ✅ Manage users in their account (create: dispatcher, tech, sales, csr)
- ✅ View all jobs, contacts, invoices, etc. in their account
- ✅ Create and edit jobs
- ✅ Assign jobs to techs
- ✅ View financials and create invoices
- ✅ View analytics and reports
- ✅ Manage dispatch operations

**Should NOT Be Able To**:
- ❌ Access data from other accounts (RLS enforced)
- ❌ Create super_admin, admin, owner, manager, or other assistant_managers
- ❌ Impersonate users
- ❌ Delete jobs or contacts
- ❌ Manage financials (full access)
- ❌ Manage marketing campaigns
- ❌ Export reports
- ❌ Manage system settings
- ❌ Export customer insights

**Special Behavior**:
- Assistant manager has limited permissions (subset of manager)
- Assistant manager can create: dispatcher, tech, sales, csr
- Assistant manager cannot create: super_admin, admin, owner, manager, or other assistant_managers
- Created by: owner or manager only
- Use case: Operational support, limited management tasks

#### Dispatcher Role
**Should Be Able To**:
- ✅ View all jobs in their account
- ✅ Create and edit jobs
- ✅ Assign jobs to technicians
- ✅ View dispatch map
- ✅ Manage dispatch operations
- ✅ View GPS tracking
- ✅ View contacts (read/write)
- ✅ View analytics, estimates, parts (read-only)
- ✅ View settings (read-only)

**Should NOT Be Able To**:
- ❌ Manage users
- ❌ Impersonate users
- ❌ Delete jobs
- ❌ Manage financials (view only)
- ❌ Manage marketing campaigns
- ❌ Export reports
- ❌ Manage system settings

**Special Behavior**:
- Dispatcher can view all jobs (not just assigned)
- Dispatcher can assign jobs to techs
- Dispatcher can view unassigned job requests via `/api/jobs/unassigned`
- Dispatcher can approve/reject job requests via `PATCH /api/jobs/unassigned`
- When approving, dispatcher can optionally assign job to a tech
- Dispatcher has limited financial access (view only)

#### Tech Role
**Should Be Able To**:
- ✅ View assigned jobs only
- ✅ Edit assigned jobs
- ✅ Create job requests
- ✅ View contacts (read-only)
- ✅ Use voice navigation

**Should NOT Be Able To**:
- ❌ View all jobs (only assigned)
- ❌ Assign jobs to other techs
- ❌ Delete jobs
- ❌ Manage users
- ❌ View financials
- ❌ View analytics
- ❌ Manage dispatch
- ❌ Access admin features

**Special Behavior**:
- Tech can only view jobs where `tech_assigned_id = user.id` AND (`request_status IS NULL` OR `request_status = 'approved'`)
- Tech CANNOT see jobs with `request_status = 'pending'` (even if they created them)
- Tech CANNOT see jobs with `request_status = 'rejected'`
- Tech can create job requests via `/api/jobs/request` (creates job with `request_status: 'pending'`)
- Tech cannot access `/api/jobs/unassigned` (requires `manage_dispatch` permission)
- When job is reassigned, old tech loses access, new tech gains access
- Tech is mobile-only role

#### Sales Role
**Should Be Able To**:
- ✅ View, create, edit contacts
- ✅ View estimates
- ✅ View marketing data (read-only)
- ✅ Use voice navigation

**Should NOT Be Able To**:
- ❌ View jobs
- ❌ Manage users
- ❌ View financials
- ❌ Manage dispatch
- ❌ Access admin features

**Special Behavior**:
- Sales is mobile-only role
- Sales focuses on leads and contacts
- Sales can create estimates

#### CSR Role
**Should Be Able To**:
- ✅ View all jobs (to assist customers)
- ✅ Create jobs
- ✅ View, create, edit contacts
- ✅ View financials (read-only)
- ✅ View estimates
- ✅ Create invoices
- ✅ View dispatch map (to see tech locations)
- ✅ Use voice navigation

**Should NOT Be Able To**:
- ❌ Edit jobs
- ❌ Assign jobs
- ❌ Delete jobs
- ❌ Manage users
- ❌ Manage financials
- ❌ Manage dispatch
- ❌ Access admin features

**Special Behavior**:
- CSR can view all jobs (unlike tech)
- CSR can create invoices but not manage financials
- CSR is customer-facing role
- Created by: owner, manager, assistant_manager

---

## 1.5 Job Request Workflow

### Overview
Techs can create job requests that require dispatcher approval before becoming active jobs.

### Workflow Steps

1. **Tech Creates Job Request**
   - Endpoint: `POST /api/jobs/request`
   - Permission: Tech role only (checks `role !== 'tech'`)
   - Creates job with:
     - `request_status: 'pending'`
     - `status: 'lead'`
     - `tech_assigned_id: tech.user.id` (tech who requested it)
   - Tech CANNOT see this job in their assigned jobs list (pending requests are hidden)

2. **Dispatcher Views Unassigned Jobs**
   - Endpoint: `GET /api/jobs/unassigned`
   - Permission: `manage_dispatch` (dispatcher, owner, admin)
   - Returns jobs where `request_status = 'pending'`
   - Dispatcher sees all pending requests from all techs in their account

3. **Dispatcher Approves/Rejects Request**
   - Endpoint: `PATCH /api/jobs/unassigned`
   - Permission: `manage_dispatch` (dispatcher, owner, admin)
   - Actions:
     - `approve`: Sets `request_status: 'approved'`, `status: 'scheduled'`
       - Optionally assigns to different tech via `techId` parameter
     - `reject`: Sets `request_status: 'rejected'`, `status: 'lead'`
   - Approved jobs become visible to assigned tech
   - Rejected jobs remain invisible to tech

4. **Tech Views Assigned Jobs**
   - Endpoint: `GET /api/jobs`
   - Tech sees jobs where `tech_assigned_id = user.id` AND (`request_status IS NULL` OR `request_status = 'approved'`)
   - Tech does NOT see pending or rejected requests

### Expected Behavior Matrix

| Action | Tech | Dispatcher | Owner/Admin |
|--------|------|------------|-------------|
| Create job request | ✅ Yes | ❌ No | ❌ No |
| View own pending requests | ❌ No | ✅ Yes | ✅ Yes |
| View all pending requests | ❌ No | ✅ Yes | ✅ Yes |
| Approve/reject requests | ❌ No | ✅ Yes | ✅ Yes |
| View approved jobs (assigned) | ✅ Yes | ✅ Yes | ✅ Yes |
| View rejected jobs | ❌ No | ✅ Yes | ✅ Yes |

### Edge Cases

1. **Tech Creates Request, Then Tries to View It**
   - Expected: Tech cannot see pending request in assigned jobs
   - Reason: `/api/jobs` filters out `request_status = 'pending'`

2. **Dispatcher Approves Without Assigning Tech**
   - Expected: Job remains assigned to requesting tech
   - Reason: `tech_assigned_id` is set when request is created

3. **Dispatcher Approves and Assigns Different Tech**
   - Expected: Original tech loses access, new tech gains access
   - Reason: `tech_assigned_id` is updated on approval

4. **Job Request Rejected**
   - Expected: Tech never sees rejected job
   - Reason: Rejected jobs have `request_status = 'rejected'` which is filtered out

---

## 2. Expected Permission Behavior by Feature

### 2.1 User Management

**Permission**: `manage_users`

**Expected Behavior**:
- **Admin/Owner**: Can create, edit, delete users in their account
- **Other Roles**: Cannot access user management UI or API
- **UI**: User management page hidden via PermissionGate
- **API**: Returns 403 if role doesn't have permission
- **Database**: No direct RLS on users table (handled by API)

**Permission**: `view_users`

**Expected Behavior**:
- **Admin/Owner**: Can view user list
- **Other Roles**: Cannot view user list
- **UI**: User list hidden via PermissionGate
- **API**: Returns 403 if role doesn't have permission

**Permission**: `impersonate_users`

**Expected Behavior**:
- **Owner**: Can impersonate users in their account
- **Admin**: Has permission but may not have UI (check implementation)
- **Other Roles**: Cannot impersonate
- **UI**: Impersonation button hidden via PermissionGate
- **API**: `/api/admin/users/impersonate` checks permission

### 2.2 Job Management

**Permission**: `view_all_jobs`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher/CSR**: Can view all jobs in account
- **Tech**: Cannot view all jobs (only assigned)
- **Sales**: Cannot view jobs
- **UI**: Jobs list page accessible
- **API**: Returns jobs filtered by account_id
- **Database**: RLS filters by account_id

**Permission**: `view_assigned_jobs`

**Expected Behavior**:
- **Tech**: Can view jobs where `tech_assigned_id = user.id`
- **Other Roles**: Use `view_all_jobs` instead
- **UI**: Tech dashboard shows assigned jobs only
- **API**: Additional filter: `.eq('tech_assigned_id', user.id)`
- **Database**: RLS + API filter ensures only assigned jobs

**Permission**: `create_jobs`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher/Tech/CSR**: Can create jobs
- **Sales**: Cannot create jobs
- **UI**: Create job button visible
- **API**: POST `/api/jobs` checks permission
- **Database**: RLS WITH CHECK validates account_id

**Permission**: `edit_jobs`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher/Tech**: Can edit jobs
- **CSR**: Cannot edit jobs (can only view/create)
- **Sales**: Cannot edit jobs
- **UI**: Edit job button visible
- **API**: PATCH `/api/jobs/[id]` checks permission
- **Database**: RLS allows UPDATE if account_id matches

**Permission**: `delete_jobs`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager**: Can delete jobs
- **Other Roles**: Cannot delete jobs
- **UI**: Delete button hidden via PermissionGate
- **API**: DELETE `/api/jobs/[id]` checks permission
- **Database**: RLS allows DELETE if account_id matches

**Permission**: `assign_jobs`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher**: Can assign jobs to techs
- **Other Roles**: Cannot assign jobs
- **UI**: Assign button visible in dispatch map
- **API**: PATCH `/api/jobs/[id]` with `tech_assigned_id` checks permission
- **Database**: RLS allows UPDATE if account_id matches

### 2.3 Contact Management

**Permission**: `view_contacts`

**Expected Behavior**:
- **All Roles**: Can view contacts in their account
- **UI**: Contacts page accessible
- **API**: Returns contacts filtered by account_id
- **Database**: RLS filters by account_id

**Permission**: `create_contacts`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher/Tech/Sales/CSR**: Can create contacts
- **UI**: Create contact button visible
- **API**: POST `/api/contacts` checks permission
- **Database**: RLS WITH CHECK validates account_id

**Permission**: `edit_contacts`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher/Sales/CSR**: Can edit contacts
- **Tech**: Cannot edit contacts (view only)
- **UI**: Edit button visible/hidden based on permission
- **API**: PATCH `/api/contacts/[id]` checks permission
- **Database**: RLS allows UPDATE if account_id matches

**Permission**: `delete_contacts`

**Expected Behavior**:
- **Admin/Owner**: Can delete contacts
- **Other Roles**: Cannot delete contacts
- **UI**: Delete button hidden via PermissionGate
- **API**: DELETE `/api/contacts/[id]` checks permission
- **Database**: RLS allows DELETE if account_id matches

### 2.4 Financial Management

**Permission**: `manage_financials`

**Expected Behavior**:
- **Admin/Owner**: Can view and manage all financial data
- **Other Roles**: Cannot manage financials
- **UI**: Financial management pages accessible
- **API**: Financial APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `view_financials`

**Expected Behavior**:
- **Admin/Owner/CSR**: Can view financial data (read-only)
- **Dispatcher**: Has permission but may have limited access
- **Other Roles**: Cannot view financials
- **UI**: Financial dashboard accessible
- **API**: Financial read APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `create_invoices`

**Expected Behavior**:
- **Admin/Owner/CSR**: Can create invoices
- **Other Roles**: Cannot create invoices
- **UI**: Create invoice button visible
- **API**: POST `/api/invoices` checks permission
- **Database**: RLS WITH CHECK validates account_id

**Permission**: `edit_invoices`

**Expected Behavior**:
- **Admin/Owner**: Can edit invoices
- **Other Roles**: Cannot edit invoices
- **UI**: Edit invoice button visible
- **API**: PATCH `/api/invoices/[id]` checks permission
- **Database**: RLS allows UPDATE if account_id matches

### 2.5 Marketing

**Permission**: `manage_marketing`

**Expected Behavior**:
- **Admin/Owner**: Can manage marketing campaigns and templates
- **Other Roles**: Cannot manage marketing
- **UI**: Marketing management pages accessible
- **API**: Marketing APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `view_marketing`

**Expected Behavior**:
- **Admin/Owner/Sales**: Can view marketing data
- **Other Roles**: Cannot view marketing
- **UI**: Marketing view pages accessible
- **API**: Marketing read APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `send_campaigns`

**Expected Behavior**:
- **Admin/Owner**: Can send marketing campaigns
- **Other Roles**: Cannot send campaigns
- **UI**: Send campaign button visible
- **API**: POST `/api/campaigns/[id]/send` checks permission
- **Database**: RLS allows INSERT if account_id matches

### 2.6 Analytics & Reports

**Permission**: `view_analytics`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher**: Can view analytics dashboard
- **Other Roles**: Cannot view analytics
- **UI**: Analytics page accessible
- **API**: Analytics APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `view_reports`

**Expected Behavior**:
- **Admin/Owner**: Can view reports
- **Other Roles**: Cannot view reports
- **UI**: Reports page accessible
- **API**: Reports APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `export_reports`

**Expected Behavior**:
- **Admin/Owner**: Can export reports
- **Other Roles**: Cannot export reports
- **UI**: Export button visible
- **API**: Export APIs check permission
- **Database**: RLS filters by account_id

### 2.7 Dispatch & GPS

**Permission**: `view_dispatch_map`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher/CSR**: Can view dispatch map
- **Tech/Sales**: Cannot view dispatch map
- **UI**: Dispatch map page accessible
- **API**: Dispatch APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `manage_dispatch`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher**: Can manage dispatch operations
- **Other Roles**: Cannot manage dispatch
- **UI**: Dispatch management UI accessible
- **API**: Dispatch management APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `view_gps`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher**: Can view GPS tracking
- **Other Roles**: Cannot view GPS
- **UI**: GPS tracking UI accessible
- **API**: GPS APIs check permission
- **Database**: RLS filters by account_id

### 2.8 Settings

**Permission**: `manage_settings`

**Expected Behavior**:
- **Admin/Owner**: Can manage system settings
- **Other Roles**: Cannot manage settings
- **UI**: Settings management pages accessible
- **API**: Settings APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `view_settings`

**Expected Behavior**:
- **Super Admin/Admin/Owner/Manager/Assistant Manager/Dispatcher**: Can view settings
- **Other Roles**: Cannot view settings
- **UI**: Settings view pages accessible
- **API**: Settings read APIs check permission
- **Database**: RLS filters by account_id

### 2.9 AI & Voice Features

**Permission**: `voice_navigation_access`

**Expected Behavior**:
- **All Roles**: Can use voice navigation
- **UI**: Voice widget visible
- **API**: Voice command APIs check permission
- **Database**: RLS filters by account_id

**Permission**: `predictive_analytics_view`

**Expected Behavior**:
- **Admin/Owner**: Can view predictive analytics
- **Other Roles**: Cannot view predictive analytics
- **UI**: Predictive analytics UI accessible
- **API**: Predictive analytics APIs check permission
- **Database**: RLS filters by account_id

---

## 3. Expected Data Behavior

### 3.1 Page Data Expectations

#### Jobs Page (`/jobs`)
**Expected Data**:
- List of jobs filtered by account_id
- For tech role: Only jobs where `tech_assigned_id = user.id`
- For other roles: All jobs in account
- Job fields: id, status, contact, tech_assigned, scheduled_start, etc.

**API Endpoints Called**:
- GET `/api/jobs` - Fetch jobs list
- GET `/api/jobs/[id]` - Fetch job details (when opened)

**Permission Checks**:
- UI: PermissionGate checks `view_all_jobs` or `view_assigned_jobs`
- API: Checks permission before returning data
- Database: RLS filters by account_id

#### Contacts Page (`/contacts`)
**Expected Data**:
- List of contacts filtered by account_id
- Contact fields: id, name, email, phone, address, etc.
- Related data: tags, notes, jobs, invoices

**API Endpoints Called**:
- GET `/api/contacts` - Fetch contacts list
- GET `/api/contacts/[id]` - Fetch contact details

**Permission Checks**:
- UI: PermissionGate checks `view_contacts`
- API: Checks permission before returning data
- Database: RLS filters by account_id

#### Dispatch Map (`/dispatch/map`)
**Expected Data**:
- Active jobs with locations
- Technician locations (GPS)
- Unassigned jobs
- Route information

**API Endpoints Called**:
- GET `/api/dispatch/jobs/active` - Active jobs
- GET `/api/dispatch/techs` - Technician locations
- GET `/api/gps` - GPS logs

**Permission Checks**:
- UI: PermissionGate checks `view_dispatch_map`
- API: Checks permission before returning data
- Database: RLS filters by account_id

### 3.2 API Response Expectations

#### Standard Success Response
```json
{
  "data": [...],
  "count": 10
}
```

#### Standard Error Response
```json
{
  "error": "Error message"
}
```

#### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 3.3 Database Query Expectations

#### Account Isolation
- All queries should filter by `account_id`
- RLS policies enforce account isolation
- Cross-account queries should return empty results

#### Role-Based Filtering
- Tech role: Jobs filtered by `tech_assigned_id = user.id`
- Other roles: Jobs filtered by `account_id = user.account_id`
- Admin role: Still filtered by account_id (RLS)

---

## 4. Expected Error Behavior

### 4.1 Authentication Errors

**Expected Behavior**:
- **401 Unauthorized**: User not authenticated
- **Response**: `{ error: "Unauthorized" }`
- **UI**: Redirect to login page or show error message
- **Occurs When**: No valid session/token

### 4.2 Permission Errors

**Expected Behavior**:
- **403 Forbidden**: User authenticated but lacks permission
- **Response**: `{ error: "Forbidden" }` or `{ error: "Forbidden - Admin access required" }`
- **UI**: Show "Access Denied" message
- **Occurs When**: Role doesn't have required permission

### 4.3 Validation Errors

**Expected Behavior**:
- **400 Bad Request**: Invalid request data
- **Response**: `{ error: "Validation error", details: {...} }`
- **UI**: Show field-level validation errors
- **Occurs When**: Request body doesn't match schema

### 4.4 Database Errors

**Expected Behavior**:
- **500 Internal Server Error**: Database error
- **Response**: `{ error: "Internal server error" }`
- **UI**: Show generic error message
- **Occurs When**: RLS policy fails, query error, constraint violation

### 4.5 Not Found Errors

**Expected Behavior**:
- **404 Not Found**: Resource doesn't exist
- **Response**: `{ error: "Not found" }` or `{ error: "User not found" }`
- **UI**: Show "Not Found" message
- **Occurs When**: Resource ID doesn't exist or not accessible

---

## 5. Expected Account Isolation Behavior

### 5.1 Data Isolation

**Expected Behavior**:
- Users can only access data in their own account
- Queries return empty results for other accounts' data
- RLS policies prevent cross-account access
- API routes validate account_id matches user's account

**Test Cases**:
1. User in account_123 queries jobs → Only account_123 jobs returned
2. User in account_123 queries account_456 jobs → Empty result
3. User tries to create job with account_456 → RLS prevents insert

### 5.2 User Isolation

**Expected Behavior**:
- Users can view users in their account
- Users cannot view users in other accounts
- Admin can view all users in their account
- Users can update their own profile
- Admin can update any user in their account

**Test Cases**:
1. User queries users → Only same-account users returned
2. User tries to update other-account user → RLS prevents update
3. Admin updates user in their account → Success

---

## 6. Expected Permission Check Consistency

### 6.1 UI-API Consistency

**Expected Behavior**:
- UI permission checks should match API permission checks
- If UI shows feature, API should allow access
- If UI hides feature, API should deny access

**Mismatch Scenarios** (Bugs):
- UI shows button but API returns 403 → User sees error
- UI hides button but API allows access → Security issue (if user knows endpoint)

### 6.2 API-Database Consistency

**Expected Behavior**:
- API permission checks should match RLS policies
- If API allows access, RLS should allow query
- If API denies access, RLS should also deny (defense in depth)

**Mismatch Scenarios** (Bugs):
- API allows access but RLS denies → Database error
- API denies access but RLS allows → Inconsistent (may be intentional)

### 6.3 Cross-Layer Consistency Matrix

| Permission | UI Check | API Check | RLS Check | Expected Result |
|------------|----------|-----------|-----------|----------------|
| `view_all_jobs` | ✅ | ✅ | ✅ | Access granted |
| `view_all_jobs` | ✅ | ❌ | ✅ | API error (bug) |
| `view_all_jobs` | ✅ | ✅ | ❌ | Database error (bug) |
| `view_all_jobs` | ❌ | ✅ | ✅ | UI hidden but accessible via API (security issue) |

---

## 7. Expected Role-Specific Behaviors

### 7.1 Admin Role Special Behavior

**Expected**:
- Bypasses PermissionGate checks (always renders)
- Does NOT bypass database RLS
- Can access all features in their account
- Cannot access other accounts' data

### 7.2 Tech Role Special Behavior

**Expected**:
- Can only view assigned jobs
- Can create job requests (pending approval)
- Cannot view all jobs
- Cannot assign jobs to others
- Mobile-only role

### 7.3 Dispatcher Role Special Behavior

**Expected**:
- Can view all jobs (not just assigned)
- Can assign jobs to techs
- Can view dispatch map
- Limited financial access (view only)
- Cannot manage users

### 7.4 Sales Role Special Behavior

**Expected**:
- Focuses on contacts and leads
- Can view estimates
- Cannot view jobs
- Mobile-only role
- Can view marketing data (read-only)

### 7.5 CSR Role Special Behavior

**Expected**:
- Can view all jobs (to assist customers)
- Can create jobs and invoices
- Cannot edit jobs
- Can view dispatch map (to see tech locations)
- Customer-facing role

---

## 8. Expected Data Relationships

### 8.1 Job Relationships

**Expected**:
- Job belongs to one account (`account_id`)
- Job belongs to one contact (`contact_id`, nullable)
- Job belongs to one conversation (`conversation_id`, nullable)
- Job assigned to one tech (`tech_assigned_id`, nullable)
- Job can have one invoice (`invoice_id`, nullable)
- Job can have many photos, parts, materials, notes

### 8.2 Contact Relationships

**Expected**:
- Contact belongs to one account (`account_id`)
- Contact can have many jobs
- Contact can have many conversations
- Contact can have many invoices
- Contact can have many tags, notes, meetings

### 8.3 Invoice Relationships

**Expected**:
- Invoice belongs to one account (`account_id`)
- Invoice belongs to one contact (`contact_id`)
- Invoice can belong to one job (`job_id`, nullable)
- Invoice can have many payments

---

## 9. Expected Performance Behavior

### 9.1 Query Performance

**Expected**:
- Queries should use indexes on `account_id`
- RLS policies should be efficient (use STABLE functions)
- Queries should return results in < 1 second for typical data sizes

### 9.2 Caching Behavior

**Expected**:
- React Query caches data for 5 minutes (staleTime)
- API responses can be cached by CDN
- Database queries use connection pooling

---

## 10. Expected Security Behavior

### 10.1 Authentication Security

**Expected**:
- Sessions expire after inactivity
- Tokens expire and refresh automatically
- Passwords are hashed (handled by Supabase Auth)
- Multi-factor authentication supported (if configured)

### 10.2 Authorization Security

**Expected**:
- Permission checks at UI, API, and Database layers
- Defense in depth: Multiple layers of security
- Account isolation enforced at database level
- Cross-account access prevented by RLS

### 10.3 Data Security

**Expected**:
- Sensitive data encrypted at rest (Supabase)
- API keys encrypted in database (pgcrypto)
- PII not logged in console
- GDPR compliance: Delete logic exists

---

**End of Expected Behavior Documentation**

12:21:04 Dec 03, 2025

