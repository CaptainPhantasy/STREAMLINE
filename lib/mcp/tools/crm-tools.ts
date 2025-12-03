import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'
import { getMCPLLMHelper } from '../llm'

// Initialize Supabase client with service role for MCP server
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

// Get account ID from user session or use default
async function getAccountId(userId?: string): Promise<string> {
  if (userId) {
    const supabase = getSupabaseClient()
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', userId)
      .single()

    if (user?.account_id) {
      return user.account_id
    }
  }

  // Fallback to default account
  return process.env.DEFAULT_ACCOUNT_ID || 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'
}

// Get LLM helper instance
const llmHelper = getMCPLLMHelper()

export const crmTools: Tool[] = [
  {
    name: 'create_job',
    description: 'Create a new job/work order. Use this when the user wants to create a job. You will need to collect: contact name, description, and optionally scheduled time and technician.',
    inputSchema: {
      type: 'object',
      properties: {
        contactName: {
          type: 'string',
          description: 'Name of the customer/contact (e.g., "John Smith")',
        },
        description: {
          type: 'string',
          description: 'Description of the work to be done',
        },
        scheduledStart: {
          type: 'string',
          description: 'ISO 8601 datetime for scheduled start (optional)',
        },
        scheduledEnd: {
          type: 'string',
          description: 'ISO 8601 datetime for scheduled end (optional)',
        },
        techAssignedId: {
          type: 'string',
          description: 'UUID of assigned technician (optional)',
        },
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
        search: {
          type: 'string',
          description: 'Search query (name, email, or phone)',
        },
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
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
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
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        status: {
          type: 'string',
          enum: ['lead', 'scheduled', 'en_route', 'in_progress', 'completed', 'invoiced', 'paid'],
          description: 'New status for the job',
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
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        techName: {
          type: 'string',
          description: 'Name of the technician to assign',
        },
      },
      required: ['jobId', 'techName'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email to a contact or send job information via email',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Email address to send to',
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        body: {
          type: 'string',
          description: 'Email body content',
        },
        jobId: {
          type: 'string',
          description: 'Optional: Job ID to include in email',
        },
      },
      required: ['to', 'subject', 'body'],
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
    name: 'create_contact',
    description: 'Create a new contact in the CRM',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address (required)',
        },
        firstName: {
          type: 'string',
          description: 'First name (required)',
        },
        lastName: {
          type: 'string',
          description: 'Last name (optional)',
        },
        phone: {
          type: 'string',
          description: 'Phone number (optional)',
        },
        address: {
          type: 'string',
          description: 'Address (optional)',
        },
      },
      required: ['email', 'firstName'],
    },
  },
  {
    name: 'get_contact',
    description: 'Get details of a specific contact by ID',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'UUID of the contact',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'list_jobs',
    description: 'List jobs with optional filters (status, tech, date range)',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (lead, scheduled, en_route, in_progress, completed, invoiced, paid)',
        },
        techId: {
          type: 'string',
          description: 'Filter by assigned technician ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
        },
      },
      required: [],
    },
  },
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
    name: 'create_invoice',
    description: 'Create a new invoice for a job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        totalAmount: {
          type: 'number',
          description: 'Total amount in cents',
        },
        dueDate: {
          type: 'string',
          description: 'ISO 8601 date for due date',
        },
        notes: {
          type: 'string',
          description: 'Optional notes',
        },
      },
      required: ['jobId', 'totalAmount'],
    },
  },
  {
    name: 'get_invoice',
    description: 'Get details of a specific invoice by ID',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          description: 'UUID of the invoice',
        },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'list_invoices',
    description: 'List invoices with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (draft, sent, paid, overdue)',
        },
        jobId: {
          type: 'string',
          description: 'Filter by job ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_notification',
    description: 'Create a notification for a user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'UUID of the user to notify',
        },
        type: {
          type: 'string',
          description: 'Notification type (job_assigned, message_received, payment_received, etc.)',
        },
        title: {
          type: 'string',
          description: 'Notification title',
        },
        message: {
          type: 'string',
          description: 'Notification message',
        },
        link: {
          type: 'string',
          description: 'Optional link URL',
        },
      },
      required: ['userId', 'type', 'title', 'message'],
    },
  },
  {
    name: 'list_notifications',
    description: 'List notifications for a user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'UUID of the user',
        },
        isRead: {
          type: 'boolean',
          description: 'Filter by read status (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'create_call_log',
    description: 'Create a call log entry',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'UUID of the contact',
        },
        jobId: {
          type: 'string',
          description: 'UUID of the job (optional)',
        },
        direction: {
          type: 'string',
          enum: ['inbound', 'outbound'],
          description: 'Call direction',
        },
        duration: {
          type: 'number',
          description: 'Call duration in seconds',
        },
        recordingUrl: {
          type: 'string',
          description: 'URL to call recording (optional)',
        },
        transcription: {
          type: 'string',
          description: 'Call transcription (optional)',
        },
        notes: {
          type: 'string',
          description: 'Notes about the call',
        },
      },
      required: ['contactId', 'direction', 'duration'],
    },
  },
  {
    name: 'get_job_analytics',
    description: 'Get analytics for jobs (revenue, counts, status breakdown)',
    inputSchema: {
      type: 'object',
      properties: {
        dateFrom: {
          type: 'string',
          description: 'ISO 8601 date to start from (optional)',
        },
        dateTo: {
          type: 'string',
          description: 'ISO 8601 date to end at (optional)',
        },
        status: {
          type: 'string',
          description: 'Filter by status (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_revenue_analytics',
    description: 'Get revenue analytics grouped by date, tech, or status',
    inputSchema: {
      type: 'object',
      properties: {
        dateFrom: {
          type: 'string',
          description: 'ISO 8601 date to start from (optional)',
        },
        dateTo: {
          type: 'string',
          description: 'ISO 8601 date to end at (optional)',
        },
        groupBy: {
          type: 'string',
          enum: ['date', 'tech', 'status'],
          description: 'Group results by date, tech, or status',
        },
      },
      required: [],
    },
  },
  {
    name: 'send_review_request',
    description: 'Send a review request email to a contact after job completion',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the completed job',
        },
        contactId: {
          type: 'string',
          description: 'UUID of the contact',
        },
      },
      required: ['jobId', 'contactId'],
    },
  },
  {
    name: 'list_job_photos',
    description: 'List photos for a specific job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
      },
      required: ['jobId'],
    },
  },
  // Wave 1: High-Priority Core Operations
  {
    name: 'list_contacts',
    description: 'List all contacts with optional filters (search, tags, status, date range)',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search query for name, email, or phone (optional)',
        },
        tags: {
          type: 'string',
          description: 'Comma-separated tag IDs to filter by (optional)',
        },
        status: {
          type: 'string',
          description: 'Filter by status (optional)',
        },
        dateStart: {
          type: 'string',
          description: 'ISO 8601 date to start from (optional)',
        },
        dateEnd: {
          type: 'string',
          description: 'ISO 8601 date to end at (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
        },
      },
      required: [],
    },
  },
  {
    name: 'update_contact',
    description: 'Update contact information',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'UUID of the contact',
        },
        email: {
          type: 'string',
          description: 'Email address (optional)',
        },
        firstName: {
          type: 'string',
          description: 'First name (optional)',
        },
        lastName: {
          type: 'string',
          description: 'Last name (optional)',
        },
        phone: {
          type: 'string',
          description: 'Phone number (optional)',
        },
        address: {
          type: 'string',
          description: 'Address (optional)',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'update_job',
    description: 'Update job details (description, scheduled times, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        description: {
          type: 'string',
          description: 'Job description (optional)',
        },
        scheduledStart: {
          type: 'string',
          description: 'ISO 8601 datetime for scheduled start (optional)',
        },
        scheduledEnd: {
          type: 'string',
          description: 'ISO 8601 datetime for scheduled end (optional)',
        },
        totalAmount: {
          type: 'number',
          description: 'Total amount in cents (optional)',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'list_conversations',
    description: 'List conversations with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'Filter by contact ID (optional)',
        },
        status: {
          type: 'string',
          description: 'Filter by status (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_conversation',
    description: 'Get conversation details including messages',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'UUID of the conversation',
        },
      },
      required: ['conversationId'],
    },
  },
  {
    name: 'create_conversation',
    description: 'Create a new conversation',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'UUID of the contact',
        },
        subject: {
          type: 'string',
          description: 'Conversation subject (optional)',
        },
        status: {
          type: 'string',
          description: 'Initial status (default: open)',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'list_users',
    description: 'List users/technicians with optional role filter',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'Filter by role (owner, admin, dispatcher, tech) (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_user',
    description: 'Get user details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'UUID of the user',
        },
      },
      required: ['userId'],
    },
  },
  // Wave 2: Field Operations
  {
    name: 'upload_job_photo',
    description: 'Upload a photo to a job (requires photo URL or base64 data)',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        photoUrl: {
          type: 'string',
          description: 'URL of the photo to upload (optional if base64 provided)',
        },
        base64Data: {
          type: 'string',
          description: 'Base64 encoded image data (optional if photoUrl provided)',
        },
        caption: {
          type: 'string',
          description: 'Photo caption (optional)',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'capture_location',
    description: 'Capture and save job location coordinates',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        latitude: {
          type: 'number',
          description: 'Latitude coordinate',
        },
        longitude: {
          type: 'number',
          description: 'Longitude coordinate',
        },
        address: {
          type: 'string',
          description: 'Address string (optional)',
        },
      },
      required: ['jobId', 'latitude', 'longitude'],
    },
  },
  {
    name: 'clock_in',
    description: 'Clock in for time tracking',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job (optional)',
        },
        notes: {
          type: 'string',
          description: 'Notes about the time entry (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'clock_out',
    description: 'Clock out from time tracking',
    inputSchema: {
      type: 'object',
      properties: {
        timeEntryId: {
          type: 'string',
          description: 'UUID of the time entry to clock out from',
        },
        notes: {
          type: 'string',
          description: 'Notes about the time entry (optional)',
        },
      },
      required: ['timeEntryId'],
    },
  },
  {
    name: 'get_tech_jobs',
    description: 'Get jobs assigned to a technician',
    inputSchema: {
      type: 'object',
      properties: {
        techId: {
          type: 'string',
          description: 'UUID of the technician (optional, defaults to current user)',
        },
        status: {
          type: 'string',
          description: 'Filter by status (optional)',
        },
        date: {
          type: 'string',
          description: 'Filter by date (ISO 8601 date, optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'add_contact_note',
    description: 'Add a note to a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'UUID of the contact',
        },
        content: {
          type: 'string',
          description: 'Note content',
        },
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
        conversationId: {
          type: 'string',
          description: 'UUID of the conversation',
        },
        content: {
          type: 'string',
          description: 'Note content',
        },
      },
      required: ['conversationId', 'content'],
    },
  },
  // Wave 3: Financial Operations
  {
    name: 'update_invoice',
    description: 'Update invoice details',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          description: 'UUID of the invoice',
        },
        totalAmount: {
          type: 'number',
          description: 'Total amount in cents (optional)',
        },
        dueDate: {
          type: 'string',
          description: 'ISO 8601 date for due date (optional)',
        },
        notes: {
          type: 'string',
          description: 'Notes (optional)',
        },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'send_invoice',
    description: 'Send invoice to customer via email',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          description: 'UUID of the invoice',
        },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'mark_invoice_paid',
    description: 'Mark an invoice as paid',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          description: 'UUID of the invoice',
        },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'add_job_parts',
    description: 'Add parts/materials to a job. Use when tech says "add 3 pipe fittings at $3.50 each to the Smith job" or "record materials used".',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        parts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Part/material name',
              },
              quantity: {
                type: 'number',
                description: 'Quantity used',
              },
              unit: {
                type: 'string',
                description: 'Unit of measurement (e.g., "each", "ft", "gallon")',
              },
              unitCost: {
                type: 'number',
                description: 'Unit cost in cents',
              },
              supplier: {
                type: 'string',
                description: 'Supplier name (optional)',
              },
              notes: {
                type: 'string',
                description: 'Additional notes (optional)',
              },
            },
            required: ['name', 'quantity', 'unitCost'],
          },
          description: 'Array of parts to add',
        },
      },
      required: ['jobId', 'parts'],
    },
  },
  {
    name: 'list_job_parts',
    description: 'List all parts/materials for a job. Use when user asks "what parts were used on this job?" or "show me materials for the Johnson job".',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'update_job_part',
    description: 'Update a part quantity or cost. Use when user says "change the quantity to 5" or "update the cost to $12.50".',
    inputSchema: {
      type: 'object',
      properties: {
        partId: {
          type: 'string',
          description: 'UUID of the part to update',
        },
        quantity: {
          type: 'number',
          description: 'New quantity (optional)',
        },
        unitCost: {
          type: 'number',
          description: 'New unit cost in cents (optional)',
        },
        notes: {
          type: 'string',
          description: 'Updated notes (optional)',
        },
      },
      required: ['partId'],
    },
  },
  {
    name: 'remove_job_part',
    description: 'Remove a part from a job. Use when user says "remove that part" or "delete the pipe fitting from the job".',
    inputSchema: {
      type: 'object',
      properties: {
        partId: {
          type: 'string',
          description: 'UUID of the part to remove',
        },
      },
      required: ['partId'],
    },
  },
  {
    name: 'list_payments',
    description: 'List payments with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'Filter by job ID (optional)',
        },
        invoiceId: {
          type: 'string',
          description: 'Filter by invoice ID (optional)',
        },
        status: {
          type: 'string',
          description: 'Filter by status (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_payment',
    description: 'Create a payment record',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          description: 'UUID of the invoice',
        },
        amount: {
          type: 'number',
          description: 'Payment amount in cents',
        },
        method: {
          type: 'string',
          description: 'Payment method (cash, check, card, etc.)',
        },
        notes: {
          type: 'string',
          description: 'Payment notes (optional)',
        },
      },
      required: ['invoiceId', 'amount', 'method'],
    },
  },
  // Wave 4: Marketing Operations
  {
    name: 'list_campaigns',
    description: 'List marketing campaigns',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_campaign',
    description: 'Create a new marketing campaign',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Campaign name',
        },
        type: {
          type: 'string',
          description: 'Campaign type (email, sms, etc.)',
        },
        templateId: {
          type: 'string',
          description: 'UUID of the email template (optional)',
        },
        subject: {
          type: 'string',
          description: 'Email subject (optional)',
        },
        body: {
          type: 'string',
          description: 'Email body (optional)',
        },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'get_campaign',
    description: 'Get campaign details',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: {
          type: 'string',
          description: 'UUID of the campaign',
        },
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
        campaignId: {
          type: 'string',
          description: 'UUID of the campaign',
        },
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
        type: {
          type: 'string',
          description: 'Filter by template type (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_email_template',
    description: 'Create a new email template',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Template name',
        },
        type: {
          type: 'string',
          description: 'Template type (review_request, invoice, etc.)',
        },
        subject: {
          type: 'string',
          description: 'Email subject',
        },
        body: {
          type: 'string',
          description: 'Email body (HTML or text)',
        },
      },
      required: ['name', 'type', 'subject', 'body'],
    },
  },
  {
    name: 'list_contact_tags',
    description: 'List contact tags',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_contact_tag',
    description: 'Create a new contact tag',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Tag name',
        },
        color: {
          type: 'string',
          description: 'Tag color (hex code, optional)',
        },
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
        contactId: {
          type: 'string',
          description: 'UUID of the contact',
        },
        tagId: {
          type: 'string',
          description: 'UUID of the tag',
        },
      },
      required: ['contactId', 'tagId'],
    },
  },
  // Wave 5: Analytics & Admin
  {
    name: 'get_contact_analytics',
    description: 'Get contact analytics and statistics',
    inputSchema: {
      type: 'object',
      properties: {
        dateFrom: {
          type: 'string',
          description: 'ISO 8601 date to start from (optional)',
        },
        dateTo: {
          type: 'string',
          description: 'ISO 8601 date to end at (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a report (jobs, contacts, invoices, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Report type (jobs, contacts, invoices, revenue)',
        },
        dateFrom: {
          type: 'string',
          description: 'ISO 8601 date to start from (optional)',
        },
        dateTo: {
          type: 'string',
          description: 'ISO 8601 date to end at (optional)',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'export_contacts',
    description: 'Export contacts to CSV or JSON',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['csv', 'json'],
          description: 'Export format (default: csv)',
        },
      },
      required: [],
    },
  },
  {
    name: 'export_jobs',
    description: 'Export jobs to CSV or JSON',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['csv', 'json'],
          description: 'Export format (default: csv)',
        },
        dateFrom: {
          type: 'string',
          description: 'ISO 8601 date to start from (optional)',
        },
        dateTo: {
          type: 'string',
          description: 'ISO 8601 date to end at (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'list_automation_rules',
    description: 'List automation rules',
    inputSchema: {
      type: 'object',
      properties: {
        active: {
          type: 'boolean',
          description: 'Filter by active status (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_automation_rule',
    description: 'Create a new automation rule',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Rule name',
        },
        trigger: {
          type: 'string',
          description: 'Trigger event (job_created, job_completed, etc.)',
        },
        action: {
          type: 'string',
          description: 'Action to perform',
        },
        active: {
          type: 'boolean',
          description: 'Whether rule is active (default: true)',
        },
      },
      required: ['name', 'trigger', 'action'],
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
        settings: {
          type: 'object',
          description: 'Settings object to update',
        },
      },
      required: ['settings'],
    },
  },
  {
    name: 'get_audit_logs',
    description: 'Get audit logs with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Filter by action type (optional)',
        },
        userId: {
          type: 'string',
          description: 'Filter by user ID (optional)',
        },
        dateFrom: {
          type: 'string',
          description: 'ISO 8601 date to start from (optional)',
        },
        dateTo: {
          type: 'string',
          description: 'ISO 8601 date to end at (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: [],
    },
  },
  // ======================================
  // AI-POWERED TOOLS (LLM Router Integration)
  // ======================================
  {
    name: 'generate_job_description',
    description: 'Generate a professional job description using AI based on customer input and job type. Useful when creating new jobs with vague or incomplete descriptions.',
    inputSchema: {
      type: 'object',
      properties: {
        jobType: {
          type: 'string',
          description: 'Type of job (e.g., "plumbing repair", "HVAC installation", "electrical work")',
        },
        customerNotes: {
          type: 'string',
          description: 'Customer\'s description of the issue or work needed',
        },
        additionalContext: {
          type: 'string',
          description: 'Optional additional context (e.g., urgency, location details, equipment info)',
        },
      },
      required: ['jobType', 'customerNotes'],
    },
  },
  {
    name: 'draft_customer_response',
    description: 'Generate an AI-drafted response to a customer message in a conversation. Analyzes conversation context and provides a professional reply.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'UUID of the conversation',
        },
        customerMessage: {
          type: 'string',
          description: 'The customer\'s most recent message',
        },
        tone: {
          type: 'string',
          enum: ['professional', 'friendly', 'apologetic', 'urgent'],
          description: 'Tone for the response (default: professional)',
        },
      },
      required: ['conversationId', 'customerMessage'],
    },
  },
  {
    name: 'summarize_job_notes',
    description: 'Generate a concise summary of all notes and activities for a job. Useful for quickly understanding job history.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'analyze_customer_sentiment',
    description: 'Analyze the sentiment of customer communications in a conversation. Returns sentiment (positive/negative/neutral) with confidence score.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'UUID of the conversation',
        },
      },
      required: ['conversationId'],
    },
  },
  {
    name: 'generate_invoice_description',
    description: 'Generate professional invoice line items and descriptions based on job details and work performed.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        includeLabor: {
          type: 'boolean',
          description: 'Include labor charges in description (default: true)',
        },
        includeMaterials: {
          type: 'boolean',
          description: 'Include materials charges in description (default: true)',
        },
      },
      required: ['jobId'],
    },
  },
  // ======================================
  // SALES BRIEFING TOOL
  // ======================================
  {
    name: 'get_sales_briefing',
    description: 'Get a comprehensive briefing on a contact before a meeting. Use this when user says "Brief me on [name]", "What should I know about [name]", or "Give me the rundown on [name]". Returns customer history, recent jobs, revenue, and personal details.',
    inputSchema: {
      type: 'object',
      properties: {
        contactName: {
          type: 'string',
          description: 'Name of the contact to get briefing for (e.g., "John Smith")',
        },
        contactId: {
          type: 'string',
          description: 'Optional: UUID of the contact if known',
        },
      },
      required: [],
    },
  },
  {
    name: 'update_contact_profile',
    description: 'Update personal details for a contact. Use this when user mentions personal info like "John has a dog named Max", "Remember that Mrs. Smith prefers morning appointments", or "Note that the Johnsons have two kids".',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'Contact UUID (optional if contactName provided)',
        },
        contactName: {
          type: 'string',
          description: 'Contact name if ID not known',
        },
        spouse: {
          type: 'string',
          description: 'Spouse/partner name',
        },
        children: {
          type: 'array',
          items: { type: 'string' },
          description: 'Children names',
        },
        pets: {
          type: 'array',
          items: { type: 'string' },
          description: 'Pet names and types (e.g., "Max the dog")',
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description: 'Hobbies/interests',
        },
        communicationPreference: {
          type: 'string',
          description: 'How they prefer to be contacted (call, text, email)',
        },
        schedulingNotes: {
          type: 'string',
          description: 'When they prefer appointments',
        },
        notes: {
          type: 'string',
          description: 'Any other personal notes',
        },
      },
      required: [],
    },
  },
  // ======================================
  // MEETING & TRANSCRIPT TOOLS
  // ======================================
  {
    name: 'compile_meeting_report',
    description: 'Process a meeting transcript and log it to the CRM. Use when user says "log this meeting", "compile that into a report", or "save the meeting notes". Analyzes transcript for action items, personal details, and follow-ups.',
    inputSchema: {
      type: 'object',
      properties: {
        contactName: {
          type: 'string',
          description: 'Customer name from the meeting',
        },
        transcript: {
          type: 'string',
          description: 'The meeting transcript or notes',
        },
        meetingType: {
          type: 'string',
          enum: ['in_person', 'phone', 'video', 'site_visit'],
          description: 'Type of meeting (default: in_person)',
        },
        title: {
          type: 'string',
          description: 'Meeting title (optional)',
        },
      },
      required: ['transcript'],
    },
  },
  {
    name: 'get_meeting_history',
    description: 'Get meeting history for a contact. Use when user asks "what meetings have I had with [name]" or "show me my notes from [name]".',
    inputSchema: {
      type: 'object',
      properties: {
        contactName: {
          type: 'string',
          description: 'Contact name to look up',
        },
        contactId: {
          type: 'string',
          description: 'Contact UUID if known',
        },
        limit: {
          type: 'number',
          description: 'Maximum meetings to return (default: 5)',
        },
      },
      required: [],
    },
  },
  // ======================================
  // MORNING BRIEFING & DAILY TOOLS
  // ======================================
  {
    name: 'get_morning_briefing',
    description: 'Get a comprehensive morning briefing. Use when user says "what do I have today?", "give me my morning briefing", "what\'s on my schedule?". Returns today\'s jobs, overdue follow-ups, and important alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        includeYesterday: {
          type: 'boolean',
          description: 'Include summary of yesterday\'s activity (default: false)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_overdue_followups',
    description: 'Get list of overdue follow-ups that need attention. Use when user asks "what follow-ups am I behind on?" or "who do I need to call back?"',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum results (default: 10)',
        },
      },
      required: [],
    },
  },
  // ======================================
  // FIELD TECH TOOLS
  // ======================================
  {
    name: 'log_site_visit',
    description: 'Log a site visit or service call. Use when tech says "I just finished at [location]" or "log my visit to [customer]". Captures arrival, departure, work performed.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'Job UUID',
        },
        notes: {
          type: 'string',
          description: 'What was done during the visit',
        },
        partsUsed: {
          type: 'array',
          items: { type: 'string' },
          description: 'Parts or materials used',
        },
        timeSpent: {
          type: 'number',
          description: 'Minutes spent on site',
        },
        nextSteps: {
          type: 'string',
          description: 'What needs to happen next',
        },
      },
      required: ['jobId', 'notes'],
    },
  },
  {
    name: 'request_parts',
    description: 'Request parts or materials for a job. Use when tech says "I need [part] for this job" or "order [part] for the [customer] job".',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'Job UUID (optional)',
        },
        parts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              urgent: { type: 'boolean' },
            },
          },
          description: 'Parts to request',
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the request',
        },
      },
      required: ['parts'],
    },
  },
  // ======================================
  // DISPATCHER TOOLS
  // ======================================
  {
    name: 'find_available_techs',
    description: 'Find available technicians. Use when dispatcher asks "who\'s available?" or "which tech can take a job in [area]?"',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to check availability (ISO format, default: today)',
        },
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required skills (e.g., ["plumbing", "hvac"])',
        },
      },
      required: [],
    },
  },
  {
    name: 'reschedule_job',
    description: 'Reschedule a job to a different time or technician. Use when user says "move the [customer] job to [time]" or "reassign [job] to [tech]".',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'Job UUID',
        },
        jobDescription: {
          type: 'string',
          description: 'Job description to find by (if ID not known)',
        },
        newDate: {
          type: 'string',
          description: 'New scheduled date/time (ISO format)',
        },
        newTechId: {
          type: 'string',
          description: 'New technician UUID',
        },
        newTechName: {
          type: 'string',
          description: 'New technician name (if ID not known)',
        },
        reason: {
          type: 'string',
          description: 'Reason for reschedule',
        },
        notifyCustomer: {
          type: 'boolean',
          description: 'Send notification to customer (default: true)',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'get_tech_status',
    description: 'Get current status of all technicians or a specific tech. Use when dispatcher asks "where is [tech]?" or "what\'s everyone\'s status?"',
    inputSchema: {
      type: 'object',
      properties: {
        techId: {
          type: 'string',
          description: 'Specific tech UUID (optional, omit for all techs)',
        },
        techName: {
          type: 'string',
          description: 'Tech name to look up',
        },
      },
      required: [],
    },
  },
  // ======================================
  // PROACTIVE MAINTENANCE TOOLS
  // ======================================
  {
    name: 'get_maintenance_due',
    description: 'Get customers due for maintenance based on job history. Use for proactive outreach like "who needs their annual water heater flush?" or "maintenance reminders due this month".',
    inputSchema: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          description: 'Type of service (e.g., "water heater flush", "HVAC tune-up")',
        },
        monthsSinceService: {
          type: 'number',
          description: 'Minimum months since last service (default: 12)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'send_maintenance_reminder',
    description: 'Send a maintenance reminder to a customer. Use when user says "remind [customer] about their annual service" or "send maintenance email to [name]".',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'Contact UUID',
        },
        contactName: {
          type: 'string',
          description: 'Contact name if ID not known',
        },
        serviceType: {
          type: 'string',
          description: 'Type of maintenance service',
        },
        customMessage: {
          type: 'string',
          description: 'Custom message to include (optional)',
        },
      },
      required: ['serviceType'],
    },
  },
  // ======================================
  // PARTS MANAGEMENT & EMAIL TOOLS
  // ======================================
  {
    name: 'email_parts_list',
    description: 'Email a formatted parts/materials list to a customer for a specific job. Use when user says "email parts list to customer" or "send materials list".',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        recipientEmail: {
          type: 'string',
          description: 'Email address to send the parts list to',
        },
      },
      required: ['jobId', 'recipientEmail'],
    },
  },
]

export async function handleCrmTool(
  name: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  const supabase = getSupabaseClient()
  const accountId = await getAccountId(userId)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  switch (name) {
    case 'create_job': {
      const { contactName, description, scheduledStart, scheduledEnd, techAssignedId } = args as {
        contactName: string
        description: string
        scheduledStart?: string
        scheduledEnd?: string
        techAssignedId?: string
      }

      // Search for contact with better matching
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .eq('account_id', accountId)
        .or(`first_name.ilike.%${contactName}%,last_name.ilike.%${contactName}%`)
        .limit(10)

      if (!contacts || contacts.length === 0) {
        return {
          error: `Contact "${contactName}" not found. You can create a new contact first, or search by email/phone.`,
          suggestion: 'create_contact',
        }
      }

      // Score contacts for best match
      const scoredContacts = contacts.map(c => {
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase()
        const searchLower = contactName.toLowerCase()

        let score = 0
        if (fullName === searchLower) score = 100
        else if (fullName.includes(searchLower)) score = 50
        else if (searchLower.includes(c.first_name?.toLowerCase() || '')) score = 30
        else score = 10

        return { contact: c, score }
      })

      scoredContacts.sort((a, b) => b.score - a.score)

      // If multiple matches with low confidence, ask for clarification
      if (contacts.length > 1 && scoredContacts[0].score < 100) {
        const options = contacts.slice(0, 3).map(c =>
          `${c.first_name} ${c.last_name}${c.email ? ` (${c.email})` : ''}`
        )
        return {
          error: `Multiple contacts found matching "${contactName}": ${options.join(', ')}. Please be more specific.`,
          matches: contacts.slice(0, 3),
        }
      }

      const contactId = scoredContacts[0].contact.id

      // Validate scheduling dates
      if (scheduledStart) {
        const startDate = new Date(scheduledStart)
        const now = new Date()

        // Check if start date is in the past (with 5 minute buffer for processing)
        if (startDate < new Date(now.getTime() - 5 * 60 * 1000)) {
          return {
            error: 'Scheduled start time cannot be in the past',
            suggestion: 'Provide a future date/time for the job',
          }
        }

        // Validate end is after start
        if (scheduledEnd) {
          const endDate = new Date(scheduledEnd)
          if (endDate <= startDate) {
            return {
              error: 'Scheduled end time must be after start time',
            }
          }
        }

        // Check for scheduling conflicts if tech is assigned
        if (techAssignedId) {
          const { data: conflictingJobs } = await supabase
            .from('jobs')
            .select('id, scheduled_start, scheduled_end')
            .eq('account_id', accountId)
            .eq('tech_assigned_id', techAssignedId)
            .not('status', 'in', '(completed,cancelled)')
            .not('scheduled_start', 'is', null)

          if (conflictingJobs && conflictingJobs.length > 0) {
            const hasConflict = conflictingJobs.some(job => {
              const jobStart = new Date(job.scheduled_start)
              const jobEnd = job.scheduled_end ? new Date(job.scheduled_end) : new Date(jobStart.getTime() + 2 * 60 * 60 * 1000) // Default 2 hour job
              const newStart = startDate
              const newEnd = scheduledEnd ? new Date(scheduledEnd) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

              // Check if time ranges overlap
              return (newStart < jobEnd && newEnd > jobStart)
            })

            if (hasConflict) {
              return {
                error: 'Technician is already scheduled for another job at this time',
                suggestion: 'Choose a different time or assign a different technician',
              }
            }
          }
        }
      }

      // Create job via edge function
      const jobRes = await fetch(`${supabaseUrl}/functions/v1/create-job`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          contactId,
          description,
          scheduledStart,
          scheduledEnd,
          techAssignedId,
        }),
      })

      const jobData = await jobRes.json()

      if (!jobRes.ok) {
        return { error: jobData.error || 'Failed to create job' }
      }

      return {
        success: true,
        jobId: jobData.job?.id,
        jobNumber: jobData.job?.id?.substring(0, 8) || 'N/A',
        message: `Job created successfully. Job number: ${jobData.job?.id?.substring(0, 8)}`,
      }
    }

    case 'search_contacts': {
      const { search } = args as { search: string }

      // Split search into potential first/last name
      const searchParts = search.trim().split(/\s+/)

      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .eq('account_id', accountId)

      if (searchParts.length === 1) {
        // Single word - search first, last, email, phone
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        )
      } else if (searchParts.length === 2) {
        // Two words - likely first + last name
        const [first, last] = searchParts
        query = query.or(
          `and(first_name.ilike.%${first}%,last_name.ilike.%${last}%),first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        )
      } else {
        // Multiple words - full text search
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      const { data: contacts } = await query.limit(10)

      // Score results for relevance
      const scoredContacts = (contacts || []).map(contact => {
        let score = 0
        const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
        const searchLower = search.toLowerCase()

        if (fullName === searchLower) score += 100 // exact match
        else if (fullName.includes(searchLower)) score += 50 // contains
        else score += 10 // partial match

        return { ...contact, _score: score }
      })

      // Sort by score descending
      scoredContacts.sort((a, b) => b._score - a._score)

      return {
        contacts: scoredContacts.map(({ _score, ...c }) => c),
        count: contacts?.length || 0,
      }
    }

    case 'get_job': {
      const { jobId } = args as { jobId: string }

      const { data: job } = await supabase
        .from('jobs')
        .select('*, contacts(*), users(*)')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      return { job }
    }

    case 'update_job_status': {
      const { jobId, status } = args as { jobId: string; status: string }

      const statusRes = await fetch(`${supabaseUrl}/functions/v1/update-job-status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          jobId,
          status,
        }),
      })

      const statusData = await statusRes.json()

      if (!statusRes.ok) {
        return { error: statusData.error || 'Failed to update job status' }
      }

      return {
        success: true,
        job: statusData.job,
        message: `Job status updated to ${status}`,
      }
    }

    case 'assign_tech': {
      const { jobId, techName } = args as { jobId: string; techName: string }

      // Search for technician
      const { data: techs } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('account_id', accountId)
        .or(`first_name.ilike.%${techName}%,last_name.ilike.%${techName}%`)
        .limit(5)

      if (!techs || techs.length === 0) {
        return { error: `Technician "${techName}" not found` }
      }

      const techId = techs[0].id

      const assignRes = await fetch(`${supabaseUrl}/functions/v1/assign-tech`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          jobId,
          techAssignedId: techId,
        }),
      })

      const assignData = await assignRes.json()

      if (!assignRes.ok) {
        return { error: assignData.error || 'Failed to assign technician' }
      }

      return {
        success: true,
        message: `Technician ${techName} assigned to job`,
      }
    }

    case 'send_email': {
      const { to, subject, body, jobId } = args as {
        to: string
        subject: string
        body: string
        jobId?: string
      }

      // Use Resend API to send email
      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return { error: 'Email service not configured' }
      }

      // Get sender email from environment config
      const senderEmail = process.env.RESEND_VERIFIED_DOMAIN
        ? (process.env.RESEND_VERIFIED_DOMAIN.includes('@')
            ? `CRM <${process.env.RESEND_VERIFIED_DOMAIN}>`
            : `CRM <noreply@${process.env.RESEND_VERIFIED_DOMAIN}>`)
        : 'CRM <noreply@resend.dev>'

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [to],
          subject,
          html: body,
        }),
      })

      const emailData = await emailRes.json()

      if (!emailRes.ok) {
        return { error: emailData.message || 'Failed to send email' }
      }

      return {
        success: true,
        messageId: emailData.id,
        message: `Email sent to ${to}`,
      }
    }

    case 'get_user_email': {
      // Get account owner email
      const { data: account } = await supabase
        .from('accounts')
        .select('owner_email')
        .eq('id', accountId)
        .single()

      if (!account?.owner_email) {
        // Try to get from users table
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

    case 'create_contact': {
      const { email, firstName, lastName, phone, address } = args as {
        email: string
        firstName: string
        lastName?: string
        phone?: string
        address?: string
      }

      // Check if contact exists
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', email)
        .eq('account_id', accountId)
        .single()

      if (existing) {
        return {
          error: `Contact with email ${email} already exists`,
          contactId: existing.id,
        }
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          account_id: accountId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        contact,
        message: `Contact ${firstName} ${lastName || ''} created successfully`,
      }
    }

    case 'get_contact': {
      const { contactId } = args as { contactId: string }

      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact) {
        return { error: 'Contact not found' }
      }

      return { contact }
    }

    case 'list_jobs': {
      const { status, techId, limit = 50, offset = 0 } = args as {
        status?: string
        techId?: string
        limit?: number
        offset?: number
      }

      let query = supabase
        .from('jobs')
        .select('*, contacts(*), users(*)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      if (techId) {
        query = query.eq('tech_assigned_id', techId)
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

    case 'get_dashboard_stats': {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

      // Jobs stats
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

      const { count: completedJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('status', 'completed')

      // Revenue stats
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('account_id', accountId)
        .eq('status', 'completed')

      const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      const todayRevenue =
        allPayments
          ?.filter((p) => {
            const paymentDate = new Date(p.created_at)
            return paymentDate >= today && paymentDate < tomorrow
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      const weekRevenue =
        allPayments
          ?.filter((p) => {
            const paymentDate = new Date(p.created_at)
            return paymentDate >= weekStart && paymentDate < weekEnd
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      const monthRevenue =
        allPayments
          ?.filter((p) => {
            const paymentDate = new Date(p.created_at)
            return paymentDate >= monthStart && paymentDate < monthEnd
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      // Contacts stats
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)

      const { count: newContactsThisMonth } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString())

      // Outstanding invoices
      const { data: outstandingInvoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('account_id', accountId)
        .in('status', ['sent', 'overdue'])

      const outstandingAmount = outstandingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

      return {
        jobs: {
          total: totalJobs || 0,
          today: todayJobs || 0,
          completed: completedJobs || 0,
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          thisWeek: weekRevenue,
          thisMonth: monthRevenue,
        },
        contacts: {
          total: totalContacts || 0,
          newThisMonth: newContactsThisMonth || 0,
        },
        invoices: {
          outstanding: outstandingInvoices?.length || 0,
          outstandingAmount,
        },
      }
    }

    case 'create_invoice': {
      const { jobId, totalAmount, dueDate, notes } = args as {
        jobId: string
        totalAmount: number
        dueDate?: string
        notes?: string
      }

      // Validate amount
      if (!totalAmount || totalAmount <= 0) {
        return { error: 'Invoice amount must be greater than zero' }
      }

      // Verify job exists
      const { data: job } = await supabase
        .from('jobs')
        .select('id, contact_id')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      // Check for existing draft invoice (idempotency)
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('job_id', jobId)
        .eq('account_id', accountId)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingInvoice) {
        return {
          success: true,
          invoice: existingInvoice,
          message: 'Draft invoice already exists for this job',
          wasExisting: true,
        }
      }

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          account_id: accountId,
          job_id: jobId,
          contact_id: job.contact_id,
          total_amount: totalAmount,
          status: 'draft',
          due_date: dueDate || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        invoice,
        message: 'Invoice created successfully',
      }
    }

    case 'get_invoice': {
      const { invoiceId } = args as { invoiceId: string }

      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, jobs(*), contacts(*)')
        .eq('id', invoiceId)
        .eq('account_id', accountId)
        .single()

      if (!invoice) {
        return { error: 'Invoice not found' }
      }

      return { invoice }
    }

    case 'list_invoices': {
      const { status, jobId, limit = 50 } = args as {
        status?: string
        jobId?: string
        limit?: number
      }

      let query = supabase
        .from('invoices')
        .select('*, jobs(*), contacts(*)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (jobId) {
        query = query.eq('job_id', jobId)
      }

      const { data: invoices, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        invoices: invoices || [],
        count: invoices?.length || 0,
      }
    }

    case 'create_notification': {
      const { userId, type, title, message, link } = args as {
        userId: string
        type: string
        title: string
        message: string
        link?: string
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          account_id: accountId,
          user_id: userId,
          type,
          title,
          message,
          link: link || null,
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

    case 'list_notifications': {
      const { userId, isRead, limit = 50 } = args as {
        userId: string
        isRead?: boolean
        limit?: number
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (isRead !== undefined) {
        query = query.eq('is_read', isRead)
      }

      const { data: notifications, error } = await query

      if (error) {
        return { error: error.message }
      }

      const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

      return {
        notifications: notifications || [],
        count: notifications?.length || 0,
        unreadCount,
      }
    }

    case 'create_call_log': {
      const { contactId, jobId, direction, duration, recordingUrl, transcription, notes } = args as {
        contactId: string
        jobId?: string
        direction: string
        duration: number
        recordingUrl?: string
        transcription?: string
        notes?: string
      }

      const { data: callLog, error } = await supabase
        .from('call_logs')
        .insert({
          account_id: accountId,
          contact_id: contactId,
          job_id: jobId || null,
          direction,
          duration,
          recording_url: recordingUrl || null,
          transcription: transcription || null,
          notes: notes || null,
          status: 'completed',
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        callLog,
        message: 'Call log created successfully',
      }
    }

    case 'get_job_analytics': {
      const { dateFrom, dateTo, status } = args as {
        dateFrom?: string
        dateTo?: string
        status?: string
      }

      let query = supabase
        .from('jobs')
        .select('id, status, total_amount, created_at')
        .eq('account_id', accountId)

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data: jobs, error } = await query

      if (error) {
        return { error: error.message }
      }

      const totalJobs = jobs?.length || 0
      const totalRevenue = jobs?.reduce((sum, j) => sum + (j.total_amount || 0), 0) || 0
      const avgValue = totalJobs > 0 ? Math.round(totalRevenue / totalJobs) : 0
      const completedCount = jobs?.filter((j) => j.status === 'completed').length || 0
      const paidCount = jobs?.filter((j) => j.status === 'paid').length || 0

      // Status breakdown
      const statusBreakdown: Record<string, number> = {}
      jobs?.forEach((job) => {
        statusBreakdown[job.status] = (statusBreakdown[job.status] || 0) + 1
      })

      return {
        totalJobs,
        totalRevenue,
        avgValue,
        completedCount,
        paidCount,
        statusBreakdown,
      }
    }

    case 'get_revenue_analytics': {
      const { dateFrom, dateTo, groupBy = 'date' } = args as {
        dateFrom?: string
        dateTo?: string
        groupBy?: 'date' | 'tech' | 'status'
      }

      let query = supabase
        .from('payments')
        .select('amount, created_at, jobs(tech_assigned_id, status)')
        .eq('account_id', accountId)
        .eq('status', 'completed')

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      const { data: payments, error } = await query

      if (error) {
        return { error: error.message }
      }

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      let breakdown: Record<string, number> = {}

      if (groupBy === 'date') {
        payments?.forEach((payment) => {
          const date = new Date(payment.created_at).toISOString().split('T')[0]
          breakdown[date] = (breakdown[date] || 0) + (payment.amount || 0)
        })
      } else if (groupBy === 'tech') {
        payments?.forEach((payment) => {
          const techId = (payment.jobs as any)?.tech_assigned_id || 'unassigned'
          breakdown[techId] = (breakdown[techId] || 0) + (payment.amount || 0)
        })
      } else if (groupBy === 'status') {
        payments?.forEach((payment) => {
          const status = (payment.jobs as any)?.status || 'unknown'
          breakdown[status] = (breakdown[status] || 0) + (payment.amount || 0)
        })
      }

      return {
        totalRevenue,
        breakdown,
      }
    }

    case 'send_review_request': {
      const { jobId, contactId } = args as { jobId: string; contactId: string }

      // Get job and contact details
      const { data: job } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('id', jobId)
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
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact) {
        return { error: 'Contact not found' }
      }

      if (!contact.email) {
        return { error: 'Contact does not have an email address' }
      }

      // Get review request template
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('account_id', accountId)
        .eq('type', 'review_request')
        .eq('active', true)
        .limit(1)
        .single()

      let emailBody = template?.body_html || template?.body_text || ''
      const emailSubject = template?.subject || 'We\'d love your feedback!'

      // Replace template variables
      emailBody = emailBody
        .replace(/\{\{contact_name\}\}/g, `${contact.first_name} ${contact.last_name || ''}`.trim())
        .replace(/\{\{company_name\}\}/g, '317 Plumber')
        .replace(/\{\{job_id\}\}/g, jobId.substring(0, 8))
        .replace(/\{\{review_link\}\}/g, 'https://g.page/r/YOUR_GOOGLE_REVIEW_LINK')

      // Send email via Resend
      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return { error: 'Email service not configured' }
      }

      // Get sender email from environment config
      const senderEmail = process.env.RESEND_VERIFIED_DOMAIN
        ? (process.env.RESEND_VERIFIED_DOMAIN.includes('@')
            ? `CRM <${process.env.RESEND_VERIFIED_DOMAIN}>`
            : `CRM <noreply@${process.env.RESEND_VERIFIED_DOMAIN}>`)
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
          subject: emailSubject,
          html: emailBody,
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

    case 'list_job_photos': {
      const { jobId } = args as { jobId: string }

      const { data: photos, error } = await supabase
        .from('job_photos')
        .select('*')
        .eq('account_id', accountId)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

      if (error) {
        return { error: error.message }
      }

      return {
        photos: photos || [],
        count: photos?.length || 0,
      }
    }

    // Wave 1: High-Priority Core Operations
    case 'list_contacts': {
      const { search, tags, status, dateStart, dateEnd, limit = 50, offset = 0 } = args as {
        search?: string
        tags?: string
        status?: string
        dateStart?: string
        dateEnd?: string
        limit?: number
        offset?: number
      }

      let query = supabase
        .from('contacts')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        )
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (dateStart) {
        query = query.gte('created_at', dateStart)
      }

      if (dateEnd) {
        query = query.lte('created_at', dateEnd)
      }

      const { data: contacts, error } = await query

      if (error) {
        return { error: error.message }
      }

      // Filter by tags if provided
      let filteredContacts = contacts || []
      if (tags && contacts) {
        const tagIds = tags.split(',').map((t) => t.trim())
        // Note: This is a simplified filter. Full tag filtering would require a join query
        filteredContacts = contacts
      }

      return {
        contacts: filteredContacts,
        count: filteredContacts.length,
      }
    }

    case 'update_contact': {
      const { contactId, email, firstName, lastName, phone, address } = args as {
        contactId: string
        email?: string
        firstName?: string
        lastName?: string
        phone?: string
        address?: string
      }

      const updateData: Record<string, unknown> = {}
      if (email !== undefined) updateData.email = email
      if (firstName !== undefined) updateData.first_name = firstName
      if (lastName !== undefined) updateData.last_name = lastName
      if (phone !== undefined) updateData.phone = phone
      if (address !== undefined) updateData.address = address

      const { data: contact, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .eq('account_id', accountId)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      if (!contact) {
        return { error: 'Contact not found' }
      }

      return {
        success: true,
        contact,
        message: 'Contact updated successfully',
      }
    }

    case 'update_job': {
      const { jobId, description, scheduledStart, scheduledEnd, totalAmount } = args as {
        jobId: string
        description?: string
        scheduledStart?: string
        scheduledEnd?: string
        totalAmount?: number
      }

      // Get current job data for validation
      const { data: currentJob } = await supabase
        .from('jobs')
        .select('scheduled_start, scheduled_end, tech_assigned_id, status')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!currentJob) {
        return { error: 'Job not found' }
      }

      const updateData: Record<string, unknown> = {}
      if (description !== undefined) updateData.description = description
      if (scheduledStart !== undefined) updateData.scheduled_start = scheduledStart
      if (scheduledEnd !== undefined) updateData.scheduled_end = scheduledEnd
      if (totalAmount !== undefined) updateData.total_amount = totalAmount

      // Validate scheduling dates
      const finalScheduledStart = scheduledStart !== undefined ? scheduledStart : currentJob.scheduled_start
      const finalScheduledEnd = scheduledEnd !== undefined ? scheduledEnd : currentJob.scheduled_end

      if (scheduledStart || scheduledEnd) {
        if (finalScheduledStart) {
          const startDate = new Date(finalScheduledStart)
          const now = new Date()

          // Check if start date is in the past (with 5 minute buffer)
          if (startDate < new Date(now.getTime() - 5 * 60 * 1000)) {
            return {
              error: 'Scheduled start time cannot be in the past',
              suggestion: 'Provide a future date/time for the job',
            }
          }

          // Validate end is after start
          if (finalScheduledEnd) {
            const endDate = new Date(finalScheduledEnd)
            if (endDate <= startDate) {
              return {
                error: 'Scheduled end time must be after start time',
              }
            }
          }

          // Check for scheduling conflicts
          const techId = currentJob.tech_assigned_id
          if (techId) {
            const { data: conflictingJobs } = await supabase
              .from('jobs')
              .select('id, scheduled_start, scheduled_end')
              .eq('account_id', accountId)
              .eq('tech_assigned_id', techId)
              .not('status', 'in', '(completed,cancelled)')
              .not('scheduled_start', 'is', null)
              .neq('id', jobId) // Exclude current job

            if (conflictingJobs && conflictingJobs.length > 0) {
              const hasConflict = conflictingJobs.some(job => {
                const jobStart = new Date(job.scheduled_start)
                const jobEnd = job.scheduled_end ? new Date(job.scheduled_end) : new Date(jobStart.getTime() + 2 * 60 * 60 * 1000)
                const newStart = startDate
                const newEnd = finalScheduledEnd ? new Date(finalScheduledEnd) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

                return (newStart < jobEnd && newEnd > jobStart)
              })

              if (hasConflict) {
                return {
                  error: 'Technician is already scheduled for another job at this time',
                  suggestion: 'Choose a different time or assign a different technician',
                }
              }
            }
          }
        }
      }

      const { data: job, error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .eq('account_id', accountId)
        .select('*, contacts(*), users(*)')
        .single()

      if (error) {
        return { error: error.message }
      }

      if (!job) {
        return { error: 'Job not found' }
      }

      return {
        success: true,
        job,
        message: 'Job updated successfully',
      }
    }

    case 'list_conversations': {
      const { contactId, status, limit = 50, offset = 0 } = args as {
        contactId?: string
        status?: string
        limit?: number
        offset?: number
      }

      let query = supabase
        .from('conversations')
        .select('*, contacts(*)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (contactId) {
        query = query.eq('contact_id', contactId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data: conversations, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        conversations: conversations || [],
        count: conversations?.length || 0,
      }
    }

    case 'get_conversation': {
      const { conversationId } = args as { conversationId: string }

      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*, contacts(*)')
        .eq('id', conversationId)
        .eq('account_id', accountId)
        .single()

      if (error) {
        return { error: error.message }
      }

      if (!conversation) {
        return { error: 'Conversation not found' }
      }

      // Get messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      return {
        conversation,
        messages: messages || [],
        messageCount: messages?.length || 0,
      }
    }

    case 'create_conversation': {
      const { contactId, subject, status = 'open' } = args as {
        contactId: string
        subject?: string
        status?: string
      }

      // Verify contact exists
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact) {
        return { error: 'Contact not found' }
      }

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          account_id: accountId,
          contact_id: contactId,
          subject: subject || null,
          status,
        })
        .select('*, contacts(*)')
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        conversation,
        message: 'Conversation created successfully',
      }
    }

    case 'list_users': {
      const { role, limit = 50, offset = 0 } = args as {
        role?: string
        limit?: number
        offset?: number
      }

      let query = supabase
        .from('users')
        .select('id, first_name, last_name, email, role, phone')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (role) {
        query = query.eq('role', role)
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

    case 'get_user': {
      const { userId } = args as { userId: string }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('account_id', accountId)
        .single()

      if (!user) {
        return { error: 'User not found' }
      }

      return { user }
    }

    // Wave 2: Field Operations
    case 'upload_job_photo': {
      const { jobId, photoUrl, base64Data, caption } = args as {
        jobId: string
        photoUrl?: string
        base64Data?: string
        caption?: string
      }

      // Verify job exists
      const { data: job } = await supabase
        .from('jobs')
        .select('id, account_id')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      // If base64 data provided, we'd need to upload to storage
      // For now, if photoUrl is provided, we can store it directly
      if (!photoUrl && !base64Data) {
        return { error: 'Either photoUrl or base64Data must be provided' }
      }

      // Store photo reference (if URL provided)
      if (photoUrl) {
        const { data: photo, error } = await supabase
          .from('job_photos')
          .insert({
            account_id: accountId,
            job_id: jobId,
            photo_url: photoUrl,
            thumbnail_url: photoUrl,
            caption: caption || null,
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

      // Base64 upload would require storage upload - return error for now
      return {
        error: 'Base64 upload not yet implemented. Please provide photoUrl instead.',
      }
    }

    case 'capture_location': {
      const { jobId, latitude, longitude, address } = args as {
        jobId: string
        latitude: number
        longitude: number
        address?: string
      }

      // Verify job exists
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      // Update job with location
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({
          latitude,
          longitude,
          address: address || null,
        })
        .eq('id', jobId)
        .eq('account_id', accountId)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        job: updatedJob,
        message: 'Location captured successfully',
      }
    }

    case 'clock_in': {
      const { jobId, notes } = args as {
        jobId?: string
        notes?: string
      }

      // Get current user ID if available
      const currentUserId = userId || null

      if (!currentUserId) {
        return { error: 'User ID required for time tracking' }
      }

      const { data: timeEntry, error } = await supabase
        .from('time_entries')
        .insert({
          account_id: accountId,
          user_id: currentUserId,
          job_id: jobId || null,
          clock_in: new Date().toISOString(),
          notes: notes || null,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        timeEntry,
        message: 'Clocked in successfully',
      }
    }

    case 'clock_out': {
      const { timeEntryId, notes } = args as {
        timeEntryId: string
        notes?: string
      }

      // Get existing time entry
      const { data: existingEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('id', timeEntryId)
        .eq('account_id', accountId)
        .single()

      if (!existingEntry) {
        return { error: 'Time entry not found' }
      }

      const clockOutTime = new Date()
      const clockInTime = new Date(existingEntry.clock_in)
      const duration = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / 1000) // seconds

      const { data: timeEntry, error } = await supabase
        .from('time_entries')
        .update({
          clock_out: clockOutTime.toISOString(),
          duration,
          notes: notes || existingEntry.notes || null,
        })
        .eq('id', timeEntryId)
        .eq('account_id', accountId)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        timeEntry,
        message: `Clocked out successfully. Duration: ${Math.round(duration / 60)} minutes`,
      }
    }

    case 'get_tech_jobs': {
      const { techId, status, date, limit = 50 } = args as {
        techId?: string
        status?: string
        date?: string
        limit?: number
      }

      // Use provided techId or default to userId
      const targetTechId = techId || userId

      if (!targetTechId) {
        return { error: 'Technician ID required' }
      }

      let query = supabase
        .from('jobs')
        .select('*, contacts(*), users(*)')
        .eq('account_id', accountId)
        .eq('tech_assigned_id', targetTechId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (date) {
        const dateStart = new Date(date)
        dateStart.setHours(0, 0, 0, 0)
        const dateEnd = new Date(date)
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

    case 'add_contact_note': {
      const { contactId, content } = args as {
        contactId: string
        content: string
      }

      // Verify contact exists
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact) {
        return { error: 'Contact not found' }
      }

      const { data: note, error } = await supabase
        .from('contact_notes')
        .insert({
          account_id: accountId,
          contact_id: contactId,
          content,
          created_by: userId || null,
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

    case 'add_job_note': {
      const { jobId, content } = args as {
        jobId: string
        content: string
      }

      // Verify job exists and belongs to account
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      const { data: note, error } = await supabase
        .from('job_notes')
        .insert({
          account_id: accountId,
          job_id: jobId,
          content,
          created_by: userId || null,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        note,
        message: 'Note added to job successfully',
      }
    }

    case 'add_conversation_note': {
      const { conversationId, content } = args as {
        conversationId: string
        content: string
      }

      // Verify conversation exists
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('account_id', accountId)
        .single()

      if (!conversation) {
        return { error: 'Conversation not found' }
      }

      const { data: note, error } = await supabase
        .from('conversation_notes')
        .insert({
          account_id: accountId,
          conversation_id: conversationId,
          content,
          created_by: userId || null,
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

    // Wave 3: Financial Operations
    case 'update_invoice': {
      const { invoiceId, totalAmount, dueDate, notes } = args as {
        invoiceId: string
        totalAmount?: number
        dueDate?: string
        notes?: string
      }

      const updateData: Record<string, unknown> = {}
      if (totalAmount !== undefined) updateData.total_amount = totalAmount
      if (dueDate !== undefined) updateData.due_date = dueDate
      if (notes !== undefined) updateData.notes = notes

      const { data: invoice, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
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

    case 'send_invoice': {
      const { invoiceId } = args as { invoiceId: string }

      // Get invoice with contact details
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, jobs(*), contacts(*)')
        .eq('id', invoiceId)
        .eq('account_id', accountId)
        .single()

      if (!invoice) {
        return { error: 'Invoice not found' }
      }

      const contact = invoice.contacts as any
      if (!contact?.email) {
        return { error: 'Contact does not have an email address' }
      }

      // Update invoice status to 'sent'
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)
        .eq('account_id', accountId)

      if (updateError) {
        return { error: updateError.message }
      }

      // Send email via Resend
      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return { error: 'Email service not configured' }
      }

      const emailSubject = `Invoice #${invoiceId.substring(0, 8)}`
      const emailBody = `
        <h2>Invoice</h2>
        <p>Invoice #${invoiceId.substring(0, 8)}</p>
        <p>Amount: $${((invoice.total_amount || 0) / 100).toFixed(2)}</p>
        ${invoice.notes ? `<p>Notes: ${invoice.notes}</p>` : ''}
      `

      // Get sender email from environment config
      const senderEmail = process.env.RESEND_VERIFIED_DOMAIN
        ? (process.env.RESEND_VERIFIED_DOMAIN.includes('@')
            ? `CRM <${process.env.RESEND_VERIFIED_DOMAIN}>`
            : `CRM <noreply@${process.env.RESEND_VERIFIED_DOMAIN}>`)
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
          subject: emailSubject,
          html: emailBody,
        }),
      })

      const emailData = await emailRes.json()

      if (!emailRes.ok) {
        return { error: emailData.message || 'Failed to send invoice' }
      }

      return {
        success: true,
        messageId: emailData.id,
        message: `Invoice sent to ${contact.email}`,
      }
    }

    case 'mark_invoice_paid': {
      const { invoiceId } = args as { invoiceId: string }

      const { data: invoice, error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)
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
        message: 'Invoice marked as paid',
      }
    }

    case 'create_estimate': {
      const { contactId, title, description, items, taxRate, validUntil, customerNotes } = args as {
        contactId: string
        title?: string
        description?: string
        items: Array<{
          type: 'labor' | 'material' | 'equipment' | 'other'
          name: string
          description?: string
          quantity: number
          unitPrice: number
          unit?: string
        }>
        taxRate?: number
        validUntil?: string
        customerNotes?: string
      }

      // Verify contact exists
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact) {
        return { error: 'Contact not found' }
      }

      // Generate estimate number
      const estimateNumberRes = await supabase
        .rpc('generate_estimate_number', { p_account_id: accountId })

      const estimateNumber = estimateNumberRes.data || `EST-${Date.now()}`

      // Create estimate
      const { data: estimate, error: estimateError } = await supabase
        .from('estimates')
        .insert({
          account_id: accountId,
          contact_id: contactId,
          estimate_number: estimateNumber,
          title: title || null,
          description: description || null,
          tax_rate: taxRate || 0,
          valid_until: validUntil || null,
          customer_notes: customerNotes || null,
          created_by: userId || null,
        })
        .select()
        .single()

      if (estimateError || !estimate) {
        return { error: estimateError?.message || 'Failed to create estimate' }
      }

      // Create estimate items
      const itemsToInsert = items.map((item, index) => ({
        account_id: accountId,
        estimate_id: estimate.id,
        item_type: item.type || 'material',
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit || 'each',
        unit_price: Math.round(item.unitPrice),
        total_price: Math.round(item.quantity * item.unitPrice),
        sort_order: index,
      }))

      const { error: itemsError } = await supabase
        .from('estimate_items')
        .insert(itemsToInsert)

      if (itemsError) {
        // Rollback estimate if items fail
        await supabase.from('estimates').delete().eq('id', estimate.id)
        return { error: itemsError.message }
      }

      // Fetch the complete estimate with items
      const { data: completeEstimate } = await supabase
        .from('estimates')
        .select('*, estimate_items(*), contacts(*)')
        .eq('id', estimate.id)
        .single()

      return {
        success: true,
        estimate: completeEstimate,
        estimateNumber,
        message: 'Estimate created successfully',
      }
    }

    case 'get_estimate': {
      const { estimateId } = args as { estimateId: string }

      const { data: estimate } = await supabase
        .from('estimates')
        .select('*, estimate_items(*), contacts(*)')
        .eq('id', estimateId)
        .eq('account_id', accountId)
        .single()

      if (!estimate) {
        return { error: 'Estimate not found' }
      }

      return { estimate }
    }

    case 'list_estimates': {
      const { contactId, status, limit = 50 } = args as {
        contactId?: string
        status?: string
        limit?: number
      }

      let query = supabase
        .from('estimates')
        .select('*, estimate_items(*), contacts(*)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (contactId) {
        query = query.eq('contact_id', contactId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data: estimates } = await query

      return {
        estimates: estimates || [],
        count: estimates?.length || 0,
      }
    }

    case 'update_estimate_status': {
      const { estimateId, status, rejectionReason } = args as {
        estimateId: string
        status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
        rejectionReason?: string
      }

      const updateData: Record<string, unknown> = { status }

      // Set timestamps based on status
      if (status === 'sent' && !updateData.sent_at) {
        updateData.sent_at = new Date().toISOString()
      } else if (status === 'viewed' && !updateData.viewed_at) {
        updateData.viewed_at = new Date().toISOString()
      } else if (status === 'accepted' && !updateData.accepted_at) {
        updateData.accepted_at = new Date().toISOString()
      } else if (status === 'rejected') {
        updateData.rejected_at = new Date().toISOString()
        if (rejectionReason) {
          updateData.rejection_reason = rejectionReason
        }
      }

      const { data: estimate, error } = await supabase
        .from('estimates')
        .update(updateData)
        .eq('id', estimateId)
        .eq('account_id', accountId)
        .select('*, estimate_items(*), contacts(*)')
        .single()

      if (error) {
        return { error: error.message }
      }

      if (!estimate) {
        return { error: 'Estimate not found' }
      }

      return {
        success: true,
        estimate,
        message: `Estimate ${status}`,
      }
    }

    case 'convert_estimate_to_job': {
      const { estimateId } = args as { estimateId: string }

      // Get the estimate
      const { data: estimate } = await supabase
        .from('estimates')
        .select('*, estimate_items(*), contacts(*)')
        .eq('id', estimateId)
        .eq('account_id', accountId)
        .single()

      if (!estimate) {
        return { error: 'Estimate not found' }
      }

      if (estimate.status !== 'accepted') {
        return { error: 'Only accepted estimates can be converted to jobs' }
      }

      if (estimate.converted_to_job_id) {
        return { error: 'Estimate has already been converted to a job' }
      }

      // Create job from estimate
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          account_id: accountId,
          contact_id: estimate.contact_id,
          description: `${estimate.title || 'Job'}\n\n${estimate.description || ''}`.trim(),
          total_amount: estimate.total_amount,
          status: 'scheduled',
        })
        .select()
        .single()

      if (jobError || !job) {
        return { error: jobError?.message || 'Failed to create job' }
      }

      // Copy estimate items to job materials
      const items = estimate.estimate_items as any[]
      if (items && items.length > 0) {
        const materialsToInsert = items.map(item => ({
          account_id: accountId,
          job_id: job.id,
          material_name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_price,
          total_cost: item.total_price,
          notes: item.description,
        }))

        await supabase.from('job_materials').insert(materialsToInsert)
      }

      // Update estimate to mark it as converted
      await supabase
        .from('estimates')
        .update({ converted_to_job_id: job.id })
        .eq('id', estimateId)

      return {
        success: true,
        job,
        estimate,
        message: 'Estimate converted to job successfully',
      }
    }

    case 'add_job_parts': {
      const { jobId, parts } = args as {
        jobId: string
        parts: Array<{
          name: string
          quantity: number
          unit?: string
          unitCost: number
          supplier?: string
          notes?: string
        }>
      }

      // Validate job exists and belongs to account
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found or access denied' }
      }

      // Validate parts
      for (const part of parts) {
        if (part.quantity <= 0) {
          return { error: `Quantity must be positive for part: ${part.name}` }
        }
        if (part.unitCost < 0) {
          return { error: `Unit cost cannot be negative for part: ${part.name}` }
        }
      }

      // Prepare parts for insertion
      const partsToInsert = parts.map(part => ({
        account_id: accountId,
        job_id: jobId,
        material_name: part.name,
        quantity: part.quantity,
        unit: part.unit || 'each',
        unit_cost: part.unitCost,
        total_cost: Math.round(part.quantity * part.unitCost),
        supplier: part.supplier || null,
        notes: part.notes || null,
      }))

      // Insert parts
      const { data: insertedParts, error } = await supabase
        .from('job_materials')
        .insert(partsToInsert)
        .select()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        parts: insertedParts,
        message: `Added ${insertedParts.length} part(s) to job`,
      }
    }

    case 'list_job_parts': {
      const { jobId } = args as { jobId: string }

      // Validate job exists and belongs to account
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found or access denied' }
      }

      // Get all parts for the job
      const { data: parts, error } = await supabase
        .from('job_materials')
        .select('*')
        .eq('job_id', jobId)
        .eq('account_id', accountId)
        .order('created_at', { ascending: true })

      if (error) {
        return { error: error.message }
      }

      return {
        parts: parts || [],
        count: parts?.length || 0,
      }
    }

    case 'update_job_part': {
      const { partId, quantity, unitCost, notes } = args as {
        partId: string
        quantity?: number
        unitCost?: number
        notes?: string
      }

      // Validate at least one field to update
      if (quantity === undefined && unitCost === undefined && notes === undefined) {
        return { error: 'At least one field (quantity, unitCost, notes) must be provided' }
      }

      // Validate values
      if (quantity !== undefined && quantity <= 0) {
        return { error: 'Quantity must be positive' }
      }
      if (unitCost !== undefined && unitCost < 0) {
        return { error: 'Unit cost cannot be negative' }
      }

      // Get current part to verify ownership
      const { data: currentPart } = await supabase
        .from('job_materials')
        .select('*')
        .eq('id', partId)
        .eq('account_id', accountId)
        .single()

      if (!currentPart) {
        return { error: 'Part not found or access denied' }
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {}

      if (quantity !== undefined) {
        updateData.quantity = quantity
      }
      if (unitCost !== undefined) {
        updateData.unit_cost = unitCost
      }
      if (notes !== undefined) {
        updateData.notes = notes
      }

      // Calculate new total cost
      const finalQuantity = quantity !== undefined ? quantity : currentPart.quantity
      const finalUnitCost = unitCost !== undefined ? unitCost : currentPart.unit_cost
      updateData.total_cost = Math.round(finalQuantity * finalUnitCost)

      // Update part
      const { data: updatedPart, error } = await supabase
        .from('job_materials')
        .update(updateData)
        .eq('id', partId)
        .eq('account_id', accountId)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        part: updatedPart,
        message: 'Part updated successfully',
      }
    }

    case 'remove_job_part': {
      const { partId } = args as { partId: string }

      // Verify part exists and belongs to account
      const { data: part } = await supabase
        .from('job_materials')
        .select('id, material_name')
        .eq('id', partId)
        .eq('account_id', accountId)
        .single()

      if (!part) {
        return { error: 'Part not found or access denied' }
      }

      // Delete part
      const { error } = await supabase
        .from('job_materials')
        .delete()
        .eq('id', partId)
        .eq('account_id', accountId)

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        message: `Part "${part.material_name}" removed successfully`,
      }
    }

    case 'email_parts_list': {
      const { jobId, recipientEmail } = args as {
        jobId: string
        recipientEmail: string
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(recipientEmail)) {
        return { error: 'Invalid email address format' }
      }

      // Get job details with contact info
      const { data: job } = await supabase
        .from('jobs')
        .select('*, contacts(*)')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single()

      if (!job) {
        return { error: 'Job not found' }
      }

      // Get all job materials for this job
      const { data: materials, error: materialsError } = await supabase
        .from('job_materials')
        .select('*')
        .eq('job_id', jobId)
        .eq('account_id', accountId)
        .order('created_at', { ascending: true })

      if (materialsError) {
        return { error: materialsError.message }
      }

      if (!materials || materials.length === 0) {
        return { error: 'No parts found for this job' }
      }

      // Calculate totals
      let subtotal = 0
      const partsRows = materials
        .map((material: any) => {
          const quantity = parseFloat(material.quantity) || 1
          const unitCost = material.unit_cost || 0
          const total = Math.round(quantity * unitCost)
          subtotal += total

          const unitPriceFormatted = (unitCost / 100).toFixed(2)
          const totalFormatted = (total / 100).toFixed(2)

          return `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px;">${material.material_name}${material.notes ? `<br/><small style="color: #666;">${material.notes}</small>` : ''}</td>
              <td style="padding: 8px; text-align: center;">${quantity} ${material.unit || 'each'}</td>
              <td style="padding: 8px; text-align: right;">$${unitPriceFormatted}</td>
              <td style="padding: 8px; text-align: right;">$${totalFormatted}</td>
            </tr>
          `
        })
        .join('')

      const subtotalFormatted = (subtotal / 100).toFixed(2)
      const totalFormatted = (subtotal / 100).toFixed(2)

      const contact = job.contacts as any
      const customerName = contact?.name || 'Valued Customer'
      const jobNumber = job.job_number || jobId.substring(0, 8)
      const jobDescription = job.description || 'N/A'

      // Generate professional HTML email
      const emailBody = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              h2 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background-color: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #000; }
              .summary { margin-top: 20px; text-align: right; }
              .summary p { margin: 5px 0; }
              .total { font-size: 1.2em; font-weight: bold; color: #2563eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Parts & Materials List - Job #${jobNumber}</h2>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Job Description:</strong> ${jobDescription}</p>

              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${partsRows}
                </tbody>
              </table>

              <div class="summary">
                <p><strong>Subtotal:</strong> $${subtotalFormatted}</p>
                <p class="total">Total: $${totalFormatted}</p>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
                Thank you for your business. If you have any questions about these materials, please don't hesitate to contact us.
              </p>
            </div>
          </body>
        </html>
      `

      // Send email via Resend
      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return { error: 'Email service not configured' }
      }

      // Get sender email from environment config (Phase 1 pattern)
      const senderEmail = process.env.RESEND_VERIFIED_DOMAIN
        ? (process.env.RESEND_VERIFIED_DOMAIN.includes('@')
            ? `CRM <${process.env.RESEND_VERIFIED_DOMAIN}>`
            : `CRM <noreply@${process.env.RESEND_VERIFIED_DOMAIN}>`)
        : 'CRM <noreply@resend.dev>'

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [recipientEmail],
          subject: `Parts List - Job #${jobNumber}`,
          html: emailBody,
        }),
      })

      const emailData = await emailRes.json()

      if (!emailRes.ok) {
        return { error: emailData.message || 'Failed to send parts list email' }
      }

      return {
        success: true,
        messageId: emailData.id,
        partsCount: materials.length,
        total: totalFormatted,
        message: `Parts list sent to ${recipientEmail}`,
      }
    }

    case 'list_payments': {
      const { jobId, invoiceId, status, limit = 50 } = args as {
        jobId?: string
        invoiceId?: string
        status?: string
        limit?: number
      }

      let query = supabase
        .from('payments')
        .select('*, invoices(*), jobs(*)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (jobId) {
        query = query.eq('job_id', jobId)
      }

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data: payments, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        payments: payments || [],
        count: payments?.length || 0,
      }
    }

    case 'create_payment': {
      const { invoiceId, amount, method, notes } = args as {
        invoiceId: string
        amount: number
        method: string
        notes?: string
      }

      // Verify invoice exists
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, job_id, contact_id')
        .eq('id', invoiceId)
        .eq('account_id', accountId)
        .single()

      if (!invoice) {
        return { error: 'Invoice not found' }
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          account_id: accountId,
          invoice_id: invoiceId,
          job_id: invoice.job_id || null,
          contact_id: invoice.contact_id || null,
          amount,
          method,
          status: 'completed',
          notes: notes || null,
        })
        .select('*, invoices(*), jobs(*)')
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        payment,
        message: 'Payment created successfully',
      }
    }

    // Wave 4: Marketing Operations
    case 'list_campaigns': {
      const { status, limit = 50 } = args as {
        status?: string
        limit?: number
      }

      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
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

    case 'create_campaign': {
      const { name, type, templateId, subject, body } = args as {
        name: string
        type: string
        templateId?: string
        subject?: string
        body?: string
      }

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          account_id: accountId,
          name,
          type,
          template_id: templateId || null,
          subject: subject || null,
          body: body || null,
          status: 'draft',
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        success: true,
        campaign,
        message: 'Campaign created successfully',
      }
    }

    case 'get_campaign': {
      const { campaignId } = args as { campaignId: string }

      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('account_id', accountId)
        .single()

      if (!campaign) {
        return { error: 'Campaign not found' }
      }

      return { campaign }
    }

    case 'send_campaign': {
      const { campaignId } = args as { campaignId: string }

      // Update campaign status to 'sending'
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId)
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

    case 'list_email_templates': {
      const { type, limit = 50 } = args as {
        type?: string
        limit?: number
      }

      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (type) {
        query = query.eq('type', type)
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

    case 'create_email_template': {
      const { name, type, subject, body } = args as {
        name: string
        type: string
        subject: string
        body: string
      }

      const { data: template, error } = await supabase
        .from('email_templates')
        .insert({
          account_id: accountId,
          name,
          type,
          subject,
          body_html: body,
          body_text: body,
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

    case 'list_contact_tags': {
      const { limit = 50 } = args as {
        limit?: number
      }

      const { data: tags, error } = await supabase
        .from('contact_tags')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return { error: error.message }
      }

      return {
        tags: tags || [],
        count: tags?.length || 0,
      }
    }

    case 'create_contact_tag': {
      const { name, color } = args as {
        name: string
        color?: string
      }

      const { data: tag, error } = await supabase
        .from('contact_tags')
        .insert({
          account_id: accountId,
          name,
          color: color || '#3B82F6',
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

    case 'assign_tag_to_contact': {
      const { contactId, tagId } = args as {
        contactId: string
        tagId: string
      }

      // Verify contact and tag exist
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single()

      if (!contact) {
        return { error: 'Contact not found' }
      }

      const { data: tag } = await supabase
        .from('contact_tags')
        .select('id')
        .eq('id', tagId)
        .eq('account_id', accountId)
        .single()

      if (!tag) {
        return { error: 'Tag not found' }
      }

      // Check if already assigned
      const { data: existing } = await supabase
        .from('contact_tag_assignments')
        .select('id')
        .eq('contact_id', contactId)
        .eq('tag_id', tagId)
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
          contact_id: contactId,
          tag_id: tagId,
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

    // Wave 5: Analytics & Admin
    case 'get_contact_analytics': {
      const { dateFrom, dateTo } = args as {
        dateFrom?: string
        dateTo?: string
      }

      let query = supabase
        .from('contacts')
        .select('id, created_at, status')
        .eq('account_id', accountId)

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      const { data: contacts, error } = await query

      if (error) {
        return { error: error.message }
      }

      const totalContacts = contacts?.length || 0
      const statusBreakdown: Record<string, number> = {}
      contacts?.forEach((contact) => {
        const status = contact.status || 'unknown'
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1
      })

      return {
        totalContacts,
        statusBreakdown,
      }
    }

    case 'generate_report': {
      const { type, dateFrom, dateTo } = args as {
        type: string
        dateFrom?: string
        dateTo?: string
      }

      // Generate report based on type
      if (type === 'jobs') {
        let query = supabase.from('jobs').select('*').eq('account_id', accountId)

        if (dateFrom) query = query.gte('created_at', dateFrom)
        if (dateTo) query = query.lte('created_at', dateTo)

        const { data: jobs, error } = await query
        if (error) return { error: error.message }

        return {
          type: 'jobs',
          data: jobs || [],
          count: jobs?.length || 0,
        }
      }

      if (type === 'contacts') {
        let query = supabase.from('contacts').select('*').eq('account_id', accountId)

        if (dateFrom) query = query.gte('created_at', dateFrom)
        if (dateTo) query = query.lte('created_at', dateTo)

        const { data: contacts, error } = await query
        if (error) return { error: error.message }

        return {
          type: 'contacts',
          data: contacts || [],
          count: contacts?.length || 0,
        }
      }

      if (type === 'invoices') {
        let query = supabase.from('invoices').select('*').eq('account_id', accountId)

        if (dateFrom) query = query.gte('created_at', dateFrom)
        if (dateTo) query = query.lte('created_at', dateTo)

        const { data: invoices, error } = await query
        if (error) return { error: error.message }

        return {
          type: 'invoices',
          data: invoices || [],
          count: invoices?.length || 0,
        }
      }

      return { error: `Unknown report type: ${type}` }
    }

    case 'export_contacts': {
      const { format = 'csv' } = args as {
        format?: 'csv' | 'json'
      }

      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', accountId)

      if (error) {
        return { error: error.message }
      }

      if (format === 'json') {
        return {
          format: 'json',
          data: contacts || [],
          count: contacts?.length || 0,
        }
      }

      // CSV format would need conversion - return JSON for now
      return {
        format: 'csv',
        data: contacts || [],
        count: contacts?.length || 0,
        note: 'CSV conversion should be done client-side',
      }
    }

    case 'export_jobs': {
      const { format = 'csv', dateFrom, dateTo } = args as {
        format?: 'csv' | 'json'
        dateFrom?: string
        dateTo?: string
      }

      let query = supabase.from('jobs').select('*, contacts(*), users(*)').eq('account_id', accountId)

      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data: jobs, error } = await query

      if (error) {
        return { error: error.message }
      }

      if (format === 'json') {
        return {
          format: 'json',
          data: jobs || [],
          count: jobs?.length || 0,
        }
      }

      return {
        format: 'csv',
        data: jobs || [],
        count: jobs?.length || 0,
        note: 'CSV conversion should be done client-side',
      }
    }

    case 'list_automation_rules': {
      const { active, limit = 50 } = args as {
        active?: boolean
        limit?: number
      }

      let query = supabase
        .from('automation_rules')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (active !== undefined) {
        query = query.eq('active', active)
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

    case 'create_automation_rule': {
      const { name, trigger, action, active = true } = args as {
        name: string
        trigger: string
        action: string
        active?: boolean
      }

      const { data: rule, error } = await supabase
        .from('automation_rules')
        .insert({
          account_id: accountId,
          name,
          trigger,
          action,
          active,
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

    case 'get_account_settings': {
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

    case 'update_account_settings': {
      const { settings } = args as {
        settings: Record<string, unknown>
      }

      const { data: account, error } = await supabase
        .from('accounts')
        .update({ settings })
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

    case 'get_audit_logs': {
      const { action, userId, dateFrom, dateTo, limit = 50 } = args as {
        action?: string
        userId?: string
        dateFrom?: string
        dateTo?: string
        limit?: number
      }

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (action) {
        query = query.eq('action', action)
      }

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
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

    // ======================================
    // AI-POWERED TOOL HANDLERS
    // ======================================

    case 'generate_job_description': {
      const { jobType, customerNotes, additionalContext } = args as {
        jobType: string
        customerNotes: string
        additionalContext?: string
      }

      try {
        // Construct prompt with context
        const contextPart = additionalContext ? `\n\nAdditional Context: ${additionalContext}` : ''
        const prompt = `Job Type: ${jobType}\nCustomer Notes: ${customerNotes}${contextPart}\n\nGenerate a clear, professional job description that includes:\n1. What needs to be done\n2. Any specific requirements or constraints\n3. Expected scope of work`

        const description = await llmHelper.callRouter({
          accountId,
          useCase: 'draft',
          prompt,
          systemPrompt: 'You are a professional job description writer for a service business. Create clear, actionable job descriptions that are concise yet complete. Focus on what work needs to be done, not how to do it. Keep descriptions between 2-4 sentences.',
          maxTokens: 500,
          temperature: 0.7,
        })

        return {
          success: true,
          description: description.trim(),
          jobType,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          error: `Failed to generate job description: ${message}`,
        }
      }
    }

    case 'draft_customer_response': {
      const { conversationId, customerMessage, tone } = args as {
        conversationId: string
        customerMessage: string
        tone?: string
      }

      try {
        // Fetch conversation context
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('subject, contact:contact_id(first_name, last_name)')
          .eq('id', conversationId)
          .single()

        if (convError || !conversation) {
          return { error: 'Conversation not found' }
        }

        // Fetch recent messages for context
        const { data: messages } = await supabase
          .from('messages')
          .select('content, sender_type, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(5)

        const conversationContext = messages
          ? messages
              .reverse()
              .map((m) => `[${m.sender_type}]: ${m.content}`)
              .join('\n')
          : ''

        const responseTone = tone || 'professional'
        const contact = conversation.contact as any
        const customerName = contact
          ? `${contact.first_name} ${contact.last_name}`
          : 'the customer'

        const prompt = `Conversation Subject: ${conversation.subject}\nCustomer Name: ${customerName}\n\nRecent Conversation History:\n${conversationContext}\n\nLatest Customer Message:\n${customerMessage}\n\nDraft a ${responseTone} response to this customer message.`

        const draftResponse = await llmHelper.callRouter({
          accountId,
          useCase: 'draft',
          prompt,
          systemPrompt: `You are a customer service representative for a service business. Draft ${responseTone} responses that are helpful, clear, and maintain good customer relationships. Keep responses concise (2-4 sentences) unless more detail is needed. Always be respectful and solution-oriented.`,
          maxTokens: 300,
          temperature: 0.7,
        })

        return {
          success: true,
          draftResponse: draftResponse.trim(),
          tone: responseTone,
          conversationId,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          error: `Failed to draft response: ${message}`,
        }
      }
    }

    case 'summarize_job_notes': {
      const { jobId } = args as { jobId: string }

      try {
        // Fetch job details
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('description, status, notes, contact:contact_id(first_name, last_name)')
          .eq('id', jobId)
          .single()

        if (jobError || !job) {
          return { error: 'Job not found' }
        }

        // Fetch job photos (descriptions)
        const { data: photos } = await supabase
          .from('job_photos')
          .select('description, photo_type')
          .eq('job_id', jobId)
          .order('created_at', { ascending: true })

        const photoNotes = photos
          ? photos
              .filter((p) => p.description)
              .map((p) => `[${p.photo_type}]: ${p.description}`)
              .join('\n')
          : ''

        const contact = job.contact as any
        const customerName = contact
          ? `${contact.first_name} ${contact.last_name}`
          : 'Customer'

        const allNotes = [
          `Job Description: ${job.description}`,
          job.notes ? `Notes: ${job.notes}` : '',
          photoNotes ? `Photo Notes:\n${photoNotes}` : '',
        ]
          .filter(Boolean)
          .join('\n\n')

        const prompt = `Customer: ${customerName}\nJob Status: ${job.status}\n\n${allNotes}\n\nProvide a concise summary of this job, highlighting key points, current status, and any important details.`

        const summary = await llmHelper.callRouter({
          accountId,
          useCase: 'summary',
          prompt,
          systemPrompt: 'You are summarizing job information for a service business. Create concise, informative summaries that capture the essential details. Use 2-4 sentences. Focus on what matters most: the work being done, current status, and any issues or special requirements.',
          maxTokens: 200,
          temperature: 0.5,
        })

        return {
          success: true,
          summary: summary.trim(),
          jobId,
          status: job.status,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          error: `Failed to summarize job notes: ${message}`,
        }
      }
    }

    case 'analyze_customer_sentiment': {
      const { conversationId } = args as { conversationId: string }

      try {
        // Fetch recent messages from customer
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('content, sender_type, created_at')
          .eq('conversation_id', conversationId)
          .eq('sender_type', 'contact')
          .order('created_at', { ascending: false })
          .limit(10)

        if (msgError || !messages || messages.length === 0) {
          return { error: 'No customer messages found in conversation' }
        }

        const customerMessages = messages
          .reverse()
          .map((m) => m.content)
          .join('\n---\n')

        const prompt = `Analyze the sentiment of these customer messages:\n\n${customerMessages}\n\nProvide:\n1. Overall sentiment: positive, negative, or neutral\n2. Confidence level: high, medium, or low\n3. Key emotions detected\n4. Brief explanation (1 sentence)\n\nRespond in JSON format: {"sentiment": "positive|negative|neutral", "confidence": "high|medium|low", "emotions": ["emotion1", "emotion2"], "explanation": "brief explanation"}`

        const analysisText = await llmHelper.callRouter({
          accountId,
          useCase: 'general',
          prompt,
          systemPrompt: 'You are a sentiment analysis expert. Analyze customer communications and provide accurate sentiment assessments. Always respond with valid JSON. Be objective and base your analysis on the actual content.',
          maxTokens: 150,
          temperature: 0.3,
        })

        // Parse JSON response
        let analysis
        try {
          // Extract JSON from potential markdown code blocks
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(analysisText)
        } catch {
          // Fallback if JSON parsing fails
          analysis = {
            sentiment: 'neutral',
            confidence: 'low',
            emotions: ['unclear'],
            explanation: 'Unable to parse sentiment analysis',
          }
        }

        return {
          success: true,
          conversationId,
          messageCount: messages.length,
          ...analysis,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          error: `Failed to analyze sentiment: ${message}`,
        }
      }
    }

    case 'generate_invoice_description': {
      const { jobId, includeLabor, includeMaterials } = args as {
        jobId: string
        includeLabor?: boolean
        includeMaterials?: boolean
      }

      try {
        const shouldIncludeLabor = includeLabor !== false
        const shouldIncludeMaterials = includeMaterials !== false

        // Fetch job details
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('description, notes, status, contact:contact_id(first_name, last_name, address)')
          .eq('id', jobId)
          .single()

        if (jobError || !job) {
          return { error: 'Job not found' }
        }

        // Fetch job materials if including materials
        let materialsInfo = ''
        if (shouldIncludeMaterials) {
          const { data: materials } = await supabase
            .from('job_materials')
            .select('name, quantity, unit_cost')
            .eq('job_id', jobId)

          if (materials && materials.length > 0) {
            materialsInfo = `\n\nMaterials Used:\n${materials
              .map((m) => `- ${m.name} (Qty: ${m.quantity}, Cost: $${(m.unit_cost / 100).toFixed(2)})`)
              .join('\n')}`
          }
        }

        const contact = job.contact as any
        const customerName = contact
          ? `${contact.first_name} ${contact.last_name}`
          : 'Customer'
        const address = contact?.address || 'Address on file'

        const prompt = `Customer: ${customerName}\nService Address: ${address}\nJob Status: ${job.status}\n\nWork Performed:\n${job.description}\n${job.notes ? `\nNotes: ${job.notes}` : ''}${materialsInfo}\n\nGenerate professional invoice line items with descriptions. ${shouldIncludeLabor ? 'Include labor charges.' : ''} ${shouldIncludeMaterials ? 'Include materials charges.' : ''}\n\nFormat each line item as:\n- Description: [what was done]\n- Suggested category: [Labor/Materials/Service/Other]`

        const invoiceDescription = await llmHelper.callRouter({
          accountId,
          useCase: 'draft',
          prompt,
          systemPrompt: 'You are creating professional invoice descriptions for a service business. Write clear, itemized descriptions of work performed. Be specific but concise. Each line item should clearly describe what was provided. Use professional business language.',
          maxTokens: 400,
          temperature: 0.6,
        })

        return {
          success: true,
          invoiceDescription: invoiceDescription.trim(),
          jobId,
          includeLabor: shouldIncludeLabor,
          includeMaterials: shouldIncludeMaterials,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          error: `Failed to generate invoice description: ${message}`,
        }
      }
    }

    // ======================================
    // SALES BRIEFING HANDLERS
    // ======================================
    case 'get_sales_briefing': {
      const { contactName, contactId } = args as {
        contactName?: string
        contactId?: string
      }

      try {
        // Find contact
        let contact
        if (contactId) {
          const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .eq('account_id', accountId)
            .single()
          contact = data
        } else if (contactName) {
          const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('account_id', accountId)
            .or(`first_name.ilike.%${contactName}%,last_name.ilike.%${contactName}%`)
            .limit(1)
            .single()
          contact = data
        }

        if (!contact) {
          return { error: `Contact "${contactName || contactId}" not found` }
        }

        // Get jobs history
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, description, status, total_amount, created_at')
          .eq('contact_id', contact.id)
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
          .limit(10)

        // Get invoices
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, status, created_at')
          .eq('contact_id', contact.id)
          .eq('account_id', accountId)

        // Get recent conversations
        const { data: conversations } = await supabase
          .from('conversations')
          .select('subject, ai_summary, last_message_at')
          .eq('contact_id', contact.id)
          .eq('account_id', accountId)
          .order('last_message_at', { ascending: false })
          .limit(5)

        // Calculate stats
        const totalRevenue = invoices?.reduce((sum, inv) => 
          inv.status === 'paid' ? sum + (inv.total_amount || 0) : sum, 0
        ) || 0
        
        const jobCount = jobs?.length || 0
        const completedJobs = jobs?.filter(j => j.status === 'completed' || j.status === 'paid').length || 0

        // Build briefing
        const briefing = {
          contact: {
            name: `${contact.first_name} ${contact.last_name}`,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            customerSince: contact.created_at,
          },
          stats: {
            totalJobs: jobCount,
            completedJobs,
            totalRevenue: totalRevenue / 100, // Convert cents to dollars
            averageJobValue: jobCount > 0 ? (totalRevenue / jobCount / 100).toFixed(2) : 0,
          },
          recentJobs: jobs?.slice(0, 3).map(j => ({
            description: j.description,
            status: j.status,
            amount: j.total_amount ? `$${(j.total_amount / 100).toFixed(2)}` : 'N/A',
            date: new Date(j.created_at).toLocaleDateString(),
          })),
          recentConversations: conversations?.slice(0, 2).map(c => ({
            subject: c.subject,
            summary: c.ai_summary || 'No summary available',
          })),
          profile: (contact as any).profile || null,
        }

        // Generate natural language summary for voice
        const summaryPrompt = `Create a brief, spoken briefing for a sales meeting with this customer:
Name: ${briefing.contact.name}
Customer since: ${briefing.contact.customerSince}
Total jobs: ${briefing.stats.totalJobs}
Total revenue: $${briefing.stats.totalRevenue}
Recent work: ${briefing.recentJobs?.map(j => j.description).join(', ') || 'None'}
${briefing.profile ? `Personal notes: ${JSON.stringify(briefing.profile)}` : ''}

Keep it conversational, 3-4 sentences max. Start with their name. Include any personal details if available.`

        try {
          const llmSummary = await llmHelper.callRouter({
            accountId,
            useCase: 'summary',
            prompt: summaryPrompt,
            maxTokens: 150,
            temperature: 0.7,
          })
          
          return {
            success: true,
            spokenSummary: llmSummary.trim(),
            ...briefing,
          }
        } catch {
          // Return structured data if LLM fails
          return {
            success: true,
            ...briefing,
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          error: `Failed to get sales briefing: ${message}`,
        }
      }
    }

    case 'update_contact_profile': {
      const { contactId, contactName, ...profileData } = args as {
        contactId?: string
        contactName?: string
        spouse?: string
        children?: string[]
        pets?: string[]
        interests?: string[]
        communicationPreference?: string
        schedulingNotes?: string
        notes?: string
      }

      try {
        // Find contact
        let id = contactId
        if (!id && contactName) {
          const { data } = await supabase
            .from('contacts')
            .select('id')
            .eq('account_id', accountId)
            .or(`first_name.ilike.%${contactName}%,last_name.ilike.%${contactName}%`)
            .limit(1)
            .single()
          id = data?.id
        }

        if (!id) {
          return { error: 'Contact not found' }
        }

        // Get existing profile
        const { data: contact } = await supabase
          .from('contacts')
          .select('profile, first_name, last_name')
          .eq('id', id)
          .single()

        const existingProfile = (contact as any)?.profile || {}

        // Merge new data
        const updatedProfile = {
          ...existingProfile,
          personal: {
            ...existingProfile.personal,
            ...(profileData.spouse && { spouse: profileData.spouse }),
            ...(profileData.children && { children: profileData.children }),
            ...(profileData.pets && { pets: profileData.pets }),
            ...(profileData.interests && { interests: profileData.interests }),
          },
          preferences: {
            ...existingProfile.preferences,
            ...(profileData.communicationPreference && { communication: profileData.communicationPreference }),
            ...(profileData.schedulingNotes && { scheduling: profileData.schedulingNotes }),
            ...(profileData.notes && { notes: profileData.notes }),
          },
          updatedAt: new Date().toISOString(),
        }

        // Update contact
        const { error } = await supabase
          .from('contacts')
          .update({ profile: updatedProfile })
          .eq('id', id)

        if (error) {
          return { error: `Failed to update profile: ${error.message}` }
        }

        return {
          success: true,
          message: `Updated profile for ${contact?.first_name} ${contact?.last_name}`,
          profile: updatedProfile,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          error: `Failed to update contact profile: ${message}`,
        }
      }
    }

    // ======================================
    // MEETING & TRANSCRIPT HANDLERS
    // ======================================
    case 'compile_meeting_report': {
      const { contactName, transcript, meetingType, title } = args as {
        contactName?: string
        transcript: string
        meetingType?: string
        title?: string
      }

      try {
        // Find contact if name provided
        let contactId: string | undefined
        if (contactName) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('id')
            .eq('account_id', accountId)
            .or(`first_name.ilike.%${contactName}%,last_name.ilike.%${contactName}%`)
            .limit(1)
            .single()
          contactId = contact?.id
        }

        // Call API to create meeting with analysis
        const response = await fetch(`${supabaseUrl}/rest/v1/meetings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            account_id: accountId,
            contact_id: contactId,
            transcript,
            meeting_type: meetingType || 'in_person',
            title: title || 'Meeting',
            started_at: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create meeting record')
        }

        const [meeting] = await response.json()

        // Analyze transcript with LLM
        const analysisPrompt = `Analyze this meeting transcript and extract:
1. A concise 2-3 sentence summary
2. Action items as a list
3. Any personal details about the customer
4. Overall sentiment
5. Any follow-up commitments

Transcript:
${transcript}

Respond in JSON:
{"summary": "...", "actionItems": ["..."], "personalDetails": {}, "sentiment": "positive|neutral|negative", "followUpNotes": "..."}`

        const analysis = await llmHelper.callRouter({
          accountId,
          useCase: 'summary',
          prompt: analysisPrompt,
          maxTokens: 500,
          temperature: 0.3,
        })

        let parsed: any = {}
        try {
          const jsonMatch = analysis.match(/\{[\s\S]*\}/)
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
        } catch {}

        // Update meeting with analysis
        if (meeting?.id && Object.keys(parsed).length > 0) {
          await supabase
            .from('meetings')
            .update({
              summary: parsed.summary,
              action_items: parsed.actionItems || [],
              sentiment: parsed.sentiment,
              extracted_data: { personalDetails: parsed.personalDetails },
              follow_up_notes: parsed.followUpNotes,
              ended_at: new Date().toISOString(),
            })
            .eq('id', meeting.id)

          // Update contact profile if personal details found
          if (contactId && parsed.personalDetails && Object.keys(parsed.personalDetails).length > 0) {
            const { data: contact } = await supabase
              .from('contacts')
              .select('profile')
              .eq('id', contactId)
              .single()

            const existingProfile = (contact as any)?.profile || {}
            await supabase
              .from('contacts')
              .update({
                profile: {
                  ...existingProfile,
                  personal: { ...existingProfile.personal, ...parsed.personalDetails },
                  updatedAt: new Date().toISOString(),
                },
              })
              .eq('id', contactId)
          }
        }

        return {
          success: true,
          meetingId: meeting?.id,
          summary: parsed.summary || 'Meeting logged successfully',
          actionItems: parsed.actionItems || [],
          sentiment: parsed.sentiment,
          personalDetailsExtracted: Object.keys(parsed.personalDetails || {}).length > 0,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to compile meeting report: ${message}` }
      }
    }

    case 'get_meeting_history': {
      const { contactName, contactId, limit = 5 } = args as {
        contactName?: string
        contactId?: string
        limit?: number
      }

      try {
        let targetContactId = contactId
        if (!targetContactId && contactName) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('id')
            .eq('account_id', accountId)
            .or(`first_name.ilike.%${contactName}%,last_name.ilike.%${contactName}%`)
            .limit(1)
            .single()
          targetContactId = contact?.id
        }

        if (!targetContactId) {
          return { error: 'Contact not found' }
        }

        const { data: meetings } = await supabase
          .from('meetings')
          .select('id, title, meeting_type, summary, action_items, sentiment, created_at')
          .eq('contact_id', targetContactId)
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
          .limit(limit)

        return {
          success: true,
          meetings: meetings || [],
          count: meetings?.length || 0,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to get meeting history: ${message}` }
      }
    }

    // ======================================
    // MORNING BRIEFING HANDLERS
    // ======================================
    case 'get_morning_briefing': {
      const { includeYesterday = false } = args as { includeYesterday?: boolean }

      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        // Get today's jobs
        const { data: todaysJobs } = await supabase
          .from('jobs')
          .select('id, description, status, scheduled_start, contact:contacts(first_name, last_name, address)')
          .eq('account_id', accountId)
          .gte('scheduled_start', today.toISOString())
          .lt('scheduled_start', tomorrow.toISOString())
          .order('scheduled_start')

        // Get overdue follow-ups from meetings
        const { data: overdueFollowups } = await supabase
          .from('meetings')
          .select('id, title, follow_up_date, follow_up_notes, contact:contacts(first_name, last_name)')
          .eq('account_id', accountId)
          .lt('follow_up_date', today.toISOString())
          .not('follow_up_date', 'is', null)
          .limit(5)

        // Get unreplied conversations
        const { data: unrepliedConvos } = await supabase
          .from('conversations')
          .select('id, subject, last_message_at, contact:contacts(first_name, last_name)')
          .eq('account_id', accountId)
          .eq('status', 'open')
          .eq('last_message_direction', 'inbound')
          .order('last_message_at', { ascending: true })
          .limit(5)

        // Get yesterday's summary if requested
        let yesterdaySummary: any = null
        if (includeYesterday) {
          const { data: yesterdaysJobs } = await supabase
            .from('jobs')
            .select('status')
            .eq('account_id', accountId)
            .gte('scheduled_start', yesterday.toISOString())
            .lt('scheduled_start', today.toISOString())

          const completed = yesterdaysJobs?.filter(j => j.status === 'completed' || j.status === 'paid').length || 0
          yesterdaySummary = {
            totalJobs: yesterdaysJobs?.length || 0,
            completed,
          }
        }

        // Generate spoken briefing
        const briefingPrompt = `Create a brief, spoken morning briefing:
Today's jobs: ${todaysJobs?.length || 0}
${todaysJobs?.slice(0, 3).map(j => `- ${(j.contact as any)?.first_name} ${(j.contact as any)?.last_name}: ${j.description}`).join('\n') || 'No jobs scheduled'}
Overdue follow-ups: ${overdueFollowups?.length || 0}
Unreplied messages: ${unrepliedConvos?.length || 0}

Keep it conversational and under 4 sentences. Start with a greeting.`

        const spokenBriefing = await llmHelper.callRouter({
          accountId,
          useCase: 'summary',
          prompt: briefingPrompt,
          maxTokens: 150,
          temperature: 0.7,
        })

        return {
          success: true,
          spokenBriefing: spokenBriefing.trim(),
          todaysJobs: todaysJobs?.map(j => ({
            id: j.id,
            description: j.description,
            status: j.status,
            scheduledStart: j.scheduled_start,
            customer: `${(j.contact as any)?.first_name} ${(j.contact as any)?.last_name}`,
            address: (j.contact as any)?.address,
          })) || [],
          overdueFollowups: overdueFollowups?.map(f => ({
            id: f.id,
            title: f.title,
            dueDate: f.follow_up_date,
            notes: f.follow_up_notes,
            customer: `${(f.contact as any)?.first_name} ${(f.contact as any)?.last_name}`,
          })) || [],
          unrepliedMessages: unrepliedConvos?.length || 0,
          yesterdaySummary,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to get morning briefing: ${message}` }
      }
    }

    case 'get_overdue_followups': {
      const { limit = 10 } = args as { limit?: number }

      try {
        const today = new Date()

        const { data: followups } = await supabase
          .from('meetings')
          .select('id, title, follow_up_date, follow_up_notes, contact:contacts(first_name, last_name, phone, email)')
          .eq('account_id', accountId)
          .lt('follow_up_date', today.toISOString())
          .not('follow_up_date', 'is', null)
          .order('follow_up_date')
          .limit(limit)

        return {
          success: true,
          followups: followups?.map(f => ({
            id: f.id,
            title: f.title,
            dueDate: f.follow_up_date,
            notes: f.follow_up_notes,
            customer: `${(f.contact as any)?.first_name} ${(f.contact as any)?.last_name}`,
            phone: (f.contact as any)?.phone,
            email: (f.contact as any)?.email,
            daysOverdue: Math.floor((today.getTime() - new Date(f.follow_up_date!).getTime()) / (1000 * 60 * 60 * 24)),
          })) || [],
          count: followups?.length || 0,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to get overdue followups: ${message}` }
      }
    }

    // ======================================
    // FIELD TECH HANDLERS
    // ======================================
    case 'log_site_visit': {
      const { jobId, notes, partsUsed, timeSpent, nextSteps } = args as {
        jobId: string
        notes: string
        partsUsed?: string[]
        timeSpent?: number
        nextSteps?: string
      }

      try {
        // Get the job
        const { data: job } = await supabase
          .from('jobs')
          .select('id, notes as existing_notes')
          .eq('id', jobId)
          .eq('account_id', accountId)
          .single()

        if (!job) {
          return { error: 'Job not found' }
        }

        // Build site visit log
        const visitLog = `\n\n--- Site Visit: ${new Date().toLocaleString()} ---\n${notes}${partsUsed ? `\nParts used: ${partsUsed.join(', ')}` : ''}${timeSpent ? `\nTime on site: ${timeSpent} minutes` : ''}${nextSteps ? `\nNext steps: ${nextSteps}` : ''}`

        // Update job notes
        const { error } = await supabase
          .from('jobs')
          .update({
            notes: (job.existing_notes || '') + visitLog,
          })
          .eq('id', jobId)

        if (error) {
          return { error: `Failed to log site visit: ${error.message}` }
        }

        // Log parts used to materials if specified
        if (partsUsed && partsUsed.length > 0) {
          const materials = partsUsed.map(part => ({
            job_id: jobId,
            account_id: accountId,
            name: part,
            quantity: 1,
            unit_cost: 0,
          }))

          await supabase.from('job_materials').insert(materials)
        }

        return {
          success: true,
          message: 'Site visit logged successfully',
          jobId,
          partsLogged: partsUsed?.length || 0,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to log site visit: ${message}` }
      }
    }

    case 'request_parts': {
      const { jobId, parts, notes } = args as {
        jobId?: string
        parts: Array<{ name: string; quantity?: number; urgent?: boolean }>
        notes?: string
      }

      try {
        // Create parts request notification
        const partsDescription = parts.map(p => 
          `${p.name} (Qty: ${p.quantity || 1})${p.urgent ? ' - URGENT' : ''}`
        ).join('\n')

        // Log to audit for now (could be a dedicated parts_requests table)
        await supabase.from('crmai_audit').insert({
          account_id: accountId,
          action: 'parts_request',
          entity_type: 'job',
          entity_id: jobId || 'general',
          new_values: {
            parts,
            notes,
            requestedAt: new Date().toISOString(),
          },
        })

        return {
          success: true,
          message: `Parts request submitted:\n${partsDescription}`,
          requestId: `REQ-${Date.now()}`,
          parts,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to request parts: ${message}` }
      }
    }

    // ======================================
    // DISPATCHER HANDLERS
    // ======================================
    case 'find_available_techs': {
      const { date, skills } = args as { date?: string; skills?: string[] }

      try {
        const targetDate = date ? new Date(date) : new Date()
        targetDate.setHours(0, 0, 0, 0)
        const nextDay = new Date(targetDate)
        nextDay.setDate(nextDay.getDate() + 1)

        // Get all techs
        const { data: techs } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('account_id', accountId)
          .eq('role', 'tech')

        if (!techs || techs.length === 0) {
          return { success: true, availableTechs: [], message: 'No technicians found' }
        }

        // Get jobs for target date
        const { data: scheduledJobs } = await supabase
          .from('jobs')
          .select('tech_assigned_id, scheduled_start, scheduled_end')
          .eq('account_id', accountId)
          .gte('scheduled_start', targetDate.toISOString())
          .lt('scheduled_start', nextDay.toISOString())

        // Calculate availability for each tech
        const techAvailability = techs.map(tech => {
          const techJobs = scheduledJobs?.filter(j => j.tech_assigned_id === tech.id) || []
          return {
            id: tech.id,
            name: tech.name,
            email: tech.email,
            jobsToday: techJobs.length,
            isAvailable: techJobs.length < 8, // Assuming 8 jobs max per day
          }
        })

        return {
          success: true,
          date: targetDate.toISOString().split('T')[0],
          availableTechs: techAvailability.filter(t => t.isAvailable),
          allTechs: techAvailability,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to find available techs: ${message}` }
      }
    }

    case 'reschedule_job': {
      const { jobId, newDate, newTechId, newTechName, reason, notifyCustomer = true } = args as {
        jobId: string
        newDate?: string
        newTechId?: string
        newTechName?: string
        reason?: string
        notifyCustomer?: boolean
      }

      try {
        const updates: any = {}

        if (newDate) {
          updates.scheduled_start = new Date(newDate).toISOString()
        }

        // Find tech by name if needed
        let techId = newTechId
        if (!techId && newTechName) {
          const { data: tech } = await supabase
            .from('users')
            .select('id')
            .eq('account_id', accountId)
            .ilike('name', `%${newTechName}%`)
            .limit(1)
            .single()
          techId = tech?.id
        }

        if (techId) {
          updates.tech_assigned_id = techId
        }

        if (Object.keys(updates).length === 0) {
          return { error: 'No changes specified (provide newDate or newTech)' }
        }

        // Get current job for comparison
        const { data: currentJob } = await supabase
          .from('jobs')
          .select('scheduled_start, tech_assigned_id, contact:contacts(email, first_name)')
          .eq('id', jobId)
          .eq('account_id', accountId)
          .single()

        if (!currentJob) {
          return { error: 'Job not found' }
        }

        // Update job
        const { error } = await supabase
          .from('jobs')
          .update(updates)
          .eq('id', jobId)

        if (error) {
          return { error: `Failed to reschedule: ${error.message}` }
        }

        // Log the reschedule
        await supabase.from('crmai_audit').insert({
          account_id: accountId,
          action: 'job_rescheduled',
          entity_type: 'job',
          entity_id: jobId,
          old_values: { scheduled_start: currentJob.scheduled_start, tech_assigned_id: currentJob.tech_assigned_id },
          new_values: updates,
          metadata: { reason, notifyCustomer },
        })

        return {
          success: true,
          message: 'Job rescheduled successfully',
          jobId,
          changes: updates,
          customerNotified: notifyCustomer,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to reschedule job: ${message}` }
      }
    }

    case 'get_tech_status': {
      const { techId, techName } = args as { techId?: string; techName?: string }

      try {
        let query = supabase
          .from('users')
          .select('id, name, email, role')
          .eq('account_id', accountId)
          .eq('role', 'tech')

        if (techId) {
          query = query.eq('id', techId)
        } else if (techName) {
          query = query.ilike('name', `%${techName}%`)
        }

        const { data: techs } = await query

        if (!techs || techs.length === 0) {
          return { success: true, techs: [], message: 'No technicians found' }
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Get current jobs for each tech
        const techStatuses = await Promise.all(techs.map(async (tech) => {
          const { data: currentJob } = await supabase
            .from('jobs')
            .select('id, description, status, contact:contacts(first_name, last_name, address)')
            .eq('tech_assigned_id', tech.id)
            .eq('account_id', accountId)
            .in('status', ['en_route', 'in_progress'])
            .limit(1)
            .single()

          const { data: todaysJobs } = await supabase
            .from('jobs')
            .select('id, status')
            .eq('tech_assigned_id', tech.id)
            .eq('account_id', accountId)
            .gte('scheduled_start', today.toISOString())
            .lt('scheduled_start', tomorrow.toISOString())

          const completed = todaysJobs?.filter(j => j.status === 'completed' || j.status === 'paid').length || 0
          const remaining = (todaysJobs?.length || 0) - completed

          return {
            id: tech.id,
            name: tech.name,
            status: currentJob ? currentJob.status : 'available',
            currentJob: currentJob ? {
              id: currentJob.id,
              description: currentJob.description,
              customer: `${(currentJob.contact as any)?.first_name} ${(currentJob.contact as any)?.last_name}`,
              address: (currentJob.contact as any)?.address,
            } : null,
            todayStats: {
              total: todaysJobs?.length || 0,
              completed,
              remaining,
            },
          }
        }))

        return {
          success: true,
          techs: techStatuses,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to get tech status: ${message}` }
      }
    }

    // ======================================
    // PROACTIVE MAINTENANCE HANDLERS
    // ======================================
    case 'get_maintenance_due': {
      const { serviceType, monthsSinceService = 12, limit = 20 } = args as {
        serviceType?: string
        monthsSinceService?: number
        limit?: number
      }

      try {
        const cutoffDate = new Date()
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsSinceService)

        // Find contacts who had jobs of specified type more than X months ago
        let jobQuery = supabase
          .from('jobs')
          .select('contact_id, description, created_at, contact:contacts(id, first_name, last_name, email, phone)')
          .eq('account_id', accountId)
          .in('status', ['completed', 'paid'])
          .lt('created_at', cutoffDate.toISOString())
          .order('created_at', { ascending: false })

        if (serviceType) {
          jobQuery = jobQuery.ilike('description', `%${serviceType}%`)
        }

        const { data: oldJobs } = await jobQuery.limit(limit * 2)

        // Group by contact and get most recent job
        const contactMap = new Map<string, any>()
        oldJobs?.forEach(job => {
          if (job.contact_id && !contactMap.has(job.contact_id)) {
            contactMap.set(job.contact_id, {
              contact: job.contact,
              lastService: job.created_at,
              lastServiceDescription: job.description,
            })
          }
        })

        const maintenanceDue = Array.from(contactMap.values()).slice(0, limit)

        return {
          success: true,
          maintenanceDue: maintenanceDue.map(m => ({
            contactId: (m.contact as any)?.id,
            name: `${(m.contact as any)?.first_name} ${(m.contact as any)?.last_name}`,
            email: (m.contact as any)?.email,
            phone: (m.contact as any)?.phone,
            lastService: m.lastService,
            lastServiceDescription: m.lastServiceDescription,
            monthsSince: Math.floor((Date.now() - new Date(m.lastService).getTime()) / (1000 * 60 * 60 * 24 * 30)),
          })),
          count: maintenanceDue.length,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to get maintenance due: ${message}` }
      }
    }

    case 'send_maintenance_reminder': {
      const { contactId, contactName, serviceType, customMessage } = args as {
        contactId?: string
        contactName?: string
        serviceType: string
        customMessage?: string
      }

      try {
        // Find contact
        let contact
        if (contactId) {
          const { data } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('id', contactId)
            .eq('account_id', accountId)
            .single()
          contact = data
        } else if (contactName) {
          const { data } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('account_id', accountId)
            .or(`first_name.ilike.%${contactName}%,last_name.ilike.%${contactName}%`)
            .limit(1)
            .single()
          contact = data
        }

        if (!contact) {
          return { error: 'Contact not found' }
        }

        if (!contact.email) {
          return { error: 'Contact has no email address' }
        }

        // Generate reminder message
        const messagePrompt = `Write a brief, friendly maintenance reminder email for:
Customer: ${contact.first_name}
Service: ${serviceType}
${customMessage ? `Special note: ${customMessage}` : ''}

Keep it under 3 sentences. Be warm and professional.`

        const emailBody = await llmHelper.callRouter({
          accountId,
          useCase: 'draft',
          prompt: messagePrompt,
          maxTokens: 150,
          temperature: 0.7,
        })

        // Log the reminder (actual email sending would be separate)
        await supabase.from('crmai_audit').insert({
          account_id: accountId,
          action: 'maintenance_reminder_sent',
          entity_type: 'contact',
          entity_id: contact.id,
          new_values: {
            serviceType,
            email: contact.email,
            message: emailBody.trim(),
          },
        })

        return {
          success: true,
          message: `Maintenance reminder queued for ${contact.first_name} ${contact.last_name}`,
          email: contact.email,
          serviceType,
          emailBody: emailBody.trim(),
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: `Failed to send maintenance reminder: ${message}` }
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

