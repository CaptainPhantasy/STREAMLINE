/**
 * Notification Service for Agent Operations
 * 
 * Provides email notifications via Resend for agent operations.
 * Handles deployment notifications, error alerts, and status updates.
 */

import { ResendService, type EmailSendOptions } from '../../email/resend-service'

export interface AgentNotificationOptions {
  resendApiKey: string
  defaultFrom?: string
  defaultReplyTo?: string
}

export interface DeploymentNotification {
  ticketId: string
  changes: Array<{ file: string; type: string }>
  stagingUrl?: string
  approvalLink?: string
  status: 'ready' | 'deployed' | 'failed'
}

export interface ErrorAlert {
  agentId: string
  error: string
  context?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface StatusUpdate {
  agentId: string
  phase: string
  progress: number
  message: string
}

/**
 * Notification Service for agent operations
 */
export class AgentNotificationService {
  private resendService: ResendService
  private defaultFrom: string
  private defaultReplyTo: string

  constructor(options: AgentNotificationOptions) {
    this.resendService = new ResendService(options.resendApiKey)
    this.defaultFrom = options.defaultFrom || 'agents@crm-ai-pro.com'
    this.defaultReplyTo = options.defaultReplyTo || 'noreply@crm-ai-pro.com'
  }

  /**
   * Send deployment notification
   */
  async sendDeploymentNotification(
    recipient: string,
    notification: DeploymentNotification
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `Deployment ${notification.status === 'ready' ? 'Ready' : notification.status === 'deployed' ? 'Complete' : 'Failed'}: ${notification.ticketId}`
      
      const html = this.generateDeploymentEmailHTML(notification)
      const text = this.generateDeploymentEmailText(notification)

      const emailOptions: EmailSendOptions = {
        recipients: [{ email: recipient }],
        from: this.defaultFrom,
        replyTo: this.defaultReplyTo,
        template: {
          name: 'deployment-notification',
          subject,
          html,
          text
        }
      }

      const result = await this.resendService.sendEmail(emailOptions)

      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send error alert
   */
  async sendErrorAlert(
    recipient: string,
    alert: ErrorAlert
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `[${alert.severity.toUpperCase()}] Agent Error: ${alert.agentId}`
      
      const html = this.generateErrorAlertHTML(alert)
      const text = this.generateErrorAlertText(alert)

      const emailOptions: EmailSendOptions = {
        recipients: [{ email: recipient }],
        from: this.defaultFrom,
        replyTo: this.defaultReplyTo,
        template: {
          name: 'error-alert',
          subject,
          html,
          text
        }
      }

      const result = await this.resendService.sendEmail(emailOptions)

      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send status update
   */
  async sendStatusUpdate(
    recipient: string,
    update: StatusUpdate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `Agent Status Update: ${update.agentId} - ${update.phase}`
      
      const html = this.generateStatusUpdateHTML(update)
      const text = this.generateStatusUpdateText(update)

      const emailOptions: EmailSendOptions = {
        recipients: [{ email: recipient }],
        from: this.defaultFrom,
        replyTo: this.defaultReplyTo,
        template: {
          name: 'status-update',
          subject,
          html,
          text
        }
      }

      const result = await this.resendService.sendEmail(emailOptions)

      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send ticket completion notification
   */
  async sendTicketCompletion(
    recipient: string,
    ticketId: string,
    summary: string,
    changes: Array<{ file: string; type: string }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `Ticket Complete: ${ticketId}`
      
      const html = `
        <h2>Ticket ${ticketId} Completed</h2>
        <p><strong>Summary:</strong> ${summary}</p>
        <h3>Changes:</h3>
        <ul>
          ${changes.map(c => `<li><strong>${c.type}</strong>: ${c.file}</li>`).join('')}
        </ul>
      `
      
      const text = `
Ticket ${ticketId} Completed

Summary: ${summary}

Changes:
${changes.map(c => `- ${c.type}: ${c.file}`).join('\n')}
      `

      const emailOptions: EmailSendOptions = {
        recipients: [{ email: recipient }],
        from: this.defaultFrom,
        replyTo: this.defaultReplyTo,
        template: {
          name: 'ticket-completion',
          subject,
          html,
          text
        }
      }

      const result = await this.resendService.sendEmail(emailOptions)

      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Private helper methods for email generation

  private generateDeploymentEmailHTML(notification: DeploymentNotification): string {
    const statusColor = notification.status === 'ready' ? '#10b981' : notification.status === 'deployed' ? '#3b82f6' : '#ef4444'
    const statusText = notification.status === 'ready' ? 'Ready for Review' : notification.status === 'deployed' ? 'Deployed Successfully' : 'Deployment Failed'

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Deployment ${statusText}</h2>
        <p><strong>Ticket ID:</strong> ${notification.ticketId}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        
        <h3>Changes:</h3>
        <ul>
          ${notification.changes.map(c => `<li><strong>${c.type}</strong>: ${c.file}</li>`).join('')}
        </ul>
        
        ${notification.stagingUrl ? `<p><a href="${notification.stagingUrl}" style="color: #3b82f6;">View Staging Environment</a></p>` : ''}
        ${notification.approvalLink ? `<p><a href="${notification.approvalLink}" style="color: #10b981;">Approve Deployment</a></p>` : ''}
      </div>
    `
  }

  private generateDeploymentEmailText(notification: DeploymentNotification): string {
    const statusText = notification.status === 'ready' ? 'Ready for Review' : notification.status === 'deployed' ? 'Deployed Successfully' : 'Deployment Failed'

    return `
Deployment ${statusText}

Ticket ID: ${notification.ticketId}
Status: ${statusText}

Changes:
${notification.changes.map(c => `- ${c.type}: ${c.file}`).join('\n')}

${notification.stagingUrl ? `Staging URL: ${notification.stagingUrl}` : ''}
${notification.approvalLink ? `Approval Link: ${notification.approvalLink}` : ''}
    `.trim()
  }

  private generateErrorAlertHTML(alert: ErrorAlert): string {
    const severityColor = {
      low: '#f59e0b',
      medium: '#f97316',
      high: '#ef4444',
      critical: '#dc2626'
    }[alert.severity]

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${severityColor};">Agent Error Alert</h2>
        <p><strong>Agent ID:</strong> ${alert.agentId}</p>
        <p><strong>Severity:</strong> <span style="color: ${severityColor}; font-weight: bold;">${alert.severity.toUpperCase()}</span></p>
        <p><strong>Error:</strong></p>
        <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${alert.error}</pre>
        ${alert.context ? `<p><strong>Context:</strong></p><pre style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${JSON.stringify(alert.context, null, 2)}</pre>` : ''}
      </div>
    `
  }

  private generateErrorAlertText(alert: ErrorAlert): string {
    return `
Agent Error Alert

Agent ID: ${alert.agentId}
Severity: ${alert.severity.toUpperCase()}

Error:
${alert.error}

${alert.context ? `Context:\n${JSON.stringify(alert.context, null, 2)}` : ''}
    `.trim()
  }

  private generateStatusUpdateHTML(update: StatusUpdate): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Agent Status Update</h2>
        <p><strong>Agent ID:</strong> ${update.agentId}</p>
        <p><strong>Phase:</strong> ${update.phase}</p>
        <p><strong>Progress:</strong> ${update.progress}%</p>
        <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0;">
          <div style="background: #3b82f6; height: 100%; width: ${update.progress}%; transition: width 0.3s;"></div>
        </div>
        <p><strong>Message:</strong> ${update.message}</p>
      </div>
    `
  }

  private generateStatusUpdateText(update: StatusUpdate): string {
    return `
Agent Status Update

Agent ID: ${update.agentId}
Phase: ${update.phase}
Progress: ${update.progress}%

Message: ${update.message}
    `.trim()
  }
}

/**
 * Factory function to create notification service
 */
export function createNotificationService(options: AgentNotificationOptions): AgentNotificationService {
  return new AgentNotificationService(options)
}
