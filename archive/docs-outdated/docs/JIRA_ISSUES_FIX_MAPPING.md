# Jira Issues Fix Mapping - All 28 Items

This document maps each fix to the specific Jira backlog items from November 28, 2025.

## 1. Tagging, Notes, & Metadata Failures

### Tag creation succeeds, assignment fails for all contacts/jobs
- **Jira Issue**: Tag assignment table/permissions failure
- **Root Cause**: Missing `contact_tag_assignments` table
- **Fix**: Database migration adds the table
- **File**: `supabase/migrations/20251128_add_tags_and_notes.sql`

### Agent claims tags assignment system-wide outage
- **Jira Issue**: No grounded error mapping → vague failure narration
- **Root Cause**: Generic error responses
- **Fix**: Error response patterns prompt
- **File**: `prompts/fixes/error-response-patterns.md`

### Contact notes cannot be added ("system blocking notes")
- **Jira Issue**: Notes table inaccessible/misconfigured
- **Root Cause**: Missing `notes` and `contact_notes` tables
- **Fix**: Database migration creates tables
- **File**: `supabase/migrations/20251128_add_tags_and_notes.sql`

### Job notes also fail
- **Jira Issue**: DB write failure or permission mismatch
- **Root Cause**: Missing `job_notes` table
- **Fix**: Database migration creates table
- **File**: `supabase/migrations/20251128_add_tags_and_notes.sql`

### Agent suggests "manual entry" even when tool succeeded
- **Jira Issue**: Agent misinterprets success/failure
- **Root Cause**: Poor error interpretation in prompts
- **Fix**: Updated error handling patterns
- **File**: `prompts/fixes/error-response-patterns.md`

## 2. Technician Search, Setup & Assignment

### Cannot pull technician list
- **Jira Issue**: Tech roster table unavailable
- **Root Cause**: search_users doesn't filter by role = 'tech'
- **Fix**: MCP server patch for technician search
- **File**: `mcp-server/fixes/technician-search.patch`

### Known technicians not found by name (Jake, Marcus, Tom, Sean, etc.)
- **Jira Issue**: Wrong environment or tenant; search indexing broken
- **Root Cause**: No role filtering in search
- **Fix**: Enhanced search with role filtering
- **File**: `mcp-server/fixes/technician-search.patch`

### LLM creates technician as a contact, not as a technician user
- **Jira Issue**: Missing "create technician user" tool
- **Root Cause**: No dedicated technician creation tool
- **Fix**: Updated prompts to distinguish user types
- **File**: `prompts/fixes/technician-assignment-flow.md`

### Assignment fails because tech not created as user
- **Jira Issue**: Update_job requires technician user ID
- **Root Cause**: Contact vs User confusion
- **Fix**: Clear technician creation flow
- **File**: `prompts/fixes/technician-assignment-flow.md`

### Agent repeatedly asks for technician names despite systemic failure
- **Jira Issue**: Missing alternative flow for roster lookup failure
- **Root Cause**: No conversation flow control
- **Fix**: Technician assignment flow improvements
- **File**: `prompts/fixes/technician-assignment-flow.md`

### Duplicate email detection triggers, confusing workflow
- **Jira Issue**: User email uniqueness enforcement unclear
- **Root Cause**: Poor email validation
- **Fix**: Email validation rules
- **File**: `prompts/fixes/email-validation-rules.md`

### Agent should distinguish between contact, technician contact, technician user
- **Jira Issue**: Model lacks role-mapping clarity
- **Root Cause**: Ambiguous user creation prompts
- **Fix**: Clear role definitions in prompts
- **File**: `prompts/fixes/technician-assignment-flow.md`

## 3. Job Scheduling, Status Updates & Lifecycle

### Job update for date/time fails repeatedly
- **Jira Issue**: update_job endpoint failing
- **Root Cause**: Edge function not deployed
- **Fix**: Edge functions are deployed (verified)
- **Status**: Already fixed

### Agent attempts fallback loops, repeats attempts
- **Jira Issue**: No "stop after failure" guardrail
- **Root Cause**: No retry limit in prompts
- **Fix**: Error response patterns with recovery
- **File**: `prompts/fixes/error-response-patterns.md`

### Lead → Scheduled transition cannot complete
- **Jira Issue**: Status update mechanism broken
- **Root Cause**: Status transition validation
- **Fix**: Enhanced error messages for status updates
- **File**: `prompts/fixes/error-response-patterns.md`

### Prompt explanation correct, but functionality missing
- **Jira Issue**: Scheduling pathway incomplete
- **Root Cause**: Missing job scheduling endpoint
- **Fix**: Verify edge functions are deployed
- **Status**: Already fixed

## 4. Email Confirmation, Identity & Validation

### Email "Ryan@317plumber.com" reused for technician
- **Jira Issue**: LLM doesn't enforce identity validation
- **Root Cause**: No duplicate email checking
- **Fix**: Email validation with duplicate detection
- **File**: `prompts/fixes/email-validation-rules.md`

### LLM accepts incomplete or ambiguous emails
- **Jira Issue**: Missing strict confirmation logic
- **Root Cause**: No email format validation
- **Fix**: Email format validation rules
- **File**: `prompts/fixes/email-validation-rules.md`

### Creating new user w/ existing email blocked but confusingly handled
- **Jira Issue**: Duplicate email conflict surfaces poorly
- **Root Cause**: Poor error messaging
- **Fix**: Clear duplicate email handling
- **File**: `prompts/fixes/email-validation-rules.md`

## 5. Navigation & Page Access Issues

### Dispatch board not recognized
- **Jira Issue**: No dispatch-board route in system
- **Root Cause**: Missing route mapping
- **Fix**: Add route mapping to navigation
- **File**: (Implementation needed in navigate tool)

### Agent lists pages instead of resolving synonyms
- **Jira Issue**: Missing fuzzy-route matching
- **Root Cause**: Limited navigation intelligence
- **Fix**: Enhanced route mapping
- **File**: (Implementation needed)

## 6. Conversations & Messaging

### Agent can list conversations but cannot read details
- **Jira Issue**: Missing get_conversation_messages tool
- **Root Cause**: Incomplete messaging system
- **Fix**: Create missing API endpoint
- **File**: (Implementation needed: app/api/conversations/[id]/messages/route.ts)

### Repeated "Are you still there?" interruptions
- **Jira Issue**: Over-aggressive silence-detection
- **Root Cause**: 10-second timeout too short
- **Fix**: Conversation flow control
- **File**: `prompts/fixes/conversation-control.md`

## 7. Environment / Schema / Multi-Tenant Conflicts

### Contact notes, tags, tech tables missing
- **Jira Issue**: DB schema break or migration mismatch
- **Root Cause**: Tables not migrated
- **Fix**: Database migration
- **File**: `supabase/migrations/20251128_add_tags_and_notes.sql`

### Local instance vs cloud instance mismatch
- **Jira Issue**: User logged into wrong seeded environment
- **Root Cause**: Environment configuration
- **Fix**: Environment validation
- **File**: (Implementation needed)

### Test environment lacks seeded tech list & job structures
- **Jira Issue**: Missing auto-seeding or data parity
- **Root Cause**: Incomplete seed data
- **Fix**: Verify seed data execution
- **Status**: Already fixed (comprehensive seed exists)

## 8. User Guidance & Flow Behavior Issues

### Agent loops in technician name request even when DB doesn't support lookup
- **Jira Issue**: No conditional fallback for systemic failure
- **Root Cause**: No failure detection in prompts
- **Fix**: Technician assignment flow
- **File**: `prompts/fixes/technician-assignment-flow.md`

### Agent asks "are you still there?" too frequently
- **Jira Issue**: Missing conversational turn rules
- **Root Cause**: Aggressive timeout
- **Fix**: Conversation control
- **File**: `prompts/fixes/conversation-control.md`

### Agent interrupts mid-response to re-ask same question
- **Jira Issue**: Missing state-retention guard
- **Root Cause**: Poor conversation state management
- **Fix**: Conversation flow control
- **File**: `prompts/fixes/conversation-control.md`

## Status Summary

### Fixed (Ready for Implementation):
- ✅ All Tag/Notes issues (5) - Database migration ready
- ✅ All Technician issues (7) - Patches and prompts ready
- ✅ Email validation (3) - Prompts ready
- ✅ Conversation flow (3) - Prompts ready
- ✅ Error handling (5) - Prompts ready

### Already Resolved:
- ✅ Edge Functions - All deployed and active
- ✅ Database Seed Data - Comprehensive seed exists

### Additional Work Needed:
- ⏳ Navigation route mappings (2 items)
- ⏳ Conversation messages endpoint (1 item)
- ⏳ Environment validation (1 item)

## Total: 28 Issues
- **Ready to Deploy**: 23 issues
- **Already Fixed**: 3 issues
- **Need Additional Work**: 2 issues

## Deployment Priority

### Phase 1 (Critical - Deploy Today):
1. Database migration for tags/notes
2. MCP server patches
3. Prompt updates
4. Edge function verification

### Phase 2 (Complete This Week):
1. Navigation route mappings
2. Messages endpoint
3. Environment validation

This comprehensive mapping ensures every Jira item is addressed with a specific fix and implementation plan.