# MCP Server Setup

This directory contains the Model Context Protocol (MCP) server implementation for ElevenLabs integration.

## Structure

```
lib/mcp/
├── tools/          # Tool definitions and handlers
│   ├── crm-tools.ts    # CRM operations (jobs, contacts, emails)
│   ├── your-tools.ts   # Example/placeholder tools
│   └── index.ts        # Tools registry
├── resources/      # Resource definitions and readers
├── prompts/        # Prompt templates
└── server.ts       # Main MCP request handler
```

## API Endpoint

The MCP server is exposed at: `/api/mcp`

### Authentication

Set the `x-api-key` header with your API key when making requests.

### Protocol

JSON-RPC 2.0 over HTTP POST

## Available Tools

The MCP server provides **22 CRM tools** for voice agent and AI integration:

### Job Management (5 tools)

#### 1. `create_job`
Create a new job/work order. Requires contact name and description.

**Parameters:**
- `contactName` (required): Name of the customer/contact
- `description` (required): Description of the work to be done
- `scheduledStart` (optional): ISO 8601 datetime for scheduled start
- `scheduledEnd` (optional): ISO 8601 datetime for scheduled end
- `techAssignedId` (optional): UUID of assigned technician

#### 2. `get_job`
Get details of a specific job by ID.

**Parameters:**
- `jobId` (required): UUID of the job

#### 3. `list_jobs`
List jobs with optional filters.

**Parameters:**
- `status` (optional): Filter by status (lead, scheduled, en_route, in_progress, completed, invoiced, paid)
- `techId` (optional): Filter by assigned technician ID
- `limit` (optional): Maximum number of results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

#### 4. `update_job_status`
Update the status of a job.

**Parameters:**
- `jobId` (required): UUID of the job
- `status` (required): New status (lead, scheduled, en_route, in_progress, completed, invoiced, paid)

#### 5. `assign_tech`
Assign a technician to a job.

**Parameters:**
- `jobId` (required): UUID of the job
- `techName` (required): Name of the technician to assign

### Contact Management (3 tools)

#### 6. `search_contacts`
Search for contacts by name, email, or phone number.

**Parameters:**
- `search` (required): Search query (name, email, or phone)

#### 7. `create_contact`
Create a new contact in the CRM.

**Parameters:**
- `email` (required): Email address
- `firstName` (required): First name
- `lastName` (optional): Last name
- `phone` (optional): Phone number
- `address` (optional): Address

#### 8. `get_contact`
Get details of a specific contact by ID.

**Parameters:**
- `contactId` (required): UUID of the contact

### Email & Communication (2 tools)

#### 9. `send_email`
Send an email to a contact or send job information via email.

**Parameters:**
- `to` (required): Email address to send to
- `subject` (required): Email subject line
- `body` (required): Email body content
- `jobId` (optional): Job ID to include in email

#### 10. `get_user_email`
Get the email address for the current user/account owner.

**Parameters:** None

### Invoice Management (3 tools)

#### 11. `create_invoice`
Create a new invoice for a job.

**Parameters:**
- `jobId` (required): UUID of the job
- `totalAmount` (required): Total amount in cents
- `dueDate` (optional): ISO 8601 date for due date
- `notes` (optional): Optional notes

#### 12. `get_invoice`
Get details of a specific invoice by ID.

**Parameters:**
- `invoiceId` (required): UUID of the invoice

#### 13. `list_invoices`
List invoices with optional filters.

**Parameters:**
- `status` (optional): Filter by status (draft, sent, paid, overdue)
- `jobId` (optional): Filter by job ID
- `limit` (optional): Maximum number of results (default: 50)

### Notifications (2 tools)

#### 14. `create_notification`
Create a notification for a user.

**Parameters:**
- `userId` (required): UUID of the user to notify
- `type` (required): Notification type (job_assigned, message_received, payment_received, etc.)
- `title` (required): Notification title
- `message` (required): Notification message
- `link` (optional): Optional link URL

#### 15. `list_notifications`
List notifications for a user.

**Parameters:**
- `userId` (required): UUID of the user
- `isRead` (optional): Filter by read status
- `limit` (optional): Maximum number of results (default: 50)

### Call Logs (1 tool)

#### 16. `create_call_log`
Create a call log entry.

**Parameters:**
- `contactId` (required): UUID of the contact
- `jobId` (optional): UUID of the job
- `direction` (required): Call direction (inbound, outbound)
- `duration` (required): Call duration in seconds
- `recordingUrl` (optional): URL to call recording
- `transcription` (optional): Call transcription
- `notes` (optional): Notes about the call

### Analytics (3 tools)

#### 17. `get_dashboard_stats`
Get dashboard statistics including jobs, revenue, contacts, and invoices.

**Parameters:** None

#### 18. `get_job_analytics`
Get analytics for jobs (revenue, counts, status breakdown).

**Parameters:**
- `dateFrom` (optional): ISO 8601 date to start from
- `dateTo` (optional): ISO 8601 date to end at
- `status` (optional): Filter by status

#### 19. `get_revenue_analytics`
Get revenue analytics grouped by date, tech, or status.

**Parameters:**
- `dateFrom` (optional): ISO 8601 date to start from
- `dateTo` (optional): ISO 8601 date to end at
- `groupBy` (optional): Group results by date, tech, or status (default: date)

### Review Requests (1 tool)

#### 20. `send_review_request`
Send a review request email to a contact after job completion.

**Parameters:**
- `jobId` (required): UUID of the completed job
- `contactId` (required): UUID of the contact

### Job Photos (1 tool)

#### 21. `list_job_photos`
List photos for a specific job.

**Parameters:**
- `jobId` (required): UUID of the job

## Testing

Test the server with:

```bash
# Test GET endpoint (health check)
curl http://localhost:3000/api/mcp

# List available tools
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool (example: search contacts)
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

## Environment Variables

The MCP server requires the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)
- `DEFAULT_ACCOUNT_ID`: Default account ID for operations (optional, has default)
- `RESEND_API_KEY`: Resend API key for sending emails

## Adding New Tools

1. Create a new tool file in `tools/` (e.g., `tools/my-tool.ts`)
2. Export the tool definition array and handler function
3. Import and register in `tools/index.ts`:
   - Add tools to `allTools` array
   - Add handler to `handlers` object

## Adding New Resources

1. Add resource definitions to `resources/index.ts`
2. Implement the `readResource` function for your resource URIs

## Adding New Prompts

1. Add prompt definitions to `prompts/index.ts`
2. Implement the `getPromptTemplate` function with your template

