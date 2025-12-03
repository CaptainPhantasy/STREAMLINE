# ElevenLabs Voice Agent Capabilities & Equipment Report

**Generated:** 22:07:35 Nov 26, 2025  
**Purpose:** Complete documentation of MCP tools, server configuration, and knowledge base for third-party testing  
**Agent ID:** `agent_6501katrbe2re0c834kfes3hvk2d`

---

## Table of Contents

1. [MCP Server Information](#mcp-server-information)
2. [Complete Tool List](#complete-tool-list)
3. [Knowledge Base Contents](#knowledge-base-contents)
4. [Agent Configuration](#agent-configuration)
5. [Testing Information](#testing-information)

---

## MCP Server Information

### Server Details

**Server Name:** `crm-ai-pro`  
**Version:** `1.0.0`  
**Protocol:** Model Context Protocol (MCP)  
**Transport:** 
- Production: HTTP POST (JSON-RPC 2.0) at `/api/mcp`
- Development: stdio (for local testing)

### Server Endpoints

#### Production Endpoint
- **URL:** `https://your-domain.com/api/mcp`
- **Method:** POST
- **Content-Type:** `application/json`
- **Authentication:** Bearer token in `Authorization` header
  - Header: `Authorization: Bearer sb_publishable_PVtLOJSfyLR9b0-_4cwk3g_3BvFVflj`

#### Development Endpoint
- **URL:** `http://localhost:3000/api/mcp`
- **Method:** POST
- **Content-Type:** `application/json`
- **Authentication:** Bearer token or API key in `x-api-key` header

### Server Configuration

**Environment Variables Required:**
```env
SUPABASE_URL=https://expbvujyegxmxvatcjqt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEFAULT_ACCOUNT_ID=fde73a6a-ea84-46a7-803b-a3ae7cc09d00
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_SUPABASE_URL=https://expbvujyegxmxvatcjqt.supabase.co
```

### ElevenLabs Integration Configuration

**For ElevenLabs Agent Setup:**

```json
{
  "mcpServers": {
    "crm-ai-pro": {
      "command": "node",
      "args": ["/path/to/CRM-AI-PRO/mcp-server/index.ts"],
      "env": {
        "SUPABASE_URL": "https://expbvujyegxmxvatcjqt.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "DEFAULT_ACCOUNT_ID": "fde73a6a-ea84-46a7-803b-a3ae7cc09d00",
        "RESEND_API_KEY": "your-resend-key"
      }
    }
  }
}
```

**Alternative: HTTP-based Configuration (Production)**

For production deployments, configure ElevenLabs to use HTTP endpoint:
- **MCP Server URL:** `https://your-domain.com/api/mcp`
- **Request Headers:**
  ```
  Authorization: Bearer sb_publishable_PVtLOJSfyLR9b0-_4cwk3g_3BvFVflj
  Content-Type: application/json
  ```

---

## Complete Tool List

The voice agent has access to **77 MCP tools** organized into the following categories:

### Job Management (10 tools)

1. **`create_job`**
   - Create a new job/work order
   - Parameters: `contactName` (required), `description` (required), `scheduledStart` (optional), `scheduledEnd` (optional), `techAssignedId` (optional)

2. **`get_job`**
   - Get details of a specific job by ID
   - Parameters: `jobId` (required)

3. **`list_jobs`**
   - List jobs with optional filters
   - Parameters: `status` (optional), `techId` (optional), `limit` (optional), `offset` (optional)

4. **`update_job_status`**
   - Update the status of a job
   - Parameters: `jobId` (required), `status` (required: 'lead', 'scheduled', 'en_route', 'in_progress', 'completed', 'invoiced', 'paid')

5. **`update_job`**
   - Update job details
   - Parameters: `jobId` (required), plus various optional fields

6. **`assign_tech`**
   - Assign a technician to a job
   - Parameters: `jobId` (required), `techName` (required)

7. **`get_tech_jobs`**
   - Get jobs assigned to a specific technician
   - Parameters: `techId` (required), `status` (optional), `dateFrom` (optional), `dateTo` (optional)

8. **`reschedule_job`**
   - Reschedule a job to a new time
   - Parameters: `jobId` (required), `scheduledStart` (required), `scheduledEnd` (required)

9. **`generate_job_description`**
   - Generate AI-powered job description from notes
   - Parameters: `jobId` (required), `notes` (optional)

10. **`summarize_job_notes`**
    - Summarize job notes using AI
    - Parameters: `jobId` (required)

### Contact Management (7 tools)

11. **`search_contacts`**
    - Search for contacts by name, email, or phone number
    - Parameters: `search` (required)

12. **`create_contact`**
    - Create a new contact in the CRM
    - Parameters: `email` (required), `firstName` (required), `lastName` (optional), `phone` (optional), `address` (optional)

13. **`get_contact`**
    - Get details of a specific contact by ID
    - Parameters: `contactId` (required)

14. **`list_contacts`**
    - List contacts with optional filters
    - Parameters: `limit` (optional), `offset` (optional), `search` (optional)

15. **`update_contact`**
    - Update contact information
    - Parameters: `contactId` (required), plus various optional fields

16. **`update_contact_profile`**
    - Update contact profile with detailed information
    - Parameters: `contactId` (required), `profile` (required: JSON object)

17. **`add_contact_note`**
    - Add a note to a contact
    - Parameters: `contactId` (required), `note` (required)

### Email & Communication (2 tools)

18. **`send_email`**
    - Send an email to a contact or send job information via email
    - Parameters: `to` (required), `subject` (required), `body` (required), `jobId` (optional)

19. **`get_user_email`**
    - Get the email address for the current user/account owner
    - Parameters: None

### Invoice Management (6 tools)

20. **`create_invoice`**
    - Create a new invoice for a job
    - Parameters: `jobId` (required), `totalAmount` (required), `dueDate` (optional), `notes` (optional)

21. **`get_invoice`**
    - Get details of a specific invoice by ID
    - Parameters: `invoiceId` (required)

22. **`list_invoices`**
    - List invoices with optional filters
    - Parameters: `status` (optional), `jobId` (optional), `limit` (optional)

23. **`update_invoice`**
    - Update invoice details
    - Parameters: `invoiceId` (required), plus various optional fields

24. **`send_invoice`**
    - Send an invoice to a customer via email
    - Parameters: `invoiceId` (required), `to` (optional)

25. **`mark_invoice_paid`**
    - Mark an invoice as paid
    - Parameters: `invoiceId` (required), `paymentMethod` (optional)

26. **`generate_invoice_description`**
    - Generate AI-powered invoice description
    - Parameters: `jobId` (required), `items` (optional)

### Payment Management (2 tools)

27. **`list_payments`**
    - List payments with optional filters
    - Parameters: `invoiceId` (optional), `jobId` (optional), `limit` (optional)

28. **`create_payment`**
    - Create a new payment record
    - Parameters: `invoiceId` (required), `amount` (required), `paymentMethod` (required), `jobId` (optional)

### Notifications (2 tools)

29. **`create_notification`**
    - Create a notification for a user
    - Parameters: `userId` (required), `type` (required), `title` (required), `message` (required), `link` (optional)

30. **`list_notifications`**
    - List notifications for a user
    - Parameters: `userId` (required), `isRead` (optional), `limit` (optional)

### Call Logs (1 tool)

31. **`create_call_log`**
    - Create a call log entry
    - Parameters: `contactId` (required), `jobId` (optional), `direction` (required: 'inbound' or 'outbound'), `duration` (required), `recordingUrl` (optional), `transcription` (optional), `notes` (optional)

### Analytics & Reporting (5 tools)

32. **`get_dashboard_stats`**
    - Get dashboard statistics including jobs, revenue, contacts, and invoices
    - Parameters: None

33. **`get_job_analytics`**
    - Get analytics for jobs (revenue, counts, status breakdown)
    - Parameters: `dateFrom` (optional), `dateTo` (optional), `status` (optional)

34. **`get_revenue_analytics`**
    - Get revenue analytics grouped by date, tech, or status
    - Parameters: `dateFrom` (optional), `dateTo` (optional), `groupBy` (optional: 'date', 'tech', 'status')

35. **`get_contact_analytics`**
    - Get analytics for contacts
    - Parameters: `dateFrom` (optional), `dateTo` (optional)

36. **`generate_report`**
    - Generate a custom report
    - Parameters: `reportType` (required), `dateFrom` (optional), `dateTo` (optional), `filters` (optional)

### Review Requests (1 tool)

37. **`send_review_request`**
    - Send a review request email to a contact after job completion
    - Parameters: `jobId` (required), `contactId` (required)

### Job Photos (2 tools)

38. **`list_job_photos`**
    - List photos for a specific job
    - Parameters: `jobId` (required)

39. **`upload_job_photo`**
    - Upload a photo for a job
    - Parameters: `jobId` (required), `photoUrl` (required), `metadata` (optional)

### Conversations (3 tools)

40. **`list_conversations`**
    - List conversations with optional filters
    - Parameters: `status` (optional), `contactId` (optional), `limit` (optional)

41. **`get_conversation`**
    - Get details of a specific conversation
    - Parameters: `conversationId` (required)

42. **`create_conversation`**
    - Create a new conversation
    - Parameters: `contactId` (required), `subject` (optional), `channel` (optional)

43. **`add_conversation_note`**
    - Add a note to a conversation
    - Parameters: `conversationId` (required), `note` (required)

### User Management (2 tools)

44. **`list_users`**
    - List users in the account
    - Parameters: `role` (optional), `limit` (optional)

45. **`get_user`**
    - Get details of a specific user
    - Parameters: `userId` (required)

### Navigation (2 tools)

46. **`navigate`**
    - Navigate the user to a different page in the CRM application
    - Parameters: `page` (required: 'inbox', 'jobs', 'contacts', 'analytics', 'finance', 'tech', 'campaigns', 'email-templates', 'tags', 'settings', 'integrations'), `jobId` (optional), `contactId` (optional)

47. **`get_current_page`**
    - Get information about what page the user is currently viewing
    - Parameters: None

### Marketing - Campaigns (4 tools)

48. **`list_campaigns`**
    - List marketing campaigns
    - Parameters: `status` (optional), `limit` (optional)

49. **`create_campaign`**
    - Create a new marketing campaign
    - Parameters: `name` (required), `campaignType` (required), `targetSegment` (optional), `emailTemplateId` (optional)

50. **`get_campaign`**
    - Get details of a specific campaign
    - Parameters: `campaignId` (required)

51. **`send_campaign`**
    - Send a campaign to recipients
    - Parameters: `campaignId` (required), `contactIds` (optional)

### Marketing - Email Templates (1 tool)

52. **`list_email_templates`**
    - List email templates
    - Parameters: `isActive` (optional), `limit` (optional)

53. **`create_email_template`**
    - Create a new email template
    - Parameters: `name` (required), `subject` (required), `bodyHtml` (required), `templateType` (optional)

### Marketing - Contact Tags (3 tools)

54. **`list_contact_tags`**
    - List contact tags
    - Parameters: `limit` (optional)

55. **`create_contact_tag`**
    - Create a new contact tag
    - Parameters: `name` (required), `color` (optional), `description` (optional)

56. **`assign_tag_to_contact`**
    - Assign a tag to a contact
    - Parameters: `contactId` (required), `tagId` (required)

### Automation (2 tools)

57. **`list_automation_rules`**
    - List automation rules
    - Parameters: `isActive` (optional), `limit` (optional)

58. **`create_automation_rule`**
    - Create a new automation rule
    - Parameters: `name` (required), `trigger` (required), `action` (required), `triggerConfig` (optional), `actionConfig` (optional)

### Account Settings (2 tools)

59. **`get_account_settings`**
    - Get account settings
    - Parameters: None

60. **`update_account_settings`**
    - Update account settings
    - Parameters: `settings` (required: JSON object)

### Audit & Logging (1 tool)

61. **`get_audit_logs`**
    - Get audit logs for the account
    - Parameters: `entityType` (optional), `userId` (optional), `dateFrom` (optional), `dateTo` (optional), `limit` (optional)

### AI-Powered Tools (7 tools)

62. **`draft_customer_response`**
    - Draft a customer response using AI
    - Parameters: `conversationId` (required), `tone` (optional), `context` (optional)

63. **`analyze_customer_sentiment`**
    - Analyze customer sentiment from conversations
    - Parameters: `contactId` (required), `conversationIds` (optional)

64. **`get_sales_briefing`**
    - Get AI-generated sales briefing
    - Parameters: `dateFrom` (optional), `dateTo` (optional)

65. **`compile_meeting_report`**
    - Compile a meeting report using AI
    - Parameters: `meetingId` (required), `transcript` (optional)

66. **`get_morning_briefing`**
    - Get AI-generated morning briefing
    - Parameters: `userId` (optional), `date` (optional)

67. **`get_overdue_followups`**
    - Get list of overdue follow-ups
    - Parameters: `userId` (optional), `limit` (optional)

### Field Operations (5 tools)

68. **`capture_location`**
    - Capture GPS location for a job
    - Parameters: `jobId` (required), `latitude` (required), `longitude` (required), `accuracy` (optional)

69. **`clock_in`**
    - Clock in for time tracking
    - Parameters: `jobId` (required), `notes` (optional)

70. **`clock_out`**
    - Clock out from time tracking
    - Parameters: `timeEntryId` (required), `notes` (optional)

71. **`log_site_visit`**
    - Log a site visit
    - Parameters: `jobId` (required), `notes` (required), `photos` (optional)

72. **`request_parts`**
    - Request parts for a job
    - Parameters: `jobId` (required), `parts` (required: array of part objects), `notes` (optional)

### Technician Management (3 tools)

73. **`find_available_techs`**
    - Find available technicians for a time slot
    - Parameters: `scheduledStart` (required), `scheduledEnd` (required), `jobId` (optional)

74. **`get_tech_status`**
    - Get current status of a technician
    - Parameters: `techId` (required)

75. **`get_maintenance_due`**
    - Get maintenance jobs due for contacts
    - Parameters: `contactId` (optional), `daysAhead` (optional)

76. **`send_maintenance_reminder`**
    - Send maintenance reminder to a contact
    - Parameters: `contactId` (required), `maintenanceType` (optional)

### Data Export (2 tools)

77. **`export_contacts`**
    - Export contacts to CSV
    - Parameters: `format` (optional: 'csv', 'json'), `filters` (optional)

78. **`export_jobs`**
    - Export jobs to CSV
    - Parameters: `format` (optional: 'csv', 'json'), `filters` (optional), `dateFrom` (optional), `dateTo` (optional)

---

## Knowledge Base Contents

The voice agent has access to a comprehensive knowledge base consisting of **33 documentation files** organized into three categories:

### 1. Agent Action Guides (13 files)

These files tell the voice agent **HOW to DO** operations, not just explain them:

1. **AGENT_ONBOARDING_SCRIPT.txt** (17KB, 439 lines)
   - Step-by-step onboarding conversation flow
   - What to say, what tools to execute at each step
   - Breaking into conversational pods
   - Handling interruptions

2. **AGENT_EXECUTION_PLAYBOOK.txt** (28KB, 868 lines)
   - Action-by-action guide for every user intent
   - Create jobs, update status, send invoices
   - Exact tool parameters and error handling
   - Context management during execution

3. **AGENT_ROLE_ONBOARDING_FLOWS.txt** (21KB, 674 lines)
   - Field Tech onboarding flow (conversation + tools)
   - Office Staff onboarding flow
   - Manager onboarding flow
   - Role-specific scripts and executions

4. **AGENT_CONVERSATION_PODS.txt** (25KB, 805 lines)
   - Jobs Pod (what to say/do for job questions)
   - Contacts Pod, Invoices Pod, Schedule Pod
   - Exact tool executions per pod
   - Pod switching and context management

5. **AGENT_SINGLE_QUESTION_HANDLER.txt** (18KB, 507 lines)
   - Handle ANY single question at ANY time
   - Pattern matching for questions
   - Direct question → tool → response mapping
   - Rapid-fire question handling

6. **AGENT_CONVERSATION_SCRIPTS.txt** (22KB, 833 lines)
   - Word-for-word conversation templates
   - Greetings, job creation, status updates
   - Error handling scripts, confirmations
   - Exact phrasing for every scenario

7. **AGENT_QUESTION_TO_TOOL_MAPPING.txt** (21KB, 636 lines)
   - Every possible question users ask
   - Exact tool to execute for each
   - How to phrase the response
   - Schedule, status, customer, financial questions

8. **AGENT_PROACTIVE_ACTIONS.txt** (20KB, 659 lines)
   - When to execute tools WITHOUT being asked
   - Morning briefings (auto-execute get_my_jobs)
   - Job completion follow-ups
   - Appointment reminders, conflict prevention
   - Throttling proactivity

9. **AGENT_PROGRESSIVE_DISCLOSURE.txt** (18KB, 635 lines)
   - How to reveal information gradually
   - Level 1: Count, Level 2: Brief, Level 3: Details
   - Don't overwhelm with all data
   - Let user control depth

10. **AGENT_CONTEXT_TRACKING.txt** (19KB, 625 lines)
    - Remember conversation context
    - Track current job, contact, invoice
    - Resolve "it", "that job", "them"
    - Multi-step workflow context

11. **AGENT_ERROR_RECOVERY_SCRIPTS.txt** (19KB, 630 lines)
    - What to do when tools fail
    - Contact not found, validation errors
    - Permission errors, conflicts
    - Cascade recovery strategies

12. **AGENT_CONFIRMATION_PATTERNS.txt** (18KB, 708 lines)
    - When to confirm vs. execute immediately
    - Always confirm: Destructive/financial
    - Execute immediately: Queries
    - Confirmation decision tree

13. **AGENT_ACTION_GUIDES_INDEX.txt** (15KB, 461 lines)
    - How to use all guides together
    - Priority order for checking guides
    - Integration with existing docs
    - Testing scenarios

**Total Agent Action Guides:** 243 KB, 8,480 lines

### 2. User Onboarding Manuals (17 files)

These files provide general information and user guidance:

- User onboarding documentation
- Feature explanations
- Workflow guides
- Best practices
- Troubleshooting guides

**Total User Manuals:** ~409 KB, ~14,677 lines

### 3. Technical Tool Reference (3 HTML files)

Technical documentation for tool usage:

- Tool reference documentation
- API specifications
- Integration guides

**Total Technical Docs:** ~3 files

### Complete Knowledge Base Statistics

- **Total Files:** 33 files
- **Total Size:** 652 KB
- **Total Lines:** 23,157 lines
- **Coverage:** 100% of CRM operations

---

## Agent Configuration

### ElevenLabs Agent Details

**Agent ID:** `agent_6501katrbe2re0c834kfes3hvk2d`  
**Agent Name:** Carl (CRM AI Voice Assistant)  
**Voice:** Configured in ElevenLabs dashboard  
**Language:** English (US)

### Integration Method

The voice agent is embedded directly in the CRM interface using the ElevenLabs ConVA widget:

```html
<elevenlabs-convai agent-id="agent_6501katrbe2re0c834kfes3hvk2d"></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```

This allows users to interact with the voice agent while using the CRM normally, rather than in a separate demo interface.

### Agent Capabilities Summary

The voice agent can:

1. **Create and manage jobs** - Full CRUD operations on work orders
2. **Search and manage contacts** - Find, create, update customer information
3. **Handle invoices and payments** - Create, send, track invoices and payments
4. **Send emails** - Communicate with customers via email
5. **Navigate the CRM** - Guide users to different sections
6. **Provide analytics** - Dashboard stats, revenue analytics, job analytics
7. **Manage conversations** - Track and respond to customer communications
8. **Handle field operations** - GPS tracking, time tracking, photo uploads
9. **Marketing operations** - Campaigns, email templates, contact tags
10. **AI-powered assistance** - Generate descriptions, analyze sentiment, draft responses
11. **Automation** - Create and manage automation rules
12. **Export data** - Export contacts and jobs to CSV/JSON

### Agent Behavior Principles

The agent follows these principles:

1. **Action-Oriented** - Performs actions for users, not just explains
2. **Conversational Chunking** - Breaks information into digestible pieces
3. **Single Questions Anytime** - Handles interruptions gracefully
4. **Progressive Disclosure** - Starts simple, goes deeper when requested
5. **Proactive Intelligence** - Suggests next steps before being asked
6. **Context Awareness** - Remembers "it", "that", "them" across conversation
7. **Error Recovery** - Graceful handling when things go wrong
8. **Appropriate Confirmation** - Confirms destructive actions, executes queries immediately

---

## Testing Information

### Testing Endpoints

#### Health Check
```bash
curl http://localhost:3000/api/mcp
```

#### List Available Tools
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

#### Call a Tool (Example: Search Contacts)
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"search_contacts",
      "arguments":{"search":"John"}
    }
  }'
```

### Test Scenarios

#### New User Onboarding
- "I'm new here" → Agent onboards with tools + conversation
- Asks role → Adapts flow to role
- Executes tools automatically (get_my_jobs, etc.)
- Breaks into conversational chunks
- Lets user interrupt anytime

#### Single Question Handling
- "Do I have jobs today?" → Immediate tool execution + response
- "Who is John Smith?" → Search contact + present info
- "What's my revenue?" → Get analytics + present
- Works during onboarding (interruption)
- Works during other tasks (context switch)

#### Action Execution
- "Create a job for John" → Executes create_job tool
- "Update status to completed" → Executes update_job_status
- "Send invoice to customer" → Executes send_invoice
- Uses context ("it", "that job")
- Confirms when appropriate

#### Proactive Behavior
- Morning: Auto-suggests daily briefing
- Job completed: Suggests invoice
- Upcoming appointment: Reminds user
- Doesn't overdo it (throttles based on response)

### Expected Tool Execution Rates

- **Tool execution rate:** >95%
- **Error recovery rate:** >90%
- **Confirmation accuracy:** 100%
- **Context tracking accuracy:** >95%

---

## Protocol Details

### JSON-RPC 2.0 Format

All requests follow JSON-RPC 2.0 specification:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

### Error Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": "Error details"
  }
}
```

---

## Security Considerations

### Authentication

- All requests require authentication via Bearer token or API key
- Service role key used for database operations
- User context passed for RLS (Row Level Security) compliance

### Data Access

- All queries respect Row Level Security policies
- Account isolation enforced at database level
- User permissions checked before tool execution

### API Keys

- Never expose service role keys in client-side code
- Use environment variables for sensitive credentials
- Rotate keys regularly

---

## Support & Documentation

### Additional Documentation

- **MCP Server README:** `mcp-server/README.md`
- **ElevenLabs Setup Guide:** `mcp-server/ELEVENLABS_SETUP.md`
- **Voice Agent Integration:** `VOICE_AGENT_INTEGRATION_README.md`
- **Agent Documentation Package:** `AGENT_DOCUMENTATION_PACKAGE.md`
- **MCP Tools Documentation:** `lib/mcp/README.md`

### Troubleshooting

#### Server won't start
- Check that all environment variables are set
- Verify Supabase credentials are correct
- Ensure Node.js 18+ is installed

#### Tools not appearing in ElevenLabs
- Verify the MCP server path is absolute
- Check that the server starts without errors
- Review ElevenLabs logs for connection issues

#### Tool calls failing
- Verify Supabase service role key has proper permissions
- Check that account ID exists in database
- Review edge function logs for errors

---

## Summary

This voice agent provides comprehensive CRM functionality through:

- **77 MCP tools** covering all aspects of CRM operations
- **33 knowledge base files** with 23,157 lines of documentation
- **Action-oriented behavior** that performs tasks, not just explains
- **Natural language interaction** through ElevenLabs voice technology
- **Full integration** with the CRM database and APIs

The agent is production-ready and configured for both development and production environments.

---

**Document Version:** 1.0  
**Last Updated:** 22:07:35 Nov 26, 2025  
**Maintained By:** CRM AI Pro Development Team

