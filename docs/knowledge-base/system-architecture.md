# System Architecture Knowledge Base

**Last Updated**: 13:29:46 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Complete understanding of system architecture for bug finder configuration

---

## 1. Role and Permission System Structure

### 1.1 User Roles

The system defines **9 user roles** organized into three tiers:

#### Platform Tier (Cross-Account Access)

1. **super_admin** - Platform owner (Douglas)
   - Route: `/inbox`
   - Special: Full unrestricted access to ALL accounts at ALL times
   - Bypasses RLS for cross-account operations
   - Can create accounts and initial owners
   - Use case: Platform owner, emergency support, account setup
   - Only one user: Douglas

2. **admin** - Legacy AI development team
   - Route: `/inbox`
   - Special: Full unrestricted access to ALL accounts at ALL times
   - Bypasses RLS for cross-account operations
   - Bypasses all permission checks in PermissionGate component
   - Can create accounts and initial owners
   - Use case: Platform support, troubleshooting, account setup
   - Multiple users: Legacy AI team members

#### Account Management Tier (Account-Scoped Access)

3. **owner** - Client account owner
   - Route: `/owner/dashboard`
   - Full access to their own account only
   - Can create: manager, assistant_manager, dispatcher, tech, sales, csr
   - Cannot access other accounts (RLS enforced)
   - Use case: Business owner with complete account control

4. **manager** - Client's manager (delegated by owner)
   - Route: `/owner/dashboard` (same as owner)
   - Full account access (same permissions as owner, account-scoped)
   - Can create: assistant_manager, dispatcher, tech, sales, csr
   - Cannot create: super_admin, admin, owner, or other managers
   - Cannot access other accounts (RLS enforced)
   - Use case: Delegated account management, daily operations
   - Created by: owner only

5. **assistant_manager** - Client's assistant manager (delegated by owner/manager)
   - Route: `/owner/dashboard` (same as owner)
   - Limited account access (subset of manager permissions)
   - Can create: dispatcher, tech, sales, csr
   - Cannot create: super_admin, admin, owner, manager, or other assistant_managers
   - Cannot access other accounts (RLS enforced)
   - Use case: Operational support, limited management tasks
   - Created by: owner or manager only

#### Operational Tier (Role-Specific Access)

6. **dispatcher** - Dispatch operations and job assignment
   - Route: `/dispatch/map`
   - Job assignment, dispatch operations, GPS tracking
   - Limited financial access (view only)
   - Can create: tech (for job assignment)
   - Use case: Dispatcher coordinating field technicians

7. **tech** - Field technicians
   - Route: `/tech/dashboard`
   - Mobile-only field operations
   - View assigned jobs only
   - Can create job requests (requires dispatcher approval)
   - Cannot create users
   - Use case: Field technician completing service calls

8. **sales** - Sales representatives
   - Route: `/sales/dashboard`
   - Mobile-only sales operations
   - Full CRUD access to contacts & leads
   - Cannot create users
   - Use case: Sales rep meeting customers, creating leads

9. **csr** - Customer Service Representative
   - Route: `/inbox`
   - Can view all jobs to assist customers
   - Can create jobs and invoices
   - Limited financial access (view only)
   - Cannot create users
   - Use case: Customer service operations

### 1.2 Permissions

The system defines **30 permissions** organized into categories:

#### User Management
- `manage_users` - Create, edit, delete users
- `view_users` - View user list
- `impersonate_users` - Impersonate other users (owner/admin only)

#### Job Management
- `view_all_jobs` - View all jobs in account
- `view_assigned_jobs` - View only assigned jobs
- `create_jobs` - Create new jobs
- `edit_jobs` - Edit job details
- `delete_jobs` - Delete jobs
- `assign_jobs` - Assign jobs to techs

#### Contact Management
- `view_contacts` - View contacts
- `create_contacts` - Create new contacts
- `edit_contacts` - Edit contact details
- `delete_contacts` - Delete contacts

#### Financial Management
- `manage_financials` - View and manage financial data
- `view_financials` - View financial data (read-only)
- `create_invoices` - Create invoices
- `edit_invoices` - Edit invoices

#### Marketing
- `manage_marketing` - Manage campaigns and templates
- `view_marketing` - View marketing data
- `send_campaigns` - Send marketing campaigns

#### Analytics & Reports
- `view_analytics` - View analytics dashboard
- `view_reports` - View reports
- `export_reports` - Export reports
- `view_estimates` - View and manage estimates
- `view_parts` - View and manage parts inventory

#### Dispatch & GPS
- `view_dispatch_map` - View dispatch map
- `manage_dispatch` - Manage dispatch operations
- `view_gps` - View GPS tracking

#### Settings
- `manage_settings` - Manage system settings
- `view_settings` - View settings

#### AI & Voice Features
- `voice_navigation_access` - Access voice navigation commands
- `predictive_analytics_view` - View predictive analytics insights

#### Advanced Features
- `equipment_management_advanced` - Advanced equipment management
- `customer_insights_export` - Export customer insights data

### 1.3 Role-to-Permission Mappings

**Source**: `lib/auth/permissions.ts` - `ROLE_PERMISSIONS` object

#### Super Admin Permissions (30 permissions)
All permissions listed above. Plus:
- Cross-account access (bypasses RLS)
- Can create accounts and initial owners
- Can create admin users

#### Admin Permissions (30 permissions)
All permissions listed above. Plus:
- Cross-account access (bypasses RLS)
- Can create accounts and initial owners
- Can create admin users (team members)

#### Owner Permissions (30 permissions)
All permissions listed above (same as admin, but account-scoped). Plus:
- Can create: manager, assistant_manager, dispatcher, tech, sales, csr
- Cannot create: super_admin, admin, or other owners

#### Manager Permissions (30 permissions)
All permissions listed above (same as owner, account-scoped). Plus:
- Can create: assistant_manager, dispatcher, tech, sales, csr
- Cannot create: super_admin, admin, owner, or other managers

#### Assistant Manager Permissions (Limited subset)
- User Management: `manage_users`, `view_users` (cannot impersonate)
- Job Management: `view_all_jobs`, `create_jobs`, `edit_jobs`, `assign_jobs` (cannot delete)
- Contact Management: `view_contacts`, `create_contacts`, `edit_contacts` (cannot delete)
- Financial Management: `view_financials`, `create_invoices` (cannot manage financials or edit invoices)
- Marketing: `view_marketing` (cannot manage or send campaigns)
- Analytics & Reports: `view_analytics`, `view_reports`, `view_estimates`, `view_parts` (cannot export)
- Dispatch & GPS: `view_dispatch_map`, `manage_dispatch`, `view_gps`
- Settings: `view_settings` (cannot manage)
- AI & Voice: `voice_navigation_access`, `predictive_analytics_view`
- Advanced: `equipment_management_advanced` (cannot export customer insights)
- Can create: dispatcher, tech, sales, csr
- Cannot create: super_admin, admin, owner, manager, or other assistant_managers

#### Dispatcher Permissions (15 permissions)
- `view_all_jobs`, `create_jobs`, `edit_jobs`, `assign_jobs`
- `view_contacts`, `create_contacts`, `edit_contacts`
- `view_analytics`, `view_estimates`, `view_parts`
- `view_dispatch_map`, `manage_dispatch`, `view_gps`
- `view_settings`
- `voice_navigation_access`
- `equipment_management_advanced`

#### Tech Permissions (4 permissions)
- `view_assigned_jobs`, `edit_jobs`, `create_jobs`
- `view_contacts`
- `voice_navigation_access`

#### Sales Permissions (5 permissions)
- `view_contacts`, `create_contacts`, `edit_contacts`
- `view_estimates`
- `view_marketing`
- `voice_navigation_access`

#### CSR Permissions (9 permissions)
- `view_contacts`, `create_contacts`, `edit_contacts`
- `create_jobs`, `view_all_jobs`
- `view_financials`, `view_estimates`, `create_invoices`
- `view_dispatch_map`
- `voice_navigation_access`

### 1.4 Permission Checking Functions

**Source**: `lib/auth/permissions.ts`

#### Core Functions
- `hasPermission(userRole, permission)` - Check single permission
- `hasAnyPermission(userRole, permissions[])` - Check if user has ANY of the permissions (OR logic)
- `hasAllPermissions(userRole, permissions[])` - Check if user has ALL permissions (AND logic)
- `isAllowedRole(userRole, allowedRoles[])` - Check if role matches allowed roles

#### Helper Functions
- `canManageUsers(role)` - Check if role can manage users
- `canViewAllJobs(role)` - Check if role can view all jobs
- `canManageFinancials(role)` - Check if role can manage financials
- `canImpersonateUsers(role)` - Check if role can impersonate (owner/admin only)
- `canAssignJobs(role)` - Check if role can assign jobs
- `canViewDispatchMap(role)` - Check if role can view dispatch map
- `canManageMarketing(role)` - Check if role can manage marketing
- `canExportReports(role)` - Check if role can export reports

#### Utility Functions
- `getPermissionsForRole(role)` - Get all permissions for a role
- `getPermissionDescription(permission)` - Get human-readable description
- `getRoleName(role)` - Get human-readable role name

### 1.5 Permission Gate Component

**Source**: `lib/auth/PermissionGate.tsx`

#### Usage Patterns
```tsx
// Single permission
<PermissionGate requires="manage_users">
  <Button>Delete User</Button>
</PermissionGate>

// Multiple roles
<PermissionGate allowedRoles={['owner', 'admin', 'dispatcher']}>
  <NavItem>Dispatch Map</NavItem>
</PermissionGate>

// Any permission (OR logic)
<PermissionGate requiresAny={['edit_jobs', 'view_all_jobs']}>
  <JobsList />
</PermissionGate>

// All permissions (AND logic)
<PermissionGate requiresAll={['view_contacts', 'edit_contacts']}>
  <ContactEditor />
</PermissionGate>
```

#### Convenience Components
- `OwnerOnly` - Render only for owners
- `AdminOnly` - Render for admins and owners
- `DispatcherOnly` - Render for dispatchers, admins, and owners
- `TechOnly` - Render only for techs
- `SalesOnly` - Render only for sales reps
- `DesktopOnly` - Render for desktop users
- `MobileOnly` - Render for mobile users

#### Special Behavior
- **Admin users bypass all permission checks** - Admin role automatically grants access
- **Impersonation support** - Uses `useEffectiveUser()` hook to consider impersonated users
- **Fallback rendering** - Can show fallback content when permission denied

### 1.6 Permission Check Locations

#### UI Layer (Components)
- `components/layout/sidebar-nav.tsx` - Navigation menu permission gates
- All dashboard pages use PermissionGate for conditional rendering

#### API Layer
- Most API routes use `getAuthenticatedSession(request)` from `lib/auth-helper.ts`
- **Two Permission Check Patterns** (inconsistency exists):

**Pattern 1: Permission Function Checks** (Preferred)
```typescript
const { hasPermission } = await import('@/lib/auth/permissions')
if (!hasPermission(user.role, 'manage_dispatch')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```
**Used in**: `/api/jobs/unassigned`, some other endpoints

**Pattern 2: Direct Role Checks** (Inconsistent - should be migrated)
```typescript
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', auth.user.id)
  .single()

if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```
**Used in**: `/api/jobs/request`, `/api/tech/parts`, `/api/settings/company`, `/api/settings/automation`, `/api/settings/ai/providers`, `/api/analytics/scenario-modeling`, `/api/office/clearances`, `/api/onboarding/status`

**Note**: Direct role checks should be migrated to permission functions for consistency and maintainability.

**Endpoints Using Direct Role Checks** (should be migrated):
- `/api/jobs/request` - Checks `role !== 'tech'` (should use `create_jobs` permission)
- `/api/tech/parts` - Checks `role !== 'tech'` (should use `view_parts` permission)
- `/api/settings/company` - Checks `!['owner', 'admin'].includes(role)` (should use `manage_settings` permission)
- `/api/settings/automation` - Checks `!['owner', 'admin'].includes(role)` (should use `manage_settings` permission)
- `/api/settings/ai/providers` - Checks `!['owner', 'admin'].includes(role)` (should use `manage_settings` permission)
- `/api/analytics/scenario-modeling` - Checks `role !== 'owner' && role !== 'admin'` (should use `view_analytics` or `predictive_analytics_view` permission)
- `/api/office/clearances` - Checks `!['admin', 'dispatcher', 'owner'].includes(role)` (should use `manage_dispatch` permission)
- `/api/onboarding/status` - Checks `!['owner', 'admin'].includes(role)` for accessing other users' onboarding (should use `manage_users` permission)

#### Database Layer (RLS)
- Row Level Security policies enforce account isolation
- Helper function: `get_user_account_id()` - Returns user's account_id
- All tables have RLS enabled with account_id-based policies

---

## 2. Page and Route Structure

### 2.1 Dashboard Modules (19 modules)

**Base Path**: `app/(dashboard)/`

1. **admin/** - Admin management
   - `/admin/audit` - Audit logs
   - `/admin/automation` - Automation rules
   - `/admin/invoices` - Invoice management
   - `/admin/invoices/[id]` - Invoice details
   - `/admin/llm-providers` - LLM provider configuration
   - `/admin/settings` - Admin settings
   - `/admin/settings/ai` - AI settings
   - `/admin/settings/automation` - Automation settings
   - `/admin/settings/company` - Company settings
   - `/admin/users` - User management

2. **analytics/** - Analytics & reporting
   - `/analytics` - Analytics dashboard

3. **calendar/** - Calendar integration
   - `/calendar` - Calendar view

4. **contacts/** - Customer management
   - `/contacts` - Contacts list

5. **csr/** - Customer service representative
    - `/csr/dashboard` - CSR dashboard (accessible to CSR, owner, and admin roles)
    - **Note**: Default route for CSR is `/inbox`, but CSR dashboard is at `/csr/dashboard`

6. **dispatch/** - Technician dispatch
    - `/dispatch/map` - Dispatch map (dispatcher route, also redirect target for office dashboard)
    - `/dispatch/unassigned` - Unassigned jobs (job requests pending approval from techs)

7. **estimates/** - Job estimates
   - `/estimates` - Estimates list
   - `/estimates/[id]` - Estimate details

8. **finance/** - Financial management
   - `/finance/dashboard` - Finance dashboard
   - `/finance/payments` - Payments

9. **inbox/** - Message center
   - `/inbox` - Inbox (admin/csr route)

10. **jobs/** - Work order management
    - `/jobs` - Jobs list (all jobs for non-tech roles, assigned only for tech role)
    - Additional job-related pages

**Note**: Root dashboard (`/`) redirects to `/inbox` before role-based routing. Role-based routing happens after login via `ROLE_ROUTES` configuration.

11. **marketing/** - Marketing campaigns
    - `/marketing/campaigns` - Campaigns list
    - `/marketing/campaigns/[id]` - Campaign details
    - `/marketing/email-templates` - Email templates
    - `/marketing/tags` - Contact tags

12. **messages/** - Direct messaging
    - `/messages` - Direct messages

13. **office/** - Office operations
    - `/office/dashboard` - Office dashboard (redirects immediately to `/dispatch/map`)
    - **Note**: Office dashboard is a redirect-only page. Office role appears to be an alias for dispatcher role.

14. **owner/** - Owner dashboard
    - `/owner/dashboard` - Owner dashboard (owner route)
    - `/owner/reports` - Owner reports

15. **parts/** - Parts inventory
    - `/parts` - Parts inventory

16. **reports/** - Business reports
    - `/reports` - Reports

17. **sales/** - Sales pipeline
    - `/sales/dashboard` - Sales dashboard (sales route)
    - `/sales/leads` - Leads management
    - `/sales/meetings` - Meetings list
    - `/sales/meetings/[id]` - Meeting details
    - `/sales/meetings/new` - New meeting
    - `/sales/meetings/record` - Record meeting (with real-time transcription)
    - `/sales/pipeline` - Sales pipeline (with tabs for pipeline, lead scoring, competitor analysis, meeting booker, follow-ups)

18. **settings/** - System settings
    - `/settings/integrations` - Integrations
    - `/settings/notifications` - Notifications
    - `/settings/profile` - User profile

19. **tech/** - Technician view
    - `/tech/dashboard` - Tech dashboard (tech route)
    - `/tech/customers/[id]/history` - Customer history (view past jobs for a customer)
    - `/tech/jobs` - Jobs list (assigned jobs only)
    - `/tech/jobs/[id]` - Job details (assigned jobs only)
    - `/tech/jobs/request` - Create job request (creates job with `request_status: 'pending'` for dispatcher approval)
    - `/tech/map` - Tech location map (GPS tracking)

### 2.2 Authentication Pages

**Base Path**: `app/(auth)/`

- `/login` - Login page

### 2.3 Route Configuration

**Source**: `lib/auth/role-routes.ts`

```typescript
export const ROLE_ROUTES: Record<UserRole, string> = {
  super_admin: '/inbox',
  admin: '/inbox',
  owner: '/owner/dashboard',
  manager: '/owner/dashboard',
  assistant_manager: '/owner/dashboard',
  dispatcher: '/dispatch/map',
  tech: '/tech/dashboard',
  sales: '/sales/dashboard',
  csr: '/inbox',
}
```

---

## 3. API Endpoint Structure

### 3.1 API Endpoint Count

**Total**: 241 API endpoints across 60+ directories

**Base Path**: `app/api/`

### 3.2 API Endpoint Categories

#### Account Management
- `/api/account/settings` - Account settings

#### Admin Operations
- `/api/admin/users` - User management
- `/api/admin/users/[id]` - User operations
- `/api/admin/users/[id]/reset-password` - Password reset
- `/api/admin/users/bulk` - Bulk user operations
- `/api/admin/users/impersonate` - User impersonation
- `/api/admin/users/statistics` - User statistics

#### AI Integration
- `/api/ai/briefing` - AI briefings
- `/api/ai/draft` - AI draft generation
- `/api/ai/meeting-summary` - Meeting summaries
- `/api/ai/pricing` - AI pricing
- `/api/ai/suggestions` - AI suggestions

#### Analytics Data
- `/api/analytics/contacts` - Contact analytics
- `/api/analytics/customer-retention` - Retention analytics
- `/api/analytics/dashboard` - Dashboard analytics
- `/api/analytics/jobs` - Job analytics
- `/api/analytics/marketing-roi` - Marketing ROI
- `/api/analytics/pl` - P&L analytics
- `/api/analytics/revenue` - Revenue analytics
- `/api/analytics/scenario-modeling` - Scenario modeling (what-if analysis)
  - **POST**: Runs scenario modeling analysis. Owner/admin only.
  - **Permission Check**: Direct role check (`role !== 'owner' && role !== 'admin'` returns 403) - **INCONSISTENCY**: Should use `view_analytics` or `predictive_analytics_view` permission
  - **Behavior**: Performs what-if analysis on revenue and job metrics
- `/api/analytics/team-metrics` - Team metrics

#### Authentication
- `/api/auth/refresh` - Token refresh
- `/api/auth/session` - Session management
- `/api/auth/signout` - Sign out

#### Automation Rules
- `/api/automation-rules` - Automation rules CRUD
- `/api/automation-rules/[id]` - Rule operations

#### Calendar Operations
- `/api/calendar/conflicts` - Calendar conflicts
- `/api/calendar/events` - Calendar events
- `/api/calendar/sync` - Calendar sync

#### Communication Tracking
- `/api/call-logs` - Call logs CRUD
- `/api/call-logs/[id]` - Call log operations

#### Marketing Campaigns
- `/api/campaigns` - Campaigns CRUD
- `/api/campaigns/[id]` - Campaign operations
- `/api/campaigns/[id]/pause` - Pause campaign
- `/api/campaigns/[id]/recipients` - Campaign recipients
- `/api/campaigns/[id]/resume` - Resume campaign
- `/api/campaigns/[id]/send` - Send campaign

#### Contact Management
- `/api/contacts` - Contacts CRUD
- `/api/contacts/[id]` - Contact operations
- `/api/contacts/[id]/history` - Contact history
- `/api/contacts/[id]/notes` - Contact notes
- `/api/contacts/[id]/tags` - Contact tags
- `/api/contacts/bulk` - Bulk contact operations
- `/api/contacts/bulk-tag` - Bulk tagging

#### Messaging System
- `/api/conversations` - Conversations CRUD
- `/api/conversations/[id]` - Conversation operations
- `/api/conversations/[id]/messages` - Conversation messages
- `/api/conversations/[id]/notes` - Conversation notes

#### Scheduled Tasks
- `/api/cron/email-queue` - Email queue processing

#### Dispatch Operations
- `/api/dispatch/auto-assign` - Auto-assign jobs
- `/api/dispatch/historical-gps` - Historical GPS data
- `/api/dispatch/jobs` - Dispatch job operations
- `/api/dispatch/jobs/[id]` - Job dispatch operations
- `/api/dispatch/jobs/active` - Active jobs
- `/api/dispatch/stats` - Dispatch statistics
- `/api/dispatch/techs` - Technician operations
- `/api/dispatch/techs/[id]` - Technician details

#### File Management
- `/api/documents` - Documents CRUD
- `/api/documents/[id]` - Document operations
- `/api/documents/upload` - Document upload

#### Email Integration
- `/api/email` - Email operations
- `/api/email/analytics` - Email analytics
- `/api/email/create-job` - Create job from email
- `/api/email/extract-actions` - Extract actions from email

#### Email Templates
- `/api/email-templates` - Templates CRUD
- `/api/email-templates/[id]` - Template operations
- `/api/email-templates/[id]/clone` - Clone template
- `/api/email-templates/[id]/preview` - Preview template
- `/api/email-templates/ai-convert` - AI conversion
- `/api/email-templates/ai-generate` - AI generation

#### Estimate Management
- `/api/estimates` - Estimates CRUD
- `/api/estimates/[id]` - Estimate operations
- `/api/estimates/[id]/convert` - Convert to job
- `/api/estimates/[id]/duplicate` - Duplicate estimate
- `/api/estimates/[id]/pdf` - Generate PDF
- `/api/estimates/[id]/preview` - Preview estimate
- `/api/estimates/[id]/send` - Send estimate
- `/api/estimates/[id]/signature` - Signature operations
- `/api/estimates/[id]/track-view` - Track view
- `/api/estimates/[id]/versions` - Estimate versions
- `/api/estimates/quick-create` - Quick create

#### Data Export
- `/api/export/contacts` - Export contacts
- `/api/export/invoices` - Export invoices
- `/api/export/jobs` - Export jobs

#### Financial APIs
- `/api/finance/stats` - Financial statistics

#### Geofencing Operations
- `/api/geofencing` - Geofencing operations

#### GPS Tracking
- `/api/gps` - GPS tracking

#### Inbox Management
- `/api/inbox/ai-route` - AI routing
- `/api/inbox/bulk` - Bulk inbox operations
- `/api/inbox/sla` - SLA management

#### Third-party Integrations
- `/api/integrations/calendar/google` - Google Calendar
- `/api/integrations/gmail` - Gmail integration
- `/api/integrations/gmail/authorize` - Gmail authorization
- `/api/integrations/gmail/callback` - Gmail callback
- `/api/integrations/gmail/send` - Send via Gmail
- `/api/integrations/gmail/status` - Gmail status
- `/api/integrations/gmail/sync` - Gmail sync
- `/api/integrations/microsoft` - Microsoft integration
- `/api/integrations/microsoft/authorize` - Microsoft authorization
- `/api/integrations/microsoft/callback` - Microsoft callback
- `/api/integrations/microsoft/status` - Microsoft status
- `/api/integrations/microsoft/sync` - Microsoft sync

#### Inventory Management
- `/api/inventory/locations` - Inventory locations

#### Invoice Management
- `/api/invoices` - Invoices CRUD
- `/api/invoices/[id]` - Invoice operations
- `/api/invoices/[id]/convert-to-parts` - Convert to parts
- `/api/invoices/[id]/mark-paid` - Mark as paid
- `/api/invoices/[id]/send` - Send invoice

#### Parts Tracking
- `/api/job-materials` - Job materials CRUD
- `/api/job-materials/[id]` - Material operations

#### Job Documentation
- `/api/job-photos` - Job photos CRUD
- `/api/job-photos/[id]` - Photo operations

#### Work Order APIs
- `/api/jobs` - Jobs CRUD
  - **GET**: Returns jobs filtered by account. Tech role sees only assigned jobs (`tech_assigned_id = user.id`). Other roles see all jobs in account.
  - **POST**: Creates new job. Requires `create_jobs` permission.
  - **Permission**: `view_all_jobs` or `view_assigned_jobs` (GET), `create_jobs` (POST)
  
- `/api/jobs/[id]` - Job operations (multiple endpoints)
  - **GET**: Returns single job. Tech role can only access if assigned to them.
  - **PATCH**: Updates job. Requires `edit_jobs` permission.
  - **Permission**: `view_all_jobs` or `view_assigned_jobs` (GET), `edit_jobs` (PATCH)
  
- `/api/jobs/bulk` - Bulk job operations
  - **POST**: Bulk assign jobs or update status. Requires `assign_jobs` permission.
  - **Permission**: `assign_jobs` or `edit_jobs`
  
- `/api/jobs/checklist-templates` - Checklist templates
  - **GET**: Returns checklist templates. Requires `view_all_jobs` permission.
  - **POST**: Creates checklist template. Requires `edit_jobs` permission.
  
- `/api/jobs/locations` - Job locations
  - **GET**: Returns job locations for mapping. Requires `view_all_jobs` or `view_dispatch_map` permission.
  
- `/api/jobs/photos` - Job photos
  - **GET**: Returns job photos. Requires `view_all_jobs` or `view_assigned_jobs` permission.
  
- `/api/jobs/request` - Job requests (Tech creates pending job requests)
  - **POST**: Creates job with `request_status: 'pending'` for dispatcher approval.
  - **Permission Check**: Direct role check (`role !== 'tech'` returns 403) - **INCONSISTENCY**: Should use `create_jobs` permission
  - **Behavior**: Tech cannot see pending requests in their assigned jobs list. Only dispatcher/owner/admin can approve.
  
- `/api/jobs/unassigned` - Unassigned jobs (Job requests pending approval)
  - **GET**: Returns jobs with `request_status: 'pending'` for dispatcher review.
  - **PATCH**: Approves or rejects job requests. Sets `request_status: 'approved'` or `'rejected'`. Can optionally assign to different tech.
  - **Permission**: `manage_dispatch` (dispatcher, owner, admin)
  - **Workflow**: Dispatcher views pending requests → Approves/rejects → Approved jobs become visible to assigned tech
  
- `/api/jobs/voice-notes` - Voice notes
  - **GET/POST**: Voice notes for jobs. Requires `view_assigned_jobs` or `view_all_jobs` permission.

#### Lead Management
- `/api/leads` - Leads CRUD
- `/api/leads/[id]` - Lead operations
- `/api/leads/pipeline` - Lead pipeline

#### LLM Router System
- `/api/llm` - LLM router
- `/api/llm/health` - LLM health check
- `/api/llm/metrics` - LLM metrics

#### AI Provider Config
- `/api/llm-providers` - Provider CRUD
- `/api/llm-providers/[id]` - Provider operations

#### Marketing Operations
- `/api/marketing/follow-ups` - Follow-ups
- `/api/marketing/lead-scoring` - Lead scoring
- `/api/marketing/predictive` - Predictive analytics

#### Model Context Protocol
- `/api/mcp` - MCP operations

#### Meeting Management
- `/api/meetings` - Meetings CRUD
- `/api/meetings/[id]` - Meeting operations
- `/api/meetings/analyze` - Analyze meeting
- `/api/meetings/analyze-realtime` - Realtime analysis
- `/api/meetings/notes` - Meeting notes

#### Direct Messaging
- `/api/messages/direct` - Direct messages

#### Alert System
- `/api/notifications` - Notifications CRUD
- `/api/notifications/[id]` - Notification operations
- `/api/notifications/read-all` - Mark all as read

#### Office Operations
- `/api/office/clearances` - Clearances (Job gates requiring exception)
  - **GET**: Returns pending escalations (gates requiring exception).
  - **Permission Check**: Direct role check (`!['admin', 'dispatcher', 'owner'].includes(role)`) - **INCONSISTENCY**: Should use `manage_dispatch` permission
  - **Returns**: Job gates with `requires_exception: true` and `status: 'pending'`
  
- `/api/office/stats` - Office statistics
  - **GET**: Returns office/dispatcher statistics. Requires `manage_dispatch` or `view_analytics` permission.

#### User Onboarding
- `/api/onboarding/analytics` - Onboarding analytics
- `/api/onboarding/complete` - Complete onboarding
- `/api/onboarding/dismiss` - Dismiss onboarding
- `/api/onboarding/restart` - Restart onboarding
- `/api/onboarding/status` - Onboarding status

#### Owner-specific APIs
- `/api/owner/stats` - Owner statistics

#### Parts Management
- `/api/parts` - Parts CRUD
- `/api/parts/[id]` - Part operations
- `/api/parts/bundles` - Part bundles
- `/api/parts/low-stock` - Low stock alerts
- `/api/parts/send` - Send parts

#### Payment Processing
- `/api/payments` - Payments CRUD
- `/api/payments/[id]` - Payment operations

#### Photo Management
- `/api/photos` - Photo operations

#### Report Generation
- `/api/reports` - Reports CRUD
- `/api/reports/ai-query` - AI query reports
- `/api/reports/builder` - Report builder
- `/api/reports/customer` - Customer reports
- `/api/reports/export` - Export reports
- `/api/reports/financial` - Financial reports
- `/api/reports/job-performance` - Job performance
- `/api/reports/revenue` - Revenue reports
- `/api/reports/tech-performance` - Tech performance

#### Review Requests
- `/api/review-requests` - Review requests

#### Sales Operations
- `/api/sales/analytics` - Sales analytics
- `/api/sales/briefing` - Sales briefing
- `/api/sales/competitors` - Competitor data
- `/api/sales/follow-ups` - Follow-ups
- `/api/sales/leads` - Sales leads
- `/api/sales/meetings` - Sales meetings
- `/api/sales/pipeline` - Sales pipeline
- `/api/sales/profile` - Sales profile

#### Scheduling System
- `/api/schedule/conflicts` - Schedule conflicts
- `/api/schedule/optimize` - Optimize schedule
- `/api/schedule/resources` - Resource scheduling
- `/api/schedule/travel-time` - Travel time

#### Search Functionality
- `/api/search` - Search operations

#### Database Seeding
- `/api/seed` - Seed database

#### Message Sending
- `/api/send-message` - Send message

#### Settings Management
- `/api/settings/ai` - AI settings (LLM provider configuration)
  - **GET/POST**: AI provider settings. Owner/admin only.
  - **Permission Check**: Direct role check (`!['owner', 'admin'].includes(role)`) - **INCONSISTENCY**: Should use `manage_settings` permission
  
- `/api/settings/automation` - Automation settings (rules management)
  - **GET/POST**: Automation rules CRUD. Owner/admin only.
  - **Permission Check**: Direct role check (`!['owner', 'admin'].includes(role)`) - **INCONSISTENCY**: Should use `manage_settings` permission
  
- `/api/settings/company` - Company settings
  - **GET/PATCH**: Company/account settings. Owner/admin only.
  - **Permission Check**: Direct role check (`!['owner', 'admin'].includes(role)`) - **INCONSISTENCY**: Should use `manage_settings` permission
  - **Includes**: Logo upload endpoint (`/api/settings/company/logo`)
  
- `/api/settings/notifications` - Notification settings
  - **GET/PATCH**: User notification preferences. All authenticated users.
  
- `/api/settings/profile` - Profile settings
  - **GET/PATCH**: User profile settings. All authenticated users (can only update own profile).

#### Signature Capture
- `/api/signatures` - Signature operations

#### Supplier Management
- `/api/suppliers` - Suppliers CRUD

#### Technician APIs
- `/api/tech/gates` - Job gates
  - **GET**: Returns job gates for assigned jobs. Requires tech role.
  
- `/api/tech/jobs` - Tech jobs
  - **GET**: Returns jobs assigned to tech. Requires tech role.
  
- `/api/tech/materials` - Materials
  - **GET/POST**: Materials for tech jobs. Requires tech role.
  
- `/api/tech/parts` - Parts inventory for tech dashboard
  - **GET**: Returns parts inventory filtered by account. Tech role only.
  - **POST**: Quick-add materials. Tech role only.
  - **Permission Check**: Direct role check (`role !== 'tech'` returns 403) - **INCONSISTENCY**: Should use `view_parts` permission
  - **Filters**: By account_id, is_active, search, category, low_stock
  
- `/api/tech/profile` - Tech profile
  - **GET/PATCH**: Tech profile operations. Requires tech role.
  
- `/api/tech/time-clock` - Time clock
  - **GET/POST**: Time clock operations. Requires tech role.

#### Technician Management
- `/api/techs/locations` - Tech locations

#### Template System
- `/api/templates/contacts` - Contact templates
- `/api/templates/jobs` - Job templates

#### Testing Endpoints
- `/api/test` - Test endpoint

#### Time Tracking
- `/api/time-entries` - Time entries

#### User Management
- `/api/users` - Users CRUD
- `/api/users/[id]` - User operations
- `/api/users/[id]/profile` - User profile
- `/api/users/[id]/profile-photos` - Profile photos
- `/api/users/[id]/profile-photos/reorder` - Reorder photos
- `/api/users/[id]/profile-photos/[photoId]` - Photo operations
- `/api/users/me` - Current user
- `/api/users/teammates` - Teammates

#### Voice Navigation
- `/api/voice-command` - Voice commands

#### External Integrations
- `/api/webhooks/elevenlabs` - ElevenLabs webhook
- `/api/webhooks/resend` - Resend webhook
- `/api/webhooks/stripe` - Stripe webhook

### 3.3 API Authentication Patterns

#### Authentication Methods
1. **Cookie-based** (Browser) - Uses `getAuthenticatedSession(request)` from `lib/auth-helper.ts`
2. **Bearer Token** (API) - Supports custom JWT and Supabase tokens
3. **Service Role** - Uses `SUPABASE_SERVICE_ROLE_KEY` for internal operations

#### Permission Checking Patterns
```typescript
// Pattern 1: Basic authentication check
const auth = await getAuthenticatedSession(request)
if (!auth) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Pattern 2: Role-based check
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', auth.user.id)
  .single()

if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Pattern 3: Service role check
const authHeader = request.headers.get('authorization')
const isServiceRole = authHeader?.startsWith('Bearer ') &&
  authHeader.substring(7) === process.env.SUPABASE_SERVICE_ROLE_KEY
```

### 3.4 API Security Middleware

**Source**: `lib/security/api-middleware.ts`

#### Features
- Rate limiting
- Input validation (Zod schemas)
- CSRF protection
- File upload validation
- CORS support
- Security headers

#### Usage
```typescript
import { withSecurity } from '@/lib/security/api-middleware'

export async function POST(request: NextRequest) {
  return withSecurity(request, async (req) => {
    // Handler logic
  }, {
    requireAuth: true,
    rateLimit: 'default',
    validation: schema,
  })
}
```

---

## 4. Component Structure

### 4.1 Component Modules (35+ modules)

**Base Path**: `components/`

- `admin/` - Admin components (12 files)
- `analytics/` - Analytics components
- `calendar/` - Calendar components
- `contacts/` - Customer management UI (5 files)
- `conversations/` - Messaging interface (3 files)
- `dashboard/` - Dashboard components (5 files)
- `dispatch/` - Dispatch management UI (11 files)
- `documents/` - File management UI (6 files)
- `email-templates/` - Email template components
- `estimates/` - Estimate components (6 files)
- `export/` - Data export tools
- `filters/` - Advanced filtering (2 files)
- `inbox/` - Message inbox UI (5 files)
- `integrations/` - Integration components (2 files)
- `inventory/` - Inventory management UI (2 files)
- `jobs/` - Work order components (10 files)
- `layout/` - Layout components (6 files)
- `marketing/` - Marketing campaign UI (3 files)
- `messaging/` - Direct messaging UI (3 files)
- `mobile/` - Mobile-optimized components (4 files)
- `notifications/` - Alert system UI (5 files)
- `onboarding/` - User onboarding flow (6 files)
- `parts/` - Parts management UI (3 files)
- `photos/` - Photo management UI
- `profile/` - User profile components (2 files)
- `reports/` - Report generation UI (10 files)
- `sales/` - Sales pipeline components (14 files)
- `scheduling/` - Scheduling components (3 files)
- `search/` - Search interface (2 files)
- `settings/` - Settings components (5 files)
- `tech/` - Technician interface (16 files)
- `templates/` - Template management UI
- `ui/` - shadcn/ui component library (34 components)
- `voice/` - Voice components
- `voice-agent/` - Voice AI interface

### 4.2 Standalone Voice Components

- `conditional-voice-navigation-bridge.tsx`
- `conditional-voice-widget.tsx`
- `dual-voice-widget.tsx`
- `voice-agent-overlay.tsx`
- `voice-conversation-provider.tsx`
- `voice-error-boundary.tsx`
- `voice-navigation-bridge-simple.tsx`
- `voice-navigation-bridge.tsx`
- `voice-provider-selector.tsx`
- `voice-provider-wrapper.tsx`

---

## 5. Data Flow Patterns

### 5.1 UI → API → Database Flow

1. **User Action** → Component event handler
2. **API Call** → `fetch('/api/...')` or React Query mutation
3. **Authentication** → `getAuthenticatedSession(request)` in API route
4. **Permission Check** → Role check in API route handler
5. **Database Query** → Supabase client with RLS enforcement
6. **Response** → JSON response back to component
7. **UI Update** → React Query cache update or state update

### 5.2 Permission Checks at Each Layer

#### UI Layer
- `PermissionGate` component wraps UI elements
- Checks user role against required permissions
- Admin role bypasses all checks

#### API Layer
- `getAuthenticatedSession(request)` validates authentication
- Manual role checks: `user.role !== 'admin' && user.role !== 'owner'`
- Returns 401 (Unauthorized) or 403 (Forbidden) on failure

#### Database Layer (RLS)
- Row Level Security policies enforce account isolation
- All queries filtered by `account_id = get_user_account_id()`
- Policies use `USING` and `WITH CHECK` clauses

### 5.3 Account Isolation

- All tables have `account_id` column
- RLS policies filter by `account_id`
- Helper function: `get_user_account_id()` returns user's account_id
- API routes validate account access before queries

### 5.4 Error Handling

#### UI Layer
- React Query error handling
- Toast notifications for errors
- Error boundaries for component errors

#### API Layer
- Try-catch blocks in route handlers
- Standardized error responses: `{ error: string }`
- HTTP status codes: 400, 401, 403, 404, 500

#### Database Layer
- RLS policy failures return 406 or 500
- Query errors logged and returned as 500

---

**End of System Architecture Documentation**

13:29:46 Dec 03, 2025

