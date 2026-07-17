export type EmailRecipient = { email: string; name?: string }

export type EmailSendOptions = {
  recipients: EmailRecipient[]
  from: string
  replyTo?: string
  template: {
    name: string
    subject: string
    html: string
    text: string
  }
}

export class ResendService {
  constructor(private readonly apiKey: string) {}

  async sendEmail(options: EmailSendOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) return { success: false, error: 'Resend API key is not configured' }
    if (!options.recipients.length) return { success: false, error: 'At least one recipient is required' }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from,
          to: options.recipients.map(recipient => recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email),
          reply_to: options.replyTo,
          subject: options.template.subject,
          html: options.template.html,
          text: options.template.text,
          tags: [{ name: 'template', value: options.template.name }],
        }),
      })

      if (!response.ok) return { success: false, error: `Resend request failed with status ${response.status}` }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Email request failed' }
    }
  }
}
