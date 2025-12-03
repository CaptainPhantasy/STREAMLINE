// Tool Schemas for AI Agent
// These define the tools available to the AI agent via function calling

export const AI_TOOL_SCHEMAS = {
  create_job: {
    name: 'create_job',
    description: 'Create a new job/work order for a customer',
    parameters: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'UUID of the contact/customer',
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
      required: ['contactId', 'description'],
    },
  },
  update_job_status: {
    name: 'update_job_status',
    description: 'Update the status of a job (lead -> scheduled -> en_route -> in_progress -> completed -> invoiced -> paid)',
    parameters: {
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
  assign_tech: {
    name: 'assign_tech',
    description: 'Assign a technician to a job',
    parameters: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'UUID of the job',
        },
        techAssignedId: {
          type: 'string',
          description: 'UUID of the technician user',
        },
      },
      required: ['jobId', 'techAssignedId'],
    },
  },
  search_contacts: {
    name: 'search_contacts',
    description: 'Search for contacts by name, email, or phone',
    parameters: {
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
  get_job: {
    name: 'get_job',
    description: 'Get details of a specific job',
    parameters: {
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
  send_message: {
    name: 'send_message',
    description: 'Send a message/email to a contact',
    parameters: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'UUID of the conversation',
        },
        message: {
          type: 'string',
          description: 'Message content to send',
        },
        subject: {
          type: 'string',
          description: 'Email subject line (optional)',
        },
      },
      required: ['conversationId', 'message'],
    },
  },
} as const

export type AIToolName = keyof typeof AI_TOOL_SCHEMAS

