/**
 * Enhanced Email Tools for MCP
 * Integrates with Resend email service for Voice Agent
 */

import { sendEmail } from '@/lib/email/service'
import { createClient } from '@supabase/supabase-js'
import { resendService } from '@/lib/email/resend-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const emailTools = [
  {
    name: 'send_email_template',
    description: 'Send an email using a predefined template',
    inputSchema: {
      type: 'object',
      properties: {
        templateName: {
          type: 'string',
          enum: ['Welcome Email', 'Job Status Update', 'Invoice Notification', 'Appointment Reminder'],
          description: 'The name of the email template to use'
        },
        to: {
          type: 'string',
          format: 'email',
          description: 'Recipient email address'
        },
        variables: {
          type: 'object',
          description: 'Variables to replace in the template',
          additionalProperties: true
        },
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          description: 'Optional: Schedule email for later (ISO 8601 format)'
        }
      },
      required: ['templateName', 'to']
    }
  },

  {
    name: 'send_custom_email',
    description: 'Send a custom email with HTML content',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          format: 'email',
          description: 'Recipient email address'
        },
        subject: {
          type: 'string',
          description: 'Email subject'
        },
        html: {
          type: 'string',
          description: 'Email body content (HTML supported)'
        },
        text: {
          type: 'string',
          description: 'Plain text version of email'
        },
        attachments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              content: { type: 'string', description: 'Base64 encoded content' },
              contentType: { type: 'string' }
            }
          },
          description: 'Optional: File attachments'
        },
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          description: 'Optional: Schedule email for later (ISO 8601 format)'
        }
      },
      required: ['to', 'subject', 'html']
    }
  },

  {
    name: 'send_job_status_email',
    description: 'Send job status update to customer',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          format: 'uuid',
          description: 'Job ID'
        },
        status: {
          type: 'string',
          enum: ['pending', 'assigned', 'en_route', 'in_progress', 'completed', 'cancelled'],
          description: 'New job status'
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the customer'
        },
        eta: {
          type: 'string',
          description: 'Estimated time of arrival'
        }
      },
      required: ['jobId', 'status']
    }
  },

  {
    name: 'send_invoice_email',
    description: 'Send invoice to customer',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          format: 'uuid',
          description: 'Invoice ID'
        },
        recipientEmail: {
          type: 'string',
          format: 'email',
          description: 'Optional: Override recipient email'
        },
        attachPDF: {
          type: 'boolean',
          description: 'Attach PDF invoice',
          default: true
        }
      },
      required: ['invoiceId']
    }
  },

  {
    name: 'send_appointment_reminder',
    description: 'Send appointment reminder to customer',
    inputSchema: {
      type: 'object',
      properties: {
        appointmentId: {
          type: 'string',
          description: 'Appointment ID'
        },
        customerEmail: {
          type: 'string',
          format: 'email',
          description: 'Customer email'
        },
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          description: 'When to send the reminder (ISO 8601 format)'
        },
        rescheduleUrl: {
          type: 'string',
          description: 'URL for rescheduling'
        }
      },
      required: ['appointmentId', 'customerEmail', 'scheduledAt']
    }
  },

  {
    name: 'get_email_templates',
    description: 'Get list of available email templates',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  {
    name: 'get_email_analytics',
    description: 'Get email analytics and statistics',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Start date for analytics (YYYY-MM-DD)'
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'End date for analytics (YYYY-MM-DD)'
        },
        templateId: {
          type: 'string',
          description: 'Filter by specific template'
        }
      }
    }
  },

  {
    name: 'list_email_queue',
    description: 'View email queue status',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'processing', 'sent', 'failed'],
          description: 'Filter by status'
        },
        limit: {
          type: 'integer',
          default: 50,
          description: 'Maximum number of emails to return'
        }
      }
    }
  },

  {
    name: 'create_email_template',
    description: 'Create a new email template',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Template name'
        },
        subject: {
          type: 'string',
          description: 'Email subject (can include variables like {{name}})'
        },
        html: {
          type: 'string',
          description: 'HTML template content'
        },
        text: {
          type: 'string',
          description: 'Plain text template content'
        },
        variables: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of variables used in template'
        }
      },
      required: ['name', 'subject', 'html']
    }
  }
]

export async function handleEmailTool(toolName: string, args: any) {
  try {
    switch (toolName) {
      case 'send_email_template': {
        // Get template by name
        const { data: template } = await supabase
          .from('email_templates')
          .select('*')
          .eq('name', args.templateName)
          .single()

        if (!template) {
          return { error: `Template "${args.templateName}" not found` }
        }

        // Send using Resend service
        const result = await resendService.sendEmail({
          templateId: template.id,
          recipients: [{
            email: args.to,
            variables: args.variables || {}
          }],
          scheduledAt: args.scheduledAt ? new Date(args.scheduledAt) : undefined
        })

        return result
      }

      case 'send_custom_email': {
        const result = await resendService.sendEmail({
          template: {
            name: 'Custom Email',
            subject: args.subject,
            html: args.html,
            text: args.text
          },
          recipients: [{ email: args.to }],
          attachments: args.attachments,
          scheduledAt: args.scheduledAt ? new Date(args.scheduledAt) : undefined
        })

        return result
      }

      case 'send_job_status_email': {
        // Get job details
        const { data: job } = await supabase
          .from('jobs')
          .select(`
            *,
            contacts!jobs_contact_id_fkey (
              first_name,
              last_name,
              email
            ),
            users!jobs_assigned_to_fkey (
              name
            )
          `)
          .eq('id', args.jobId)
          .single()

        if (!job) {
          return { error: 'Job not found' }
        }

        // Find job status template
        const { data: template } = await supabase
          .from('email_templates')
          .select('*')
          .eq('name', 'Job Status Update')
          .single()

        if (!template) {
          return { error: 'Job Status Update template not found' }
        }

        // Send email
        const result = await resendService.sendEmail({
          templateId: template.id,
          recipients: [{
            email: job.contacts?.email,
            variables: {
              jobId: job.job_number || job.id,
              status: args.status,
              customerName: `${job.contacts?.first_name} ${job.contacts?.last_name}`,
              technicianName: job.users?.name,
              notes: args.notes,
              eta: args.eta,
              jobUrl: `https://app.crm-ai-pro.com/jobs/${job.id}`
            }
          }]
        })

        // Update job status if provided
        if (args.status) {
          await supabase
            .from('jobs')
            .update({ status: args.status })
            .eq('id', args.jobId)
        }

        return result
      }

      case 'send_invoice_email': {
        // Get invoice details
        const { data: invoice } = await supabase
          .from('invoices')
          .select(`
            *,
            contacts!invoices_contact_id_fkey (
              first_name,
              last_name,
              email
            )
          `)
          .eq('id', args.invoiceId)
          .single()

        if (!invoice) {
          return { error: 'Invoice not found' }
        }

        // Find invoice template
        const { data: template } = await supabase
          .from('email_templates')
          .select('*')
          .eq('name', 'Invoice Notification')
          .single()

        if (!template) {
          return { error: 'Invoice Notification template not found' }
        }

        // Prepare attachments if requested
        const attachments = []
        if (args.attachPDF) {
          // TODO: Generate PDF invoice
          // const pdfBuffer = await generateInvoicePDF(invoice)
          // attachments.push({
          //   filename: `invoice-${invoice.invoice_number}.pdf`,
          //   content: pdfBuffer.toString('base64'),
          //   contentType: 'application/pdf'
          // })
        }

        // Send email
        const result = await resendService.sendEmail({
          templateId: template.id,
          recipients: [{
            email: args.recipientEmail || invoice.contacts?.email,
            variables: {
              invoiceNumber: invoice.invoice_number,
              customerName: `${invoice.contacts?.first_name} ${invoice.contacts?.last_name}`,
              companyName: '317 Plumber',
              amount: invoice.total_amount,
              dueDate: invoice.due_date,
              jobNumber: invoice.job_number,
              invoiceUrl: `https://app.crm-ai-pro.com/invoices/${invoice.id}`
            }
          }],
          attachments: attachments.length > 0 ? attachments : undefined
        })

        return result
      }

      case 'send_appointment_reminder': {
        // Get appointment details
        const { data: appointment } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', args.appointmentId)
          .single()

        if (!appointment) {
          return { error: 'Appointment not found' }
        }

        // Find reminder template
        const { data: template } = await supabase
          .from('email_templates')
          .select('*')
          .eq('name', 'Appointment Reminder')
          .single()

        if (!template) {
          return { error: 'Appointment Reminder template not found' }
        }

        // Schedule email
        const result = await resendService.sendEmail({
          templateId: template.id,
          recipients: [{
            email: args.customerEmail,
            variables: {
              customerName: appointment.customer_name,
              date: appointment.start_time,
              time: appointment.start_time,
              service: appointment.service_type,
              technician: appointment.technician_name,
              address: appointment.location,
              appointmentUrl: `https://app.crm-ai-pro.com/appointments/${args.appointmentId}`,
              rescheduleUrl: args.rescheduleUrl
            }
          }],
          scheduledAt: new Date(args.scheduledAt)
        })

        return result
      }

      case 'get_email_templates': {
        const { data: templates } = await supabase
          .from('email_templates')
          .select('id, name, subject, template_type, variables')
          .eq('is_active', true)
          .order('name')

        return { templates: templates || [] }
      }

      case 'get_email_analytics': {
        const startDate = args.startDate ? new Date(args.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = args.endDate ? new Date(args.endDate) : new Date()

        const analytics = await resendService.getAnalytics(
          undefined, // TODO: Get account ID from context
          startDate,
          endDate
        )

        return analytics
      }

      case 'list_email_queue': {
        let query = supabase
          .from('email_queue')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(args.limit || 50)

        if (args.status) {
          query = query.eq('status', args.status)
        }

        const { data: emails } = await query

        return { emails: emails || [] }
      }

      case 'create_email_template': {
        const { data: template } = await supabase
          .from('email_templates')
          .insert({
            name: args.name,
            subject: args.subject,
            body_html: args.html,
            body_text: args.text,
            variables: args.variables || [],
            template_type: 'custom',
            is_active: true,
            account_id: null // System-wide template
          })
          .select()
          .single()

        return { template }
      }

      default:
        return { error: `Unknown email tool: ${toolName}` }
    }
  } catch (error) {
    console.error(`Error in email tool ${toolName}:`, error)
    return {
      error: error instanceof Error ? error.message : 'An error occurred'
    }
  }
}