# RBAC System Roadmap

**Last Updated**: 13:29:46 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Complete roadmap for implementing the 9-role RBAC system with proper hierarchy and access controls

---

## 1. Role Hierarchy Overview

### 1.1 Complete Role List (9 Roles)

The system defines **9 user roles** organized into three tiers:

#### Platform Tier (Cross-Account Access)
1. **super_admin** - Platform owner (Douglas)
   - Full unrestricted access to ALL accounts at ALL times
   - Can create accounts and initial owners
   - Can intervene in any account for support/maintenance
   - Bypasses RLS for cross-account operations
   - Only one user: Douglas

2. **admin** - Legacy AI development team
   - Full unrestricted access to ALL accounts at ALL times
   - Can create accounts and initial owners
   - Can intervene in any account for support/maintenance
   - Bypasses RLS for cross-account operations
   - Multiple users: Legacy AI team members

#### Account Management Tier (Account-Scoped Access)
3. **owner** - Client account owner
   - Full access to their own account only
   - Can create: manager, assistant_manager, dispatcher, tech, sales, csr
   - Cannot create: super_admin, admin, or other owners
   - Account-scoped: Cannot access other accounts

4. **manager** - Client's manager (delegated by owner)
   - Full account access (same as owner, but scoped to account)
   - Can create: assistant_manager, dispatcher, tech, sales, csr
   - Cannot create: super_admin, admin, owner, or other managers
   - Account-scoped: Cannot access other accounts
   - Created by: owner only

5. **assistant_manager** - Client's assistant manager (delegated by owner/manager)
   - Limited account access (subset of manager permissions)
   - Can create: dispatcher, tech, sales, csr
   - Cannot create: super_admin, admin, owner, manager, or other assistant_managers
   - Account-scoped: Cannot access other accounts
   - Created by: owner or manager only

#### Operational Tier (Role-Specific Access)
6. **dispatcher** - Operations coordinator
   - Job assignment, dispatch operations, GPS tracking
   - View all jobs, assign jobs to techs
   - Limited financial access (view only)
   - Created by: owner, manager, assistant_manager

7. **tech** - Field technicians
   - View assigned jobs only
   - Create job requests (requires dispatcher approval)
   - Mobile-only field operations
   - Created by: owner, manager, assistant_manager, dispatcher

8. **sales** - Sales representatives
   - Contact management, leads, meetings
   - View estimates, create contacts
   - Mobile-only sales operations
   - Created by: owner, manager, assistant_manager

9. **csr** - Customer Service Representative
   - View all jobs (to assist customers)
   - Create jobs and invoices
   - View contacts, financials (read-only)
   - Customer-facing operations
   - Created by: owner, manager, assistant_manager

---

## 2. Role Creation Rules

### 2.1 Who Can Create Which Roles

| Creator Role | Can Create |
|-------------|------------|
| **super_admin** | admin, owner (initial account setup) |
| **admin** | owner (initial account setup), admin (team members) |
| **owner** | manager, assistant_manager, dispatcher, tech, sales, csr |
| **manager** | assistant_manager, dispatcher, tech, sales, csr |
| **assistant_manager** | dispatcher, tech, sales, csr |
| **dispatcher** | tech (for job assignment) |
| **tech** | ❌ Cannot create users |
| **sales** | ❌ Cannot create users |
| **csr** | ❌ Cannot create users |

### 2.2 Role Creation Restrictions

- **super_admin** can only be created manually in database (Douglas only)
- **admin** can only be created by super_admin or existing admin
- **owner** can only be created by super_admin or admin (during account setup)
- **manager** can only be created by owner
- **assistant_manager** can only be created by owner or manager
- Lower-tier roles cannot create higher-tier roles

---

## 3. Access Control Model

### 3.1 Platform Tier Access (super_admin, admin)

**Cross-Account Access:**
- ✅ Can access ALL accounts at ALL times
- ✅ Can view/edit/delete data in ANY account
- ✅ Can create users in ANY account
- ✅ Can impersonate users in ANY account
- ✅ Bypasses RLS for cross-account operations (uses service role client)

**Use Cases:**
- Account setup and provisioning
- Support and troubleshooting
- Emergency interventions
- Platform maintenance

### 3.2 Account Management Tier Access (owner, manager, assistant_manager)

**Account-Scoped Access:**
- ✅ Can access ONLY their own account
- ✅ Cannot access other accounts (RLS enforced)
- ✅ Can manage users within their account (based on role creation rules)
- ✅ Can view/edit/delete data within their account

**Use Cases:**
- Daily account management
- User onboarding and offboarding
- Account configuration
- Delegating responsibilities

### 3.3 Operational Tier Access (dispatcher, tech, sales, csr)

**Role-Specific Access:**
- ✅ Can access ONLY their own account (RLS enforced)
- ✅ Limited permissions based on role
- ✅ Cannot create users (except dispatcher can create techs for assignment)
- ✅ Cannot access admin features

**Use Cases:**
- Daily operational tasks
- Field work (tech)
- Sales operations (sales)
- Customer service (csr)
- Dispatch coordination (dispatcher)

---

## 4. Permission Structure

### 4.1 Permission Categories

1. **User Management**
   - `manage_users` - Create, edit, delete users
   - `view_users` - View user list
   - `impersonate_users` - Impersonate other users

2. **Job Management**
   - `view_all_jobs` - View all jobs in account
   - `view_assigned_jobs` - View only assigned jobs
   - `create_jobs` - Create new jobs
   - `edit_jobs` - Edit job details
   - `delete_jobs` - Delete jobs
   - `assign_jobs` - Assign jobs to techs

3. **Contact Management**
   - `view_contacts` - View contacts
   - `create_contacts` - Create new contacts
   - `edit_contacts` - Edit contact details
   - `delete_contacts` - Delete contacts

4. **Financial Management**
   - `manage_financials` - View and manage financial data
   - `view_financials` - View financial data (read-only)
   - `create_invoices` - Create invoices
   - `edit_invoices` - Edit invoices

5. **Marketing**
   - `manage_marketing` - Manage campaigns and templates
   - `view_marketing` - View marketing data
   - `send_campaigns` - Send marketing campaigns

6. **Analytics & Reports**
   - `view_analytics` - View analytics dashboard
   - `view_reports` - View reports
   - `export_reports` - Export reports
   - `view_estimates` - View and manage estimates
   - `view_parts` - View and manage parts inventory

7. **Dispatch & GPS**
   - `view_dispatch_map` - View dispatch map
   - `manage_dispatch` - Manage dispatch operations
   - `view_gps` - View GPS tracking

8. **Settings**
   - `manage_settings` - Manage system settings
   - `view_settings` - View settings

9. **AI & Voice Features**
   - `voice_navigation_access` - Access voice navigation commands
   - `predictive_analytics_view` - View predictive analytics insights

10. **Advanced Features**
    - `equipment_management_advanced` - Advanced equipment management
    - `customer_insights_export` - Export customer insights data

### 4.2 Role Permission Matrix

| Permission | super_admin | admin | owner | manager | assistant_manager | dispatcher | tech | sales | csr |
|------------|-------------|-------|-------|---------|-------------------|------------|------|-------|-----|
| **User Management** |
| manage_users | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_users | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| impersonate_users | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Job Management** |
| view_all_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| view_assigned_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| create_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| edit_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| delete_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| assign_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Contact Management** |
| view_contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| edit_contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| delete_contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Financial Management** |
| manage_financials | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view_financials | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| create_invoices | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| edit_invoices | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Marketing** |
| manage_marketing | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view_marketing | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| send_campaigns | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Analytics & Reports** |
| view_analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_reports | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| export_reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view_estimates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| view_parts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Dispatch & GPS** |
| view_dispatch_map | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| manage_dispatch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_gps | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Settings** |
| manage_settings | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view_settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **AI & Voice** |
| voice_navigation_access | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| predictive_analytics_view | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Advanced Features** |
| equipment_management_advanced | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| customer_insights_export | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Implementation Phases

### Phase 1: Documentation & Planning ✅ (Current)
- [x] Create RBAC roadmap
- [x] Update system-architecture.md
- [x] Update expected-behavior.md
- [x] Update database-schema.md
- [ ] Verify all documentation consistency

### Phase 2: Type System Updates
- [ ] Update `lib/types/permissions.ts` - Add super_admin, manager, assistant_manager to UserRole type
- [ ] Update `lib/auth/role-routes.ts` - Add routes for new roles
- [ ] Update `lib/auth/permissions.ts` - Add permissions for new roles

### Phase 3: Database Schema Updates
- [ ] Update `users.role` CHECK constraint to include all 9 roles
- [ ] Create migration to add super_admin, manager, assistant_manager roles
- [ ] Update RLS helper functions to recognize new roles
- [ ] Update RLS policies for cross-account access (super_admin, admin)

### Phase 4: User Creation Logic
- [ ] Update `/api/admin/users/route.ts` - Add role creation restrictions
- [ ] Update `/api/users/route.ts` - Add role creation restrictions
- [ ] Add pre-creation validation (prevent NULL role, account_id)
- [ ] Add role creation permission checks

### Phase 5: RLS Policy Updates
- [ ] Update RLS policies to allow super_admin/admin cross-account access
- [ ] Update RLS policies for manager role
- [ ] Update RLS policies for assistant_manager role
- [ ] Test RLS with all roles

### Phase 6: UI Updates
- [ ] Update user creation forms with role restrictions
- [ ] Update role selection dropdowns
- [ ] Add role creation guidance/help text
- [ ] Update permission gates for new roles

### Phase 7: Testing & Verification
- [ ] Test super_admin cross-account access
- [ ] Test admin cross-account access
- [ ] Test role creation restrictions
- [ ] Test all permissions for each role
- [ ] Test RLS policies with all roles

### Phase 8: Cleanup & Migration
- [ ] Delete test users (keep only Douglas)
- [ ] Make Douglas super_admin
- [ ] Verify super_admin has full access
- [ ] Incrementally add roles and test

---

## 6. Key Design Decisions

### 6.1 Admin Access Model

**Decision**: Admin and super_admin have full, unrestricted access to ALL accounts at ALL times.

**Rationale**:
- Platform provider (Legacy AI) needs to support clients
- Emergency interventions require immediate access
- Account setup requires cross-account access
- Support and troubleshooting require full visibility

**Implementation**:
- Use service role client for admin operations
- Bypass RLS for cross-account queries
- Maintain account isolation for non-admin users

### 6.2 Manager Role Delegation

**Decision**: Owner can delegate account management to managers, who can further delegate to assistant managers.

**Rationale**:
- Business owners don't typically manage day-to-day operations
- Managers need full account access to operate effectively
- Assistant managers need limited access for operational support
- Reduces need for platform admin intervention

**Implementation**:
- Manager has same permissions as owner (account-scoped)
- Assistant manager has subset of manager permissions
- Role creation restrictions enforce hierarchy

### 6.3 NULL Field Prevention

**Decision**: Prevent NULL values in critical fields (role, account_id) at user creation time, not post-creation.

**Rationale**:
- Prevents broken user states
- Ensures data integrity from creation
- Reduces need for cleanup triggers
- Better user experience (clear validation errors)

**Implementation**:
- Application-level validation before database insert
- Database NOT NULL constraints as safety net
- Clear error messages for missing required fields

### 6.4 Role Creation Restrictions

**Decision**: Enforce role creation restrictions at application level, not just database level.

**Rationale**:
- Prevents privilege escalation
- Maintains role hierarchy
- Clear error messages for invalid role creation
- Easier to audit and debug

**Implementation**:
- API route validation before user creation
- Role creation matrix (who can create what)
- Clear error messages for unauthorized role creation

---

## 7. Testing Strategy

### 7.1 Clean Slate Approach

**Strategy**: Delete all test users except Douglas, make Douglas super_admin, then test incrementally.

**Steps**:
1. Backup current database state
2. Delete all test users (keep Douglas)
3. Make Douglas super_admin
4. Test super_admin has full access to all accounts
5. Add owner → test account-scoped access
6. Add manager → test manager permissions
7. Add assistant_manager → test limited permissions
8. Add operational roles → test role-specific access

**Benefits**:
- Clean baseline for testing
- Easier to debug issues
- Incremental verification
- Matches real-world setup

### 7.2 Test Scenarios

1. **Cross-Account Access**
   - super_admin can access all accounts
   - admin can access all accounts
   - owner cannot access other accounts

2. **Role Creation**
   - owner can create manager
   - manager can create assistant_manager
   - assistant_manager cannot create manager
   - dispatcher cannot create owner

3. **Permission Checks**
   - Each role has correct permissions
   - RLS policies enforce account isolation
   - Permission gates work correctly

4. **NULL Prevention**
   - Cannot create user without role
   - Cannot create user without account_id
   - Clear error messages

---

## 8. Migration Checklist

- [ ] Update all documentation files
- [ ] Update TypeScript types
- [ ] Update database schema
- [ ] Update RLS policies
- [ ] Update API routes
- [ ] Update UI components
- [ ] Test all roles
- [ ] Clean up test users
- [ ] Make Douglas super_admin
- [ ] Verify full system access

---

**End of RBAC Roadmap**

13:29:46 Dec 03, 2025

