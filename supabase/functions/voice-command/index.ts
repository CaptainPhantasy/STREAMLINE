import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface VoiceCommandRequest {
  accountId: string
  transcription: string
  conversationId?: string
  context?: {
    lastJobId?: string
    lastContactId?: string
    lastConversationId?: string
    conversationHistory?: Array<{ role: string; content: string }>
  }
}

// Helper function to convert MCP tools to OpenAI function calling format
function convertMCPToolsToOpenAIFormat(mcpTools: any[]): Record<string, any> {
  const openaiTools: Record<string, any> = {}

  for (const tool of mcpTools) {
    openaiTools[tool.name] = {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema || {
          type: 'object',
          properties: {},
        },
      },
    }
  }

  return openaiTools
}

// Helper function to fetch tools from MCP server
async function fetchMCPTools(supabaseUrl: string, serviceRoleKey: string): Promise<Record<string, any>> {
  try {
    const mcpUrl = getNextApiUrl(supabaseUrl, '/mcp')
    const mcpResponse = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      }),
    })

    if (!mcpResponse.ok) {
      console.error('Failed to fetch MCP tools:', await mcpResponse.text())
      return FALLBACK_AI_TOOLS // Use fallback if MCP server is unavailable
    }

    const mcpData = await mcpResponse.json()

    if (mcpData.error) {
      console.error('MCP server error:', mcpData.error)
      return FALLBACK_AI_TOOLS
    }

    const mcpTools = mcpData.result?.tools || []
    return convertMCPToolsToOpenAIFormat(mcpTools)
  } catch (error) {
    console.error('Error fetching MCP tools:', error)
    return FALLBACK_AI_TOOLS
  }
}

// Helper function to execute tool via MCP server
async function executeMCPTool(
  supabaseUrl: string,
  serviceRoleKey: string,
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  const mcpUrl = getNextApiUrl(supabaseUrl, '/mcp')
  const mcpResponse = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  })

  if (!mcpResponse.ok) {
    throw new Error(`MCP tool execution failed: ${await mcpResponse.text()}`)
  }

  const mcpData = await mcpResponse.json()

  if (mcpData.error) {
    throw new Error(`MCP tool error: ${mcpData.error.message}`)
  }

  // Extract result from MCP response format
  const content = mcpData.result?.content?.[0]
  if (content?.type === 'text') {
    try {
      return JSON.parse(content.text)
    } catch {
      return { result: content.text }
    }
  }

  return mcpData.result
}

// Fallback tools in case MCP server is unavailable (minimal set for critical operations)
// NOTE: These are only used as a last resort if the MCP server is unreachable
const FALLBACK_AI_TOOLS = {
  list_jobs: {
    type: 'function',
    function: {
      name: 'list_jobs',
      description: 'List jobs with optional filters',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status' },
          date: { type: 'string', description: 'Filter by date' },
        },
      },
    },
  },
  list_contacts: {
    type: 'function',
    function: {
      name: 'list_contacts',
      description: 'List contacts with optional search',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search query' },
        },
      },
    },
  },
  create_job: {
    type: 'function',
    function: {
      name: 'create_job',
      description: 'Create a new job/work order for a customer. If contactId is not provided, use contactName to search for the contact.',
      parameters: {
        type: 'object',
        properties: {
          contactId: { type: 'string', description: 'UUID of the contact/customer (optional if contactName provided)' },
          contactName: { type: 'string', description: 'Name of the contact to search for (optional if contactId provided)' },
          description: { type: 'string', description: 'Description of the work to be done' },
          scheduledStart: { type: 'string', description: 'ISO 8601 datetime for scheduled start (optional)' },
          scheduledEnd: { type: 'string', description: 'ISO 8601 datetime for scheduled end (optional)' },
          techAssignedId: { type: 'string', description: 'UUID of assigned technician (optional)' },
        },
        required: ['description'],
      },
    },
  },
  update_job_status: {
    type: 'function',
    function: {
      name: 'update_job_status',
      description: 'Update the status of a job',
      parameters: {
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
  },
  assign_tech: {
    type: 'function',
    function: {
      name: 'assign_tech',
      description: 'Assign a technician to a job',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'UUID of the job' },
          techAssignedId: { type: 'string', description: 'UUID of the technician user' },
        },
        required: ['jobId', 'techAssignedId'],
      },
    },
  },
  search_contacts: {
    type: 'function',
    function: {
      name: 'search_contacts',
      description: 'Search for contacts by name, email, or phone',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search query (name, email, or phone)' },
        },
        required: ['search'],
      },
    },
  },
  get_job: {
    type: 'function',
    function: {
      name: 'get_job',
      description: 'Get details of a specific job',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'UUID of the job' },
        },
        required: ['jobId'],
      },
    },
  },
  send_message: {
    type: 'function',
    function: {
      name: 'send_message',
      description: 'Send a message/email to a contact',
      parameters: {
        type: 'object',
        properties: {
          conversationId: { type: 'string', description: 'UUID of the conversation' },
          message: { type: 'string', description: 'Message content to send' },
          subject: { type: 'string', description: 'Email subject line (optional)' },
        },
        required: ['conversationId', 'message'],
      },
    },
  },
}

// ARCHIVED: Old hardcoded tools - now fetched dynamically from MCP server
// The massive AI_TOOLS object that was here (~850 lines) has been replaced by:
// 1. Dynamic tool fetching from MCP server via fetchMCPTools()
// 2. Minimal FALLBACK_AI_TOOLS above (only used if MCP server is unreachable)
// 3. Tool execution via MCP server's tools/call endpoint
//
// This provides:
// - Single source of truth (MCP tools)
// - All 68 tools available to voice agent (not just 30)
// - Easier maintenance (update tools in one place)
// - Consistent tool definitions across the system
//
// Legacy tool execution code is preserved below for backwards compatibility
// during the migration period.

/* REMOVED OLD TOOLS - NOW USING MCP SERVER
  // Priority 1 - Core Operations
  list_jobs: {
    type: 'function',
    function: {
      name: 'list_jobs',
      description: 'List jobs with optional filters. Use this when user asks "What jobs do I have today?" or "Show me jobs"',
      parameters: {
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
  },
  list_contacts: {
    type: 'function',
    function: {
      name: 'list_contacts',
      description: 'List contacts with optional search and filters. Use this when user asks "Show me all contacts" or "List contacts"',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by name, email, or phone' },
          limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
          offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
        },
      },
    },
  },
  create_contact: {
    type: 'function',
    function: {
      name: 'create_contact',
      description: 'Create a new contact. Use this when user says "Add a new contact named John Smith"',
      parameters: {
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
  },
  update_contact: {
    type: 'function',
    function: {
      name: 'update_contact',
      description: 'Update contact information. Use this when user says "Update John\'s phone number"',
      parameters: {
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
  },
  get_contact: {
    type: 'function',
    function: {
      name: 'get_contact',
      description: 'Get contact details. Use this when user says "Show me John Smith\'s details"',
      parameters: {
        type: 'object',
        properties: {
          contactId: { type: 'string', description: 'UUID of the contact or contact name to search' },
        },
        required: ['contactId'],
      },
    },
  },
  list_conversations: {
    type: 'function',
    function: {
      name: 'list_conversations',
      description: 'List conversations with optional filters. Use this when user asks "What conversations need attention?"',
      parameters: {
        type: 'object',
        properties: {
          contactId: { type: 'string', description: 'Filter by contact ID' },
          status: { type: 'string', description: 'Filter by status (open, closed, snoozed)' },
          limit: { type: 'number', description: 'Maximum number of results (default: 100)' },
          offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
        },
      },
    },
  },
  get_conversation: {
    type: 'function',
    function: {
      name: 'get_conversation',
      description: 'Get conversation details with messages. Use this when user says "Show me conversation with John"',
      parameters: {
        type: 'object',
        properties: {
          conversationId: { type: 'string', description: 'UUID of the conversation or contact name to search' },
          limit: { type: 'number', description: 'Maximum number of messages (default: 100)' },
        },
        required: ['conversationId'],
      },
    },
  },
  generate_draft: {
    type: 'function',
    function: {
      name: 'generate_draft',
      description: 'Generate an AI draft reply for a conversation. Use this when user says "Generate a reply to this conversation"',
      parameters: {
        type: 'object',
        properties: {
          conversationId: { type: 'string', description: 'UUID of the conversation' },
        },
        required: ['conversationId'],
      },
    },
  },
  assign_tech_by_name: {
    type: 'function',
    function: {
      name: 'assign_tech_by_name',
      description: 'Assign a technician to a job by technician name. Use this when user says "Assign Mike to job 123"',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'UUID of the job or "last" or "current" for context' },
          techName: { type: 'string', description: 'Name of the technician to assign' },
        },
        required: ['jobId', 'techName'],
      },
    },
  },
  bulk_operations: {
    type: 'function',
    function: {
      name: 'bulk_operations',
      description: 'Perform bulk operations on jobs. Use this when user says "Mark all today\'s jobs as completed"',
      parameters: {
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
  },
  // Priority 2 - Field Operations
  upload_photo: {
    type: 'function',
    function: {
      name: 'upload_photo',
      description: 'Upload a photo for a job. Note: This requires a photo URL or base64 data. Use this when user says "Upload a photo of the completed work"',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'UUID of the job or "last" or "current" for context' },
          photoUrl: { type: 'string', description: 'URL of the photo to upload' },
          photoData: { type: 'string', description: 'Base64 encoded photo data' },
        },
        required: ['jobId'],
      },
    },
  },
  capture_location: {
    type: 'function',
    function: {
      name: 'capture_location',
      description: 'Capture location for a job. Use this when user says "I\'m at the job site now"',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'UUID of the job or "last" or "current" for context' },
          latitude: { type: 'number', description: 'Latitude coordinate' },
          longitude: { type: 'number', description: 'Longitude coordinate' },
        },
        required: ['jobId'],
      },
    },
  },
  clock_in: {
    type: 'function',
    function: {
      name: 'clock_in',
      description: 'Clock in for time tracking. Use this when user says "Clock in"',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'UUID of the job (optional)' },
          notes: { type: 'string', description: 'Notes for the time entry (optional)' },
        },
      },
    },
  },
  clock_out: {
    type: 'function',
    function: {
      name: 'clock_out',
      description: 'Clock out for time tracking. Use this when user says "Clock out"',
      parameters: {
        type: 'object',
        properties: {
          timeEntryId: { type: 'string', description: 'UUID of the time entry to clock out (optional, uses most recent)' },
          notes: { type: 'string', description: 'Notes for the time entry (optional)' },
        },
      },
    },
  },
  add_job_note: {
    type: 'function',
    function: {
      name: 'add_job_note',
      description: 'Add a note to a job or contact. Use this when user says "Add a note: customer wants follow-up"',
      parameters: {
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
  },
  get_my_jobs: {
    type: 'function',
    function: {
      name: 'get_my_jobs',
      description: 'Get jobs assigned to the current user (technician). Use this when user says "What are my jobs today?"',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status' },
          date: { type: 'string', description: 'Filter by date (ISO 8601 or relative like "today", "tomorrow")' },
        },
      },
    },
  },
  // Priority 3 - Business Intelligence
  get_stats: {
    type: 'function',
    function: {
      name: 'get_stats',
      description: 'Get business statistics and dashboard data. Use this when user says "What\'s my revenue this month?"',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Time period (today, week, month, year)' },
        },
      },
    },
  },
  get_analytics: {
    type: 'function',
    function: {
      name: 'get_analytics',
      description: 'Get analytics data. Use this when user says "Show me job completion rates"',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['jobs', 'contacts', 'revenue'], description: 'Type of analytics' },
          period: { type: 'string', description: 'Time period (week, month, year)' },
        },
      },
    },
  },
  search_jobs: {
    type: 'function',
    function: {
      name: 'search_jobs',
      description: 'Search jobs by date or other criteria. Use this when user says "Find jobs scheduled for tomorrow"',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date filter (ISO 8601 or relative like "today", "tomorrow", "next week")' },
          status: { type: 'string', description: 'Filter by status' },
          contactName: { type: 'string', description: 'Filter by contact name' },
        },
      },
    },
  },
  filter_jobs: {
    type: 'function',
    function: {
      name: 'filter_jobs',
      description: 'Filter jobs by status or other criteria. Use this when user says "Show me all in-progress jobs"',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status' },
          techId: { type: 'string', description: 'Filter by technician ID' },
          contactId: { type: 'string', description: 'Filter by contact ID' },
        },
      },
    },
  },
  // Priority 4 - Advanced Operations
  create_invoice: {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Create an invoice for a job. Use this when user says "Create an invoice for job 123"',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'UUID of the job' },
          amount: { type: 'number', description: 'Invoice amount' },
          description: { type: 'string', description: 'Invoice description' },
        },
        required: ['jobId'],
      },
    },
  },
  send_invoice: {
    type: 'function',
    function: {
      name: 'send_invoice',
      description: 'Send an invoice to a customer. Use this when user says "Send invoice to customer"',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'UUID of the invoice' },
        },
        required: ['invoiceId'],
      },
    },
  },
  create_campaign: {
    type: 'function',
    function: {
      name: 'create_campaign',
      description: 'Create a marketing campaign. Use this when user says "Create a marketing campaign"',
      parameters: {
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
  },
  export_data: {
    type: 'function',
    function: {
      name: 'export_data',
      description: 'Export data to CSV. Use this when user says "Export all contacts to CSV"',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['contacts', 'jobs', 'invoices'], description: 'Type of data to export' },
          format: { type: 'string', enum: ['csv', 'json'], description: 'Export format (default: csv)' },
        },
        required: ['type'],
      },
    },
  },
  // Additional Essential Tools
  update_job: {
    type: 'function',
    function: {
      name: 'update_job',
      description: 'Update job details. Use this when user wants to modify job information',
      parameters: {
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
  },
  delete_job: {
    type: 'function',
    function: {
      name: 'delete_job',
      description: 'Delete a job. Use this when user says "Delete job 123"',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'UUID of the job' },
        },
        required: ['jobId'],
      },
    },
  },
  delete_contact: {
    type: 'function',
    function: {
      name: 'delete_contact',
      description: 'Delete a contact. Use this when user says "Delete contact John Smith"',
      parameters: {
        type: 'object',
        properties: {
          contactId: { type: 'string', description: 'UUID of the contact or contact name' },
        },
        required: ['contactId'],
      },
    },
  },
  create_conversation: {
    type: 'function',
    function: {
      name: 'create_conversation',
      description: 'Create a new conversation. Use this when user wants to start a new conversation',
      parameters: {
        type: 'object',
        properties: {
          contactId: { type: 'string', description: 'UUID of the contact or contact name' },
          subject: { type: 'string', description: 'Conversation subject (optional)' },
          channel: { type: 'string', description: 'Channel (email, phone, etc.) (optional, default: email)' },
        },
        required: ['contactId'],
      },
    },
  },
  update_conversation_status: {
    type: 'function',
    function: {
      name: 'update_conversation_status',
      description: 'Update conversation status. Use this when user says "Close this conversation"',
      parameters: {
        type: 'object',
        properties: {
          conversationId: { type: 'string', description: 'UUID of the conversation or "last" or "current" for context' },
          status: { type: 'string', enum: ['open', 'closed', 'snoozed'], description: 'New status' },
        },
        required: ['conversationId', 'status'],
      },
    },
  },
  list_invoices: {
    type: 'function',
    function: {
      name: 'list_invoices',
      description: 'List invoices. Use this when user says "Show me all invoices"',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
          offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
        },
      },
    },
  },
  get_invoice: {
    type: 'function',
    function: {
      name: 'get_invoice',
      description: 'Get invoice details. Use this when user says "Show me invoice 123"',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'UUID of the invoice' },
        },
        required: ['invoiceId'],
      },
    },
  },
  mark_invoice_paid: {
    type: 'function',
    function: {
      name: 'mark_invoice_paid',
      description: 'Mark an invoice as paid. Use this when user says "Mark invoice 123 as paid"',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'UUID of the invoice' },
        },
        required: ['invoiceId'],
      },
    },
  },
  list_payments: {
    type: 'function',
    function: {
      name: 'list_payments',
      description: 'List payments. Use this when user says "Show me all payments"',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
          offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
        },
      },
    },
  },
  create_payment: {
    type: 'function',
    function: {
      name: 'create_payment',
      description: 'Create a payment record. Use this when user says "Record a payment"',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'UUID of the invoice' },
          amount: { type: 'number', description: 'Payment amount' },
          method: { type: 'string', description: 'Payment method (cash, check, card, etc.)' },
        },
        required: ['invoiceId', 'amount'],
      },
    },
  },
  list_notifications: {
    type: 'function',
    function: {
      name: 'list_notifications',
      description: 'List notifications. Use this when user says "Show me notifications"',
      parameters: {
        type: 'object',
        properties: {
          unreadOnly: { type: 'boolean', description: 'Show only unread notifications (default: false)' },
          limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        },
      },
    },
  },
  mark_notification_read: {
    type: 'function',
    function: {
      name: 'mark_notification_read',
      description: 'Mark a notification as read. Use this when user says "Mark notification as read"',
      parameters: {
        type: 'object',
        properties: {
          notificationId: { type: 'string', description: 'UUID of the notification' },
        },
        required: ['notificationId'],
      },
    },
  },
  list_call_logs: {
    type: 'function',
    function: {
      name: 'list_call_logs',
      description: 'List call logs. Use this when user says "Show me call logs"',
      parameters: {
        type: 'object',
        properties: {
          contactId: { type: 'string', description: 'Filter by contact ID' },
          limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        },
      },
    },
  },
  create_call_log: {
    type: 'function',
    function: {
      name: 'create_call_log',
      description: 'Create a call log entry. Use this when user says "Log a call"',
      parameters: {
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
  },
  // Navigation Tool
  navigate: {
    type: 'function',
    function: {
      name: 'navigate',
      description: 'Navigate to a page, open a modal, or switch tabs. Use this when user says "Go to jobs" or "Show me contacts"',
      parameters: {
        type: 'object',
        properties: {
          route: { type: 'string', enum: ['jobs', 'contacts', 'inbox', 'analytics', 'settings', 'dashboard'], description: 'Route to navigate to' },
          action: { type: 'string', enum: ['open', 'close', 'switch'], description: 'Action to perform' },
          entityId: { type: 'string', description: 'Entity ID for opening specific entities' },
          entityType: { type: 'string', enum: ['job', 'contact', 'conversation', 'invoice'], description: 'Type of entity' },
        },
        required: ['route', 'action'],
      },
    },
  },
}
END OF REMOVED OLD TOOLS */

// Helper function to parse relative dates
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

// Helper function to resolve context references
function resolveContextId(id: string, context: any, type: 'job' | 'contact' | 'conversation'): string | null {
  if (id === 'last' || id === 'current') {
    if (type === 'job' && context?.lastJobId) return context.lastJobId
    if (type === 'contact' && context?.lastContactId) return context.lastContactId
    if (type === 'conversation' && context?.lastConversationId) return context.lastConversationId
  }
  return id
}

// Helper function to find tech by name
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
  
  // Try exact match
  const exactMatch = users.find((u: any) => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    searchTerm.toLowerCase().includes(u.first_name?.toLowerCase() || '') ||
    searchTerm.toLowerCase().includes(u.last_name?.toLowerCase() || '')
  )
  
  return exactMatch?.id || users[0].id
}

// Helper function to find contact by name
async function findContactByName(supabase: any, accountId: string, contactName: string): Promise<string | null> {
  const searchTerm = contactName.trim()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .eq('account_id', accountId)
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
    .limit(5)
  
  if (!contacts || contacts.length === 0) return null
  
  // Try exact match
  const exactMatch = contacts.find((c: any) => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    searchTerm.toLowerCase().includes(c.first_name?.toLowerCase() || '') ||
    searchTerm.toLowerCase().includes(c.last_name?.toLowerCase() || '')
  )
  
  return exactMatch?.id || contacts[0].id
}

// Helper function to get Next.js API URL
function getNextApiUrl(supabaseUrl: string, path: string): string {
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || Deno.env.get('APP_URL')
  if (appUrl) {
    return `${appUrl}/api${path}`
  }
  // Fallback: try to construct from Supabase URL (may not work in production)
  const baseUrl = supabaseUrl.replace('/rest/v1', '').replace('/functions/v1', '')
  return `${baseUrl}/api${path}`
}

// Helper function to format response for voice
function formatForVoice(data: any, type: string): string {
  if (type === 'jobs' && Array.isArray(data)) {
    if (data.length === 0) return 'No jobs found.'
    if (data.length === 1) {
      const job = data[0]
      return `You have 1 job: ${job.description || 'No description'} for ${job.contact?.first_name || ''} ${job.contact?.last_name || ''} at ${job.status || 'unknown'} status.`
    }
    if (data.length <= 5) {
      return `You have ${data.length} jobs: ${data.map((j: any, i: number) => 
        `Job ${i + 1}: ${j.description || 'No description'} for ${j.contact?.first_name || ''} ${j.contact?.last_name || ''}`
      ).join('. ')}.`
    }
    return `You have ${data.length} jobs. Here are the first 5: ${data.slice(0, 5).map((j: any, i: number) => 
      `Job ${i + 1}: ${j.description || 'No description'}`
    ).join('. ')}.`
  }
  if (type === 'contacts' && Array.isArray(data)) {
    if (data.length === 0) return 'No contacts found.'
    if (data.length === 1) {
      const contact = data[0]
      return `Found 1 contact: ${contact.first_name || ''} ${contact.last_name || ''}, email ${contact.email || 'no email'}.`
    }
    if (data.length <= 5) {
      return `Found ${data.length} contacts: ${data.map((c: any) => 
        `${c.first_name || ''} ${c.last_name || ''}`
      ).join(', ')}.`
    }
    return `Found ${data.length} contacts. Here are the first 5: ${data.slice(0, 5).map((c: any) => 
      `${c.first_name || ''} ${c.last_name || ''}`
    ).join(', ')}.`
  }
  return JSON.stringify(data)
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    
    // Use service role key for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body: VoiceCommandRequest = await req.json()
    const { accountId, transcription, conversationId, context } = body

    if (!accountId || !transcription) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accountId, transcription' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get persona config for context (also validates account exists)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('persona_config')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Invalid account ID' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const personaConfig = account?.persona_config || {}
    const systemPrompt = personaConfig.systemPrompt || `You are an AI assistant for a service business.
Parse voice commands and determine the appropriate action using the available tools.
Be precise and extract all necessary parameters from the user's request.

When parsing dates and times:
- "today" = current date
- "tomorrow" = next day
- "next week" = 7 days from now
- "2pm" = 14:00 in ISO format
- "tomorrow at 2pm" = next day at 14:00

When resolving references:
- "that job" or "the last job" = use context.lastJobId if available
- "John" = search for contact named John
- "Mike" = search for technician named Mike

Always use the most specific tool available. For example, use "list_jobs" with filters rather than "get_job" when user asks for multiple jobs.`

    // Fetch tools from MCP server (single source of truth)
    const AI_TOOLS = await fetchMCPTools(supabaseUrl, serviceRoleKey)

    // Use LLM Router with function calling to parse the command
    // VOICE USE CASE: Optimized for low latency (<500ms target)
    // - Uses 'voice' use case (routes to GPT-4o-mini or Claude Haiku)
    // - Reduced maxTokens (150) for faster response
    // - Temperature 0.3 for consistent parsing
    // - No streaming (faster for short responses)
    const llmRouterUrl = getNextApiUrl(supabaseUrl, '/llm')
    const routerResponse = await fetch(llmRouterUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        useCase: 'voice', // CHANGED: Use voice use case for low latency
        prompt: `Parse this voice command and call the appropriate tool: "${transcription}"`,
        systemPrompt,
        tools: AI_TOOLS, // Fetched from MCP server
        toolChoice: 'auto',
        maxSteps: 1,
        temperature: 0.3,
        maxTokens: 150, // ADDED: Limit tokens for faster response
        stream: false,
      }),
    })

    if (!routerResponse.ok) {
      const errorText = await routerResponse.text()
      throw new Error(`LLM Router error: ${errorText}`)
    }

    const routerData = await routerResponse.json()
    
    if (!routerData.success) {
      throw new Error(`LLM Router failed: ${routerData.error || 'Unknown error'}`)
    }

    // Extract tool calls from router response
    const toolCalls = routerData.toolCalls || []

    const response: any = { action: 'unknown', params: {} }

    // Execute tool calls via MCP server
    for (const toolCall of toolCalls) {
      // Router returns { toolCallId, toolName, args } format
      const functionName = toolCall.toolName || toolCall.function?.name
      const functionArgs = toolCall.args || (toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {})

      response.action = functionName
      response.params = functionArgs

      try {
        // Execute tool via MCP server
        const toolResult = await executeMCPTool(supabaseUrl, serviceRoleKey, functionName, functionArgs)

        // Process tool result
        response.result = toolResult

        // Extract specific fields based on tool name for backwards compatibility
        if (functionName === 'list_jobs' || functionName === 'search_jobs' || functionName === 'filter_jobs') {
          response.jobs = toolResult.jobs || toolResult
          response.jobCount = Array.isArray(response.jobs) ? response.jobs.length : 0
          response.formatted = formatForVoice(response.jobs, 'jobs')
        } else if (functionName === 'list_contacts' || functionName === 'search_contacts') {
          response.contacts = toolResult.contacts || toolResult
          response.contactCount = Array.isArray(response.contacts) ? response.contacts.length : 0
          response.formatted = formatForVoice(response.contacts, 'contacts')
        } else if (functionName === 'get_job') {
          response.job = toolResult.job || toolResult
        } else if (functionName === 'get_contact') {
          response.contact = toolResult.contact || toolResult
        } else if (functionName === 'create_job') {
          response.jobId = toolResult.job?.id || toolResult.id
        } else if (functionName === 'create_contact') {
          response.contactId = toolResult.contact?.id || toolResult.id
        } else if (functionName === 'list_conversations' || functionName === 'get_conversation') {
          response.conversations = toolResult.conversations || (toolResult.conversation ? [toolResult.conversation] : [])
          response.conversationCount = response.conversations.length
        } else if (functionName === 'navigate') {
          response.navigation = toolResult
        }

        // Mark as success if no error
        if (!toolResult.error) {
          response.success = true
        } else {
          response.error = toolResult.error
        }
      } catch (error: any) {
        console.error(`Error executing tool ${functionName}:`, error)
        response.error = error.message || 'Failed to execute tool'
      }
    }

    // LEGACY FALLBACK: If MCP execution fails, try legacy direct execution for critical tools
    // This ensures backwards compatibility during the migration
    if (response.error && toolCalls.length > 0) {
      const toolCall = toolCalls[0]
      const functionName = toolCall.toolName || toolCall.function?.name
      const functionArgs = toolCall.args || (toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {})

      console.warn(`MCP execution failed for ${functionName}, attempting legacy fallback`)

      // Execute the tool using legacy approach
      if (functionName === 'create_job') {
        // If contactId not provided but contact name is, search for contact
        let finalContactId = functionArgs.contactId
        if (!finalContactId && functionArgs.contactName) {
          const searchTerm = functionArgs.contactName.trim()
          const { data: contacts } = await supabase
            .from('contacts')
            .select('id, first_name, last_name')
            .eq('account_id', accountId)
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
            .limit(5)
          
          // Try to find exact match first
          let matched = contacts?.find(c => 
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            searchTerm.toLowerCase().includes(c.first_name?.toLowerCase() || '') ||
            searchTerm.toLowerCase().includes(c.last_name?.toLowerCase() || '')
          )
          
          if (matched) {
            finalContactId = matched.id
          } else if (contacts && contacts.length > 0) {
            // Use first match if no exact match
            finalContactId = contacts[0].id
          }
        }

        if (!finalContactId) {
          response.error = 'Contact not found. Please specify contact name or ID.'
        } else {
          const jobRes = await fetch(`${supabaseUrl}/functions/v1/create-job`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountId,
              contactId: finalContactId,
              description: functionArgs.description,
              scheduledStart: functionArgs.scheduledStart,
              scheduledEnd: functionArgs.scheduledEnd,
              techAssignedId: functionArgs.techAssignedId,
            }),
          })
          const jobData = await jobRes.json()
          response.result = jobData
          response.jobId = jobData.job?.id
        }
      } else if (functionName === 'update_job_status') {
        const statusRes = await fetch(`${supabaseUrl}/functions/v1/update-job-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId,
            jobId: functionArgs.jobId,
            status: functionArgs.status,
          }),
        })
        const statusData = await statusRes.json()
        response.result = statusData
      } else if (functionName === 'assign_tech') {
        const assignRes = await fetch(`${supabaseUrl}/functions/v1/assign-tech`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId,
            jobId: functionArgs.jobId,
            techAssignedId: functionArgs.techAssignedId,
          }),
        })
        const assignData = await assignRes.json()
        response.result = assignData
      } else if (functionName === 'search_contacts') {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, phone')
          .eq('account_id', accountId)
          .or(`first_name.ilike.%${functionArgs.search}%,last_name.ilike.%${functionArgs.search}%,email.ilike.%${functionArgs.search}%,phone.ilike.%${functionArgs.search}%`)
          .limit(5)
        response.contacts = contacts || []
        response.contactCount = contacts?.length || 0
      } else if (functionName === 'get_job') {
        const { data: job } = await supabase
          .from('jobs')
          .select('*, contacts(*), users(*)')
          .eq('id', functionArgs.jobId)
          .eq('account_id', accountId)
          .single()
        response.job = job
      } else if (functionName === 'send_message') {
        // Create or get conversation
        let convId = functionArgs.conversationId || conversationId
        if (!convId) {
          // Would need contactId to create conversation - simplified for now
          response.error = 'conversationId required for send_message'
        } else {
          const { data: message } = await supabase
            .from('messages')
            .insert({
              conversation_id: convId,
              direction: 'outbound',
              body_text: functionArgs.message,
              sender_type: 'user',
            })
            .select()
            .single()
          response.message = message
        }
      }
      // Priority 1 - Core Operations
      else if (functionName === 'list_jobs') {
        let query = supabase
          .from('jobs')
          .select('*, contact:contacts(*), tech:users!tech_assigned_id(*)')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
          .limit(functionArgs.limit || 50)
          .range(functionArgs.offset || 0, (functionArgs.offset || 0) + (functionArgs.limit || 50) - 1)
        
        if (functionArgs.status) query = query.eq('status', functionArgs.status)
        if (functionArgs.techId) query = query.eq('tech_assigned_id', functionArgs.techId)
        if (functionArgs.contactId) query = query.eq('contact_id', functionArgs.contactId)
        if (functionArgs.date) {
          const dateStr = parseRelativeDate(functionArgs.date)
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
          response.error = `Failed to fetch jobs: ${error.message}`
        } else {
          response.jobs = jobs || []
          response.jobCount = jobs?.length || 0
          response.formatted = formatForVoice(jobs || [], 'jobs')
        }
      }
      else if (functionName === 'list_contacts') {
        let query = supabase
          .from('contacts')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
          .limit(functionArgs.limit || 50)
          .range(functionArgs.offset || 0, (functionArgs.offset || 0) + (functionArgs.limit || 50) - 1)
        
        if (functionArgs.search) {
          query = query.or(`first_name.ilike.%${functionArgs.search}%,last_name.ilike.%${functionArgs.search}%,email.ilike.%${functionArgs.search}%,phone.ilike.%${functionArgs.search}%`)
        }
        
        const { data: contacts, error } = await query
        if (error) {
          response.error = `Failed to fetch contacts: ${error.message}`
        } else {
          response.contacts = contacts || []
          response.contactCount = contacts?.length || 0
          response.formatted = formatForVoice(contacts || [], 'contacts')
        }
      }
      else if (functionName === 'create_contact') {
        // Get user account_id - for edge function, we need to find a user for the account
        const { data: accountUser } = await supabase
          .from('users')
          .select('id')
          .eq('account_id', accountId)
          .limit(1)
          .single()
        
        if (!accountUser) {
          response.error = 'No user found for account'
        } else {
          // Check if contact already exists
          const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', functionArgs.email)
            .eq('account_id', accountId)
            .single()
          
          if (existing) {
            response.error = 'Contact with this email already exists'
            response.contact = existing
          } else {
            const { data: contact, error } = await supabase
              .from('contacts')
              .insert({
                account_id: accountId,
                email: functionArgs.email,
                phone: functionArgs.phone || null,
                first_name: functionArgs.firstName,
                last_name: functionArgs.lastName || null,
                address: functionArgs.address || null,
              })
              .select()
              .single()
            
            if (error) {
              response.error = `Failed to create contact: ${error.message}`
            } else {
              response.result = { success: true, contact }
              response.contact = contact
              response.contactId = contact?.id
            }
          }
        }
      }
      else if (functionName === 'update_contact') {
        let contactId = resolveContextId(functionArgs.contactId, context, 'contact')
        if (!contactId || contactId === functionArgs.contactId) {
          // Try to find by name
          contactId = await findContactByName(supabase, accountId, functionArgs.contactId) || functionArgs.contactId
        }
        
        const updateData: any = {}
        if (functionArgs.email !== undefined) updateData.email = functionArgs.email
        if (functionArgs.firstName !== undefined) updateData.first_name = functionArgs.firstName
        if (functionArgs.lastName !== undefined) updateData.last_name = functionArgs.lastName
        if (functionArgs.phone !== undefined) updateData.phone = functionArgs.phone
        if (functionArgs.address !== undefined) updateData.address = functionArgs.address
        
        if (Object.keys(updateData).length === 0) {
          response.error = 'No fields to update'
        } else {
          const { data: contact, error } = await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', contactId)
            .eq('account_id', accountId)
            .select()
            .single()
          
          if (error) {
            response.error = `Failed to update contact: ${error.message}`
          } else {
            response.result = { success: true, contact }
            response.contact = contact
          }
        }
      }
      else if (functionName === 'get_contact') {
        let contactId = resolveContextId(functionArgs.contactId, context, 'contact')
        if (!contactId || contactId === functionArgs.contactId) {
          // Try to find by name
          contactId = await findContactByName(supabase, accountId, functionArgs.contactId) || functionArgs.contactId
        }
        
        const { data: contact, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .eq('account_id', accountId)
          .single()
        
        if (error || !contact) {
          response.error = 'Contact not found'
        } else {
          response.contact = contact
        }
      }
      else if (functionName === 'list_conversations') {
        let query = supabase
          .from('conversations')
          .select('*, contact:contacts(*)')
          .eq('account_id', accountId)
          .order('last_message_at', { ascending: false })
          .limit(functionArgs.limit || 100)
          .range(functionArgs.offset || 0, (functionArgs.offset || 0) + (functionArgs.limit || 100) - 1)
        
        if (functionArgs.contactId) query = query.eq('contact_id', functionArgs.contactId)
        if (functionArgs.status) query = query.eq('status', functionArgs.status)
        
        const { data: conversations, error } = await query
        if (error) {
          response.error = `Failed to fetch conversations: ${error.message}`
        } else {
          response.conversations = conversations || []
          response.conversationCount = conversations?.length || 0
        }
      }
      else if (functionName === 'get_conversation') {
        let conversationId = resolveContextId(functionArgs.conversationId, context, 'conversation')
        if (!conversationId || conversationId === functionArgs.conversationId) {
          // Try to find by contact name
          const contactId = await findContactByName(supabase, accountId, functionArgs.conversationId)
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
          response.error = 'Conversation not found'
        } else {
          // Get messages
          const apiUrl = getNextApiUrl(supabaseUrl, `/conversations/${conversationId}/messages`)
          const messagesRes = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
          })
          const messagesData = await messagesRes.json()
          response.conversation = conversation
          response.messages = messagesData.messages || []
        }
      }
      else if (functionName === 'generate_draft') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/ai/draft')
        const draftRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: functionArgs.conversationId,
          }),
        })
        const draftText = await draftRes.text()
        if (!draftRes.ok) {
          response.error = 'Failed to generate draft'
        } else {
          response.draft = draftText
        }
      }
      else if (functionName === 'assign_tech_by_name') {
        let jobId = resolveContextId(functionArgs.jobId, context, 'job')
        const techId = await findTechByName(supabase, accountId, functionArgs.techName)
        
        if (!techId) {
          response.error = `Technician "${functionArgs.techName}" not found`
        } else {
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
          response.result = assignData
        }
      }
      else if (functionName === 'bulk_operations') {
        let jobIds = functionArgs.jobIds || []
        
        // If filter provided, get job IDs first
        if (functionArgs.filter && !jobIds.length) {
          let filterQuery = supabase
            .from('jobs')
            .select('id')
            .eq('account_id', accountId)
          
          if (functionArgs.filter.status) filterQuery = filterQuery.eq('status', functionArgs.filter.status)
          if (functionArgs.filter.date) {
            const dateStr = parseRelativeDate(functionArgs.filter.date)
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
          response.error = 'No jobs found to perform bulk operation'
        } else {
          const apiUrl = getNextApiUrl(supabaseUrl, '/jobs/bulk')
          const bulkRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: functionArgs.action,
              jobIds,
              status: functionArgs.status,
              techId: functionArgs.techId,
            }),
          })
          const bulkData = await bulkRes.json()
          if (!bulkRes.ok) {
            response.error = bulkData.error || 'Failed to perform bulk operation'
          } else {
            response.result = bulkData
            response.updatedCount = bulkData.count || 0
          }
        }
      }
      // Priority 2 - Field Operations
      else if (functionName === 'upload_photo') {
        let jobId = resolveContextId(functionArgs.jobId, context, 'job')
        const apiUrl = getNextApiUrl(supabaseUrl, `/jobs/${jobId}/upload-photo`)
        const photoRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photoUrl: functionArgs.photoUrl,
            photoData: functionArgs.photoData,
          }),
        })
        const photoData = await photoRes.json()
        if (!photoRes.ok) {
          response.error = photoData.error || 'Failed to upload photo'
        } else {
          response.result = photoData
        }
      }
      else if (functionName === 'capture_location') {
        let jobId = resolveContextId(functionArgs.jobId, context, 'job')
        const apiUrl = getNextApiUrl(supabaseUrl, `/jobs/${jobId}/location`)
        const locationRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: functionArgs.latitude,
            longitude: functionArgs.longitude,
          }),
        })
        const locationData = await locationRes.json()
        if (!locationRes.ok) {
          response.error = locationData.error || 'Failed to capture location'
        } else {
          response.result = locationData
        }
      }
      else if (functionName === 'clock_in') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/time-entries')
        const clockRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: functionArgs.jobId,
            notes: functionArgs.notes,
          }),
        })
        const clockData = await clockRes.json()
        if (!clockRes.ok) {
          response.error = clockData.error || 'Failed to clock in'
        } else {
          response.result = clockData
          response.timeEntryId = clockData.timeEntry?.id
        }
      }
      else if (functionName === 'clock_out') {
        let timeEntryId = functionArgs.timeEntryId
        if (!timeEntryId) {
          // Get most recent time entry for account
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
          response.error = 'No active time entry found to clock out'
        } else {
          const apiUrl = getNextApiUrl(supabaseUrl, `/time-entries/${timeEntryId}`)
          const clockRes = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notes: functionArgs.notes,
            }),
          })
          const clockData = await clockRes.json()
          if (!clockRes.ok) {
            response.error = clockData.error || 'Failed to clock out'
          } else {
            response.result = clockData
          }
        }
      }
      else if (functionName === 'add_job_note') {
        let noteTarget = functionArgs.jobId || functionArgs.contactId
        if (functionArgs.jobId) {
          noteTarget = resolveContextId(functionArgs.jobId, context, 'job')
        } else if (functionArgs.contactId) {
          noteTarget = resolveContextId(functionArgs.contactId, context, 'contact')
          if (!noteTarget || noteTarget === functionArgs.contactId) {
            noteTarget = await findContactByName(supabase, accountId, functionArgs.contactId) || functionArgs.contactId
          }
        }
        
        if (!noteTarget) {
          response.error = 'Job ID or Contact ID required'
        } else {
          const apiUrl = functionArgs.jobId 
            ? getNextApiUrl(supabaseUrl, `/jobs/${noteTarget}/notes`)
            : getNextApiUrl(supabaseUrl, `/contacts/${noteTarget}/notes`)
          
          const noteRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: functionArgs.content,
              conversationId: functionArgs.conversationId,
            }),
          })
          const noteData = await noteRes.json()
          if (!noteRes.ok) {
            response.error = noteData.error || 'Failed to add note'
          } else {
            response.result = noteData
            response.note = noteData.note
          }
        }
      }
      else if (functionName === 'get_my_jobs') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/tech/jobs')
        const params = new URLSearchParams()
        if (functionArgs.status) params.append('status', functionArgs.status)
        if (functionArgs.date) {
          const dateStr = parseRelativeDate(functionArgs.date)
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
          response.error = jobsData.error || 'Failed to fetch jobs'
        } else {
          response.jobs = jobsData.jobs || []
          response.stats = jobsData.stats
          response.formatted = formatForVoice(jobsData.jobs || [], 'jobs')
        }
      }
      // Priority 3 - Business Intelligence
      else if (functionName === 'get_stats') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/analytics/dashboard')
        const statsRes = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const statsData = await statsRes.json()
        if (!statsRes.ok) {
          response.error = statsData.error || 'Failed to fetch stats'
        } else {
          response.stats = statsData
        }
      }
      else if (functionName === 'get_analytics') {
        const type = functionArgs.type || 'jobs'
        const apiUrl = getNextApiUrl(supabaseUrl, `/analytics/${type}`)
        const analyticsRes = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const analyticsData = await analyticsRes.json()
        if (!analyticsRes.ok) {
          response.error = analyticsData.error || 'Failed to fetch analytics'
        } else {
          response.analytics = analyticsData
        }
      }
      else if (functionName === 'search_jobs') {
        let query = supabase
          .from('jobs')
          .select('*, contact:contacts(*)')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
        
        if (functionArgs.date) {
          const dateStr = parseRelativeDate(functionArgs.date)
          if (dateStr) {
            const start = new Date(dateStr)
            start.setHours(0, 0, 0, 0)
            const end = new Date(dateStr)
            end.setHours(23, 59, 59, 999)
            query = query.gte('scheduled_start', start.toISOString()).lte('scheduled_start', end.toISOString())
          }
        }
        if (functionArgs.status) query = query.eq('status', functionArgs.status)
        if (functionArgs.contactName) {
          const contactId = await findContactByName(supabase, accountId, functionArgs.contactName)
          if (contactId) query = query.eq('contact_id', contactId)
        }
        
        const { data: jobs, error } = await query.limit(50)
        if (error) {
          response.error = `Failed to search jobs: ${error.message}`
        } else {
          response.jobs = jobs || []
          response.formatted = formatForVoice(jobs || [], 'jobs')
        }
      }
      else if (functionName === 'filter_jobs') {
        let query = supabase
          .from('jobs')
          .select('*, contact:contacts(*)')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
        
        if (functionArgs.status) query = query.eq('status', functionArgs.status)
        if (functionArgs.techId) query = query.eq('tech_assigned_id', functionArgs.techId)
        if (functionArgs.contactId) query = query.eq('contact_id', functionArgs.contactId)
        
        const { data: jobs, error } = await query.limit(50)
        if (error) {
          response.error = `Failed to filter jobs: ${error.message}`
        } else {
          response.jobs = jobs || []
          response.formatted = formatForVoice(jobs || [], 'jobs')
        }
      }
      // Priority 4 - Advanced Operations
      else if (functionName === 'create_invoice') {
        let jobId = resolveContextId(functionArgs.jobId, context, 'job')
        const apiUrl = getNextApiUrl(supabaseUrl, '/invoices')
        const invoiceRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId,
            amount: functionArgs.amount,
            description: functionArgs.description,
          }),
        })
        const invoiceData = await invoiceRes.json()
        if (!invoiceRes.ok) {
          response.error = invoiceData.error || 'Failed to create invoice'
        } else {
          response.result = invoiceData
          response.invoice = invoiceData.invoice
        }
      }
      else if (functionName === 'send_invoice') {
        const apiUrl = getNextApiUrl(supabaseUrl, `/invoices/${functionArgs.invoiceId}/send`)
        const sendRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const sendData = await sendRes.json()
        if (!sendRes.ok) {
          response.error = sendData.error || 'Failed to send invoice'
        } else {
          response.result = sendData
        }
      }
      else if (functionName === 'create_campaign') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/campaigns')
        const campaignRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: functionArgs.name,
            subject: functionArgs.subject,
            body: functionArgs.body,
            templateId: functionArgs.templateId,
          }),
        })
        const campaignData = await campaignRes.json()
        if (!campaignRes.ok) {
          response.error = campaignData.error || 'Failed to create campaign'
        } else {
          response.result = campaignData
          response.campaign = campaignData.campaign
        }
      }
      else if (functionName === 'export_data') {
        const type = functionArgs.type
        const format = functionArgs.format || 'csv'
        const apiUrl = getNextApiUrl(supabaseUrl, `/export/${type}?format=${format}`)
        const exportRes = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        if (!exportRes.ok) {
          const errorData = await exportRes.json()
          response.error = errorData.error || 'Failed to export data'
        } else {
          response.exportUrl = exportRes.url
          response.message = `Export completed. ${type} data exported as ${format}.`
        }
      }
      // Additional Essential Tools
      else if (functionName === 'update_job') {
        let jobId = resolveContextId(functionArgs.jobId, context, 'job')
        const apiUrl = getNextApiUrl(supabaseUrl, `/jobs/${jobId}`)
        const updateData: any = {}
        if (functionArgs.description !== undefined) updateData.description = functionArgs.description
        if (functionArgs.scheduledStart !== undefined) updateData.scheduledStart = functionArgs.scheduledStart
        if (functionArgs.scheduledEnd !== undefined) updateData.scheduledEnd = functionArgs.scheduledEnd
        
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
          response.error = jobData.error || 'Failed to update job'
        } else {
          response.result = jobData
          response.job = jobData.job
        }
      }
      else if (functionName === 'delete_job') {
        let jobId = resolveContextId(functionArgs.jobId, context, 'job')
        const apiUrl = getNextApiUrl(supabaseUrl, `/jobs/${jobId}`)
        const deleteRes = await fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        if (!deleteRes.ok) {
          const errorData = await deleteRes.json()
          response.error = errorData.error || 'Failed to delete job'
        } else {
          response.success = true
          response.message = 'Job deleted successfully'
        }
      }
      else if (functionName === 'delete_contact') {
        let contactId = resolveContextId(functionArgs.contactId, context, 'contact')
        if (!contactId || contactId === functionArgs.contactId) {
          contactId = await findContactByName(supabase, accountId, functionArgs.contactId) || functionArgs.contactId
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
          response.error = errorData.error || 'Failed to delete contact'
        } else {
          response.success = true
          response.message = 'Contact deleted successfully'
        }
      }
      else if (functionName === 'create_conversation') {
        let contactId = resolveContextId(functionArgs.contactId, context, 'contact')
        if (!contactId || contactId === functionArgs.contactId) {
          contactId = await findContactByName(supabase, accountId, functionArgs.contactId) || functionArgs.contactId
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
            subject: functionArgs.subject,
            channel: functionArgs.channel || 'email',
          }),
        })
        const convData = await convRes.json()
        if (!convRes.ok) {
          response.error = convData.error || 'Failed to create conversation'
        } else {
          response.result = convData
          response.conversation = convData.conversation
        }
      }
      else if (functionName === 'update_conversation_status') {
        let conversationId = resolveContextId(functionArgs.conversationId, context, 'conversation')
        const apiUrl = getNextApiUrl(supabaseUrl, `/conversations/${conversationId}`)
        const updateRes = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: functionArgs.status,
          }),
        })
        const updateData = await updateRes.json()
        if (!updateRes.ok) {
          response.error = updateData.error || 'Failed to update conversation status'
        } else {
          response.result = updateData
          response.conversation = updateData.conversation
        }
      }
      else if (functionName === 'list_invoices') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/invoices')
        const params = new URLSearchParams()
        if (functionArgs.limit) params.append('limit', functionArgs.limit.toString())
        if (functionArgs.offset) params.append('offset', functionArgs.offset.toString())
        
        const invoicesRes = await fetch(`${apiUrl}?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const invoicesData = await invoicesRes.json()
        if (!invoicesRes.ok) {
          response.error = invoicesData.error || 'Failed to fetch invoices'
        } else {
          response.invoices = invoicesData.invoices || []
        }
      }
      else if (functionName === 'get_invoice') {
        const apiUrl = getNextApiUrl(supabaseUrl, `/invoices/${functionArgs.invoiceId}`)
        const invoiceRes = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const invoiceData = await invoiceRes.json()
        if (!invoiceRes.ok) {
          response.error = invoiceData.error || 'Failed to fetch invoice'
        } else {
          response.invoice = invoiceData.invoice
        }
      }
      else if (functionName === 'mark_invoice_paid') {
        const apiUrl = getNextApiUrl(supabaseUrl, `/invoices/${functionArgs.invoiceId}/mark-paid`)
        const paidRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const paidData = await paidRes.json()
        if (!paidRes.ok) {
          response.error = paidData.error || 'Failed to mark invoice as paid'
        } else {
          response.result = paidData
        }
      }
      else if (functionName === 'list_payments') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/payments')
        const params = new URLSearchParams()
        if (functionArgs.limit) params.append('limit', functionArgs.limit.toString())
        if (functionArgs.offset) params.append('offset', functionArgs.offset.toString())
        
        const paymentsRes = await fetch(`${apiUrl}?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const paymentsData = await paymentsRes.json()
        if (!paymentsRes.ok) {
          response.error = paymentsData.error || 'Failed to fetch payments'
        } else {
          response.payments = paymentsData.payments || []
        }
      }
      else if (functionName === 'create_payment') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/payments')
        const paymentRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceId: functionArgs.invoiceId,
            amount: functionArgs.amount,
            method: functionArgs.method,
          }),
        })
        const paymentData = await paymentRes.json()
        if (!paymentRes.ok) {
          response.error = paymentData.error || 'Failed to create payment'
        } else {
          response.result = paymentData
          response.payment = paymentData.payment
        }
      }
      else if (functionName === 'list_notifications') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/notifications')
        const params = new URLSearchParams()
        if (functionArgs.unreadOnly) params.append('unreadOnly', 'true')
        if (functionArgs.limit) params.append('limit', functionArgs.limit.toString())
        
        const notificationsRes = await fetch(`${apiUrl}?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const notificationsData = await notificationsRes.json()
        if (!notificationsRes.ok) {
          response.error = notificationsData.error || 'Failed to fetch notifications'
        } else {
          response.notifications = notificationsData.notifications || []
        }
      }
      else if (functionName === 'mark_notification_read') {
        const apiUrl = getNextApiUrl(supabaseUrl, `/notifications/${functionArgs.notificationId}`)
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
          response.error = readData.error || 'Failed to mark notification as read'
        } else {
          response.result = readData
        }
      }
      else if (functionName === 'list_call_logs') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/call-logs')
        const params = new URLSearchParams()
        if (functionArgs.contactId) params.append('contactId', functionArgs.contactId)
        if (functionArgs.limit) params.append('limit', functionArgs.limit.toString())
        
        const callLogsRes = await fetch(`${apiUrl}?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        })
        const callLogsData = await callLogsRes.json()
        if (!callLogsRes.ok) {
          response.error = callLogsData.error || 'Failed to fetch call logs'
        } else {
          response.callLogs = callLogsData.callLogs || []
        }
      }
      else if (functionName === 'create_call_log') {
        const apiUrl = getNextApiUrl(supabaseUrl, '/call-logs')
        const callLogRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactId: functionArgs.contactId,
            direction: functionArgs.direction,
            duration: functionArgs.duration,
            notes: functionArgs.notes,
          }),
        })
        const callLogData = await callLogRes.json()
        if (!callLogRes.ok) {
          response.error = callLogData.error || 'Failed to create call log'
        } else {
          response.result = callLogData
          response.callLog = callLogData.callLog
        }
      }
      // Navigation Tool
      else if (functionName === 'navigate') {
        // Navigation is handled client-side, return navigation instruction
        response.navigation = {
          route: functionArgs.route,
          action: functionArgs.action,
          entityId: functionArgs.entityId,
          entityType: functionArgs.entityType,
        }
        response.message = `Navigate to ${functionArgs.route}`
      }
    } // End of legacy fallback

    // Generate natural language response
    if (toolCalls.length > 0) {
      // Use formatted response if available, otherwise generate one
      if (response.formatted) {
        response.response = response.formatted
      } else if (response.error) {
        response.response = `Sorry, ${response.error}. ${response.error.includes('not found') ? 'Please check the name or ID and try again.' : 'Please try again or ask for help.'}`
      } else {
        // Build context for response generation
        let responseContext = `Voice command: "${transcription}"\nAction: ${response.action}\n`
        if (response.jobs && response.jobs.length > 0) {
          responseContext += `Found ${response.jobs.length} job(s).`
        }
        if (response.contacts && response.contacts.length > 0) {
          responseContext += `Found ${response.contacts.length} contact(s).`
        }
        if (response.job) {
          responseContext += `Job: ${response.job.description || 'No description'}`
        }
        if (response.contact) {
          responseContext += `Contact: ${response.contact.first_name || ''} ${response.contact.last_name || ''}`
        }
        if (response.success) {
          responseContext += 'Operation completed successfully.'
        }
        
        const summaryPrompt = `Based on this information, generate a brief, natural voice response (1-2 sentences max) confirming what was done:\n${responseContext}`
        
        // Use LLM Router for response generation (prefer Haiku for speed/cost)
        const summaryRouterResponse = await fetch(llmRouterUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId,
            useCase: 'summary', // Use summary use case (routes to Haiku)
            prompt: summaryPrompt,
            systemPrompt: 'Generate a brief, natural voice response (1-2 sentences). Be conversational and friendly.',
            maxTokens: 150,
            temperature: 0.7,
            stream: false,
          }),
        })

        if (summaryRouterResponse.ok) {
          const summaryData = await summaryRouterResponse.json()
          if (summaryData.success && summaryData.text) {
            response.response = summaryData.text
          } else {
            response.response = response.message || 'Operation completed.'
          }
        } else {
          response.response = response.message || 'Operation completed.'
        }
      }
    } else {
      // No tool calls - use router's text response if available
      response.response = routerData.text || "I didn't understand that command. You can ask me to create jobs, list contacts, update job status, search for information, and much more. What would you like to do?"
    }

    return new Response(
      JSON.stringify({ success: true, ...response }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

