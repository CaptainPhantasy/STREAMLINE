import { describe, expect, it } from 'vitest'
import { ResendService } from './resend-service'

describe('ResendService', () => {
  it('fails closed without a credential and performs no request', async () => {
    const result = await new ResendService('').sendEmail({
      recipients: [{ email: 'operator@example.com' }],
      from: 'agent@example.com',
      template: { name: 'status', subject: 'Status', html: '<p>ok</p>', text: 'ok' },
    })
    expect(result).toEqual({ success: false, error: 'Resend API key is not configured' })
  })
})
