/**
 * Enhanced Resend Email Service
 *
 * Features:
 * - Template-based email sending
 * - Email queue with retry logic
 * - Analytics and tracking
 * - Batch email sending
 * - Webhook handling
 */

import { Resend } from 'resend'
import { getSenderEmail, getCrmSenderEmail, getJobStatusSenderEmail } from './domain-config'
import { createClient } from '@supabase/supabase-js'

export interface EmailRecipient {
  email: string
  name?: string
  variables?: Record<string, any>
}

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  html: string
  text?: string
  variables?: string[]
}

export interface EmailSendOptions {
  templateId?: string
  template?: EmailTemplate
  recipients: EmailRecipient[]
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
  headers?: Record<string, string>
  scheduledAt?: Date
  batchId?: string
  metadata?: Record<string, any>
}

export interface EmailQueueItem {
  id: string
  account_id: string
  recipient_email: string
  recipient_name?: string
  subject: string
  html_content?: string
  text_content?: string
  template_id?: string
  template_variables?: Record<string, any>
  from_email?: string
  reply_to?: string
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
  attempts: number
  max_attempts: number
  last_error?: string
  scheduled_at?: Date
  sent_at?: Date
  created_at: Date
  updated_at: Date
  metadata?: Record<string, any>
  provider: 'resend' | 'gmail' | 'microsoft'
  batch_id?: string
}

export interface EmailAnalytics {
  totalSent: number
  totalDelivered: number
  totalBounced: number
  totalComplained: number
  totalOpened: number
  totalClicked: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
}

class ResendService {
  private resend: Resend
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY!)
  }

  /**
   * Send email using template or custom content
   */
  async sendEmail(options: EmailSendOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // If using template ID, fetch template
      if (options.templateId && !options.template) {
        const { data: template } = await this.supabase
          .from('email_templates')
          .select('*')
          .eq('id', options.templateId)
          .single()

        if (template) {
          options.template = {
            name: template.name,
            subject: template.subject,
            html: template.body_html || '',
            text: template.body_text || '',
            variables: template.variables || []
          }
        }
      }

      // If scheduling, add to queue
      if (options.scheduledAt && options.scheduledAt > new Date()) {
        return this.queueEmail(options)
      }

      // Process each recipient
      const results = []
      for (const recipient of options.recipients) {
        const result = await this.sendToRecipient(options, recipient)
        results.push(result)
      }

      // Return success if all emails were sent
      const allSuccessful = results.every(r => r.success)
      return {
        success: allSuccessful,
        messageId: allSuccessful ? results[0]?.messageId : undefined,
        error: allSuccessful ? undefined : 'Some emails failed to send'
      }
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }
    }
  }

  /**
   * Send email to a single recipient
   */
  private async sendToRecipient(options: EmailSendOptions, recipient: EmailRecipient) {
    try {
      // Prepare content
      let subject = options.template?.subject || ''
      let html = options.template?.html || ''
      let text = options.template?.text || ''

      // Replace template variables
      if (options.template && recipient.variables) {
        subject = this.replaceVariables(subject, recipient.variables)
        html = this.replaceVariables(html, recipient.variables)
        text = this.replaceVariables(text, recipient.variables)
      }

      // Determine sender
      const from = options.from || getCrmSenderEmail()

      // Send via Resend
      const { data, error } = await this.resend.emails.send({
        from,
        to: recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email,
        subject,
        html,
        text,
        replyTo: options.replyTo,
        attachments: options.attachments,
        headers: {
          ...options.headers,
          ...(options.batchId && { 'X-Batch-ID': options.batchId }),
          ...(options.metadata && {
            'X-Metadata': JSON.stringify(options.metadata)
          })
        }
      })

      if (error) {
        throw error
      }

      // Track analytics
      await this.trackEmail(data?.id || '', recipient.email, 'sent')

      return {
        success: true,
        messageId: data?.id
      }
    } catch (error) {
      console.error(`Error sending to ${recipient.email}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send'
      }
    }
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(content: string, variables: Record<string, any>): string {
    let replaced = content

    // Replace {{variable}} format
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      replaced = replaced.replace(regex, String(value))
    }

    // Replace {{variable:format}} format (e.g., {{date:MM/DD/YYYY}})
    for (const [key, value] of Object.entries(variables)) {
      const formatRegex = new RegExp(`{{\\s*${key}\\s*:\\s*([^}]+)\\s*}}`, 'g')
      replaced = replaced.replace(formatRegex, (match, format) => {
        if (value instanceof Date) {
          return this.formatDate(value, format)
        }
        return String(value)
      })
    }

    return replaced
  }

  /**
   * Format date according to provided format
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
  }

  /**
   * Add email to queue for scheduled sending
   */
  private async queueEmail(options: EmailSendOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Create queue items for each recipient
      const queueItems: Partial<EmailQueueItem>[] = options.recipients.map(recipient => ({
        account_id: 'default', // TODO: Get from context
        recipient_email: recipient.email,
        recipient_name: recipient.name,
        subject: options.template?.subject || '',
        html_content: options.template?.html,
        text_content: options.template?.text,
        template_id: options.templateId,
        template_variables: recipient.variables,
        from_email: options.from,
        reply_to: options.replyTo,
        status: 'pending' as const,
        attempts: 0,
        max_attempts: 3,
        scheduled_at: options.scheduledAt,
        metadata: options.metadata,
        provider: 'resend' as const,
        batch_id: options.batchId
      }))

      // Insert into queue
      const { error } = await this.supabase
        .from('email_queue')
        .insert(queueItems)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error queuing email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to queue email'
      }
    }
  }

  /**
   * Process email queue
   */
  async processQueue(): Promise<void> {
    console.log('Processing email queue...')

    // Get pending emails
    const { data: pendingEmails, error } = await this.supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error || !pendingEmails || pendingEmails.length === 0) {
      return
    }

    // Process each email
    for (const email of pendingEmails) {
      try {
        // Mark as processing
        await this.supabase
          .from('email_queue')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id)

        // Prepare send options
        const sendOptions: EmailSendOptions = {
          templateId: email.template_id,
          recipients: [{
            email: email.recipient_email,
            name: email.recipient_name || undefined,
            variables: email.template_variables || {}
          }],
          from: email.from_email || undefined,
          replyTo: email.reply_to || undefined,
          batchId: email.batch_id || undefined,
          metadata: email.metadata || {}
        }

        // Send email
        const result = await this.sendToRecipient(sendOptions, sendOptions.recipients[0])

        if (result.success) {
          // Mark as sent
          await this.supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id)

          console.log(`Email sent successfully to ${email.recipient_email}`)
        } else {
          // Handle failure
          await this.handleQueueFailure(email, result.error)
        }
      } catch (error) {
        await this.handleQueueFailure(email, error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  /**
   * Handle queue item failure
   */
  private async handleQueueFailure(email: EmailQueueItem, error?: string): Promise<void> {
    const attempts = email.attempts + 1

    if (attempts >= email.max_attempts) {
      // Mark as failed after max attempts
      await this.supabase
        .from('email_queue')
        .update({
          status: 'failed',
          attempts,
          last_error: error,
          updated_at: new Date().toISOString()
        })
        .eq('id', email.id)

      console.error(`Email failed permanently for ${email.recipient_email}:`, error)
    } else {
      // Retry with exponential backoff
      const backoffMinutes = Math.pow(2, attempts) * 5 // 5, 10, 20 minutes
      const retryAt = new Date(Date.now() + backoffMinutes * 60000)

      await this.supabase
        .from('email_queue')
        .update({
          status: 'pending',
          attempts,
          last_error: error,
          scheduled_at: retryAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', email.id)

      console.log(`Email scheduled for retry ${attempts}/${email.max_attempts} for ${email.recipient_email} at ${retryAt}`)
    }
  }

  /**
   * Track email analytics
   */
  private async trackEmail(messageId: string, email: string, event: string): Promise<void> {
    try {
      await this.supabase
        .from('email_analytics')
        .insert({
          message_id: messageId,
          recipient_email: email,
          event,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error tracking email analytics:', error)
    }
  }

  /**
   * Handle Resend webhooks for analytics
   */
  async handleWebhook(body: any): Promise<void> {
    try {
      const events = Array.isArray(body) ? body : [body]

      for (const event of events) {
        const { type, data } = event

        switch (type) {
          case 'email.delivered':
            await this.trackEmail(data.message_id, data.to, 'delivered')
            break
          case 'email.bounced':
            await this.trackEmail(data.message_id, data.to, 'bounced')
            break
          case 'email.complained':
            await this.trackEmail(data.message_id, data.to, 'complained')
            break
          case 'email.opened':
            await this.trackEmail(data.message_id, data.to, 'opened')
            break
          case 'email.clicked':
            await this.trackEmail(data.message_id, data.to, 'clicked')
            break
        }
      }
    } catch (error) {
      console.error('Error handling webhook:', error)
    }
  }

  /**
   * Get email analytics
   */
  async getAnalytics(accountId?: string, startDate?: Date, endDate?: Date): Promise<EmailAnalytics> {
    try {
      let query = this.supabase
        .from('email_analytics')
        .select('*')

      if (accountId) {
        // TODO: Add account_id to email_analytics table
        // query = query.eq('account_id', accountId)
      }

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString())
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString())
      }

      const { data: events, error } = await query

      if (error || !events) {
        throw error || new Error('No events found')
      }

      // Calculate metrics
      const totalSent = events.filter(e => e.event === 'sent').length
      const totalDelivered = events.filter(e => e.event === 'delivered').length
      const totalBounced = events.filter(e => e.event === 'bounced').length
      const totalComplained = events.filter(e => e.event === 'complained').length
      const totalOpened = events.filter(e => e.event === 'opened').length
      const totalClicked = events.filter(e => e.event === 'clicked').length

      return {
        totalSent,
        totalDelivered,
        totalBounced,
        totalComplained,
        totalOpened,
        totalClicked,
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
      }
    } catch (error) {
      console.error('Error getting analytics:', error)
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalBounced: 0,
        totalComplained: 0,
        totalOpened: 0,
        totalClicked: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0
      }
    }
  }

  /**
   * Create predefined email templates
   */
  async createDefaultTemplates(): Promise<void> {
    const templates = [
      {
        name: 'Job Status Update',
        subject: 'Job Status Update - {{jobId}} - {{status}}',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Job Status Update</h2>
            <p>Hi {{customerName}},</p>
            <p>Your job (ID: {{jobId}}) status has been updated to: <strong>{{status}}</strong></p>

            {{#if technicianName}}
            <p>Technician: {{technicianName}}</p>
            {{/if}}

            {{#if notes}}
            <p>Notes: {{notes}}</p>
            {{/if}}

            {{#if eta}}
            <p>Estimated Arrival: {{eta}}</p>
            {{/if}}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                This is an automated message from CRM-AI PRO.
                You can view your job details <a href="{{jobUrl}}">here</a>.
              </p>
            </div>
          </div>
        `,
        body_text: `
Job Status Update

Hi {{customerName}},

Your job (ID: {{jobId}}) status has been updated to: {{status}}

{{#if technicianName}}
Technician: {{technicianName}}
{{/if}}

{{#if notes}}
Notes: {{notes}}
{{/if}}

{{#if eta}}
Estimated Arrival: {{eta}}
{{/if}}

---
This is an automated message from CRM-AI PRO.
Job URL: {{jobUrl}}
        `,
        template_type: 'job_update',
        variables: ['jobId', 'status', 'customerName', 'technicianName', 'notes', 'eta', 'jobUrl']
      },
      {
        name: 'Welcome Email',
        subject: 'Welcome to CRM-AI PRO!',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to CRM-AI PRO! 👋</h1>
            <p>Hi {{firstName}},</p>
            <p>We're excited to have you on board! CRM-AI PRO is your complete solution for managing customers, jobs, and communications.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Getting Started</h3>
              <ul>
                <li>✅ Complete your profile</li>
                <li>📱 Try our mobile app</li>
                <li>🎯 Schedule your first job</li>
                <li>📊 Check your dashboard</li>
              </ul>
            </div>

            <p>
              <a href="{{loginUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Get Started
              </a>
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                If you have any questions, reply to this email or visit our help center.
              </p>
            </div>
          </div>
        `,
        body_text: `
Welcome to CRM-AI PRO!

Hi {{firstName}},

We're excited to have you on board! CRM-AI PRO is your complete solution for managing customers, jobs, and communications.

Getting Started:
- Complete your profile
- Try our mobile app
- Schedule your first job
- Check your dashboard

Get started here: {{loginUrl}}

---
If you have any questions, reply to this email or visit our help center.
        `,
        template_type: 'welcome',
        variables: ['firstName', 'loginUrl']
      },
      {
        name: 'Invoice Notification',
        subject: 'Invoice {{invoiceNumber}} from {{companyName}}',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Invoice #{{invoiceNumber}}</h2>
            <p>Hi {{customerName}},</p>
            <p>Your invoice from {{companyName}} is ready. Below are the details:</p>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Invoice Number:</td>
                  <td style="padding: 8px 0;">{{invoiceNumber}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Amount Due:</td>
                  <td style="padding: 8px 0;">\${{amount}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Due Date:</td>
                  <td style="padding: 8px 0;">{{dueDate}}</td>
                </tr>
                {{#if jobNumber}}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Job Reference:</td>
                  <td style="padding: 8px 0;">{{jobNumber}}</td>
                </tr>
                {{/if}}
              </table>
            </div>

            <p>
              <a href="{{invoiceUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Invoice
              </a>
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                Thank you for your business! If you have any questions about this invoice, please don't hesitate to contact us.
              </p>
            </div>
          </div>
        `,
        body_text: `
Invoice #{{invoiceNumber}}

Hi {{customerName}},

Your invoice from {{companyName}} is ready. Below are the details:

Invoice Number: {{invoiceNumber}}
Amount Due: \${{amount}}
Due Date: {{dueDate}}
{{#if jobNumber}}
Job Reference: {{jobNumber}}
{{/if}}

View your invoice here: {{invoiceUrl}}

---
Thank you for your business! If you have any questions about this invoice, please don't hesitate to contact us.
        `,
        template_type: 'invoice',
        variables: ['invoiceNumber', 'customerName', 'companyName', 'amount', 'dueDate', 'jobNumber', 'invoiceUrl']
      },
      {
        name: 'Appointment Reminder',
        subject: 'Appointment Reminder - {{date}} at {{time}}',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Appointment Reminder 🔔</h2>
            <p>Hi {{customerName}},</p>
            <p>This is a friendly reminder about your upcoming appointment:</p>

            <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">Appointment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0;">{{date}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0;">{{time}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Service:</td>
                  <td style="padding: 8px 0;">{{service}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Technician:</td>
                  <td style="padding: 8px 0;">{{technician}}</td>
                </tr>
                {{#if address}}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0;">{{address}}</td>
                </tr>
                {{/if}}
              </table>
            </div>

            <p>
              <a href="{{appointmentUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Appointment
              </a>
              {{#if rescheduleUrl}}
              <a href="{{rescheduleUrl}}" style="margin-left: 10px; color: #2563eb; text-decoration: underline;">
                Reschedule
              </a>
              {{/if}}
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                Please make sure someone is available at the location. If you need to make any changes, please let us know as soon as possible.
              </p>
            </div>
          </div>
        `,
        body_text: `
Appointment Reminder

Hi {{customerName}},

This is a friendly reminder about your upcoming appointment:

Appointment Details:
Date: {{date}}
Time: {{time}}
Service: {{service}}
Technician: {{technician}}
{{#if address}}
Location: {{address}}
{{/if}}

View your appointment here: {{appointmentUrl}}
{{#if rescheduleUrl}}
Reschedule: {{rescheduleUrl}}
{{/if}}

---
Please make sure someone is available at the location. If you need to make any changes, please let us know as soon as possible.
        `,
        template_type: 'reminder',
        variables: ['customerName', 'date', 'time', 'service', 'technician', 'address', 'appointmentUrl', 'rescheduleUrl']
      }
    ]

    // Insert templates
    for (const template of templates) {
      await this.supabase
        .from('email_templates')
        .upsert({
          ...template,
          account_id: null, // System-wide templates
          is_active: true
        }, {
          onConflict: 'name'
        })
    }
  }
}

// Export singleton instance
const resendService = new ResendService()
export { resendService }