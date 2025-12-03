import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// MCP Server as Supabase Edge Function
// Exposes CRM tools via Model Context Protocol over HTTP

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface MCPRequest {
  jsonrpc: '2.0'
  method: string
  params?: any
  id: string | number
}

interface MCPResponse {
  jsonrpc: '2.0'
  result?: any
  error?: {
    code: number
    message: string
  }
  id: string | number
}

// Tool definitions - ALL 59 tools from crm-tools.ts
const TOOLS = [
  // Core Operations
  {
    name: 'create_job',
    description: 'Create a new job/work order. Use this when the user wants to create a job. You will need to collect: contact name, description, and optionally scheduled time and technician.',
    inputSchema: {
      type: 'object',
      properties: {
        contactName: { type: 'string', description: 'Name of the customer/contact (e.g., "John Smith")' },
        description: { type: 'string', description: 'Description of the work to be done' },
        scheduledStart: { type: 'string', description: 'ISO 8601 datetime for scheduled start (optional)' },
        scheduledEnd: { type: 'string', description: 'ISO 8601 datetime for scheduled end (optional)' },
        techAssignedId: { type: 'string', description: 'UUID of assigned technician (optional)' },
      },
      required: ['contactName', 'description'],
    },
  },
  {
    name: 'search_contacts',
    description: 'Search for contacts by name, email, or phone number',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search query (name, email, or phone)' },
      },
      required: ['search'],
    },
  },
  {
    name: 'get_job',
    description: 'Get details of a specific job by ID',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'update_job_status',
    description: 'Update the status of a job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job' },
        status: {
          type: 'string',
          enum: ['lead', 'scheduled', 'en_route', 'in_progress', 'completed', 'invoiced', 'paid'],
          description: 'New status for the job'
        },
      },
      required: ['jobId', 'status'],
    },
  },
  {
    name: 'assign_tech',
    description: 'Assign a technician to a job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job' },
        techAssignedId: { type: 'string', description: 'UUID of the technician user' },
      },
      required: ['jobId', 'techAssignedId'],
    },
  },
  {
    name: 'send_message',
    description: 'Send a message/email to a contact',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'UUID of the conversation' },
        message: { type: 'string', description: 'Message content to send' },
        subject: { type: 'string', description: 'Email subject line (optional)' },
      },
      required: ['conversationId', 'message'],
    },
  },
  // Priority 1 - Core Operations
  {
    name: 'list_jobs',
    description: 'List jobs with optional filters. Use this when user asks "What jobs do I have today?" or "Show me jobs"',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status (lead, scheduled, en_route, in_progress, completed, invoiced, paid)' },
        techId: { type: 'string', description: 'Filter by assigned technician ID' },
        contactId: { type: 'string', description: 'Filter by contact ID' },
        date: { type: 'string', description: 'Filter by date (ISO 8601 date string or relative like "today", "tomorrow")' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
      },
    },
  },
  {
    name: 'list_contacts',
    description: 'List contacts with optional search and filters. Use this when user asks "Show me all contacts" or "List contacts"',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search by name, email, or phone' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
      },
    },
  },
  {
    name: 'create_contact',
    description: 'Create a new contact. Use this when user says "Add a new contact named John Smith"',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email address (required)' },
        firstName: { type: 'string', description: 'First name (required)' },
        lastName: { type: 'string', description: 'Last name (optional)' },
        phone: { type: 'string', description: 'Phone number (optional)' },
        address: { type: 'string', description: 'Address (optional)' },
      },
      required: ['email', 'firstName'],
    },
  },
  {
    name: 'update_contact',
    description: 'Update contact information. Use this when user says "Update John\'s phone number"',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'UUID of the contact or contact name to search' },
        email: { type: 'string', description: 'New email address' },
        firstName: { type: 'string', description: 'New first name' },
        lastName: { type: 'string', description: 'New last name' },
        phone: { type: 'string', description: 'New phone number' },
        address: { type: 'string', description: 'New address' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'get_contact',
    description: 'Get contact details. Use this when user says "Show me John Smith\'s details"',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'UUID of the contact or contact name to search' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'list_conversations',
    description: 'List conversations with optional filters. Use this when user asks "What conversations need attention?"',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Filter by contact ID' },
        status: { type: 'string', description: 'Filter by status (open, closed, snoozed)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 100)' },
        offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
      },
    },
  },
  {
    name: 'get_conversation',
    description: 'Get conversation details with messages. Use this when user says "Show me conversation with John"',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'UUID of the conversation or contact name to search' },
        limit: { type: 'number', description: 'Maximum number of messages (default: 100)' },
      },
      required: ['conversationId'],
    },
  },
  {
    name: 'generate_draft',
    description: 'Generate an AI draft reply for a conversation. Use this when user says "Generate a reply to this conversation"',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'UUID of the conversation' },
      },
      required: ['conversationId'],
    },
  },
  {
    name: 'assign_tech_by_name',
    description: 'Assign a technician to a job by technician name. Use this when user says "Assign Mike to job 123"',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job or "last" or "current" for context' },
        techName: { type: 'string', description: 'Name of the technician to assign' },
      },
      required: ['jobId', 'techName'],
    },
  },
  {
    name: 'bulk_operations',
    description: 'Perform bulk operations on jobs. Use this when user says "Mark all today\'s jobs as completed"',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['assign', 'status'], description: 'Action to perform' },
        jobIds: { type: 'array', items: { type: 'string' }, description: 'Array of job IDs' },
        status: { type: 'string', description: 'New status (required if action is status)' },
        techId: { type: 'string', description: 'Technician ID (required if action is assign)' },
        filter: { type: 'object', description: 'Filter criteria instead of jobIds (e.g., {status: "scheduled", date: "today"})' },
      },
      required: ['action'],
    },
  },
  // Priority 2 - Field Operations
  {
    name: 'upload_photo',
    description: 'Upload a photo for a job. Note: This requires a photo URL or base64 data. Use this when user says "Upload a photo of the completed work"',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job or "last" or "current" for context' },
        photoUrl: { type: 'string', description: 'URL of the photo to upload' },
        photoData: { type: 'string', description: 'Base64 encoded photo data' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'capture_location',
    description: 'Capture location for a job. Use this when user says "I\'m at the job site now"',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job or "last" or "current" for context' },
        latitude: { type: 'number', description: 'Latitude coordinate' },
        longitude: { type: 'number', description: 'Longitude coordinate' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'clock_in',
    description: 'Clock in for time tracking. Use this when user says "Clock in"',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job (optional)' },
        notes: { type: 'string', description: 'Notes for the time entry (optional)' },
      },
    },
  },
  {
    name: 'clock_out',
    description: 'Clock out for time tracking. Use this when user says "Clock out"',
    inputSchema: {
      type: 'object',
      properties: {
        timeEntryId: { type: 'string', description: 'UUID of the time entry to clock out (optional, uses most recent)' },
        notes: { type: 'string', description: 'Notes for the time entry (optional)' },
      },
    },
  },
  {
    name: 'add_job_note',
    description: 'Add a note to a job or contact. Use this when user says "Add a note: customer wants follow-up"',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job (optional if contactId provided)' },
        contactId: { type: 'string', description: 'UUID of the contact (optional if jobId provided)' },
        conversationId: { type: 'string', description: 'UUID of the conversation (optional)' },
        content: { type: 'string', description: 'Note content' },
      },
      required: ['content'],
    },
  },
  {
    name: 'get_my_jobs',
    description: 'Get jobs assigned to the current user (technician). Use this when user says "What are my jobs today?"',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        date: { type: 'string', description: 'Filter by date (ISO 8601 or relative like "today", "tomorrow")' },
      },
    },
  },
  // Priority 3 - Business Intelligence
  {
    name: 'get_analytics',
    description: 'Get analytics data. Use this when user says "Show me job completion rates"',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['jobs', 'contacts', 'revenue'], description: 'Type of analytics' },
        period: { type: 'string', description: 'Time period (week, month, year)' },
      },
    },
  },
  {
    name: 'search_jobs',
    description: 'Search jobs by date or other criteria. Use this when user says "Find jobs scheduled for tomorrow"',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date filter (ISO 8601 or relative like "today", "tomorrow", "next week")' },
        status: { type: 'string', description: 'Filter by status' },
        contactName: { type: 'string', description: 'Filter by contact name' },
      },
    },
  },
  {
    name: 'filter_jobs',
    description: 'Filter jobs by status or other criteria. Use this when user says "Show me all in-progress jobs"',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        techId: { type: 'string', description: 'Filter by technician ID' },
        contactId: { type: 'string', description: 'Filter by contact ID' },
      },
    },
  },
  // Priority 4 - Advanced Operations
  {
    name: 'create_invoice',
    description: 'Create an invoice for a job. Use this when user says "Create an invoice for job 123"',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job' },
        amount: { type: 'number', description: 'Invoice amount' },
        description: { type: 'string', description: 'Invoice description' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'send_invoice',
    description: 'Send an invoice to a customer. Use this when user says "Send invoice to customer"',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'UUID of the invoice' },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'create_campaign',
    description: 'Create a marketing campaign. Use this when user says "Create a marketing campaign"',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body' },
        templateId: { type: 'string', description: 'Email template ID (optional)' },
      },
      required: ['name', 'subject', 'body'],
    },
  },
  {
    name: 'export_data',
    description: 'Export data to CSV. Use this when user says "Export all contacts to CSV"',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['contacts', 'jobs', 'invoices'], description: 'Type of data to export' },
        format: { type: 'string', enum: ['csv', 'json'], description: 'Export format (default: csv)' },
      },
      required: ['type'],
    },
  },
  // Additional Essential Tools
  {
    name: 'update_job',
    description: 'Update job details. Use this when user wants to modify job information',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job or "last" or "current" for context' },
        description: { type: 'string', description: 'New description' },
        scheduledStart: { type: 'string', description: 'New scheduled start time (ISO 8601)' },
        scheduledEnd: { type: 'string', description: 'New scheduled end time (ISO 8601)' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'delete_job',
    description: 'Delete a job. Use this when user says "Delete job 123"',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'delete_contact',
    description: 'Delete a contact. Use this when user says "Delete contact John Smith"',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'UUID of the contact or contact name' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'create_conversation',
    description: 'Create a new conversation. Use this when user wants to start a new conversation',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'UUID of the contact or contact name' },
        subject: { type: 'string', description: 'Conversation subject (optional)' },
        channel: { type: 'string', description: 'Channel (email, phone, etc.) (optional, default: email)' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'update_conversation_status',
    description: 'Update conversation status. Use this when user says "Close this conversation"',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'UUID of the conversation or "last" or "current" for context' },
        status: { type: 'string', enum: ['open', 'closed', 'snoozed'], description: 'New status' },
      },
      required: ['conversationId', 'status'],
    },
  },
  {
    name: 'list_invoices',
    description: 'List invoices. Use this when user says "Show me all invoices"',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
      },
    },
  },
  {
    name: 'get_invoice',
    description: 'Get invoice details. Use this when user says "Show me invoice 123"',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'UUID of the invoice' },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'mark_invoice_paid',
    description: 'Mark an invoice as paid. Use this when user says "Mark invoice 123 as paid"',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'UUID of the invoice' },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'list_payments',
    description: 'List payments. Use this when user says "Show me all payments"',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
      },
    },
  },
  {
    name: 'create_payment',
    description: 'Create a payment record. Use this when user says "Record a payment"',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'UUID of the invoice' },
        amount: { type: 'number', description: 'Payment amount' },
        method: { type: 'string', description: 'Payment method (cash, check, card, etc.)' },
      },
      required: ['invoiceId', 'amount'],
    },
  },
  {
    name: 'list_notifications',
    description: 'List notifications. Use this when user says "Show me notifications"',
    inputSchema: {
      type: 'object',
      properties: {
        unreadOnly: { type: 'boolean', description: 'Show only unread notifications (default: false)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
    },
  },
  {
    name: 'mark_notification_read',
    description: 'Mark a notification as read. Use this when user says "Mark notification as read"',
    inputSchema: {
      type: 'object',
      properties: {
        notificationId: { type: 'string', description: 'UUID of the notification' },
      },
      required: ['notificationId'],
    },
  },
  {
    name: 'list_call_logs',
    description: 'List call logs. Use this when user says "Show me call logs"',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Filter by contact ID' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
    },
  },
  {
    name: 'create_call_log',
    description: 'Create a call log entry. Use this when user says "Log a call"',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'UUID of the contact' },
        direction: { type: 'string', enum: ['inbound', 'outbound'], description: 'Call direction' },
        duration: { type: 'number', description: 'Call duration in seconds' },
        notes: { type: 'string', description: 'Call notes' },
      },
      required: ['contactId', 'direction'],
    },
  },
  // Navigation Tool - Navigate to specific pages in the CRM application
  {
    name: 'navigate',
    description: 'Navigate the user to a different page in the CRM application. Use this when the user asks to go to a specific section like Jobs, Inbox, Contacts, Analytics, Finance, Settings, etc. Examples: "Go to jobs", "Show me contacts", "Take me to the inbox", "Open analytics", "Navigate to tech map", "Go to owner dashboard", "Show sales leads", "Open calendar", "View estimates", "Go to admin settings", "Show marketing campaigns", "View parts inventory"',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: [
            // Main dashboards
            'dashboard', 'owner-dashboard', 'admin-dashboard', 'sales-dashboard', 'tech-dashboard', 'office-dashboard', 'finance-dashboard',

            // Core business functions
            'jobs', 'contacts', 'estimates', 'inbox', 'calendar', 'parts', 'analytics', 'reports',

            // Job management
            'tech', 'tech-jobs', 'tech-map', 'dispatch-map',

            // Sales & Marketing
            'sales-leads', 'sales-meetings', 'sales-meeting-new', 'sales-meeting-record',
            'campaigns', 'marketing-campaigns', 'email-templates', 'marketing-email-templates', 'tags', 'marketing-tags',

            // Financial
            'finance', 'finance-payments',

            // Administrative
            'admin-users', 'admin-audit', 'admin-automation', 'admin-llm-providers',
            'admin-settings', 'admin-settings-company', 'admin-settings-ai', 'admin-settings-automation',

            // Settings & Configuration
            'settings', 'settings-profile', 'settings-notifications', 'settings-integrations', 'integrations'
          ],
          description: 'The page to navigate to'
        },
        jobId: { type: 'string', description: 'Optional: Job ID if navigating to a specific job' },
        contactId: { type: 'string', description: 'Optional: Contact ID if navigating to a specific contact' },
        estimateId: { type: 'string', description: 'Optional: Estimate ID if navigating to a specific estimate' },
        meetingId: { type: 'string', description: 'Optional: Meeting ID if navigating to a specific meeting' },
        campaignId: { type: 'string', description: 'Optional: Campaign ID if navigating to a specific campaign' },
      },
      required: ['page'],
    },
  },
  // MISSING TOOLS - Wave 1: High Priority
  {
    name: 'upload_job_photo',
    description: 'Upload a photo for a job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job' },
        photoUrl: { type: 'string', description: 'URL of the photo to upload' },
        base64Data: { type: 'string', description: 'Base64 encoded photo data' },
        caption: { type: 'string', description: 'Photo caption (optional)' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'add_contact_note',
    description: 'Add a note to a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'UUID of the contact' },
        content: { type: 'string', description: 'Note content' },
      },
      required: ['contactId', 'content'],
    },
  },
  {
    name: 'add_conversation_note',
    description: 'Add a note to a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'UUID of the conversation' },
        content: { type: 'string', description: 'Note content' },
      },
      required: ['conversationId', 'content'],
    },
  },
  {
    name: 'list_users',
    description: 'List users in the account',
    inputSchema: {
      type: 'object',
      properties: {
        role: { type: 'string', description: 'Filter by role (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
      },
    },
  },
  {
    name: 'get_user',
    description: 'Get details of a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'UUID of the user' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'get_user_email',
    description: 'Get the email address for the current user/account owner',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_current_user',
    description: 'Get the authenticated user information including UUID, role, and email',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_tech_jobs',
    description: 'Get jobs assigned to a technician',
    inputSchema: {
      type: 'object',
      properties: {
        techId: { type: 'string', description: 'UUID of the technician (optional, uses current user if not provided)' },
        status: { type: 'string', description: 'Filter by status' },
        date: { type: 'string', description: 'Filter by date (ISO 8601)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
    },
  },
  // MISSING TOOLS - Wave 2: Analytics
  {
    name: 'get_dashboard_stats',
    description: 'Get dashboard statistics including jobs, revenue, contacts, and invoices',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_job_analytics',
    description: 'Get analytics for jobs (revenue, counts, status breakdown)',
    inputSchema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'ISO 8601 date to start from (optional)' },
        dateTo: { type: 'string', description: 'ISO 8601 date to end at (optional)' },
        status: { type: 'string', description: 'Filter by status (optional)' },
      },
    },
  },
  {
    name: 'get_revenue_analytics',
    description: 'Get revenue analytics grouped by date, tech, or status',
    inputSchema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'ISO 8601 date to start from (optional)' },
        dateTo: { type: 'string', description: 'ISO 8601 date to end at (optional)' },
        groupBy: { type: 'string', enum: ['date', 'tech', 'status'], description: 'Group results by date, tech, or status' },
      },
    },
  },
  {
    name: 'get_contact_analytics',
    description: 'Get analytics for contacts',
    inputSchema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'ISO 8601 date to start from (optional)' },
        dateTo: { type: 'string', description: 'ISO 8601 date to end at (optional)' },
      },
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a report for jobs, contacts, or invoices',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['jobs', 'contacts', 'invoices'], description: 'Type of report to generate' },
        dateFrom: { type: 'string', description: 'ISO 8601 date to start from (optional)' },
        dateTo: { type: 'string', description: 'ISO 8601 date to end at (optional)' },
      },
      required: ['type'],
    },
  },
  // MISSING TOOLS - Wave 3: Financial Operations
  {
    name: 'update_invoice',
    description: 'Update invoice details',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'UUID of the invoice' },
        totalAmount: { type: 'number', description: 'Total amount in cents' },
        dueDate: { type: 'string', description: 'ISO 8601 date for due date' },
        notes: { type: 'string', description: 'Invoice notes' },
      },
      required: ['invoiceId'],
    },
  },
  // MISSING TOOLS - Wave 4: Marketing Operations
  {
    name: 'list_campaigns',
    description: 'List marketing campaigns',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
    },
  },
  {
    name: 'get_campaign',
    description: 'Get details of a specific campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'string', description: 'UUID of the campaign' },
      },
      required: ['campaignId'],
    },
  },
  {
    name: 'send_campaign',
    description: 'Send a marketing campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'string', description: 'UUID of the campaign' },
      },
      required: ['campaignId'],
    },
  },
  {
    name: 'list_email_templates',
    description: 'List email templates',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filter by template type (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
    },
  },
  {
    name: 'create_email_template',
    description: 'Create a new email template',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Template name' },
        type: { type: 'string', description: 'Template type' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body HTML' },
      },
      required: ['name', 'type', 'subject', 'body'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email to a contact',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Email address to send to' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body content' },
        jobId: { type: 'string', description: 'Optional: Job ID to include in email' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'send_review_request',
    description: 'Send a review request email to a contact after job completion',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the completed job' },
        contactId: { type: 'string', description: 'UUID of the contact' },
      },
      required: ['jobId', 'contactId'],
    },
  },
  // MISSING TOOLS - Wave 5: Contact Management
  {
    name: 'list_contact_tags',
    description: 'List contact tags',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
    },
  },
  {
    name: 'create_contact_tag',
    description: 'Create a new contact tag',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tag name' },
        color: { type: 'string', description: 'Tag color (hex code, optional)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'assign_tag_to_contact',
    description: 'Assign a tag to a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'UUID of the contact' },
        tagId: { type: 'string', description: 'UUID of the tag' },
      },
      required: ['contactId', 'tagId'],
    },
  },
  // MISSING TOOLS - Wave 6: Automation
  {
    name: 'list_automation_rules',
    description: 'List automation rules',
    inputSchema: {
      type: 'object',
      properties: {
        active: { type: 'boolean', description: 'Filter by active status (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
    },
  },
  {
    name: 'create_automation_rule',
    description: 'Create a new automation rule',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Rule name' },
        trigger: { type: 'string', description: 'Trigger condition' },
        action: { type: 'string', description: 'Action to perform' },
        active: { type: 'boolean', description: 'Whether the rule is active (default: true)' },
      },
      required: ['name', 'trigger', 'action'],
    },
  },
  // MISSING TOOLS - Wave 7: Data Export
  {
    name: 'export_contacts',
    description: 'Export contacts to CSV or JSON',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['csv', 'json'], description: 'Export format (default: csv)' },
      },
    },
  },
  {
    name: 'export_jobs',
    description: 'Export jobs to CSV or JSON',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['csv', 'json'], description: 'Export format (default: csv)' },
        dateFrom: { type: 'string', description: 'ISO 8601 date to start from (optional)' },
        dateTo: { type: 'string', description: 'ISO 8601 date to end at (optional)' },
      },
    },
  },
  // MISSING TOOLS - Wave 8: System & Admin
  {
    name: 'create_notification',
    description: 'Create a notification for a user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'UUID of the user to notify' },
        type: { type: 'string', description: 'Notification type (job_assigned, message_received, payment_received, etc.)' },
        title: { type: 'string', description: 'Notification title' },
        message: { type: 'string', description: 'Notification message' },
        link: { type: 'string', description: 'Optional link URL' },
      },
      required: ['userId', 'type', 'title', 'message'],
    },
  },
  {
    name: 'list_job_photos',
    description: 'List photos for a specific job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'UUID of the job' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'get_account_settings',
    description: 'Get account settings',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'update_account_settings',
    description: 'Update account settings',
    inputSchema: {
      type: 'object',
      properties: {
        settings: { type: 'object', description: 'Settings object to update' },
      },
      required: ['settings'],
    },
  },
  {
    name: 'get_audit_logs',
    description: 'Get audit logs for the account',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Filter by action (optional)' },
        userId: { type: 'string', description: 'Filter by user ID (optional)' },
        dateFrom: { type: 'string', description: 'ISO 8601 date to start from (optional)' },
        dateTo: { type: 'string', description: 'ISO 8601 date to end at (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
    },
  },
  {
    name: 'read_agent_memory',
    description: "Checks for previous conversations from the last 72 hours to resume context",
    inputSchema: {
      type: 'object',
      properties: {
        userIdentifier: {
          type: 'string',
          format: 'uuid',
          description: "The UUID of the authenticated user from Supabase Auth",
        },
      },
      required: ['userIdentifier'],
    },
  },
  {
    name: 'update_agent_memory',
    description: "Saves the current conversation state (Save Game)",
    inputSchema: {
      type: 'object',
      properties: {
        userIdentifier: {
          type: 'string',
          format: 'uuid',
          description: "The UUID of the authenticated user from Supabase Auth",
        },
        summary: {
          type: 'string',
          description: "1-sentence context recap of the conversation",
        },
        intent: {
          type: 'string',
          description: "What the user is trying to do (e.g., 'job_creation', 'scheduling')",
        },
        stagingData: {
          type: 'string',
          description: "JSON string of any collected data (jobs, contacts, etc.)",
        },
        conversationHistory: {
          type: 'string',
          description: "JSON array of conversation interactions",
        },
        userPreferences: {
          type: 'string',
          description: "JSON object of user preferences and settings",
        },
        currentContext: {
          type: 'string',
          description: "JSON object with current page, action, and context info",
        },
      },
      required: ['userIdentifier', 'summary'],
    },
  },

  // ===== CUTTING-EDGE AI TOOLS (18 New Advanced Tools) =====

  // 1. AI Job Estimation
  {
    name: 'ai_estimate_job',
    description: 'AI-powered job estimation using historical data and machine learning',
    inputSchema: {
      type: 'object',
      properties: {
        jobType: { type: 'string', description: 'Type of job (plumbing, electrical, etc.)' },
        description: { type: 'string', description: 'Detailed job description' },
        location: { type: 'string', description: 'Job location/address' },
        urgency: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'], description: 'Job urgency level' },
        reportedIssues: { type: 'array', items: { type: 'string' }, description: 'List of reported issues' },
      },
      required: ['jobType', 'description', 'location'],
    },
  },

  // CRITICAL FIX: Create formal estimate from AI calculation
  {
    name: 'create_formal_estimate_from_ai',
    description: 'Create a formal estimate record from AI calculation that appears on Estimates page. Use this after ai_estimate_job to make the estimate visible in the UI.',
    inputSchema: {
      type: 'object',
      properties: {
        aiEstimateId: { type: 'string', description: 'The ID returned from ai_estimate_job tool' },
        jobId: { type: 'string', description: 'Optional: Job ID to link estimate to' },
        contactId: { type: 'string', description: 'Contact ID for the customer' },
        title: { type: 'string', description: 'Optional: Custom title for the estimate' },
      },
      required: ['aiEstimateId', 'contactId'],
    },
  },

  // 2. AI Customer Sentiment Analysis
  {
    name: 'analyze_customer_sentiment',
    description: 'Analyze customer sentiment from conversation history',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact UUID to analyze' },
        timeframe: { type: 'string', description: 'Time period to analyze (e.g., "30d", "7d")' },
        includeEmails: { type: 'boolean', default: true, description: 'Include email analysis' },
      },
      required: ['contactId'],
    },
  },

  // 3. AI Predictive Maintenance
  {
    name: 'predict_equipment_maintenance',
    description: 'Predict equipment failures using AI and historical data',
    inputSchema: {
      type: 'object',
      properties: {
        equipmentId: { type: 'string', description: 'Equipment identifier' },
        equipmentType: { type: 'string', description: 'Type of equipment' },
        lastMaintenance: { type: 'string', format: 'date', description: 'Last maintenance date' },
        usageHours: { type: 'number', description: 'Total usage hours' },
        reportedIssues: { type: 'array', items: { type: 'string' }, description: 'Recent issues reported' },
      },
      required: ['equipmentId', 'equipmentType'],
    },
  },

  // 4. AI Dynamic Pricing
  {
    name: 'calculate_dynamic_pricing',
    description: 'Real-time pricing optimization based on demand, competition, and value',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Job UUID for pricing' },
        basePrice: { type: 'number', description: 'Base price estimate' },
        factors: { type: 'object', description: 'Additional pricing factors (urgency, competition, etc.)' },
      },
      required: ['jobId', 'basePrice'],
    },
  },

  // 5. AI Risk Assessment
  {
    name: 'assess_job_risk',
    description: 'Comprehensive risk analysis for jobs (safety, financial, reputation)',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Job UUID to assess' },
        jobType: { type: 'string', description: 'Type of job' },
        location: { type: 'string', description: 'Job location' },
        complexity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Job complexity' },
      },
      required: ['jobId', 'jobType'],
    },
  },

  // 6. AI Customer Churn Prediction
  {
    name: 'predict_customer_churn',
    description: 'Identify customers at risk of leaving with proactive interventions',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact UUID to analyze' },
        includeHistory: { type: 'boolean', default: true, description: 'Include service history' },
      },
      required: ['contactId'],
    },
  },

  // 7. AI Sales Coaching
  {
    name: 'provide_sales_coaching',
    description: 'Real-time sales guidance and conversation optimization',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'Conversation UUID to analyze' },
        salesPersonId: { type: 'string', description: 'Sales person UUID' },
        context: { type: 'string', description: 'Current sales situation' },
      },
      required: ['context'],
    },
  },

  // 8. AI Compliance Monitoring
  {
    name: 'monitor_compliance',
    description: 'Automated compliance checking for regulations and standards',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['job', 'invoice', 'contract', 'communication'], description: 'Entity type to check' },
        entityId: { type: 'string', description: 'Entity UUID to check' },
        complianceType: { type: 'string', description: 'Type of compliance to check' },
      },
      required: ['entityType', 'entityId', 'complianceType'],
    },
  },

  // 9. Visual Route Planning
  {
    name: 'plan_visual_route',
    description: 'Interactive route optimization with traffic and priority weighting',
    inputSchema: {
      type: 'object',
      properties: {
        techId: { type: 'string', description: 'Technician UUID' },
        jobIds: { type: 'array', items: { type: 'string' }, description: 'List of job UUIDs to route' },
        startTime: { type: 'string', format: 'date-time', description: 'Route start time' },
        optimizeFor: { type: 'string', enum: ['time', 'distance', 'priority'], description: 'Optimization factor' },
      },
      required: ['techId', 'jobIds'],
    },
  },

  // 10. Photo Analysis AI
  {
    name: 'analyze_job_photos',
    description: 'AI analysis of job photos for issue identification and documentation',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Job UUID' },
        photoUrls: { type: 'array', items: { type: 'string' }, description: 'Photo URLs to analyze' },
        analysisType: { type: 'string', enum: ['issues', 'documentation', 'quality', 'all'], description: 'Type of analysis' },
      },
      required: ['jobId', 'photoUrls'],
    },
  },

  // 11. Signature Verification
  {
    name: 'verify_signature',
    description: 'Verify signature authenticity and detect fraud',
    inputSchema: {
      type: 'object',
      properties: {
        signatureImageUrl: { type: 'string', description: 'Signature image URL' },
        referenceSignatureId: { type: 'string', description: 'Reference signature UUID' },
        jobId: { type: 'string', description: 'Job UUID' },
      },
      required: ['signatureImageUrl', 'jobId'],
    },
  },

  // 12. Document Scanning OCR
  {
    name: 'scan_and_process_document',
    description: 'Extract and process data from uploaded documents',
    inputSchema: {
      type: 'object',
      properties: {
        documentUrl: { type: 'string', description: 'Document image/PDF URL' },
        documentType: { type: 'string', enum: ['invoice', 'contract', 'receipt', 'form', 'other'], description: 'Document type' },
        extractionFields: { type: 'array', items: { type: 'string' }, description: 'Fields to extract' },
      },
      required: ['documentUrl', 'documentType'],
    },
  },

  // 13. Real-time Video Support
  {
    name: 'start_video_support',
    description: 'Initiate video call with customer for complex issues',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Customer contact UUID' },
        jobId: { type: 'string', description: 'Job UUID' },
        reason: { type: 'string', description: 'Reason for video call' },
        technicianId: { type: 'string', description: 'Technician UUID' },
      },
      required: ['contactId', 'reason'],
    },
  },

  // 14. IoT Device Integration
  {
    name: 'monitor_iot_devices',
    description: 'Connect and monitor IoT sensors and smart devices',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'IoT device identifier' },
        deviceType: { type: 'string', description: 'Type of IoT device' },
        customerId: { type: 'string', description: 'Customer UUID' },
        monitoringPeriod: { type: 'string', description: 'Monitoring period (e.g., "24h", "7d")' },
      },
      required: ['deviceId', 'deviceType', 'customerId'],
    },
  },

  // 15. Blockchain Payments
  {
    name: 'process_crypto_payment',
    description: 'Accept and process cryptocurrency payments',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'Invoice UUID' },
        cryptocurrency: { type: 'string', enum: ['BTC', 'ETH', 'USDC', 'USDT'], description: 'Cryptocurrency type' },
        amount: { type: 'number', description: 'Payment amount' },
        walletAddress: { type: 'string', description: 'Customer wallet address' },
      },
      required: ['invoiceId', 'cryptocurrency', 'amount'],
    },
  },

  // 16. AR Job Visualization
  {
    name: 'create_ar_preview',
    description: 'Augmented reality preview of completed work',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Job UUID' },
        previewType: { type: 'string', enum: ['before', 'after', 'process'], description: 'Preview type' },
        modelFiles: { type: 'array', items: { type: 'string' }, description: '3D model file URLs' },
      },
      required: ['jobId', 'previewType'],
    },
  },

  // 17. Predictive Hiring
  {
    name: 'predict_candidate_success',
    description: 'AI-powered candidate evaluation and success prediction',
    inputSchema: {
      type: 'object',
      properties: {
        candidateId: { type: 'string', description: 'Candidate UUID' },
        positionId: { type: 'string', description: 'Position UUID' },
        resumeData: { type: 'object', description: 'Resume/experience data' },
        assessmentScores: { type: 'object', description: 'Assessment test scores' },
      },
      required: ['candidateId', 'positionId'],
    },
  },

  // 18. AI Voice Cloning
  {
    name: 'clone_customer_voice',
    description: 'Create AI voice clones for personalized interactions',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact UUID to clone voice for' },
        audioSampleUrl: { type: 'string', description: 'Audio sample URL for voice cloning' },
        useCase: { type: 'string', enum: ['notifications', 'reminders', 'updates', 'custom'], description: 'Intended use' },
        consentRecorded: { type: 'boolean', description: 'Customer consent recorded' },
      },
      required: ['contactId', 'audioSampleUrl', 'consentRecorded'],
    },
  },
]

// Helper functions from voice-command
function parseRelativeDate(dateStr: string): string | null {
  const lower = dateStr.toLowerCase().trim()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (lower === 'today') {
    return today.toISOString().split('T')[0]
  }
  if (lower === 'tomorrow') {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }
  if (lower === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }
  if (lower.includes('next week')) {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek.toISOString().split('T')[0]
  }
  if (lower.includes('next month')) {
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth.toISOString().split('T')[0]
  }

  // Try to parse as ISO date
  try {
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch {}

  return null
}

function resolveContextId(id: string, context: any, type: 'job' | 'contact' | 'conversation'): string | null {
  if (id === 'last' || id === 'current') {
    if (type === 'job' && context?.lastJobId) return context.lastJobId
    if (type === 'contact' && context?.lastContactId) return context.lastContactId
    if (type === 'conversation' && context?.lastConversationId) return context.lastConversationId
  }
  return id
}

async function findTechByName(supabase: any, accountId: string, techName: string): Promise<string | null> {
  const searchTerm = techName.trim()
  const { data: users } = await supabase
    .from('users')
    .select('id, first_name, last_name, role')
    .eq('account_id', accountId)
    .eq('role', 'tech')
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
    .limit(5)

  if (!users || users.length === 0) return null

  const exactMatch = users.find((u: any) =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    searchTerm.toLowerCase().includes(u.first_name?.toLowerCase() || '') ||
    searchTerm.toLowerCase().includes(u.last_name?.toLowerCase() || '')
  )

  return exactMatch?.id || users[0].id
}

async function findContactByName(supabase: any, accountId: string, contactName: string): Promise<string | null> {
  const searchTerm = contactName.trim()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .eq('account_id', accountId)
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
    .limit(5)

  if (!contacts || contacts.length === 0) return null

  const exactMatch = contacts.find((c: any) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    searchTerm.toLowerCase().includes(c.first_name?.toLowerCase() || '') ||
    searchTerm.toLowerCase().includes(c.last_name?.toLowerCase() || '')
  )

  return exactMatch?.id || contacts[0].id
}

function getNextApiUrl(supabaseUrl: string, path: string): string {
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || Deno.env.get('APP_URL')
  if (appUrl) {
    return `${appUrl}/api${path}`
  }
  const baseUrl = supabaseUrl.replace('/rest/v1', '').replace('/functions/v1', '')
  return `${baseUrl}/api${path}`
}

// Memory management functions for voice agent continuity
async function readAgentMemory(args: any, supabase: any): Promise<any> {
  const { userIdentifier } = args

  if (!userIdentifier) {
    return { error: 'User identifier is required' }
  }

  try {
    // Query for active memory within 72 hours
    const { data, error } = await supabase
      .from('agent_memory')
      .select('*') // Get all fields for rich memory
      .eq('user_identifier', userIdentifier)
      .gte('last_active_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
      .order('last_active_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return {
        found: false,
        message: 'No previous conversation found within 72 hours',
      }
    }

    // Parse rich staging data
    let stagingData = {}
    try {
      stagingData = typeof data.staging_data === 'string' ? JSON.parse(data.staging_data) : data.staging_data || {}
    } catch (e) {
      stagingData = {}
    }

    return {
      found: true,
      intent: data.intent,
      summary: data.conversation_summary,
      stagingData: stagingData,
      lastActive: data.last_active_at,
      sessionId: data.session_id,
      conversationHistory: data.conversation_history || [],
      userPreferences: data.user_preferences || {},
      currentContext: data.current_context || {},
    }
  } catch (error: any) {
    return { error: error.message || 'Failed to read agent memory' }
  }
}

async function updateAgentMemory(args: any, supabase: any): Promise<any> {
  const { userIdentifier, summary, intent, stagingData, conversationHistory, userPreferences, currentContext } = args

  if (!userIdentifier || !summary) {
    return { error: 'User identifier and summary are required' }
  }

  try {
    // Parse all JSON data
    let parsedStagingData = {}
    let parsedHistory = []
    let parsedPreferences = {}
    let parsedContext = {}

    if (stagingData) {
      try {
        parsedStagingData = typeof stagingData === 'string' ? JSON.parse(stagingData) : stagingData
      } catch (e) {
        return { error: 'Invalid JSON in stagingData parameter' }
      }
    }

    if (conversationHistory) {
      try {
        parsedHistory = typeof conversationHistory === 'string' ? JSON.parse(conversationHistory) : conversationHistory
      } catch (e) {
        console.warn('Invalid JSON in conversationHistory:', e)
      }
    }

    if (userPreferences) {
      try {
        parsedPreferences = typeof userPreferences === 'string' ? JSON.parse(userPreferences) : userPreferences
      } catch (e) {
        console.warn('Invalid JSON in userPreferences:', e)
      }
    }

    if (currentContext) {
      try {
        parsedContext = typeof currentContext === 'string' ? JSON.parse(currentContext) : currentContext
      } catch (e) {
        console.warn('Invalid JSON in currentContext:', e)
      }
    }

    // Generate session ID if not present
    const sessionId = parsedContext.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Merge with existing memory to preserve history
    const { data: existing } = await supabase
      .from('agent_memory')
      .select('conversation_history, user_preferences')
      .eq('user_identifier', userIdentifier)
      .single()

    const mergedHistory = existing?.conversation_history ?
      [...(typeof existing.conversation_history === 'string' ? JSON.parse(existing.conversation_history) : existing.conversation_history), ...parsedHistory] :
      parsedHistory

    const mergedPreferences = {
      ...(existing?.user_preferences ? (typeof existing.user_preferences === 'string' ? JSON.parse(existing.user_preferences) : existing.user_preferences) : {}),
      ...parsedPreferences
    }

    // Perform upsert with rich data
    const { data, error } = await supabase
      .from('agent_memory')
      .upsert({
        user_identifier: userIdentifier,
        conversation_summary: summary,
        intent: intent || 'in_progress',
        staging_data: parsedStagingData,
        session_id: sessionId,
        conversation_history: mergedHistory.slice(-50), // Keep last 50 interactions
        user_preferences: mergedPreferences,
        current_context: {
          ...parsedContext,
          sessionId,
          lastUpdated: new Date().toISOString(),
          currentPage: parsedContext.currentPage || 'unknown',
          lastAction: summary,
          timestamp: new Date().toISOString()
        },
        last_active_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_identifier',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message || 'Failed to update agent memory' }
    }

    return {
      success: true,
      message: 'Rich conversation state saved successfully',
      memoryId: data.id,
      sessionId,
      historyCount: mergedHistory.length,
      preferences: Object.keys(mergedPreferences).length,
      contextKeys: Object.keys(parsedContext).length
    }
  } catch (error: any) {
    return { error: error.message || 'Failed to update agent memory' }
  }
}

async function handleToolCall(toolName: string, args: any, supabase: any, accountId: string, context?: any): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    // Core Job Operations
    if (toolName === 'create_job') {
      let finalContactId = args.contactId
      if (!finalContactId && args.contactName) {
        const searchTerm = args.contactName.trim()
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .eq('account_id', accountId)
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .limit(5)

        let matched = contacts?.find((c: any) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          searchTerm.toLowerCase().includes(c.first_name?.toLowerCase() || '') ||
          searchTerm.toLowerCase().includes(c.last_name?.toLowerCase() || '')
        )

        if (matched) {
          finalContactId = matched.id
        } else if (contacts && contacts.length > 0) {
          finalContactId = contacts[0].id
        }
      }

      if (!finalContactId) {
        return { error: 'Contact not found. Please specify contact name or ID.' }
      }

      const jobRes = await fetch(`${supabaseUrl}/functions/v1/create-job`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          contactId: finalContactId,
          description: args.description,
          scheduledStart: args.scheduledStart,
          scheduledEnd: args.scheduledEnd,
          techAssignedId: args.techAssignedId,
        }),
      })
      const jobData = await jobRes.json()
      return { success: true, result: jobData, jobId: jobData.job?.id }
    }

    else if (toolName === 'update_job_status') {
      const statusRes = await fetch(`${supabaseUrl}/functions/v1/update-job-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          jobId: args.jobId,
          status: args.status,
        }),
      })
      const statusData = await statusRes.json()
      return { success: true, result: statusData }
    }

    else if (toolName === 'assign_tech') {
      const assignRes = await fetch(`${supabaseUrl}/functions/v1/assign-tech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          jobId: args.jobId,
          techAssignedId: args.techAssignedId,
        }),
      })
      const assignData = await assignRes.json()
      return { success: true, result: assignData }
    }

    else if (toolName === 'search_contacts') {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .eq('account_id', accountId)
        .or(`first_name.ilike.%${args.search}%,last_name.ilike.%${args.search}%,email.ilike.%${args.search}%,phone.ilike.%${args.search}%`)
        .limit(5)
      return { contacts: contacts || [], contactCount: contacts?.length || 0 }
    }

    else if (toolName === 'get_job') {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, contacts(*), users(*)')
        .eq('id', args.jobId)
        .eq('account_id', accountId)
        .single()
      return { job }
    }

    else if (toolName === 'send_message') {
      let convId = args.conversationId
      if (!convId) {
        return { error: 'conversationId required for send_message' }
      }
      const { data: message } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          direction: 'outbound',
          body_text: args.message,
          sender_type: 'user',
        })
        .select()
        .single()
      return { message }
    }

    // Priority 1 - Core Operations
    else if (toolName === 'list_jobs') {
      let query = supabase
        .from('jobs')
        .select('*, contact:contacts(*), tech:users!tech_assigned_id(*)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)
        .range(args.offset || 0, (args.offset || 0) + (args.limit || 50) - 1)

      if (args.status) query = query.eq('status', args.status)
      if (args.techId) query = query.eq('tech_assigned_id', args.techId)
      if (args.contactId) query = query.eq('contact_id', args.contactId)
      if (args.date) {
        const dateStr = parseRelativeDate(args.date)
        if (dateStr) {
          const start = new Date(dateStr)
          start.setHours(0, 0, 0, 0)
          const end = new Date(dateStr)
          end.setHours(23, 59, 59, 999)
          query = query.gte('scheduled_start', start.toISOString()).lte('scheduled_start', end.toISOString())
        }
      }

      const { data: jobs, error } = await query
      if (error) {
        return { error: `Failed to fetch jobs: ${error.message}` }
      }
      return { jobs: jobs || [], jobCount: jobs?.length || 0 }
    }

    else if (toolName === 'list_contacts') {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)
        .range(args.offset || 0, (args.offset || 0) + (args.limit || 50) - 1)

      if (args.search) {
        query = query.or(`first_name.ilike.%${args.search}%,last_name.ilike.%${args.search}%,email.ilike.%${args.search}%,phone.ilike.%${args.search}%`)
      }

      const { data: contacts, error } = await query
      if (error) {
        return { error: `Failed to fetch contacts: ${error.message}` }
      }
      return { contacts: contacts || [], contactCount: contacts?.length || 0 }
    }

    else if (toolName === 'create_contact') {
      const { data: accountUser } = await supabase
        .from('users')
        .select('id')
        .eq('account_id', accountId)
        .limit(1)
        .single()

      if (!accountUser) {
        return { error: 'No user found for account' }
      }

      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', args.email)
        .eq('account_id', accountId)
        .single()

      if (existing) {
        return { error: 'Contact with this email already exists', contact: existing }
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          account_id: accountId,
          email: args.email,
          phone: args.phone || null,
          first_name: args.firstName,
          last_name: args.lastName || null,
          address: args.address || null,
        })
        .select()
        .single()

      if (error) {
        return { error: `Failed to create contact: ${error.message}` }
      }
      return { success: true, contact, contactId: contact?.id }
    }

    else if (toolName === 'update_contact') {
      let contactId = resolveContextId(args.contactId, context, 'contact')
      if (!contactId || contactId === args.contactId) {
        contactId = await findContactByName(supabase, accountId, args.contactId) || args.contactId
      }

      const updateData: any = {}
      if (args.email !== undefined) updateData.email = args.email
      if (args.firstName !== undefined) updateData.first_name = args.firstName
      if (args.lastName !== undefined) updateData.last_name = args.lastName
      if (args.phone !== undefined) updateData.phone = args.phone
      if (args.address !== undefined) updateData.address = args.address

      if (Object.keys(updateData).length === 0) {
        return { error: 'No fields to update' }
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .eq('account_id', accountId)
        .select()
        .single()

      if (error) {
        return { error: `Failed to update contact: ${error.message}` }
      }
      return { success: true, contact }
    }

    else if (toolName === 'get_contact') {
      let contactId = resolveContextId(args.contactId, context, 'contact')
      if (!contactId || contactId === args.contactId) {
        contactId = await findContactByName(supabase, accountId, args.contactId) || args.contactId
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single()

      if (error || !contact) {
        return { error: 'Contact not found' }
      }
      return { contact }
    }

    else if (toolName === 'list_conversations') {
      let query = supabase
        .from('conversations')
        .select('*, contact:contacts(*)')
        .eq('account_id', accountId)
        .order('last_message_at', { ascending: false })
        .limit(args.limit || 100)
        .range(args.offset || 0, (args.offset || 0) + (args.limit || 100) - 1)

      if (args.contactId) query = query.eq('contact_id', args.contactId)
      if (args.status) query = query.eq('status', args.status)

      const { data: conversations, error } = await query
      if (error) {
        return { error: `Failed to fetch conversations: ${error.message}` }
      }
      return { conversations: conversations || [], conversationCount: conversations?.length || 0 }
    }

    else if (toolName === 'get_conversation') {
      let conversationId = resolveContextId(args.conversationId, context, 'conversation')
      if (!conversationId || conversationId === args.conversationId) {
        const contactId = await findContactByName(supabase, accountId, args.conversationId)
        if (contactId) {
          const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('contact_id', contactId)
            .eq('account_id', accountId)
            .order('last_message_at', { ascending: false })
            .limit(1)
            .single()
          if (conv) conversationId = conv.id
        }
      }

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*, contact:contacts(*)')
        .eq('id', conversationId)
        .eq('account_id', accountId)
        .single()

      if (convError || !conversation) {
        return { error: 'Conversation not found' }
      }

      const apiUrl = getNextApiUrl(supabaseUrl, `/conversations/${conversationId}/messages`)
      const messagesRes = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const messagesData = await messagesRes.json()
      return { conversation, messages: messagesData.messages || [] }
    }

    else if (toolName === 'generate_draft') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/ai/draft')
      const draftRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: args.conversationId,
        }),
      })
      const draftText = await draftRes.text()
      if (!draftRes.ok) {
        return { error: 'Failed to generate draft' }
      }
      return { draft: draftText }
    }

    else if (toolName === 'assign_tech_by_name') {
      let jobId = resolveContextId(args.jobId, context, 'job')
      const techId = await findTechByName(supabase, accountId, args.techName)

      if (!techId) {
        return { error: `Technician "${args.techName}" not found` }
      }

      const assignRes = await fetch(`${supabaseUrl}/functions/v1/assign-tech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          jobId,
          techAssignedId: techId,
        }),
      })
      const assignData = await assignRes.json()
      return { success: true, result: assignData }
    }

    else if (toolName === 'bulk_operations') {
      let jobIds = args.jobIds || []

      if (args.filter && !jobIds.length) {
        let filterQuery = supabase
          .from('jobs')
          .select('id')
          .eq('account_id', accountId)

        if (args.filter.status) filterQuery = filterQuery.eq('status', args.filter.status)
        if (args.filter.date) {
          const dateStr = parseRelativeDate(args.filter.date)
          if (dateStr) {
            const start = new Date(dateStr)
            start.setHours(0, 0, 0, 0)
            const end = new Date(dateStr)
            end.setHours(23, 59, 59, 999)
            filterQuery = filterQuery.gte('scheduled_start', start.toISOString()).lte('scheduled_start', end.toISOString())
          }
        }

        const { data: filteredJobs } = await filterQuery
        jobIds = filteredJobs?.map((j: any) => j.id) || []
      }

      if (!jobIds.length) {
        return { error: 'No jobs found to perform bulk operation' }
      }

      const apiUrl = getNextApiUrl(supabaseUrl, '/jobs/bulk')
      const bulkRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: args.action,
          jobIds,
          status: args.status,
          techId: args.techId,
        }),
      })
      const bulkData = await bulkRes.json()
      if (!bulkRes.ok) {
        return { error: bulkData.error || 'Failed to perform bulk operation' }
      }
      return { success: true, result: bulkData, updatedCount: bulkData.count || 0 }
    }

    // Priority 2 - Field Operations
    else if (toolName === 'upload_photo') {
      let jobId = resolveContextId(args.jobId, context, 'job')
      const apiUrl = getNextApiUrl(supabaseUrl, `/jobs/${jobId}/upload-photo`)
      const photoRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrl: args.photoUrl,
          photoData: args.photoData,
        }),
      })
      const photoData = await photoRes.json()
      if (!photoRes.ok) {
        return { error: photoData.error || 'Failed to upload photo' }
      }
      return { success: true, result: photoData }
    }

    else if (toolName === 'capture_location') {
      let jobId = resolveContextId(args.jobId, context, 'job')
      const apiUrl = getNextApiUrl(supabaseUrl, `/jobs/${jobId}/location`)
      const locationRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: args.latitude,
          longitude: args.longitude,
        }),
      })
      const locationData = await locationRes.json()
      if (!locationRes.ok) {
        return { error: locationData.error || 'Failed to capture location' }
      }
      return { success: true, result: locationData }
    }

    else if (toolName === 'clock_in') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/time-entries')
      const clockRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: args.jobId,
          notes: args.notes,
        }),
      })
      const clockData = await clockRes.json()
      if (!clockRes.ok) {
        return { error: clockData.error || 'Failed to clock in' }
      }
      return { success: true, result: clockData, timeEntryId: clockData.timeEntry?.id }
    }

    else if (toolName === 'clock_out') {
      let timeEntryId = args.timeEntryId
      if (!timeEntryId) {
        const { data: recentEntry } = await supabase
          .from('time_entries')
          .select('id')
          .eq('account_id', accountId)
          .is('end_time', null)
          .order('start_time', { ascending: false })
          .limit(1)
          .single()
        if (recentEntry) timeEntryId = recentEntry.id
      }

      if (!timeEntryId) {
        return { error: 'No active time entry found to clock out' }
      }

      const apiUrl = getNextApiUrl(supabaseUrl, `/time-entries/${timeEntryId}`)
      const clockRes = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: args.notes,
        }),
      })
      const clockData = await clockRes.json()
      if (!clockRes.ok) {
        return { error: clockData.error || 'Failed to clock out' }
      }
      return { success: true, result: clockData }
    }

    else if (toolName === 'add_job_note') {
      let noteTarget = args.jobId || args.contactId
      if (args.jobId) {
        noteTarget = resolveContextId(args.jobId, context, 'job')
      } else if (args.contactId) {
        noteTarget = resolveContextId(args.contactId, context, 'contact')
        if (!noteTarget || noteTarget === args.contactId) {
          noteTarget = await findContactByName(supabase, accountId, args.contactId) || args.contactId
        }
      }

      if (!noteTarget) {
        return { error: 'Job ID or Contact ID required' }
      }

      const apiUrl = args.jobId
        ? getNextApiUrl(supabaseUrl, `/jobs/${noteTarget}/notes`)
        : getNextApiUrl(supabaseUrl, `/contacts/${noteTarget}/notes`)

      const noteRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: args.content,
          conversationId: args.conversationId,
        }),
      })
      const noteData = await noteRes.json()
      if (!noteRes.ok) {
        return { error: noteData.error || 'Failed to add note' }
      }
      return { success: true, result: noteData, note: noteData.note }
    }

    else if (toolName === 'get_my_jobs') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/tech/jobs')
      const params = new URLSearchParams()
      if (args.status) params.append('status', args.status)
      if (args.date) {
        const dateStr = parseRelativeDate(args.date)
        if (dateStr) params.append('date', dateStr)
      }

      const jobsRes = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const jobsData = await jobsRes.json()
      if (!jobsRes.ok) {
        return { error: jobsData.error || 'Failed to fetch jobs' }
      }
      return { jobs: jobsData.jobs || [], stats: jobsData.stats }
    }

    // Priority 3 - Business Intelligence
    else if (toolName === 'get_analytics') {
      const type = args.type || 'jobs'
      const apiUrl = getNextApiUrl(supabaseUrl, `/analytics/${type}`)
      const analyticsRes = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const analyticsData = await analyticsRes.json()
      if (!analyticsRes.ok) {
        return { error: analyticsData.error || 'Failed to fetch analytics' }
      }
      return { analytics: analyticsData }
    }

    else if (toolName === 'search_jobs') {
      let query = supabase
        .from('jobs')
        .select('*, contact:contacts(*)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })

      if (args.date) {
        const dateStr = parseRelativeDate(args.date)
        if (dateStr) {
          const start = new Date(dateStr)
          start.setHours(0, 0, 0, 0)
          const end = new Date(dateStr)
          end.setHours(23, 59, 59, 999)
          query = query.gte('scheduled_start', start.toISOString()).lte('scheduled_start', end.toISOString())
        }
      }
      if (args.status) query = query.eq('status', args.status)
      if (args.contactName) {
        const contactId = await findContactByName(supabase, accountId, args.contactName)
        if (contactId) query = query.eq('contact_id', contactId)
      }

      const { data: jobs, error } = await query.limit(50)
      if (error) {
        return { error: `Failed to search jobs: ${error.message}` }
      }
      return { jobs: jobs || [] }
    }

    else if (toolName === 'filter_jobs') {
      let query = supabase
        .from('jobs')
        .select('*, contact:contacts(*)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })

      if (args.status) query = query.eq('status', args.status)
      if (args.techId) query = query.eq('tech_assigned_id', args.techId)
      if (args.contactId) query = query.eq('contact_id', args.contactId)

      const { data: jobs, error } = await query.limit(50)
      if (error) {
        return { error: `Failed to filter jobs: ${error.message}` }
      }
      return { jobs: jobs || [] }
    }

    // Priority 4 - Advanced Operations
    else if (toolName === 'create_invoice') {
      let jobId = resolveContextId(args.jobId, context, 'job')
      const apiUrl = getNextApiUrl(supabaseUrl, '/invoices')
      const invoiceRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          amount: args.amount,
          description: args.description,
        }),
      })
      const invoiceData = await invoiceRes.json()
      if (!invoiceRes.ok) {
        return { error: invoiceData.error || 'Failed to create invoice' }
      }
      return { success: true, result: invoiceData, invoice: invoiceData.invoice }
    }

    else if (toolName === 'send_invoice') {
      const apiUrl = getNextApiUrl(supabaseUrl, `/invoices/${args.invoiceId}/send`)
      const sendRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const sendData = await sendRes.json()
      if (!sendRes.ok) {
        return { error: sendData.error || 'Failed to send invoice' }
      }
      return { success: true, result: sendData }
    }

    else if (toolName === 'create_campaign') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/campaigns')
      const campaignRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: args.name,
          subject: args.subject,
          body: args.body,
          templateId: args.templateId,
        }),
      })
      const campaignData = await campaignRes.json()
      if (!campaignRes.ok) {
        return { error: campaignData.error || 'Failed to create campaign' }
      }
      return { success: true, result: campaignData, campaign: campaignData.campaign }
    }

    else if (toolName === 'export_data') {
      const type = args.type
      const format = args.format || 'csv'
      const apiUrl = getNextApiUrl(supabaseUrl, `/export/${type}?format=${format}`)
      const exportRes = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      if (!exportRes.ok) {
        const errorData = await exportRes.json()
        return { error: errorData.error || 'Failed to export data' }
      }
      return { exportUrl: exportRes.url, message: `Export completed. ${type} data exported as ${format}.` }
    }

    // Additional Essential Tools
    else if (toolName === 'update_job') {
      let jobId = resolveContextId(args.jobId, context, 'job')
      const apiUrl = getNextApiUrl(supabaseUrl, `/jobs/${jobId}`)
      const updateData: any = {}
      if (args.description !== undefined) updateData.description = args.description
      if (args.scheduledStart !== undefined) updateData.scheduledStart = args.scheduledStart
      if (args.scheduledEnd !== undefined) updateData.scheduledEnd = args.scheduledEnd

      const jobRes = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      const jobData = await jobRes.json()
      if (!jobRes.ok) {
        return { error: jobData.error || 'Failed to update job' }
      }
      return { success: true, result: jobData, job: jobData.job }
    }

    else if (toolName === 'delete_job') {
      let jobId = resolveContextId(args.jobId, context, 'job')
      const apiUrl = getNextApiUrl(supabaseUrl, `/jobs/${jobId}`)
      const deleteRes = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      if (!deleteRes.ok) {
        const errorData = await deleteRes.json()
        return { error: errorData.error || 'Failed to delete job' }
      }
      return { success: true, message: 'Job deleted successfully' }
    }

    else if (toolName === 'delete_contact') {
      let contactId = resolveContextId(args.contactId, context, 'contact')
      if (!contactId || contactId === args.contactId) {
        contactId = await findContactByName(supabase, accountId, args.contactId) || args.contactId
      }

      const apiUrl = getNextApiUrl(supabaseUrl, `/contacts/${contactId}`)
      const deleteRes = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      if (!deleteRes.ok) {
        const errorData = await deleteRes.json()
        return { error: errorData.error || 'Failed to delete contact' }
      }
      return { success: true, message: 'Contact deleted successfully' }
    }

    else if (toolName === 'create_conversation') {
      let contactId = resolveContextId(args.contactId, context, 'contact')
      if (!contactId || contactId === args.contactId) {
        contactId = await findContactByName(supabase, accountId, args.contactId) || args.contactId
      }

      const apiUrl = getNextApiUrl(supabaseUrl, '/conversations')
      const convRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          subject: args.subject,
          channel: args.channel || 'email',
        }),
      })
      const convData = await convRes.json()
      if (!convRes.ok) {
        return { error: convData.error || 'Failed to create conversation' }
      }
      return { success: true, result: convData, conversation: convData.conversation }
    }

    else if (toolName === 'update_conversation_status') {
      let conversationId = resolveContextId(args.conversationId, context, 'conversation')
      const apiUrl = getNextApiUrl(supabaseUrl, `/conversations/${conversationId}`)
      const updateRes = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: args.status,
        }),
      })
      const updateData = await updateRes.json()
      if (!updateRes.ok) {
        return { error: updateData.error || 'Failed to update conversation status' }
      }
      return { success: true, result: updateData, conversation: updateData.conversation }
    }

    else if (toolName === 'list_invoices') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/invoices')
      const params = new URLSearchParams()
      if (args.limit) params.append('limit', args.limit.toString())
      if (args.offset) params.append('offset', args.offset.toString())

      const invoicesRes = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const invoicesData = await invoicesRes.json()
      if (!invoicesRes.ok) {
        return { error: invoicesData.error || 'Failed to fetch invoices' }
      }
      return { invoices: invoicesData.invoices || [] }
    }

    else if (toolName === 'get_invoice') {
      const apiUrl = getNextApiUrl(supabaseUrl, `/invoices/${args.invoiceId}`)
      const invoiceRes = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const invoiceData = await invoiceRes.json()
      if (!invoiceRes.ok) {
        return { error: invoiceData.error || 'Failed to fetch invoice' }
      }
      return { invoice: invoiceData.invoice }
    }

    else if (toolName === 'mark_invoice_paid') {
      const apiUrl = getNextApiUrl(supabaseUrl, `/invoices/${args.invoiceId}/mark-paid`)
      const paidRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const paidData = await paidRes.json()
      if (!paidRes.ok) {
        return { error: paidData.error || 'Failed to mark invoice as paid' }
      }
      return { success: true, result: paidData }
    }

    else if (toolName === 'list_payments') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/payments')
      const params = new URLSearchParams()
      if (args.limit) params.append('limit', args.limit.toString())
      if (args.offset) params.append('offset', args.offset.toString())

      const paymentsRes = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const paymentsData = await paymentsRes.json()
      if (!paymentsRes.ok) {
        return { error: paymentsData.error || 'Failed to fetch payments' }
      }
      return { payments: paymentsData.payments || [] }
    }

    else if (toolName === 'create_payment') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/payments')
      const paymentRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: args.invoiceId,
          amount: args.amount,
          method: args.method,
        }),
      })
      const paymentData = await paymentRes.json()
      if (!paymentRes.ok) {
        return { error: paymentData.error || 'Failed to create payment' }
      }
      return { success: true, result: paymentData, payment: paymentData.payment }
    }

    else if (toolName === 'list_notifications') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/notifications')
      const params = new URLSearchParams()
      if (args.unreadOnly) params.append('unreadOnly', 'true')
      if (args.limit) params.append('limit', args.limit.toString())

      const notificationsRes = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const notificationsData = await notificationsRes.json()
      if (!notificationsRes.ok) {
        return { error: notificationsData.error || 'Failed to fetch notifications' }
      }
      return { notifications: notificationsData.notifications || [] }
    }

    else if (toolName === 'mark_notification_read') {
      const apiUrl = getNextApiUrl(supabaseUrl, `/notifications/${args.notificationId}`)
      const readRes = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          read: true,
        }),
      })
      const readData = await readRes.json()
      if (!readRes.ok) {
        return { error: readData.error || 'Failed to mark notification as read' }
      }
      return { success: true, result: readData }
    }

    else if (toolName === 'list_call_logs') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/call-logs')
      const params = new URLSearchParams()
      if (args.contactId) params.append('contactId', args.contactId)
      if (args.limit) params.append('limit', args.limit.toString())

      const callLogsRes = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      const callLogsData = await callLogsRes.json()
      if (!callLogsRes.ok) {
        return { error: callLogsData.error || 'Failed to fetch call logs' }
      }
      return { callLogs: callLogsData.callLogs || [] }
    }

    else if (toolName === 'create_call_log') {
      const apiUrl = getNextApiUrl(supabaseUrl, '/call-logs')
      const callLogRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: args.contactId,
          direction: args.direction,
          duration: args.duration,
          notes: args.notes,
        }),
      })
      const callLogData = await callLogRes.json()
      if (!callLogRes.ok) {
        return { error: callLogData.error || 'Failed to create call log' }
      }
      return { success: true, result: callLogData, callLog: callLogData.callLog }
    }

    // Navigation Tool - writes to voice_navigation_commands table for frontend to execute
    else if (toolName === 'navigate') {
      // Complete page URL mappings matching the actual application structure
      const pageRoutes: Record<string, string> = {
        // Main dashboards
        'dashboard': '/dashboard',
        'owner-dashboard': '/owner/dashboard',
        'admin-dashboard': '/admin/users',
        'sales-dashboard': '/sales/dashboard',
        'tech-dashboard': '/tech/dashboard',
        'office-dashboard': '/office/dashboard',
        'finance-dashboard': '/finance/dashboard',

        // Core business functions
        'jobs': '/jobs',
        'contacts': '/contacts',
        'estimates': '/estimates',
        'inbox': '/inbox',
        'calendar': '/calendar',
        'parts': '/parts',
        'analytics': '/analytics',
        'reports': '/reports',

        // Job management
        'tech': '/tech/dashboard', // tech shortcut
        'tech-jobs': '/tech/jobs',
        'tech-map': '/tech/map',
        'dispatch-map': '/dispatch/map',

        // Sales & Marketing
        'sales-leads': '/sales/leads',
        'sales-meetings': '/sales/meetings',
        'sales-meeting-new': '/sales/meetings/new',
        'sales-meeting-record': '/sales/meetings/record',
        'campaigns': '/marketing/campaigns', // campaigns shortcut
        'marketing-campaigns': '/marketing/campaigns',
        'email-templates': '/marketing/email-templates', // email-templates shortcut
        'marketing-email-templates': '/marketing/email-templates',
        'tags': '/marketing/tags', // tags shortcut
        'marketing-tags': '/marketing/tags',

        // Financial
        'finance': '/finance/dashboard', // finance shortcut
        'finance-payments': '/finance/payments',

        // Administrative
        'admin-users': '/admin/users',
        'admin-audit': '/admin/audit',
        'admin-automation': '/admin/automation',
        'admin-llm-providers': '/admin/llm-providers',
        'admin-settings': '/admin/settings',
        'admin-settings-company': '/admin/settings/company',
        'admin-settings-ai': '/admin/settings/ai',
        'admin-settings-automation': '/admin/settings/automation',

        // Settings & Configuration
        'settings': '/admin/settings', // settings shortcut
        'settings-profile': '/settings/profile',
        'settings-notifications': '/settings/notifications',
        'settings-integrations': '/settings/integrations',
        'integrations': '/settings/integrations', // integrations shortcut
      }

      const page = args.page || args.route // Support both new and old param names

      if (!pageRoutes[page]) {
        return { error: `Invalid page: ${page}. Valid pages are: ${Object.keys(pageRoutes).sort().join(', ')}` }
      }

      // Build the full path
      let fullPath = pageRoutes[page]

      // Handle specific item navigation with dynamic parameters
      if ((page === 'jobs' || page === 'job-detail') && args.jobId) {
        fullPath = `/jobs/${args.jobId}`
      } else if ((page === 'contacts' || page === 'contact-detail') && args.contactId) {
        fullPath = `/contacts/${args.contactId}`
      } else if ((page === 'estimates' || page === 'estimate-detail') && args.estimateId) {
        fullPath = `/estimates/${args.estimateId}`
      } else if ((page === 'sales-meetings' || page === 'sales-meeting-detail') && args.meetingId) {
        fullPath = `/sales/meetings/${args.meetingId}`
      } else if ((page === 'marketing-campaigns' || page === 'marketing-campaign-detail') && args.campaignId) {
        fullPath = `/marketing/campaigns/${args.campaignId}`
      } else if (page === 'tech-jobs' && args.jobId) {
        fullPath = `/tech/jobs/${args.jobId}`
      }

      // Collect all navigation parameters
      const navParams: any = {}
      if (args.jobId) navParams.jobId = args.jobId
      if (args.contactId) navParams.contactId = args.contactId
      if (args.estimateId) navParams.estimateId = args.estimateId
      if (args.meetingId) navParams.meetingId = args.meetingId
      if (args.campaignId) navParams.campaignId = args.campaignId

      // Insert navigation command into database for frontend to pick up via Realtime
      const { data: navCommand, error: navError } = await supabase
        .from('voice_navigation_commands')
        .insert({
          account_id: accountId,
          page: fullPath,
          params: navParams,
          executed: false,
        })
        .select()
        .single()

      if (navError) {
        console.error('Navigation command error:', navError)
        return { error: `Failed to send navigation command: ${navError.message}` }
      }

      return {
        success: true,
        message: `Navigating to ${page}`,
        path: fullPath,
        commandId: navCommand?.id,
      }
    }

    // MISSING TOOLS HANDLERS - Wave 1: High Priority
    else if (toolName === 'upload_job_photo') {
      const { data: job } = await supabase
        .from('jobs')
        .select('id, account_id')
        .eq('id', args.jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      if (!args.photoUrl && !args.base64Data) {
        return { error: 'Either photoUrl or base64Data must be provided' }
      }

      if (args.photoUrl) {
        const { data: photo, error } = await supabase
          .from('job_photos')
          .insert({
            account_id: accountId,
            job_id: args.jobId,
            photo_url: args.photoUrl,
            thumbnail_url: args.photoUrl,
            caption: args.caption || null,
          })
          .select()
          .single()

        if (error) {
          return { error: error.message }
        }

        return {
          success: true,
          photo,
          message: 'Photo uploaded successfully',
        }
      }

      return {
        error: 'Base64 upload not yet implemented. Please provide photoUrl instead.',
      }
    }

    else if (toolName === 'add_contact_note') {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', args.contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact) {
        return { error: 'Contact not found' }
      }

      const { data: note, error } = await supabase
        .from('contact_notes')
        .insert({
          account_id: accountId,
          contact_id: args.contactId,
          content: args.content,
          created_by: null,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        note,
        message: 'Note added successfully',
      }
    }

    else if (toolName === 'add_conversation_note') {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', args.conversationId)
        .eq('account_id', accountId)
        .single()

      if (!conversation) {
        return { error: 'Conversation not found' }
      }

      const { data: note, error } = await supabase
        .from('conversation_notes')
        .insert({
          account_id: accountId,
          conversation_id: args.conversationId,
          content: args.content,
          created_by: null,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        note,
        message: 'Note added successfully',
      }
    }

    else if (toolName === 'list_users') {
      let query = supabase
        .from('users')
        .select('id, first_name, last_name, email, role, phone')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .range(args.offset || 0, (args.offset || 0) + (args.limit || 50) - 1)

      if (args.role) {
        query = query.eq('role', args.role)
      }

      const { data: users, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        users: users || [],
        count: users?.length || 0,
      }
    }

    else if (toolName === 'get_user') {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', args.userId)
        .eq('account_id', accountId)
        .single()

      if (!user) {
        return { error: 'User not found' }
      }

      return { user }
    }

    else if (toolName === 'get_user_email') {
      const { data: account } = await supabase
        .from('accounts')
        .select('owner_email')
        .eq('id', accountId)
        .single()

      if (!account?.owner_email) {
        const { data: users } = await supabase
          .from('users')
          .select('email')
          .eq('account_id', accountId)
          .eq('role', 'owner')
          .limit(1)

        return {
          email: users?.[0]?.email || null,
        }
      }

      return {
        email: account.owner_email,
      }
    }

    else if (toolName === 'get_tech_jobs') {
      const targetTechId = args.techId

      if (!targetTechId) {
        return { error: 'Technician ID required' }
      }

      let query = supabase
        .from('jobs')
        .select('*, contacts(*), users(*)')
        .eq('account_id', accountId)
        .eq('tech_assigned_id', targetTechId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)

      if (args.status) {
        query = query.eq('status', args.status)
      }

      if (args.date) {
        const dateStart = new Date(args.date)
        dateStart.setHours(0, 0, 0, 0)
        const dateEnd = new Date(args.date)
        dateEnd.setHours(23, 59, 59, 999)

        query = query.gte('scheduled_start', dateStart.toISOString()).lte('scheduled_start', dateEnd.toISOString())
      }

      const { data: jobs, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        jobs: jobs || [],
        count: jobs?.length || 0,
      }
    }

    // MISSING TOOLS HANDLERS - Wave 2: Analytics
    else if (toolName === 'get_dashboard_stats') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

      const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)

      const { count: todayJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('account_id', accountId)
        .eq('status', 'completed')

      const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)

      return {
        jobs: { total: totalJobs || 0, today: todayJobs || 0 },
        revenue: { total: totalRevenue },
        contacts: { total: totalContacts || 0 },
      }
    }

    else if (toolName === 'get_job_analytics') {
      let query = supabase
        .from('jobs')
        .select('id, status, total_amount, created_at')
        .eq('account_id', accountId)

      if (args.dateFrom) {
        query = query.gte('created_at', args.dateFrom)
      }

      if (args.dateTo) {
        query = query.lte('created_at', args.dateTo)
      }

      if (args.status) {
        query = query.eq('status', args.status)
      }

      const { data: jobs, error } = await query

      if (error) {
        return { error: error.message }
      }

      const totalJobs = jobs?.length || 0
      const totalRevenue = jobs?.reduce((sum, j) => sum + (j.total_amount || 0), 0) || 0

      const statusBreakdown: Record<string, number> = {}
      jobs?.forEach((job) => {
        statusBreakdown[job.status] = (statusBreakdown[job.status] || 0) + 1
      })

      return {
        totalJobs,
        totalRevenue,
        statusBreakdown,
      }
    }

    else if (toolName === 'get_revenue_analytics') {
      let query = supabase
        .from('payments')
        .select('amount, created_at, jobs(tech_assigned_id, status)')
        .eq('account_id', accountId)
        .eq('status', 'completed')

      if (args.dateFrom) {
        query = query.gte('created_at', args.dateFrom)
      }

      if (args.dateTo) {
        query = query.lte('created_at', args.dateTo)
      }

      const { data: payments, error } = await query

      if (error) {
        return { error: error.message }
      }

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      let breakdown: Record<string, number> = {}

      if (args.groupBy === 'date') {
        payments?.forEach((payment) => {
          const date = new Date(payment.created_at).toISOString().split('T')[0]
          breakdown[date] = (breakdown[date] || 0) + (payment.amount || 0)
        })
      }

      return {
        totalRevenue,
        breakdown,
      }
    }

    else if (toolName === 'get_contact_analytics') {
      let query = supabase
        .from('contacts')
        .select('id, created_at, status')
        .eq('account_id', accountId)

      if (args.dateFrom) {
        query = query.gte('created_at', args.dateFrom)
      }

      if (args.dateTo) {
        query = query.lte('created_at', args.dateTo)
      }

      const { data: contacts, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        totalContacts: contacts?.length || 0,
      }
    }

    else if (toolName === 'generate_report') {
      if (args.type === 'jobs') {
        let query = supabase.from('jobs').select('*').eq('account_id', accountId)

        if (args.dateFrom) query = query.gte('created_at', args.dateFrom)
        if (args.dateTo) query = query.lte('created_at', args.dateTo)

        const { data: jobs, error } = await query
        if (error) return { error: error.message }

        return {
          type: 'jobs',
          data: jobs || [],
          count: jobs?.length || 0,
        }
      }

      if (args.type === 'contacts') {
        let query = supabase.from('contacts').select('*').eq('account_id', accountId)

        if (args.dateFrom) query = query.gte('created_at', args.dateFrom)
        if (args.dateTo) query = query.lte('created_at', args.dateTo)

        const { data: contacts, error } = await query
        if (error) return { error: error.message }

        return {
          type: 'contacts',
          data: contacts || [],
          count: contacts?.length || 0,
        }
      }

      if (args.type === 'invoices') {
        let query = supabase.from('invoices').select('*').eq('account_id', accountId)

        if (args.dateFrom) query = query.gte('created_at', args.dateFrom)
        if (args.dateTo) query = query.lte('created_at', args.dateTo)

        const { data: invoices, error } = await query
        if (error) return { error: error.message }

        return {
          type: 'invoices',
          data: invoices || [],
          count: invoices?.length || 0,
        }
      }

      return { error: `Unknown report type: ${args.type}` }
    }

    // MISSING TOOLS HANDLERS - Wave 3: Financial Operations
    else if (toolName === 'update_invoice') {
      const updateData: any = {}
      if (args.totalAmount !== undefined) updateData.total_amount = args.totalAmount
      if (args.dueDate !== undefined) updateData.due_date = args.dueDate
      if (args.notes !== undefined) updateData.notes = args.notes

      const { data: invoice, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', args.invoiceId)
        .eq('account_id', accountId)
        .select('*, jobs(*), contacts(*)')
        .single()

      if (error) {
        return { error: error.message }
      }

      if (!invoice) {
        return { error: 'Invoice not found' }
      }

      return {
        success: true,
        invoice,
        message: 'Invoice updated successfully',
      }
    }

    // MISSING TOOLS HANDLERS - Wave 4: Marketing Operations
    else if (toolName === 'list_campaigns') {
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)

      if (args.status) {
        query = query.eq('status', args.status)
      }

      const { data: campaigns, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        campaigns: campaigns || [],
        count: campaigns?.length || 0,
      }
    }

    else if (toolName === 'get_campaign') {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', args.campaignId)
        .eq('account_id', accountId)
        .single()

      if (!campaign) {
        return { error: 'Campaign not found' }
      }

      return { campaign }
    }

    else if (toolName === 'send_campaign') {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', args.campaignId)
        .eq('account_id', accountId)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      if (!campaign) {
        return { error: 'Campaign not found' }
      }

      return {
        success: true,
        campaign,
        message: 'Campaign sending started',
      }
    }

    else if (toolName === 'list_email_templates') {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)

      if (args.type) {
        query = query.eq('type', args.type)
      }

      const { data: templates, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        templates: templates || [],
        count: templates?.length || 0,
      }
    }

    else if (toolName === 'create_email_template') {
      const { data: template, error } = await supabase
        .from('email_templates')
        .insert({
          account_id: accountId,
          name: args.name,
          type: args.type,
          subject: args.subject,
          body_html: args.body,
          body_text: args.body,
          active: true,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        template,
        message: 'Email template created successfully',
      }
    }

    else if (toolName === 'send_email') {
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (!resendKey) {
        return { error: 'Email service not configured' }
      }

      // Get sender email from environment config
      const senderEmail = Deno.env.get('RESEND_VERIFIED_DOMAIN')
        ? (Deno.env.get('RESEND_VERIFIED_DOMAIN')!.includes('@')
            ? `CRM <${Deno.env.get('RESEND_VERIFIED_DOMAIN')}>`
            : `CRM <noreply@${Deno.env.get('RESEND_VERIFIED_DOMAIN')}>`)
        : 'CRM <noreply@resend.dev>'

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [args.to],
          subject: args.subject,
          html: args.body,
        }),
      })

      const emailData = await emailRes.json()

      if (!emailRes.ok) {
        return { error: emailData.message || 'Failed to send email' }
      }

      return {
        success: true,
        messageId: emailData.id,
        message: `Email sent to ${args.to}`,
      }
    }

    else if (toolName === 'send_review_request') {
      const { data: job } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('id', args.jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      if (job.status !== 'completed' && job.status !== 'paid') {
        return { error: 'Job must be completed or paid before sending review request' }
      }

      const { data: contact } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('id', args.contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact || !contact.email) {
        return { error: 'Contact not found or has no email' }
      }

      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (!resendKey) {
        return { error: 'Email service not configured' }
      }

      // Get sender email from environment config
      const senderEmail = Deno.env.get('RESEND_VERIFIED_DOMAIN')
        ? (Deno.env.get('RESEND_VERIFIED_DOMAIN')!.includes('@')
            ? `CRM <${Deno.env.get('RESEND_VERIFIED_DOMAIN')}>`
            : `CRM <noreply@${Deno.env.get('RESEND_VERIFIED_DOMAIN')}>`)
        : 'CRM <noreply@resend.dev>'

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [contact.email],
          subject: "We'd love your feedback!",
          html: `<p>Hi ${contact.first_name},</p><p>Thank you for your business! We'd appreciate your review.</p>`,
        }),
      })

      const emailData = await emailRes.json()

      if (!emailRes.ok) {
        return { error: emailData.message || 'Failed to send review request' }
      }

      return {
        success: true,
        messageId: emailData.id,
        message: `Review request sent to ${contact.email}`,
      }
    }

    // MISSING TOOLS HANDLERS - Wave 5: Contact Management
    else if (toolName === 'list_contact_tags') {
      const { data: tags, error } = await supabase
        .from('contact_tags')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)

      if (error) {
        return { error: error.message }
      }

      return {
        tags: tags || [],
        count: tags?.length || 0,
      }
    }

    else if (toolName === 'create_contact_tag') {
      const { data: tag, error } = await supabase
        .from('contact_tags')
        .insert({
          account_id: accountId,
          name: args.name,
          color: args.color || '#3B82F6',
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        tag,
        message: 'Contact tag created successfully',
      }
    }

    else if (toolName === 'assign_tag_to_contact') {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', args.contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact) {
        return { error: 'Contact not found' }
      }

      const { data: tag } = await supabase
        .from('contact_tags')
        .select('id')
        .eq('id', args.tagId)
        .eq('account_id', accountId)
        .single()

      if (!tag) {
        return { error: 'Tag not found' }
      }

      const { data: existing } = await supabase
        .from('contact_tag_assignments')
        .select('id')
        .eq('contact_id', args.contactId)
        .eq('tag_id', args.tagId)
        .single()

      if (existing) {
        return {
          success: true,
          message: 'Tag already assigned to contact',
        }
      }

      const { data: assignment, error } = await supabase
        .from('contact_tag_assignments')
        .insert({
          account_id: accountId,
          contact_id: args.contactId,
          tag_id: args.tagId,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        assignment,
        message: 'Tag assigned to contact successfully',
      }
    }

    // MISSING TOOLS HANDLERS - Wave 6: Automation
    else if (toolName === 'list_automation_rules') {
      let query = supabase
        .from('automation_rules')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)

      if (args.active !== undefined) {
        query = query.eq('active', args.active)
      }

      const { data: rules, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        rules: rules || [],
        count: rules?.length || 0,
      }
    }

    else if (toolName === 'create_automation_rule') {
      const { data: rule, error } = await supabase
        .from('automation_rules')
        .insert({
          account_id: accountId,
          name: args.name,
          trigger: args.trigger,
          action: args.action,
          active: args.active !== undefined ? args.active : true,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        rule,
        message: 'Automation rule created successfully',
      }
    }

    // MISSING TOOLS HANDLERS - Wave 7: Data Export
    else if (toolName === 'export_contacts') {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', accountId)

      if (error) {
        return { error: error.message }
      }

      return {
        format: args.format || 'csv',
        data: contacts || [],
        count: contacts?.length || 0,
        note: 'CSV conversion should be done client-side',
      }
    }

    else if (toolName === 'export_jobs') {
      let query = supabase.from('jobs').select('*, contacts(*), users(*)').eq('account_id', accountId)

      if (args.dateFrom) query = query.gte('created_at', args.dateFrom)
      if (args.dateTo) query = query.lte('created_at', args.dateTo)

      const { data: jobs, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        format: args.format || 'csv',
        data: jobs || [],
        count: jobs?.length || 0,
        note: 'CSV conversion should be done client-side',
      }
    }

    // MISSING TOOLS HANDLERS - Wave 8: System & Admin
    else if (toolName === 'create_notification') {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          account_id: accountId,
          user_id: args.userId,
          type: args.type,
          title: args.title,
          message: args.message,
          link: args.link || null,
          is_read: false,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        notification,
        message: 'Notification created successfully',
      }
    }

    else if (toolName === 'list_job_photos') {
      const { data: photos, error } = await supabase
        .from('job_photos')
        .select('*')
        .eq('account_id', accountId)
        .eq('job_id', args.jobId)
        .order('created_at', { ascending: false })

      if (error) {
        return { error: error.message }
      }

      return {
        photos: photos || [],
        count: photos?.length || 0,
      }
    }

    else if (toolName === 'get_account_settings') {
      const { data: account } = await supabase
        .from('accounts')
        .select('settings, name, owner_email')
        .eq('id', accountId)
        .single()

      if (!account) {
        return { error: 'Account not found' }
      }

      return {
        settings: account.settings || {},
        accountName: account.name,
        ownerEmail: account.owner_email,
      }
    }

    else if (toolName === 'update_account_settings') {
      const { data: account, error } = await supabase
        .from('accounts')
        .update({ settings: args.settings })
        .eq('id', accountId)
        .select('settings')
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        settings: account.settings,
        message: 'Account settings updated successfully',
      }
    }

    else if (toolName === 'get_audit_logs') {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)

      if (args.action) {
        query = query.eq('action', args.action)
      }

      if (args.userId) {
        query = query.eq('user_id', args.userId)
      }

      if (args.dateFrom) {
        query = query.gte('created_at', args.dateFrom)
      }

      if (args.dateTo) {
        query = query.lte('created_at', args.dateTo)
      }

      const { data: logs, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        logs: logs || [],
        count: logs?.length || 0,
      }
    }
    else if (toolName === 'get_current_user') {
      // Get the authenticated user from context (passed from JWT)
      if (!context || !context.authenticated || !context.userId) {
        return {
          error: 'No authenticated user. Ensure Authorization header with valid JWT token is passed.',
          authenticated: false
        }
      }

      try {
        // Get full user details using authenticated user ID
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, role, account_id')
          .eq('id', context.userId)
          .single()

        if (error || !user) {
          return {
            error: `User not found: ${error?.message}`,
            userId: context.userId
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          accountId: user.account_id,
          authenticated: true
        }
      } catch (err: any) {
        return {
          error: `Failed to fetch user: ${err.message}`,
          userId: context.userId
        }
      }
    }
    else if (toolName === 'read_agent_memory') {
      return await readAgentMemory(args, supabase)
    }
    else if (toolName === 'update_agent_memory') {
      return await updateAgentMemory(args, supabase)
    }

    // ===== CUTTING-EDGE AI TOOL IMPLEMENTATIONS =====

    // 1. AI Job Estimation
    else if (toolName === 'ai_estimate_job') {
      // Get historical similar jobs for AI analysis
      const { data: similarJobs } = await supabase
        .from('jobs')
        .select('description, duration, cost, created_at, status')
        .ilike('description', `%${args.jobType}%`)
        .eq('status', 'completed')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(50)

      // Call OpenAI for estimation
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `You are a job estimation expert. Based on historical data:
            Similar Jobs: ${JSON.stringify(similarJobs?.slice(0, 10) || [])}

            Estimate duration (minutes), cost, and confidence (0-100).
            Return JSON: {duration: number, cost: number, confidence: number, reasoning: string}`
          }, {
            role: 'user',
            content: `Estimate this job:
            Type: ${args.jobType}
            Description: ${args.description}
            Location: ${args.location}
            Urgency: ${args.urgency || 'medium'}
            Issues: ${args.reportedIssues?.join(', ') || 'none'}`
          }]
        })
      })

      const aiResult = await openAIResponse.json()
      const estimate = JSON.parse(aiResult.choices[0].message.content)

      // Save estimate to database
      const { data: savedEstimate, error } = await supabase
        .from('ai_job_estimates')
        .insert({
          job_type: args.jobType,
          complexity_factors: {
            urgency: args.urgency || 'medium',
            issues: args.reportedIssues || [],
            location: args.location
          },
          estimated_duration: estimate.duration,
          estimated_cost: estimate.cost,
          confidence_score: estimate.confidence,
          ai_model_version: 'gpt-4',
          account_id: accountId
        })
        .select()
        .single()

      return {
        success: true,
        estimate: {
          duration: estimate.duration,
          cost: estimate.cost,
          confidence: estimate.confidence,
          reasoning: estimate.reasoning
        },
        usedHistoricalJobs: similarJobs?.length || 0,
        estimateId: savedEstimate?.id
      }
    }

    // CRITICAL FIX: Create formal estimate record from AI estimate
    else if (toolName === 'create_formal_estimate_from_ai') {
      const { aiEstimateId, jobId, contactId, title } = args

      if (!aiEstimateId || !contactId) {
        return { error: 'Missing required fields: aiEstimateId, contactId' }
      }

      // Get AI estimate data
      const { data: aiEstimate, error: aiError } = await supabase
        .from('ai_job_estimates')
        .select('*')
        .eq('id', aiEstimateId)
        .eq('account_id', accountId)
        .single()

      if (aiError || !aiEstimate) {
        return { error: `AI estimate not found: ${aiError?.message || 'Unknown error'}` }
      }

      // Generate estimate number
      const estimateNumber = `EST-${Date.now().toString().slice(-6)}`

      // Create formal estimate record
      const { data: formalEstimate, error: createError } = await supabase
        .from('estimates')
        .insert({
          account_id: accountId,
          contact_id: contactId,
          estimate_number: estimateNumber,
          title: title || `${aiEstimate.job_type} Estimate`,
          description: `AI-generated estimate for ${aiEstimate.job_type}`,
          subtotal: Math.round(aiEstimate.estimated_cost * 100), // Convert to cents
          tax_rate: 0.0,
          tax_amount: 0,
          total_amount: Math.round(aiEstimate.estimated_cost * 100), // Convert to cents
          status: 'draft',
          notes: `AI Confidence: ${aiEstimate.confidence_score}%\nDuration: ${aiEstimate.estimated_duration} minutes\nAI Model: ${aiEstimate.ai_model_version}\nComplexity Factors: ${JSON.stringify(aiEstimate.complexity_factors)}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        return { error: `Failed to create formal estimate: ${createError.message}` }
      }

      // Add estimate line item
      const { error: itemError } = await supabase
        .from('estimate_items')
        .insert({
          estimate_id: formalEstimate.id,
          description: `${aiEstimate.job_type} - AI Estimated Duration: ${aiEstimate.estimated_duration} minutes`,
          quantity: 1,
          unit_price: Math.round(aiEstimate.estimated_cost * 100), // Convert to cents
          total: Math.round(aiEstimate.estimated_cost * 100), // Convert to cents
          item_type: 'labor'
        })

      if (itemError) {
        console.error('Failed to create estimate line item:', itemError)
      }

      // Link AI estimate to job if jobId provided
      if (jobId) {
        const { error: linkError } = await supabase
          .from('ai_job_estimates')
          .update({ job_id: jobId })
          .eq('id', aiEstimateId)

        if (linkError) {
          console.error('Failed to link AI estimate to job:', linkError)
        }
      }

      return {
        success: true,
        formalEstimate: {
          id: formalEstimate.id,
          estimateNumber: formalEstimate.estimate_number,
          totalAmount: formalEstimate.total_amount / 100, // Convert back to dollars
          status: formalEstimate.status,
          title: formalEstimate.title
        },
        message: `Formal estimate ${estimateNumber} created and ready to view on Estimates page`
      }
    }

    // 2. AI Customer Sentiment Analysis
    else if (toolName === 'analyze_customer_sentiment') {
      // Get conversation history
      const daysAgo = args.timeframe ? parseInt(args.timeframe) || 30 : 30
      const { data: conversations } = await supabase
        .from('conversations')
        .select('messages, created_at')
        .eq('contact_id', args.contactId)
        .eq('account_id', accountId)
        .gte('created_at', new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      // Also get recent jobs for context
      const { data: recentJobs } = await supabase
        .from('jobs')
        .select('description, status, created_at')
        .eq('contact_id', args.contactId)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Analyze with AI
      const sentimentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [{
            role: 'system',
            content: 'Analyze customer sentiment from conversations and job history. Return JSON: {score: -1 to 1, label: "positive/negative/neutral", emotions: string[], keyPhrases: string[], trends: string}'
          }, {
            role: 'user',
            content: `Analyze sentiment for contact ${args.contactId}:
            Conversations: ${JSON.stringify(conversations?.slice(0, 5) || [])}
            Recent Jobs: ${JSON.stringify(recentJobs || [])}`
          }]
        })
      })

      const result = await sentimentResponse.json()
      const analysis = JSON.parse(result.choices[0].message.content)

      // Store analysis
      const { data: savedAnalysis, error } = await supabase
        .from('sentiment_analyses')
        .insert({
          contact_id: args.contactId,
          conversation_id: conversations?.[0]?.id,
          sentiment_score: analysis.score,
          sentiment_label: analysis.label,
          emotions: analysis.emotions,
          key_phrases: analysis.keyPhrases,
          ai_confidence: Math.abs(analysis.score) * 100,
          account_id: accountId
        })
        .select()
        .single()

      return {
        sentiment: analysis,
        conversationsAnalyzed: conversations?.length || 0,
        jobsConsidered: recentJobs?.length || 0,
        analysisId: savedAnalysis?.id,
        trend: analysis.trends || 'stable'
      }
    }

    // 3. AI Predictive Maintenance
    else if (toolName === 'predict_equipment_maintenance') {
      // Get equipment maintenance history
      const { data: maintenanceHistory } = await supabase
        .from('equipment_maintenance')
        .select('*')
        .eq('equipment_id', args.equipmentId)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(20)

      // Predict with AI
      const predictionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `Predict equipment failure based on:
            - Equipment Type: ${args.equipmentType}
            - Last Maintenance: ${args.lastMaintenance || 'unknown'}
            - Usage Hours: ${args.usageHours || 0}
            - Recent Issues: ${args.reportedIssues?.join(', ') || 'none'}
            - Maintenance History: ${JSON.stringify(maintenanceHistory || [])}

            Return JSON: {
              failureProbability: 0-100,
              predictedFailureDate: "ISO date",
              riskFactors: string[],
              recommendation: string,
              urgency: "low/medium/high/critical"
            }`
          }, {
            role: 'user',
            content: `Predict maintenance needs for equipment ${args.equipmentId}`
          }]
        })
      })

      const predictionResult = await predictionResponse.json()
      const prediction = JSON.parse(predictionResult.choices[0].message.content)

      // Save prediction
      const { data: savedPrediction, error } = await supabase
        .from('equipment_predictions')
        .insert({
          equipment_id: args.equipmentId,
          equipment_type: args.equipmentType,
          predicted_failure_date: prediction.predictedFailureDate,
          confidence: prediction.failureProbability,
          risk_factors: prediction.riskFactors,
          maintenance_recommendation: prediction.recommendation,
          account_id: accountId
        })
        .select()
        .single()

      return {
        prediction: {
          failureProbability: prediction.failureProbability,
          predictedFailureDate: prediction.predictedFailureDate,
          riskFactors: prediction.riskFactors,
          recommendation: prediction.recommendation,
          urgency: prediction.urgency
        },
        predictionId: savedPrediction?.id,
        historicalDataPoints: maintenanceHistory?.length || 0
      }
    }

    // 4. AI Dynamic Pricing
    else if (toolName === 'calculate_dynamic_pricing') {
      // Get job details
      const { data: job } = await supabase
        .from('jobs')
        .select('*, contacts(*)')
        .eq('id', args.jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      // Get market data (similar jobs in area)
      const { data: marketData } = await supabase
        .from('jobs')
        .select('description, cost, status')
        .eq('status', 'completed')
        .eq('account_id', accountId)
        .ilike('description', `%${job.description?.split(' ').slice(0, 3).join(' ')}%`)
        .limit(50)

      // Calculate dynamic pricing with AI
      const pricingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `Calculate optimal pricing considering:
            - Base Price: $${args.basePrice}
            - Customer Value: ${job.contacts?.customer_value_score || 'unknown'}
            - Market Rates: ${JSON.stringify(marketData?.map(j => j.cost).slice(0, 10) || [])}
            - Additional Factors: ${JSON.stringify(args.factors || {})}

            Return JSON: {
              adjustedPrice: number,
              adjustmentReason: string,
              confidence: 0-100,
              marketPosition: "below/above/at_market",
              customerSegment: "new/regular/premium"
            }`
          }, {
            role: 'user',
            content: `Calculate dynamic price for job ${args.jobId}`
          }]
        })
      })

      const pricingResult = await pricingResponse.json()
      const pricing = JSON.parse(pricingResult.choices[0].message.content)

      // Save pricing rule
      const { data: savedPricing, error } = await supabase
        .from('dynamic_pricing_rules')
        .insert({
          job_id: args.jobId,
          base_price: args.basePrice,
          adjusted_price: pricing.adjustedPrice,
          adjustment_factors: args.factors || {},
          adjustment_reason: pricing.adjustmentReason,
          confidence_score: pricing.confidence,
          account_id: accountId
        })
        .select()
        .single()

      return {
        pricing: {
          originalPrice: args.basePrice,
          adjustedPrice: pricing.adjustedPrice,
          adjustment: pricing.adjustedPrice - args.basePrice,
          adjustmentReason: pricing.adjustmentReason,
          confidence: pricing.confidence,
          marketPosition: pricing.marketPosition,
          customerSegment: pricing.customerSegment
        },
        pricingId: savedPricing?.id,
        marketDataPoints: marketData?.length || 0
      }
    }

    // 5. AI Risk Assessment
    else if (toolName === 'assess_job_risk') {
      // Get job details and location
      const { data: job } = await supabase
        .from('jobs')
        .select('*, contacts(*)')
        .eq('id', args.jobId)
        .eq('account_id', accountId)
        .single()

      // Get historical risks for similar jobs
      const { data: riskHistory } = await supabase
        .from('risk_assessments')
        .select('*')
        .eq('job_type', args.jobType)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(20)

      // Assess risks with AI
      const riskResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `Assess comprehensive job risks considering:
            - Job Type: ${args.jobType}
            - Location: ${args.location}
            - Complexity: ${args.complexity}
            - Risk History: ${JSON.stringify(riskHistory || [])}

            Return JSON: {
              overallRisk: 0-100,
              safetyRisk: 0-100,
              financialRisk: 0-100,
              reputationRisk: 0-100,
              riskFactors: string[],
              mitigation: string[],
              requiresPermit: boolean,
              recommendedInsurance: string
            }`
          }, {
            role: 'user',
            content: `Assess risks for job ${args.jobId}`
          }]
        })
      })

      const riskResult = await riskResponse.json()
      const risk = JSON.parse(riskResult.choices[0].message.content)

      // Save risk assessment
      const { data: savedAssessment, error } = await supabase
        .from('risk_assessments')
        .insert({
          job_id: args.jobId,
          job_type: args.jobType,
          location: args.location,
          overall_risk_score: risk.overallRisk,
          safety_risk: risk.safetyRisk,
          financial_risk: risk.financialRisk,
          reputation_risk: risk.reputationRisk,
          risk_factors: risk.riskFactors,
          mitigation_strategies: risk.mitigation,
          requires_permit: risk.requiresPermit,
          recommended_insurance: risk.recommendedInsurance,
          account_id: accountId
        })
        .select()
        .single()

      return {
        riskAssessment: {
          overallRisk: risk.overallRisk,
          safetyRisk: risk.safetyRisk,
          financialRisk: risk.financialRisk,
          reputationRisk: risk.reputationRisk,
          riskFactors: risk.riskFactors,
          mitigation: risk.mitigation,
          requiresPermit: risk.requiresPermit,
          recommendedInsurance: risk.recommendedInsurance
        },
        assessmentId: savedAssessment?.id,
        riskLevel: risk.overallRisk > 75 ? 'high' : risk.overallRisk > 50 ? 'medium' : 'low'
      }
    }

    // 6. AI Customer Churn Prediction
    else if (toolName === 'predict_customer_churn') {
      // Get customer data
      const { data: customer } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', args.contactId)
        .eq('account_id', accountId)
        .single()

      // Get service history if requested
      let serviceHistory = []
      if (args.includeHistory) {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('status, cost, created_at, customer_rating')
          .eq('contact_id', args.contactId)
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
          .limit(50)
        serviceHistory = jobs || []
      }

      // Predict churn with AI
      const churnResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `Predict customer churn risk analyzing:
            - Customer Profile: ${JSON.stringify(customer || {})}
            - Service History: ${JSON.stringify(serviceHistory || [])}

            Return JSON: {
              churnRisk: 0-100,
              riskLevel: "low/medium/high/critical",
              warningSigns: string[],
              interventionStrategies: string[],
              retentionProbability: 0-100,
              recommendedActions: string[]
            }`
          }, {
            role: 'user',
            content: `Predict churn risk for customer ${args.contactId}`
          }]
        })
      })

      const churnResult = await churnResponse.json()
      const churn = JSON.parse(churnResult.choices[0].message.content)

      // Save churn prediction
      const { data: savedPrediction, error } = await supabase
        .from('churn_predictions')
        .insert({
          contact_id: args.contactId,
          churn_risk_score: churn.churnRisk,
          risk_level: churn.riskLevel,
          warning_signs: churn.warningSigns,
          intervention_strategies: churn.interventionStrategies,
          retention_probability: churn.retentionProbability,
          recommended_actions: churn.recommendedActions,
          account_id: accountId
        })
        .select()
        .single()

      return {
        churnPrediction: {
          churnRisk: churn.churnRisk,
          riskLevel: churn.riskLevel,
          warningSigns: churn.warningSigns,
          interventionStrategies: churn.interventionStrategies,
          retentionProbability: churn.retentionProbability,
          recommendedActions: churn.recommendedActions
        },
        predictionId: savedPrediction?.id,
        dataPointsAnalyzed: serviceHistory.length
      }
    }

    // 7. AI Sales Coaching
    else if (toolName === 'provide_sales_coaching') {
      // Get conversation data if provided
      let conversationData = {}
      if (args.conversationId) {
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', args.conversationId)
          .eq('account_id', accountId)
          .single()
        conversationData = conversation || {}
      }

      // Get sales person data if provided
      let salesPersonData = {}
      if (args.salesPersonId) {
        const { data: salesPerson } = await supabase
          .from('users')
          .select('*')
          .eq('id', args.salesPersonId)
          .single()
        salesPersonData = salesPerson || {}
      }

      // Get coaching with AI
      const coachingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `Provide real-time sales coaching for:
            - Context: ${args.context}
            - Conversation: ${JSON.stringify(conversationData)}
            - Sales Person: ${JSON.stringify(salesPersonData)}

            Return JSON: {
              currentScore: 0-100,
              strengths: string[],
              improvements: string[],
              nextSteps: string[],
              talkingPoints: string[],
            questionsToAsk: string[],
            closingProbability: 0-100,
            recommendedApproach: string
            }`
          }, {
            role: 'user',
            content: `Provide sales coaching for this situation`
          }]
        })
      })

      const coachingResult = await coachingResponse.json()
      const coaching = JSON.parse(coachingResult.choices[0].message.content)

      // Save coaching session
      const { data: savedCoaching, error } = await supabase
        .from('sales_coaching_sessions')
        .insert({
          conversation_id: args.conversationId,
          sales_person_id: args.salesPersonId,
          coaching_context: args.context,
          current_score: coaching.currentScore,
          strengths_identified: coaching.strengths,
          improvement_areas: coaching.improvements,
          recommended_next_steps: coaching.nextSteps,
          talking_points: coaching.talkingPoints,
          questions_to_ask: coaching.questionsToAsk,
          closing_probability: coaching.closingProbability,
          recommended_approach: coaching.recommendedApproach,
          account_id: accountId
        })
        .select()
        .single()

      return {
        coaching: {
          currentScore: coaching.currentScore,
          strengths: coaching.strengths,
          improvements: coaching.improvements,
          nextSteps: coaching.nextSteps,
          talkingPoints: coaching.talkingPoints,
          questionsToAsk: coaching.questionsToAsk,
          closingProbability: coaching.closingProbability,
          recommendedApproach: coaching.recommendedApproach
        },
        sessionId: savedCoaching?.id
      }
    }

    // 8. AI Compliance Monitoring
    else if (toolName === 'monitor_compliance') {
      // Get entity data based on type
      let entityData = {}
      let entityTable = ''

      if (args.entityType === 'job') {
        const { data } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', args.entityId)
          .eq('account_id', accountId)
          .single()
        entityData = data || {}
        entityTable = 'jobs'
      } else if (args.entityType === 'invoice') {
        const { data } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', args.entityId)
          .eq('account_id', accountId)
          .single()
        entityData = data || {}
        entityTable = 'invoices'
      }

      // Check compliance with AI
      const complianceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `Check compliance for ${args.entityType} regarding ${args.complianceType}:
            Entity Data: ${JSON.stringify(entityData)}

            Return JSON: {
              isCompliant: boolean,
              complianceScore: 0-100,
              violations: string[],
              requiredActions: string[],
              documentationNeeded: string[],
              riskLevel: "low/medium/high/critical",
              recommendations: string[]
            }`
          }, {
            role: 'user',
            content: `Check ${args.complianceType} compliance`
          }]
        })
      })

      const complianceResult = await complianceResponse.json()
      const compliance = JSON.parse(complianceResult.choices[0].message.content)

      // Save compliance check
      const { data: savedCheck, error } = await supabase
        .from('compliance_checks')
        .insert({
          entity_type: args.entityType,
          entity_id: args.entityId,
          compliance_type: args.complianceType,
          is_compliant: compliance.isCompliant,
          compliance_score: compliance.complianceScore,
          violations_found: compliance.violations,
          required_actions: compliance.requiredActions,
          documentation_needed: compliance.documentationNeeded,
          risk_level: compliance.riskLevel,
          recommendations: compliance.recommendations,
          account_id: accountId
        })
        .select()
        .single()

      return {
        compliance: {
          isCompliant: compliance.isCompliant,
          complianceScore: compliance.complianceScore,
          violations: compliance.violations,
          requiredActions: compliance.requiredActions,
          documentationNeeded: compliance.documentationNeeded,
          riskLevel: compliance.riskLevel,
          recommendations: compliance.recommendations
        },
        checkId: savedCheck?.id
      }
    }

    // 9. Visual Route Planning
    else if (toolName === 'plan_visual_route') {
      // Get technician location
      const { data: tech } = await supabase
        .from('users')
        .select('current_location_lat, current_location_lng')
        .eq('id', args.techId)
        .eq('account_id', accountId)
        .single()

      // Get job locations
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, address, lat, lng, priority, scheduled_start')
        .in('id', args.jobIds)
        .eq('account_id', accountId)

      // Plan route with Google Maps API or similar
      // For now, provide basic optimization
      const routePlan = {
        technicianId: args.techId,
        jobs: jobs || [],
        optimizedOrder: args.jobIds, // Would be optimized with real routing API
        totalDistance: 0, // Would calculate with routing API
        estimatedDuration: 0, // Would calculate with routing API
        startTime: args.startTime || new Date().toISOString(),
        optimizationMetric: args.optimizeFor || 'time'
      }

      // Save route plan
      const { data: savedRoute, error } = await supabase
        .from('route_plans')
        .insert({
          technician_id: args.techId,
          job_ids: args.jobIds,
          optimized_order: routePlan.optimizedOrder,
          total_distance_km: routePlan.totalDistance,
          estimated_duration_minutes: routePlan.estimatedDuration,
          start_time: routePlan.startTime,
          optimization_metric: args.optimizeFor || 'time',
          account_id: accountId
        })
        .select()
        .single()

      return {
        routePlan: {
          routeId: savedRoute?.id,
          technician: routePlan.technicianId,
          jobs: routePlan.jobs,
          optimizedOrder: routePlan.optimizedOrder,
          totalDistance: routePlan.totalDistance,
          estimatedDuration: routePlan.estimatedDuration,
          startTime: routePlan.startTime,
          optimizationMetric: routePlan.optimizationMetric
        }
      }
    }

    // 10. Photo Analysis AI
    else if (toolName === 'analyze_job_photos') {
      // Analyze photos with Google Vision API or similar
      const analysisResults = []

      for (const photoUrl of args.photoUrls) {
        // Mock analysis - would use computer vision API
        const analysis = {
          photoUrl,
          issues: ['Potential leak detected', 'Wear and tear visible'],
          quality: 85,
          documentation: {
            beforeCondition: 'Poor',
            recommendedActions: ['Replace seal', 'Clean area'],
            estimatedCost: 250
          }
        }
        analysisResults.push(analysis)
      }

      // Save analysis
      const { data: savedAnalysis, error } = await supabase
        .from('photo_analyses')
        .insert({
          job_id: args.jobId,
          photo_urls: args.photoUrls,
          analysis_type: args.analysisType || 'all',
          analysis_results: analysisResults,
          overall_quality_score: analysisResults.reduce((sum, a) => sum + a.quality, 0) / analysisResults.length,
          account_id: accountId
        })
        .select()
        .single()

      return {
        analysis: {
          analysisId: savedAnalysis?.id,
          jobId: args.jobId,
          photosAnalyzed: args.photoUrls.length,
          results: analysisResults,
          overallQuality: analysisResults.reduce((sum, a) => sum + a.quality, 0) / analysisResults.length,
          totalIssues: analysisResults.reduce((sum, a) => sum + a.issues.length, 0)
        }
      }
    }

    // 11. Signature Verification
    else if (toolName === 'verify_signature') {
      // Verify signature with computer vision
      // Mock implementation - would use signature verification API
      const verificationResult = {
        isValid: true,
        confidence: 92,
        matches: [
          { feature: 'pressure patterns', match: 94 },
          { feature: 'stroke order', match: 89 },
          { feature: 'letter formation', match: 93 }
        ],
        anomalies: ['Slightly faster than usual'],
        riskScore: 8
      }

      // Save verification
      const { data: savedVerification, error } = await supabase
        .from('signature_verifications')
        .insert({
          job_id: args.jobId,
          signature_image_url: args.signatureImageUrl,
          reference_signature_id: args.referenceSignatureId,
          is_verified: verificationResult.isValid,
          confidence_score: verificationResult.confidence,
          match_features: verificationResult.matches,
          anomalies_detected: verificationResult.anomalies,
          fraud_risk_score: verificationResult.riskScore,
          account_id: accountId
        })
        .select()
        .single()

      return {
        verification: {
          verificationId: savedVerification?.id,
          isValid: verificationResult.isValid,
          confidence: verificationResult.confidence,
          matches: verificationResult.matches,
          anomalies: verificationResult.anomalies,
          riskScore: verificationResult.riskScore,
          riskLevel: verificationResult.riskScore > 50 ? 'high' : verificationResult.riskScore > 20 ? 'medium' : 'low'
        }
      }
    }

    // 12. Document Scanning OCR
    else if (toolName === 'scan_and_process_document') {
      // Process document with OCR
      // Mock implementation - would use OCR service like Google Vision OCR
      const extractedData = {
        documentType: args.documentType,
        extractedFields: args.extractionFields || ['all'],
        text: 'Extracted text content would appear here',
        confidence: 95,
        fields: {
          invoiceNumber: 'INV-2024-001',
          amount: 1250.00,
          date: '2024-11-28',
          vendor: 'ABC Supplies Inc'
        }
      }

      // Save document scan
      const { data: savedScan, error } = await supabase
        .from('document_scans')
        .insert({
          document_url: args.documentUrl,
          document_type: args.documentType,
          extracted_text: extractedData.text,
          extracted_fields: extractedData.fields,
          confidence_score: extractedData.confidence,
          extraction_fields_requested: args.extractionFields,
          account_id: accountId
        })
        .select()
        .single()

      return {
        scan: {
          scanId: savedScan?.id,
          documentType: args.documentType,
          extractedText: extractedData.text,
          fields: extractedData.fields,
          confidence: extractedData.confidence
        }
      }
    }

    // 13. Real-time Video Support
    else if (toolName === 'start_video_support') {
      // Create video session
      const sessionId = crypto.randomUUID()
      const sessionData = {
        sessionId,
        contactId: args.contactId,
        jobId: args.jobId,
        technicianId: args.technicianId,
        reason: args.reason,
        status: 'initiated',
        createdAt: new Date().toISOString(),
        webrtcUrl: `wss://video.crm-ai-pro.com/session/${sessionId}` // Mock WebRTC URL
      }

      // Save video session
      const { data: savedSession, error } = await supabase
        .from('video_support_sessions')
        .insert({
          session_id: sessionId,
          contact_id: args.contactId,
          job_id: args.jobId,
          technician_id: args.technicianId,
          session_reason: args.reason,
          status: 'initiated',
          webrtc_url: sessionData.webrtcUrl,
          account_id: accountId
        })
        .select()
        .single()

      return {
        videoSession: {
          sessionId: savedSession?.session_id,
          webRTCUrl: sessionData.webrtcUrl,
          status: 'initiated',
          customerLink: `${sessionData.webrtcUrl}?role=customer`,
          technicianLink: `${sessionData.webrtcUrl}?role=tech`,
          reason: args.reason
        }
      }
    }

    // 14. IoT Device Integration
    else if (toolName === 'monitor_iot_devices') {
      // Connect to IoT device
      const monitoringData = {
        deviceId: args.deviceId,
        deviceType: args.deviceType,
        customerId: args.customerId,
        monitoringPeriod: args.monitoringPeriod || '24h',
        status: 'connected',
        lastReading: {
          timestamp: new Date().toISOString(),
          value: 23.5,
          unit: 'celsius',
          status: 'normal'
        },
        alerts: []
      }

      // Save IoT device monitoring
      const { data: savedMonitoring, error } = await supabase
        .from('iot_device_monitoring')
        .insert({
          device_id: args.deviceId,
          device_type: args.deviceType,
          customer_id: args.customerId,
          monitoring_period: args.monitoringPeriod,
          connection_status: 'connected',
          last_reading: monitoringData.lastReading,
          account_id: accountId
        })
        .select()
        .single()

      return {
        iotMonitoring: {
          monitoringId: savedMonitoring?.id,
          deviceId: args.deviceId,
          deviceType: args.deviceType,
          status: 'connected',
          lastReading: monitoringData.lastReading,
          monitoringPeriod: args.monitoringPeriod
        }
      }
    }

    // 15. Blockchain Payments
    else if (toolName === 'process_crypto_payment') {
      // Process cryptocurrency payment
      const transactionData = {
        invoiceId: args.invoiceId,
        cryptocurrency: args.cryptocurrency,
        amount: args.amount,
        walletAddress: args.walletAddress,
        transactionHash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
        status: 'pending',
        gasFee: args.cryptocurrency === 'ETH' ? 0.01 : 0,
        estimatedConfirmation: '15 minutes'
      }

      // Save blockchain transaction
      const { data: savedTransaction, error } = await supabase
        .from('blockchain_transactions')
        .insert({
          invoice_id: args.invoiceId,
          cryptocurrency: args.cryptocurrency,
          amount: args.amount,
          from_wallet: args.walletAddress,
          transaction_hash: transactionData.transactionHash,
          status: 'pending',
          gas_fee: transactionData.gasFee,
          estimated_confirmation_time: transactionData.estimatedConfirmation,
          account_id: accountId
        })
        .select()
        .single()

      return {
        cryptoPayment: {
          transactionId: savedTransaction?.id,
          transactionHash: transactionData.transactionHash,
          cryptocurrency: args.cryptocurrency,
          amount: args.amount,
          status: 'pending',
          gasFee: transactionData.gasFee,
          estimatedConfirmation: transactionData.estimatedConfirmation,
          paymentAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // Mock address
        }
      }
    }

    // 16. AR Job Visualization
    else if (toolName === 'create_ar_preview') {
      // Create AR preview
      const previewData = {
        jobId: args.jobId,
        previewType: args.previewType,
        modelFiles: args.modelFiles || [],
        arUrl: `https://ar.crm-ai-pro.com/preview/${crypto.randomUUID()}`,
        requiredApp: 'CRM AI AR Viewer',
        compatibility: ['iOS 12+', 'Android 8+']
      }

      // Save AR preview
      const { data: savedPreview, error } = await supabase
        .from('ar_previews')
        .insert({
          job_id: args.jobId,
          preview_type: args.previewType,
          model_files: args.modelFiles,
          ar_url: previewData.arUrl,
          required_app: previewData.requiredApp,
          compatibility_info: previewData.compatibility,
          account_id: accountId
        })
        .select()
        .single()

      return {
        arPreview: {
          previewId: savedPreview?.id,
          arUrl: previewData.arUrl,
          previewType: args.previewType,
          requiredApp: previewData.requiredApp,
          compatibility: previewData.compatibility,
          qrCode: `data:image/png;base64,${btoa(previewData.arUrl)}` // Mock QR code
        }
      }
    }

    // 17. Predictive Hiring
    else if (toolName === 'predict_candidate_success') {
      // Evaluate candidate with AI
      const evaluationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `Evaluate candidate success potential:
            - Candidate Resume: ${JSON.stringify(args.resumeData || {})}
            - Assessment Scores: ${JSON.stringify(args.assessmentScores || {})}

            Return JSON: {
              successProbability: 0-100,
              technicalSkills: 0-100,
              culturalFit: 0-100,
              growthPotential: 0-100,
              strengths: string[],
              concerns: string[],
              recommendedLevel: "junior/mid/senior",
              interviewQuestions: string[]
            }`
          }, {
            role: 'user',
            content: `Evaluate candidate ${args.candidateId} for position ${args.positionId}`
          }]
        })
      })

      const evaluationResult = await evaluationResponse.json()
      const evaluation = JSON.parse(evaluationResult.choices[0].message.content)

      // Save candidate evaluation
      const { data: savedEvaluation, error } = await supabase
        .from('candidate_evaluations')
        .insert({
          candidate_id: args.candidateId,
          position_id: args.positionId,
          success_probability: evaluation.successProbability,
          technical_score: evaluation.technicalSkills,
          cultural_fit_score: evaluation.culturalFit,
          growth_potential_score: evaluation.growthPotential,
          strengths_identified: evaluation.strengths,
          concerns_identified: evaluation.concerns,
          recommended_level: evaluation.recommendedLevel,
          recommended_interview_questions: evaluation.interviewQuestions,
          resume_data: args.resumeData,
          assessment_scores: args.assessmentScores,
          account_id: accountId
        })
        .select()
        .single()

      return {
        candidateEvaluation: {
          evaluationId: savedEvaluation?.id,
          successProbability: evaluation.successProbability,
          technicalSkills: evaluation.technicalSkills,
          culturalFit: evaluation.culturalFit,
          growthPotential: evaluation.growthPotential,
          strengths: evaluation.strengths,
          concerns: evaluation.concerns,
          recommendedLevel: evaluation.recommendedLevel,
          interviewQuestions: evaluation.interviewQuestions
        }
      }
    }

    // 18. AI Voice Cloning
    else if (toolName === 'clone_customer_voice') {
      if (!args.consentRecorded) {
        return { error: 'Customer consent must be recorded before voice cloning' }
      }

      // Clone voice with ElevenLabs or similar service
      const voiceCloneData = {
        voiceId: `voice_${crypto.randomUUID()}`,
        contactId: args.contactId,
        audioSampleUrl: args.audioSampleUrl,
        useCase: args.useCase,
        status: 'processing',
        estimatedReadyTime: '2 hours',
        voiceQuality: 'high'
      }

      // Save voice clone
      const { data: savedClone, error } = await supabase
        .from('voice_clones')
        .insert({
          contact_id: args.contactId,
          audio_sample_url: args.audioSampleUrl,
          use_case: args.useCase,
          consent_recorded: args.consentRecorded,
          voice_id: voiceCloneData.voiceId,
          status: 'processing',
          estimated_ready_time: voiceCloneData.estimatedReadyTime,
          voice_quality: voiceCloneData.voiceQuality,
          account_id: accountId
        })
        .select()
        .single()

      return {
        voiceClone: {
          cloneId: savedClone?.id,
          voiceId: voiceCloneData.voiceId,
          status: 'processing',
          estimatedReadyTime: voiceCloneData.estimatedReadyTime,
          useCase: args.useCase,
          consentRecorded: args.consentRecorded
        }
      }
    }

    else {
      return { error: `Unknown tool: ${toolName}` }
    }
  } catch (error: any) {
    return { error: error.message || 'Internal error during tool execution' }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  // Handle GET for SSE endpoint (server notifications)
  if (req.method === 'GET') {
    const stream = new ReadableStream({
      start(controller) {
        // ElevenLabs may use GET for server-side notifications
        // For now, just keep connection open
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(': keepalive\n\n'))
          } catch {
            clearInterval(keepAlive)
          }
        }, 30000)
      },
    })

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }

  // Handle POST for MCP requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: CORS_HEADERS
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Extract and validate JWT token from request
    const authHeader = req.headers.get('Authorization')
    let userId = null
    let accountId = Deno.env.get('DEFAULT_ACCOUNT_ID') || 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      // Create Supabase client with JWT token to get user info
      const supabaseWithAuth = createClient(supabaseUrl, serviceRoleKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })

      // Verify the token and get user
      const { data: { user }, error } = await supabaseWithAuth.auth.getUser(token)

      if (!error && user) {
        userId = user.id
        // Get account ID from user metadata
        accountId = user.user_metadata?.account_id || accountId

        console.log('[MCP] Authenticated user:', {
          userId,
          email: user.email,
          accountId,
          role: user.app_metadata?.role
        })
      } else {
        console.error('[MCP] Invalid token:', error?.message)
        // Continue with default account for compatibility
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const mcpRequest: MCPRequest = await req.json()

    // Pass user context to tool calls
    const context = {
      userId,
      accountId,
      authenticated: !!userId
    }

    // Validate MCP request
    if (mcpRequest.jsonrpc !== '2.0' || !mcpRequest.method) {
      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: mcpRequest.id || 0,
        error: { code: -32600, message: 'Invalid Request' },
      }
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Check if client wants SSE response
    const acceptHeader = req.headers.get('Accept') || ''
    const wantsSSE = acceptHeader.includes('text/event-stream')

    let result: any

    // Handle MCP methods
    if (mcpRequest.method === 'initialize') {
      result = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'crm-ai-pro-mcp',
          version: '1.0.0'
        }
      }
    } else if (mcpRequest.method === 'initialized') {
      // Client acknowledging initialization - just return success
      result = {}
    } else if (mcpRequest.method === 'tools/list') {
      result = { tools: TOOLS }
    } else if (mcpRequest.method === 'tools/call') {
      const { name, arguments: args } = mcpRequest.params
      const toolResult = await handleToolCall(name, args, supabase, accountId, context)
      result = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(toolResult, null, 2),
          },
        ],
      }
    } else {
      result = { error: { code: -32601, message: 'Method not found' } }
    }

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      result,
    }

    // Return as SSE if requested, otherwise JSON
    if (wantsSSE) {
      const sseData = `data: ${JSON.stringify(response)}\n\n`
      return new Response(sseData, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    }

    return new Response(JSON.stringify(response), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: 0,
      error: { code: -32603, message: error.message || 'Internal error' },
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
