/**
 * Email Service Test Suite
 *
 * Tests for:
 * - Template sending
 * - Queue functionality
 * - Analytics tracking
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { resendService } from '../resend-service'
import { sendEmail } from '../service'
import { createClient } from '@supabase/supabase-js'

// Mock dependencies
vi.mock('@supabase/supabase-js')
vi.mock('resend')

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendEmail', () => {
    it('should send email via Resend by default', async () => {
      // Arrange
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }
      ;(createClient as any).mockReturnValue(mockSupabase)

      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      }

      // Act
      const result = await sendEmail(options)

      // Assert
      expect(result).toBeDefined()
      expect(mockSupabase.from).toHaveBeenCalledWith('email_providers')
    })

    it('should use Gmail when Gmail provider is configured', async () => {
      // Arrange
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{
            id: '1',
            provider: 'gmail',
            provider_email: 'user@gmail.com',
            access_token_encrypted: 'encrypted_token',
            refresh_token_encrypted: 'encrypted_refresh',
            token_expires_at: null,
            is_default: true,
            is_active: true
          }],
          error: null
        })
      }
      ;(createClient as any).mockReturnValue(mockSupabase)

      // Mock decryption
      vi.doMock('../gmail/encryption', () => ({
        decrypt: vi.fn().mockReturnValue('decrypted_token'),
        encrypt: vi.fn().mockReturnValue('encrypted')
      }))

      const options = {
        accountId: 'account-1',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>'
      }

      // Act
      const result = await sendEmail(options)

      // Assert
      expect(result.provider).toBe('gmail')
    })
  })

  describe('resendService', () => {
    describe('sendEmail', () => {
      it('should send email with template variables', async () => {
        // Arrange
        const mockSupabase = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'template-1',
              name: 'Test Template',
              subject: 'Hello {{name}}',
              body_html: '<p>Welcome {{name}}!</p>',
              variables: ['name']
            },
            error: null
          }),
          insert: vi.fn().mockReturnThis()
        }
        ;(createClient as any).mockReturnValue(mockSupabase)

        const options = {
          templateId: 'template-1',
          recipients: [
            { email: 'john@example.com', name: 'John', variables: { name: 'John' } }
          ]
        }

        // Act
        const result = await resendService.sendEmail(options)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should queue scheduled emails', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 60000) // 1 minute from now
        const options = {
          recipients: [{ email: 'test@example.com' }],
          scheduledAt: futureDate
        }

        // Act
        const result = await resendService.sendEmail(options)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should handle batch emails', async () => {
        // Arrange
        const options = {
          recipients: [
            { email: 'user1@example.com' },
            { email: 'user2@example.com' },
            { email: 'user3@example.com' }
          ],
          batchId: 'batch-123'
        }

        // Act
        const result = await resendService.sendEmail(options)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('replaceVariables', () => {
      it('should replace simple variables', () => {
        // Arrange
        const content = 'Hello {{name}}, your order #{{orderId}} is ready!'
        const variables = { name: 'John', orderId: '12345' }

        // Act
        const result = (resendService as any).replaceVariables(content, variables)

        // Assert
        expect(result).toBe('Hello John, your order #12345 is ready!')
      })

      it('should format dates', () => {
        // Arrange
        const content = 'Date: {{date:MM/DD/YYYY}}'
        const variables = { date: new Date('2024-01-28') }

        // Act
        const result = (resendService as any).replaceVariables(content, variables)

        // Assert
        expect(result).toBe('Date: 01/28/2024')
      })

      it('should handle missing variables gracefully', () => {
        // Arrange
        const content = 'Hello {{name}}, welcome!'
        const variables = {}

        // Act
        const result = (resendService as any).replaceVariables(content, variables)

        // Assert
        expect(result).toBe('Hello {{name}}, welcome!')
      })
    })

    describe('processQueue', () => {
      it('should process pending emails', async () => {
        // Arrange
        const mockSupabase = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{
              id: 'queue-1',
              recipient_email: 'test@example.com',
              subject: 'Test',
              status: 'pending',
              attempts: 0,
              max_attempts: 3
            }],
            error: null
          }),
          update: vi.fn().mockReturnThis()
        }
        ;(createClient as any).mockReturnValue(mockSupabase)

        // Act
        await resendService.processQueue()

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith('email_queue')
        expect(mockSupabase.update).toHaveBeenCalled()
      })
    })

    describe('getAnalytics', () => {
      it('should calculate email metrics correctly', async () => {
        // Arrange
        const mockSupabase = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: [
              { event: 'sent' },
              { event: 'sent' },
              { event: 'delivered' },
              { event: 'opened' },
              { event: 'clicked' },
              { event: 'bounced' }
            ],
            error: null
          })
        }
        ;(createClient as any).mockReturnValue(mockSupabase)

        // Act
        const analytics = await resendService.getAnalytics()

        // Assert
        expect(analytics.totalSent).toBe(2)
        expect(analytics.totalDelivered).toBe(1)
        expect(analytics.totalOpened).toBe(1)
        expect(analytics.totalClicked).toBe(1)
        expect(analytics.totalBounced).toBe(1)
        expect(analytics.deliveryRate).toBe(50)
        expect(analytics.openRate).toBe(100)
      })
    })

    describe('handleWebhook', () => {
      it('should process webhook events', async () => {
        // Arrange
        const events = [
          {
            type: 'email.delivered',
            data: {
              message_id: 'msg-123',
              to: 'test@example.com'
            }
          },
          {
            type: 'email.opened',
            data: {
              message_id: 'msg-123',
              to: 'test@example.com'
            }
          }
        ]

        const mockSupabase = {
          from: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null })
        }
        ;(createClient as any).mockReturnValue(mockSupabase)

        // Act
        await resendService.handleWebhook(events)

        // Assert
        expect(mockSupabase.insert).toHaveBeenCalledTimes(2)
      })
    })
  })
})