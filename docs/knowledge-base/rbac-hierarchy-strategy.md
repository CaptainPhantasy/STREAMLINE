# RBAC Hierarchy Strategy Report

**Last Updated**: 15:27:30 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Document the top-down role hierarchy strategy and implementation approach

---

## Executive Summary

This document outlines the comprehensive Role-Based Access Control (RBAC) hierarchy strategy implemented across the CRM AI PRO platform. The strategy ensures that **super_admin** has full access to everything, and each role below has precisely the permissions needed for their responsibilities, working down the hierarchy.

---

## 1. Role Hierarchy Overview

### 1.1 Hierarchy Structure (Top to Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ PLATFORM TIER (Cross-Account Access)                        │
├─────────────────────────────────────────────────────────────┤
│ super_admin (Douglas) - Platform Owner                      │
│   └─ FULL ACCESS: ALL accounts, ALL tables, ALL operations   │
│                                                              │
│ admin (Legacy AI Team) - Platform Support                   │
│   └─ FULL ACCESS: ALL accounts, ALL tables, ALL operations  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ACCOUNT MANAGEMENT TIER (Account-Scoped Access)             │
├─────────────────────────────────────────────────────────────┤
│ owner (Client Account Owner)                                 │
│   └─ FULL ACCESS: Their account only                        │
│   └─ Can create: manager, assistant_manager, dispatcher,   │
│                   tech, sales, csr                          │
│                                                              │
│ manager (Delegated by Owner)                                 │
│   └─ FULL ACCESS: Their account (same as owner)            │
│   └─ Can create: assistant_manager, dispatcher, tech,       │
│                   sales, csr                                │
│   └─ Cannot create: super_admin, admin, owner, manager     │
│                                                              │
│ assistant_manager (Delegated by Owner/Manager)              │
│   └─ LIMITED ACCESS: Their account (subset of manager)     │
│   └─ Can create: dispatcher, tech, sales, csr              │
│   └─ Cannot create: super_admin, admin, owner, manager,     │
│                     assistant_manager                       │
│   └─ Cannot delete: jobs, contacts, users                │
│   └─ Cannot manage: settings, marketing, full financials  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ OPERATIONAL TIER (Role-Specific Access)                     │
├─────────────────────────────────────────────────────────────┤
│ dispatcher - Dispatch Operations                            │
│   └─ Can: View all jobs, assign jobs, manage dispatch      │
│   └─ Cannot: Manage users, delete jobs, manage financials  │
│                                                              │
│ tech - Field Technician                                     │
│   └─ Can: View assigned jobs, edit assigned jobs           │
│   └─ Cannot: View all jobs, manage users, view financials  │
│                                                              │
│ sales - Sales Representative                                │
│   └─ Can: Manage contacts, view estimates                  │
│   └─ Cannot: View jobs, manage users, view financials       │
│                                                              │
│ csr - Customer Service Representative                       │
│   └─ Can: View all jobs, create jobs, create invoices      │
│   └─ Cannot: Edit jobs, assign jobs, manage users          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Top-Down Analysis Strategy

### 2.1 From Admin Perspective → Owner Needs

**Question**: "What does an owner need to fully manage their account?"

**Answer**: Everything that admin has, but scoped to their account:
- ✅ Full user management (create: manager, assistant_manager, dispatcher, tech, sales, csr)
- ✅ Full job management (view, create, edit, delete, assign)
- ✅ Full contact management (view, create, edit, delete)
- ✅ Full financial management (view, create, edit invoices, manage payments)
- ✅ Full marketing management (campaigns, templates, automations)
- ✅ Full settings management (account settings, LLM providers, email providers)
- ✅ Full analytics access (view, export reports, view insights)
- ✅ Full dispatch management (GPS, routes, waypoints)
- ✅ Full parts/inventory management
- ✅ Audit log access (their account only)

**Implementation**: Owner has same permissions as admin, but RLS enforces `account_id = get_user_account_id()`

### 2.2 From Owner Perspective → Manager Needs

**Question**: "What does a manager need to run daily operations?"

**Answer**: Same as owner, but cannot create other managers or owners:
- ✅ Full user management (create: assistant_manager, dispatcher, tech, sales, csr)
- ✅ Full job management (view, create, edit, delete, assign)
- ✅ Full contact management (view, create, edit, delete)
- ✅ Full financial management (view, create, edit invoices, manage payments)
- ✅ Full marketing management (campaigns, templates, automations)
- ✅ Full settings management (account settings, LLM providers, email providers)
- ✅ Full analytics access (view, export reports, view insights)
- ✅ Full dispatch management (GPS, routes, waypoints)
- ✅ Full parts/inventory management
- ✅ Audit log access (their account only)
- ❌ Cannot create: super_admin, admin, owner, or other managers

**Implementation**: Manager has same permissions as owner, but user creation policy restricts role creation

### 2.3 From Manager/Owner Perspective → Assistant Manager Needs

**Question**: "What does an assistant manager need to help with operations without full control?"

**Answer**: Operational support with restrictions:
- ✅ User management (create: dispatcher, tech, sales, csr)
- ✅ User updates (update: dispatcher, tech, sales, csr)
- ✅ Job management (view all, create, edit, assign)
- ✅ Contact management (view, create, edit)
- ✅ Financial viewing (view financials, create invoices)
- ✅ Dispatch management (view map, manage dispatch, view GPS)
- ✅ Analytics viewing (view analytics, view reports)
- ✅ Parts viewing (view parts inventory)
- ❌ Cannot delete: jobs, contacts, users
- ❌ Cannot manage: settings, marketing campaigns, full financials
- ❌ Cannot export: reports, customer insights
- ❌ Cannot impersonate: users

**Implementation**: Assistant manager has subset of manager permissions, with delete/management restrictions

### 2.4 From Owner/Manager Perspective → Dispatcher Needs

**Question**: "What does a dispatcher need to coordinate field operations?"

**Answer**: Dispatch-focused operations:
- ✅ Job management (view all, create, edit, assign)
- ✅ Contact management (view, create, edit)
- ✅ Dispatch operations (view map, manage dispatch, view GPS)
- ✅ Parts viewing (view parts inventory)
- ✅ Analytics viewing (view analytics, view estimates)
- ❌ Cannot manage: users, financials, marketing, settings
- ❌ Cannot delete: jobs, contacts

**Implementation**: Dispatcher has job/contact/dispatch permissions only

### 2.5 From Owner/Manager Perspective → Tech Needs

**Question**: "What does a tech need to complete field work?"

**Answer**: Assigned job operations only:
- ✅ Job management (view assigned, edit assigned, create job requests)
- ✅ Contact viewing (view contacts for job context)
- ✅ Voice navigation (voice commands)
- ❌ Cannot view: all jobs, financials, analytics, parts
- ❌ Cannot manage: users, dispatch, settings

**Implementation**: Tech can only see jobs where `tech_assigned_id = auth.uid()` AND `request_status IS NULL OR 'approved'`

### 2.6 From Owner/Manager Perspective → Sales Needs

**Question**: "What does a sales rep need to manage leads and customers?"

**Answer**: Contact and estimate management:
- ✅ Contact management (view, create, edit)
- ✅ Estimate viewing (view estimates)
- ✅ Marketing viewing (view marketing data)
- ✅ Voice navigation (voice commands)
- ❌ Cannot view: jobs, financials, parts, dispatch
- ❌ Cannot manage: users, settings

**Implementation**: Sales has contact/estimate permissions only

### 2.7 From Owner/Manager Perspective → CSR Needs

**Question**: "What does a CSR need to assist customers?"

**Answer**: Customer-facing operations:
- ✅ Contact management (view, create, edit)
- ✅ Job viewing (view all jobs to assist customers)
- ✅ Job creation (create jobs for customers)
- ✅ Financial viewing (view financials, view estimates)
- ✅ Invoice creation (create invoices for customers)
- ✅ Dispatch viewing (view map to see tech locations)
- ✅ Voice navigation (voice commands)
- ❌ Cannot edit: jobs (can only view/create)
- ❌ Cannot assign: jobs to techs
- ❌ Cannot manage: users, full financials, dispatch

**Implementation**: CSR has view/create permissions for jobs/invoices, but cannot edit/assign

---

## 3. Implementation Strategy

### 3.1 Database Layer (RLS Policies)

**Pattern**: Every policy follows this structure:

```sql
CREATE POLICY "policy_name"
  ON table_name FOR operation
  USING (
    -- 1. Super admin/admin bypass (FIRST CHECK)
    is_super_admin_or_admin()
    OR
    -- 2. Account-scoped access
    (
      account_id = get_user_account_id()
      AND
      -- 3. Role-based permissions
      (role_check_here)
    )
  )
  WITH CHECK (
    -- Same pattern for INSERT/UPDATE
    is_super_admin_or_admin()
    OR
    (
      account_id = get_user_account_id()
      AND
      (role_check_here)
    )
  );
```

**Key Principles**:
1. **Super admin/admin bypass FIRST** - Always check `is_super_admin_or_admin()` before account checks
2. **Account isolation** - All non-admin roles are restricted to their `account_id`
3. **Role-based permissions** - Use `user_has_role()` or specific role checks
4. **Consistent helper functions** - Use `get_user_account_id()`, `get_user_role()`, `user_has_role()`

### 3.2 User Creation Restrictions

**Pattern**: Role-based user creation with restrictions:

```sql
CREATE POLICY "user_creation"
  ON users FOR INSERT
  WITH CHECK (
    is_super_admin_or_admin()
    OR (
      account_id = get_user_account_id()
      AND (
        -- Owner can create: manager, assistant_manager, dispatcher, tech, sales, csr
        (get_user_role() = 'owner' AND role IN ('manager', 'assistant_manager', 'dispatcher', 'tech', 'sales', 'csr'))
        OR
        -- Manager can create: assistant_manager, dispatcher, tech, sales, csr
        (get_user_role() = 'manager' AND role IN ('assistant_manager', 'dispatcher', 'tech', 'sales', 'csr'))
        OR
        -- Assistant Manager can create: dispatcher, tech, sales, csr
        (get_user_role() = 'assistant_manager' AND role IN ('dispatcher', 'tech', 'sales', 'csr'))
      )
    )
  );
```

**Restrictions**:
- **Owner** cannot create: super_admin, admin, other owners
- **Manager** cannot create: super_admin, admin, owner, other managers
- **Assistant Manager** cannot create: super_admin, admin, owner, manager, other assistant_managers
- **Dispatcher/Tech/Sales/CSR** cannot create users

### 3.3 Permission Matrix

| Permission | super_admin | admin | owner | manager | assistant_manager | dispatcher | tech | sales | csr |
|------------|-------------|-------|-------|---------|-------------------|------------|------|-------|-----|
| **User Management** |
| manage_users | ✅ | ✅ | ✅ | ✅ | ✅ (limited) | ❌ | ❌ | ❌ | ❌ |
| view_users | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| impersonate_users | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Job Management** |
| view_all_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| view_assigned_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| create_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| edit_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| delete_jobs | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| assign_jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Contact Management** |
| view_contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| edit_contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| delete_contacts | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
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
| view_settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 4. Key Implementation Details

### 4.1 Super Admin/Admin Bypass

**Every RLS policy** checks `is_super_admin_or_admin()` FIRST:

```sql
USING (
  is_super_admin_or_admin()  -- ← ALWAYS FIRST
  OR
  (account_id = get_user_account_id() AND role_check)
)
```

**Why**: Super admin and admin need to access ALL accounts for support/maintenance. This bypass must be checked before account filtering.

### 4.2 Account Isolation

**All non-admin roles** are restricted to their account:

```sql
account_id = get_user_account_id()
```

**Why**: Multi-tenant security - users can only access data in their own account.

### 4.3 Role-Based Permissions

**Each role** has specific permissions checked via:

```sql
user_has_role(ARRAY['owner', 'manager', 'assistant_manager'])
```

**Why**: Different roles need different access levels. Permissions match the permission system in `lib/auth/permissions.ts`.

### 4.4 User Creation Restrictions

**Role hierarchy** enforced in user INSERT policy:

- **Owner** → Can create: manager, assistant_manager, dispatcher, tech, sales, csr
- **Manager** → Can create: assistant_manager, dispatcher, tech, sales, csr
- **Assistant Manager** → Can create: dispatcher, tech, sales, csr
- **Dispatcher/Tech/Sales/CSR** → Cannot create users

**Why**: Prevents privilege escalation - users cannot create roles above their own level.

---

## 5. Migration Implementation

### 5.1 Migration File

**File**: `supabase/migrations/20251203152730_comprehensive_rls_super_admin_access.sql`

**Purpose**: 
- Ensure super_admin/admin have FULL access to ALL tables
- Configure role-based access for all other roles
- Apply consistent helper functions across all policies

### 5.2 Tables Covered

**60+ tables** with RLS policies updated:
- Core: accounts, users, contacts, conversations, messages, jobs
- Financial: invoices, payments, estimates
- Operations: parts, job_photos, job_materials, job_parts, job_gates, job_notes, job_checklist_items
- Tracking: gps_logs, time_entries, meetings
- Marketing: campaigns, campaign_recipients, email_templates, email_queue, email_analytics
- Settings: account_settings, llm_providers, email_providers, calendar_providers
- And many more...

### 5.3 Key Fixes Applied

1. **Super Admin Bypass**: All policies check `is_super_admin_or_admin()` FIRST
2. **Assistant Manager User Creation**: Fixed to allow creating dispatcher, tech, sales, csr
3. **Assistant Manager User Updates**: Fixed to allow updating dispatcher, tech, sales, csr
4. **Consistent Helper Functions**: All policies use same helper functions
5. **Role Restrictions**: User creation enforces role hierarchy

---

## 6. Verification Checklist

After migration, verify:

- [ ] Super admin can access ALL tables in ALL accounts
- [ ] Admin can access ALL tables in ALL accounts
- [ ] Owner can access all tables in their account only
- [ ] Manager can access all tables in their account only
- [ ] Assistant manager can create/update operational roles (dispatcher, tech, sales, csr)
- [ ] Assistant manager cannot delete jobs/contacts/users
- [ ] Assistant manager cannot manage settings/marketing
- [ ] Dispatcher can manage dispatch operations
- [ ] Tech can only see assigned jobs
- [ ] Sales can manage contacts/estimates
- [ ] CSR can view all jobs and create invoices

---

## 7. Next Steps

1. **Apply Migration**: Run the comprehensive RLS migration
2. **Create Owner User**: Create the initial account owner
3. **Test Access**: Verify super_admin can access all tables
4. **Test Role Hierarchy**: Verify each role has appropriate access
5. **Document Results**: Update this document with any findings

---

**Report Complete**

15:27:30 Dec 03, 2025
