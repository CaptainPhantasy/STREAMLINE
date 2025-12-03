/**
 * Test Data Generators
 * 
 * UUID-based test data generators for test isolation
 * 
 * Usage:
 *   import { generateTestJob, generateTestContact } from './utils/test-data'
 */

import { randomUUID } from 'crypto'

/**
 * Generate a test account ID (UUID)
 */
export function generateAccountId(): string {
  return randomUUID()
}

/**
 * Generate a test user ID (UUID)
 */
export function generateUserId(): string {
  return randomUUID()
}

/**
 * Generate a test contact ID (UUID)
 */
export function generateContactId(): string {
  return randomUUID()
}

/**
 * Generate a test job ID (UUID)
 */
export function generateJobId(): string {
  return randomUUID()
}

/**
 * Generate a test conversation ID (UUID)
 */
export function generateConversationId(): string {
  return randomUUID()
}

/**
 * Generate a test message ID (UUID)
 */
export function generateMessageId(): string {
  return randomUUID()
}

/**
 * Generate a test photo ID (UUID)
 */
export function generatePhotoId(): string {
  return randomUUID()
}

/**
 * Generate a test invoice ID (UUID)
 */
export function generateInvoiceId(): string {
  return randomUUID()
}

/**
 * Generate test contact data
 */
export function generateTestContact(overrides: Partial<any> = {}) {
  return {
    id: generateContactId(),
    account_id: generateAccountId(),
    email: `test-${randomUUID().substring(0, 8)}@example.com`,
    phone: `317-555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    first_name: 'Test',
    last_name: 'User',
    address: '123 Test Street, Indianapolis, IN 46202',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate test job data
 */
export function generateTestJob(overrides: Partial<any> = {}) {
  return {
    id: generateJobId(),
    account_id: generateAccountId(),
    contact_id: generateContactId(),
    conversation_id: null,
    status: 'scheduled' as const,
    scheduled_start: new Date().toISOString(),
    scheduled_end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    tech_assigned_id: null,
    description: `Test job ${randomUUID().substring(0, 8)}`,
    total_amount: null,
    stripe_payment_link: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate test conversation data
 */
export function generateTestConversation(overrides: Partial<any> = {}) {
  return {
    id: generateConversationId(),
    account_id: generateAccountId(),
    contact_id: generateContactId(),
    status: 'open' as const,
    subject: `Test conversation ${randomUUID().substring(0, 8)}`,
    channel: 'email' as const,
    last_message_at: new Date().toISOString(),
    assigned_to: null,
    ai_summary: null,
    ...overrides,
  }
}

/**
 * Generate test message data
 */
export function generateTestMessage(overrides: Partial<any> = {}) {
  return {
    id: generateMessageId(),
    account_id: generateAccountId(),
    conversation_id: generateConversationId(),
    direction: 'inbound' as const,
    sender_type: 'contact' as const,
    sender_id: null,
    subject: null,
    body_text: `Test message ${randomUUID().substring(0, 8)}`,
    body_html: null,
    attachments: [],
    message_id: `test-${randomUUID()}`,
    in_reply_to: null,
    is_internal_note: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate test photo data
 */
export function generateTestPhoto(overrides: Partial<any> = {}) {
  return {
    id: generatePhotoId(),
    account_id: generateAccountId(),
    job_id: generateJobId(),
    photo_url: `https://example.com/photos/${randomUUID()}.jpg`,
    thumbnail_url: `https://example.com/photos/${randomUUID()}-thumb.jpg`,
    caption: null,
    taken_at: new Date().toISOString(),
    taken_by: generateUserId(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate test user data
 */
export function generateTestUser(overrides: Partial<any> = {}) {
  return {
    id: generateUserId(),
    account_id: generateAccountId(),
    full_name: `Test User ${randomUUID().substring(0, 8)}`,
    role: 'tech' as const,
    avatar_url: null,
    ...overrides,
  }
}

/**
 * Generate a unique test email
 */
export function generateTestEmail(): string {
  return `test-${randomUUID().substring(0, 8)}@example.com`
}

/**
 * Generate a unique test phone number
 */
export function generateTestPhone(): string {
  return `317-555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
}

