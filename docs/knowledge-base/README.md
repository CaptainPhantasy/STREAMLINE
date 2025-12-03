# Knowledge Base for Bug Finder Dispatch

**Last Updated**: 13:29:46 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Comprehensive knowledge base for configuring and dispatching bug finders

---

## Overview

This knowledge base contains complete documentation of the CRM AI PRO system architecture, components, data flows, and expected behaviors. This documentation is **NOT about finding bugs** - it's about understanding the system so that bug finders can be properly configured to find ALL problems.

---

## Knowledge Base Structure

### 1. System Architecture (`system-architecture.md`)

**Contents**:
- Complete role and permission system structure
- All 9 user roles and 30+ permissions
- Permission checking functions and patterns
- Page and route structure (19 dashboard modules)
- API endpoint structure (241 endpoints)
- Component structure overview
- Data flow patterns overview

**Use For**: Understanding the overall system structure and how permissions work

### 2. Database Schema (`database-schema.md`)

**Contents**:
- Complete database schema (80+ tables)
- Table structures with columns, types, constraints
- Row Level Security (RLS) policies (complete inventory)
- RLS helper functions
- Account isolation patterns
- Constraints and indexes

**Use For**: Understanding database structure and security policies

### 3. Component Structure (`component-structure.md`)

**Contents**:
- Component organization (35+ modules)
- PermissionGate usage patterns
- Component data fetching patterns (React Query, Fetch)
- Component dependencies
- Component error handling
- Component state management

**Use For**: Understanding UI components and how they interact with APIs

### 4. Data Flow (`data-flow.md`)

**Contents**:
- Complete UI → API → Database flow
- Authentication flow at each layer
- Permission checks at each layer
- Account isolation flow
- Error flow
- Real-time data flow
- Data consistency checks

**Use For**: Understanding how data flows through the system and where permission checks occur

### 5. Expected Behavior (`expected-behavior.md`)

**Contents**:
- Expected permission behavior matrix for all roles
- Expected permission behavior by feature
- Expected data behavior for pages and APIs
- Expected error behavior
- Expected account isolation behavior
- Expected permission check consistency
- Expected role-specific behaviors

**Use For**: Understanding what SHOULD work for each role and feature

### 6. Verification Requirements (`verification-requirements.md`)

**Contents**:
- What needs to be verified
- Verification methods (code analysis, database queries, API testing, UI testing)
- Verification test scenarios
- Mismatch detection requirements
- Edge cases to verify
- Integration points to verify
- Security verification
- Bug detection priorities

**Use For**: Understanding what needs to be tested and how to detect mismatches


## Quick Reference

### System Statistics

- **User Roles**: 9 (super_admin, admin, owner, manager, assistant_manager, dispatcher, tech, sales, csr)
- **Permissions**: 30+
- **Dashboard Modules**: 19
- **API Endpoints**: 241
- **Database Tables**: 80+
- **Component Modules**: 35+
- **RLS Policies**: 100+ policies across all tables

### Key Files

#### Permission System
- `lib/auth/permissions.ts` - Permission definitions and role mappings
- `lib/types/permissions.ts` - Permission type definitions
- `lib/auth/PermissionGate.tsx` - UI permission gate component
- `lib/auth/role-routes.ts` - Role-based routing

#### Authentication
- `lib/auth-helper.ts` - Authentication helper functions
- `lib/security/api-middleware.ts` - API security middleware

#### Database
- `supabase/migrations/` - Database migrations (47 SQL files)
- `supabase/migrations/rls-policies.sql` - RLS policy definitions
- `supabase/migrations/fix-rls-performance.sql` - RLS optimizations

---

## How to Use This Knowledge Base

### For Bug Finder Configuration

1. **Start with System Architecture** - Understand roles, permissions, and overall structure
2. **Review Database Schema** - Understand data structure and RLS policies
3. **Examine Data Flow** - Understand how data flows and where checks occur
4. **Check Expected Behavior** - Understand what should work for each role
5. **Use Verification Requirements** - Understand what needs to be tested

### For Finding Permission Bugs

1. **Check Permission Consistency** - Compare UI, API, and Database permission checks
2. **Verify Account Isolation** - Ensure all layers enforce account isolation
3. **Test Role Boundaries** - Verify users cannot access features for other roles
4. **Check Error Handling** - Verify errors are handled correctly at each layer

### For Finding Data Flow Bugs

1. **Trace Data Flow** - Follow data from UI → API → Database
2. **Check Permission Checks** - Verify permission checks at each layer
3. **Verify Account Isolation** - Ensure account_id filtering at each layer
4. **Check Error Propagation** - Verify errors propagate correctly

---

## Success Criteria

Before dispatching a bug finder, verify:

- [x] Complete understanding of permission system architecture
- [x] Complete page inventory with all dependencies
- [x] Complete API endpoint catalog with schemas
- [x] Complete database schema documentation
- [x] Complete RLS policy documentation
- [x] Complete component inventory with dependencies
- [x] Complete data flow documentation
- [x] Expected permission behavior matrix
- [x] Expected data behavior documentation
- [x] Verification requirements specification
- [x] Mismatch detection requirements specification
- [x] All identified gaps filled in main documents

---

## Next Steps

1. **Review Knowledge Base** - Read all documentation files
2. **Configure Bug Finder** - Use knowledge base to configure bug finder
3. **Run Verification** - Execute verification scenarios
4. **Analyze Results** - Compare findings against expected behavior
5. **Report Bugs** - Document any mismatches or inconsistencies found

---

## Notes

- This knowledge base is a **snapshot** of the system at the time of creation
- System may evolve - update knowledge base when system changes
- Use Supabase MCP tools to query actual database state
- Use codebase_search and grep to find patterns in code
- Always verify against actual code and database, not just documentation

---

**Knowledge Base Complete**

**Note**: All identified gaps have been filled directly into the main documents. Permission inconsistencies are documented with **INCONSISTENCY** markers in the API endpoint documentation.

**RBAC Roadmap**: See `RBAC-ROADMAP.md` for complete implementation plan for the 9-role system.

13:29:46 Dec 03, 2025

