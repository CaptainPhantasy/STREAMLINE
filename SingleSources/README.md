# SingleSources - Single Source of Truth Documentation

This folder contains the **single source of truth** documents for the CRM-AI-PRO platform. These documents are the **only** authoritative references for their respective domains.

## Purpose

When multiple documentation files exist across the project, it becomes difficult to know which is current and accurate. The SingleSources folder solves this problem by:

1. **Consolidating** information from multiple sources into one authoritative document
2. **Preventing confusion** by clearly marking which documents are current
3. **Simplifying maintenance** by having one place to update documentation
4. **Archiving historical** documentation for reference without cluttering the project

---

## Current Documents

### 1. 📄 UI_UX_MASTER_ROADMAP.md (v2.0)
**Domain:** Frontend Architecture & Features
**Last Updated:** November 28, 2025
**Status:** Production Ready (95% Complete)

**Consolidates:**
- All UI/UX role flows and architecture
- Mobile PWA implementation details (100% complete)
- Desktop component inventory
- Platform strategic roadmap

**Use Cases:**
- Verifying feature completeness per role (Tech, Sales, Owner)
- Reference for PWA offline/sync architecture
- Theme system (Solaris/Opus) specifications

### 2. 🧠 MCP_TOOL_REQUIREMENTS.md (v2.2)
**Domain:** AI Tools & Backend Logic
**Last Updated:** November 28, 2025 - 12:30 PM
**Status:** ✅ COMPLETE PARITY

**Consolidates:**
- **The Technical Bible:** Exact Zod schemas for all 18 MCP tools (9 core + 9 utility)
- **Zero-Ambiguity Protocol:** Anti-confusion language for UUID vs name fields
- **Search-First, ID-Always:** The mandatory workflow for all agents
- **Navigation Enums:** The hardcoded list of 11 allowed page routes
- **Validation Rules:** Constraints with .describe() instructions

**Use Cases:**
- Developing new MCP tools (must match this schema exactly)
- Debugging AI tool failures (check parameters here first)
- Voice Agent prompt engineering (derived from this file)
- Understanding tool dependencies and workflows

### 3. 🎙️ VOICE_AGENT_README.md (v2.2)
**Domain:** Voice Agent Integration Guide
**Last Updated:** November 28, 2025 - 12:30 PM
**Status:** ✅ CURRENT IMPLEMENTATION

**Consolidates:**
- **Complete Tool Catalog:** All 18 MCP tools with usage examples
- **Critical Protocols:** "Search-First, ID-Always" implementation
- **Anti-Error Guidelines:** UUID vs name field rules
- **Integration Dependencies:** Server setup and environment variables
- **Testing Procedures:** Verification workflows

**Use Cases:**
- Voice Agent system prompt construction
- Developer integration testing
- Troubleshooting agent failures
- Training new agents on CRM workflows

### 4. 🚀 DISPATCH_SYSTEM.md (v1.0)
**Domain:** Dispatch, GPS Tracking & Field Operations
**Last Updated:** November 28, 2025
**Status:** ✅ PRODUCTION READY

**Consolidates:**
- **8 React Components:** AssignTechDialog, TechDetailPanel, JobDetailPanel, TechListSidebar, DispatchStats, MapControls, HistoricalPlayback, JobSelectionDialog
- **3 Utility Libraries:** Geocoding, Auto-Assign Algorithm, Navigation
- **GPS Tracking:** Real-time location, Haversine distance, arrival/departure logging
- **Auto-Assign Algorithm:** Scoring factors (distance, performance, urgency, workload)
- **7 API Endpoints:** Complete dispatch API documentation

**Use Cases:**
- Understanding dispatch map architecture
- Implementing GPS tracking features
- Configuring auto-assign algorithm
- Troubleshooting dispatch issues

---

### 5. 🤖 LLM_INTEGRATION.md (v1.0)
**Domain:** AI/LLM Router & Multi-Provider Architecture
**Last Updated:** November 28, 2025
**Status:** ✅ PRODUCTION READY

**Consolidates:**
- **LLM Router:** Intelligent provider selection by use case
- **Caching Layer:** Memory cache (dev) + Redis cache (prod)
- **Rate Limiting:** Token bucket algorithm (10 req/s, 50 burst)
- **Circuit Breaker:** Fail-fast pattern with state machine
- **Retry Logic:** Exponential backoff with jitter
- **Metrics Collection:** Latency, tokens, cost tracking
- **Error Handling:** 9 structured error types
- **Budget Tracking:** Daily/monthly limits with alerts

**Use Cases:**
- Configuring LLM providers
- Understanding router architecture
- Implementing resilience patterns
- Monitoring AI costs and performance

---

### 6. 📚 API_REFERENCE.md (v2.0)
**Domain:** Complete REST API Documentation
**Last Updated:** November 28, 2025
**Status:** ✅ PRODUCTION READY

**Consolidates:**
- **165 API Endpoints:** All routes organized by category
- **Authentication:** Cookie/Bearer token patterns
- **Request/Response Formats:** With TypeScript types
- **Common Patterns:** Pagination, error handling, filtering
- **35+ Feature Categories:** Auth, Jobs, Contacts, Finance, AI, etc.

**Use Cases:**
- API endpoint reference for frontend development
- Understanding request/response formats
- Implementing new API consumers
- Testing and debugging API calls

---

### 7. 🗄️ DATABASE_SCHEMA.md (v3.0)
**Domain:** Database Architecture & Schema
**Last Updated:** November 28, 2025 - 2:47 AM
**Status:** ✅ PRODUCTION READY (100% Complete)

**Consolidates:**
- **Complete Table Reference:** All 55+ database tables with full specifications
- **TypeScript Type Definitions:** Exact type mappings for all entities
- **RLS Policies:** Row Level Security configuration for multi-tenant isolation
- **Performance Indexes:** 80+ strategic indexes for query optimization
- **Helper Functions:** All 8 database functions with usage examples
- **Migration History:** Complete chronological record of schema changes
- **Security Hardening:** All linter warnings addressed

**Use Cases:**
- Database schema reference for development
- Understanding table relationships and foreign keys
- RLS policy configuration and troubleshooting
- Migration planning and execution
- Performance optimization and index strategy
- Security audit and compliance verification

### 8. 🔌 INTEGRATIONS.md (v1.0)
**Domain:** Third-Party Service Integrations
**Last Updated:** November 28, 2025
**Status:** ✅ Production Ready

**Consolidates:**
- **Gmail Integration:** OAuth, send, sync, contact extraction
- **Microsoft 365 Integration:** Outlook, Graph API, mail sending
- **Google Calendar Integration:** Event sync, OAuth flow
- **Stripe Integration:** Webhooks, payment processing
- **ElevenLabs Voice Integration:** MCP server, voice navigation
- **Google Maps Integration:** Geocoding, dispatch optimization
- **Resend Email Integration:** Transactional emails, domain config
- **Environment Variables:** Complete reference for all integrations
- **Security & Encryption:** Token encryption, webhook verification

**Use Cases:**
- Setting up new integrations (OAuth flows, API keys)
- Troubleshooting integration failures
- Understanding webhook flows and event handling
- Configuring environment variables for deployments
- Security best practices for token storage

### 9. 🔐 AUTH_PERMISSIONS.md (v1.0)
**Domain:** Authentication, Authorization & Multi-Tenant Security
**Last Updated:** November 28, 2025 - 3:45 PM
**Status:** ✅ Production Ready

**Consolidates:**
- **Complete Permission System:** All 5 user roles with 33 granular permissions
- **Multi-Tenant Architecture:** Account isolation, RLS policies, data flow
- **React Components:** PermissionGate, usePermissions hook, convenience components
- **API Authentication Pattern:** Standard patterns for all API routes
- **Security Best Practices:** DOs and DON'Ts for secure implementation
- **Migration Guides:** Adding new roles and permissions

**Use Cases:**
- Implementing new features with proper permission checks
- Understanding role capabilities and restrictions
- Setting up multi-tenant accounts
- Debugging authentication/authorization issues
- Security auditing and compliance
- Training developers on auth system

### 10. ⚙️ CONFIGURATION.md (v3.0)
**Domain:** Configuration, Environment, & Deployment
**Last Updated:** November 28, 2025 - 1:45 PM
**Status:** ✅ PRODUCTION READY

**Consolidates:**
- **Environment Variables:** Complete reference for all services (Supabase, OpenAI, Anthropic, ElevenLabs, Google Maps, Resend, Stripe)
- **NPM Scripts:** All 40+ scripts with detailed usage examples and workflows
- **Docker Configuration:** Multi-service compose setup (app, MCP server, Supabase, nginx, Redis)
- **Development Setup:** Step-by-step guide from git clone to running application
- **Database Migrations:** Setup procedures, execution methods, rollback strategies
- **Production Deployment:** Automated scripts and manual workflows with pre/post-deployment checklists
- **Platform Specifics:** Railway and Vercel configuration, CLI commands, custom domains
- **Webpack Prevention:** Comprehensive cache management protocols to prevent runtime errors
- **Troubleshooting:** 10 common issues with detailed step-by-step solutions

**Use Cases:**
- New developer onboarding and environment setup
- Production deployment procedures (Railway/Vercel)
- Environment variable configuration and validation
- Database migration management
- Docker container orchestration
- Troubleshooting webpack, build, and deployment issues
- NPM script reference for all project operations


### 11. 📱 OFFLINE_SYNC.md (v2.0)
**Domain:** PWA Offline & Background Sync
**Last Updated:** November 28, 2025 - 3:15 AM
**Status:** ✅ PRODUCTION READY (95% Complete)

**Consolidates:**
- **IndexedDB Schema:** Complete Dexie.js database structure (5 tables: jobs, gateCompletions, photos, gpsLogs, syncQueue)
- **Service Worker:** Network-first caching with offline fallback, push notification handlers
- **Sync Queue System:** Automatic retry logic (max 5 attempts), exponential backoff, conflict detection
- **PWA Manifest:** Installation configuration, app metadata, standalone mode
- **GPS Integration:** Offline location tracking with automatic sync on reconnection
- **Offline Data Types:** TypeScript interfaces for all offline entities
- **Sync Service:** Background sync orchestration with event-driven architecture

**Use Cases:**
- Understanding offline data storage architecture
- Implementing new offline-capable features
- Debugging sync failures and queue issues
- Configuring PWA installation behavior
- Troubleshooting IndexedDB and service worker problems
- Performance optimization for offline storage
- Testing offline workflows and sync behavior

**Key Sections:**
- Complete TypeScript interfaces for all offline data types
- Service worker lifecycle and caching strategies
- Sync service implementation with retry logic
- Testing procedures and DevTools debugging
- Performance considerations and storage limits
- Troubleshooting guide for common offline issues

**Archived Documentation:**
- `/archive/docs-ui-ux-implementation-nov2025/PWA_OFFLINE_IMPLEMENTATION.md`
- `/shared-docs/task-3-offline-sync.md`

---

### 12. 📋 BUSINESS_WORKFLOWS.md (v1.0)
**Domain:** Business Processes & Workflow Logic
**Last Updated:** November 28, 2025
**Status:** ✅ PRODUCTION READY

**Consolidates:**
- **Job Lifecycle:** lead → scheduled → en_route → in_progress → completed → invoiced → paid
- **7-Gate Tech Workflow:** Mobile job completion with GPS, photos, signature, ratings
- **Invoice Generation:** From job completion to payment processing
- **Estimate Workflow:** draft → sent → viewed → accepted/rejected
- **Campaign Workflow:** draft → scheduled → sending → sent → completed
- **Onboarding Flows:** Role-specific onboarding (Owner: 7 steps, Tech: 5, Sales: 5, etc.)
- **Automation Triggers:** 8 trigger types with 7 action types
- **Notification System:** Email, SMS, push notification triggers

**Use Cases:**
- Understanding business process flows
- Implementing new workflow features
- Training team on CRM processes
- Debugging workflow state transitions
- Voice agent workflow guidance

---

## Rules for Single Source Documents

1. **Always Up-to-Date:** Documents in this folder MUST be kept current.
2. **Version Controlled:** Update version number and date when making changes.
3. **Comprehensive:** Cover the entire scope of the topic, not partial information.
4. **Consolidate First:** Before creating a new document, consider if it should be added to an existing one.
5. **Archive Old Versions:** When replacing/superseding documentation, move old versions to `archive/`.
6. **TIMESTAMP ENFORCEMENT:** Always check LOCAL SYSTEM TIME before updating (see protocol below).

---

## 🚨 **CRITICAL: Documentation Parity Protocol**

### Agent Instructions for Maintaining Total Parity

**When updating ANY documentation in this folder:**

1. **ALWAYS Check Implementation First**
   - Review the actual codebase files
   - Compare with current documentation
   - Identify any discrepancies

2. **Update Timestamp IMMEDIATELY**
   - Format: `November 28, 2025 - HH:MM PM`
   - Include in both header and status section
   - Be precise to the minute
   - **MANDATORY**: Always check LOCAL SYSTEM TIME before updating
   - **ENFORCEMENT**: Use `date` command to verify current time

3. **Remove ALL Conflicting Information**
   - Delete outdated specifications
   - Remove deprecated tool descriptions
   - Update version numbers if breaking changes

4. **Verify Complete Coverage**
   - All implemented tools must be documented
   - All documented features must be implemented
   - No "TODO" items in final documentation

5. **Cross-Reference All Documents**
   - Ensure tool names match across all files
   - Verify protocol descriptions are consistent
   - Check that enums/lists are identical

### Parity Validation Checklist

Before concluding documentation updates:

- [ ] MCP_TOOL_REQUIREMENTS.md reflects ALL 12 tools (9 core + 3 utility)
- [ ] Tool descriptions match zero-ambiguity language in implementation
- [ ] All Zod schema descriptions are documented
- [ ] Navigation enum lists are identical across documents
- [ ] Status indicators are accurate (✅ COMPLETE, ⚠️ IN PROGRESS, ❌ BLOCKED)
- [ ] Version numbers follow semantic versioning (vX.Y.Z)
- [ ] No outdated references remain

### ⚠️ CRITICAL: Timestamp Enforcement Protocol

**MANDATORY TIME CHECK PROCEDURE:**

Before updating ANY document in this folder:

1. **Check Local System Time:**
   ```bash
   date +"%B %d, %Y - %I:%M %p"
   # Example output: November 28, 2025 - 03:15 PM
   ```

2. **Use Exact Format:**
   - Month: Full name (January, February, etc.)
   - Day: Numeric with no leading zero
   - Year: 4-digit
   - Time: 12-hour format with leading zero for hour
   - Period: AM/PM in uppercase

3. **Update Both Locations:**
   - Document header (line 3-5)
   - Implementation status section (if present)

4. **NO EXCEPTIONS:**
   - Never copy timestamps from other documents
   - Never estimate the time
   - Always use CURRENT local system time

**Example:**
```markdown
**Last Updated:** November 28, 2025 - 03:15 PM
```

### Automated Parity Checks

When possible, run these commands to verify parity:

```bash
# Check current system time for timestamping
date +"%B %d, %Y - %I:%M %p"

# Check if MCP tools match requirements
grep "name: '" mcp-server/index.ts | wc -l  # Should return 18
grep -E "^[0-9]+\." SingleSources/MCP_TOOL_REQUIREMENTS.md | wc -l  # Should return 18

# Verify all timestamps are current
find SingleSources/ -name "*.md" -exec grep -l "Last Updated" {} \;
```

### Consequence of Parity Failure

- ❌ **Agents will fail** with incorrect tool usage
- ❌ **Developers will implement wrong features**
- ❌ **Users experience inconsistent behavior**
- ❌ **Technical debt accumulates**

**REMEMBER**: This folder is the **SINGLE SOURCE OF TRUTH**. Any deviation between documentation and implementation creates critical failures.

---

## Archived Documentation

All historical documentation has been moved to:
`/archive/docs-ui-ux-implementation-nov2025/`


### Navigation (14 Documents)

| # | Document | Domain |
|---|----------|--------|
| 1 | [UI_UX_MASTER_ROADMAP.md](./UI_UX_MASTER_ROADMAP.md) | Frontend architecture & features |
| 2 | [MCP_TOOL_REQUIREMENTS.md](./MCP_TOOL_REQUIREMENTS.md) | AI tools & backend logic |
| 3 | [VOICE_AGENT_README.md](./VOICE_AGENT_README.md) | Voice agent integration |
| 4 | [VoiceAgentKnowledge.txt](./VoiceAgentKnowledge.txt) | ElevenLabs agent knowledge base |
| 5 | [DISPATCH_SYSTEM.md](./DISPATCH_SYSTEM.md) | Dispatch, GPS & field ops |
| 6 | [LLM_INTEGRATION.md](./LLM_INTEGRATION.md) | AI/LLM router & resilience |
| 7 | [API_REFERENCE.md](./API_REFERENCE.md) | REST API documentation |
| 8 | [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Database architecture |
| 9 | [INTEGRATIONS.md](./INTEGRATIONS.md) | Third-party services |
| 10 | [AUTH_PERMISSIONS.md](./AUTH_PERMISSIONS.md) | Auth & multi-tenant security |
| 11 | [CONFIGURATION.md](./CONFIGURATION.md) | Environment & deployment |
| 12 | [OFFLINE_SYNC.md](./OFFLINE_SYNC.md) | PWA offline & sync |
| 13 | [BUSINESS_WORKFLOWS.md](./BUSINESS_WORKFLOWS.md) | Business process logic |
| 14 | [COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md) | Complete codebase inventory |

---

## Archived Documentation

All outdated documentation has been moved to:
- `/archive/docs-outdated/root-level/` - Former root-level docs
- `/archive/docs-outdated/shared-docs/` - Former shared-docs
- `/archive/docs-outdated/docs/` - Former docs folder
- `/archive/docs-outdated/components/` - Former component docs
- `/archive/docs-outdated/lib/` - Former lib docs
- `/archive/docs-ui-ux-implementation-nov2025/` - UI/UX implementation history

---

**Maintained by:** CRM-AI PRO Development Team
**Last Index Update:** November 28, 2025 - 08:21 PM
**Total Documents:** 14
**Status:** ✅ All documents production ready (Updated with 88 MCP tools including 18 cutting-edge AI tools)
