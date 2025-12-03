/**
 * Gmail Integration TypeScript Definitions
 * Provides comprehensive type safety for Gmail OAuth and API integration
 */

// =============================================================================
// Gmail OAuth Types
// =============================================================================

export interface GmailOAuthTokens {
  accessToken: string
  refreshToken: string
  expiryDate?: Date | null
}

export interface GmailUserInfo {
  email: string
  name?: string | null
  picture?: string | null
}

export interface GmailOAuthState {
  userId: string
  accountId: string
  redirectUrl?: string
}

// =============================================================================
// Email Provider Types
// =============================================================================

export interface EmailProvider {
  id: string
  account_id: string
  user_id?: string | null
  provider: 'gmail' | 'microsoft' | 'resend' | 'sendgrid' | 'mailgun'
  provider_email: string
  is_active: boolean
  is_default: boolean
  access_token_encrypted?: string | null
  refresh_token_encrypted?: string | null
  token_expires_at?: string | null
  config: Record<string, any>
  created_at: string
  updated_at: string
}

export interface GmailProviderConfig {
  name?: string
  picture?: string
  historyId?: string
  syncEnabled?: boolean
  lastSyncAt?: string
  syncLabels?: string[]
}

// =============================================================================
// Gmail API Types
// =============================================================================

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: GmailMessagePayload
  internalDate: string
  labelIds: string[]
  sizeEstimate?: number
}

export interface GmailMessagePayload {
  partId?: string
  mimeType?: string
  filename?: string
  headers?: GmailMessageHeader[]
  body?: GmailMessageBody
  parts?: GmailMessagePayload[]
}

export interface GmailMessageHeader {
  name: string
  value: string
}

export interface GmailMessageBody {
  attachmentId?: string
  size?: number
  data?: string // Base64 encoded content
}

export interface GmailProfile {
  emailAddress: string
  messagesTotal: number
  threadsTotal: number
  historyId: string
}

export interface GmailThread {
  id: string
  snippet: string
  historyId: string
  messages: GmailMessage[]
}

// =============================================================================
// Parsed Email Types
// =============================================================================

export interface ParsedEmailAddress {
  email: string
  name: string | null
}

export interface ParsedEmail {
  messageId: string
  threadId: string
  from: ParsedEmailAddress
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string | null
  bodyText: string | null
  bodyHtml: string | null
  date: Date
  inReplyTo: string | null
  references: string | null
  attachments?: EmailAttachment[]
  labels: string[]
}

export interface EmailAttachment {
  id: string
  filename: string
  mimeType: string
  size: number
  attachmentId: string
  data?: string // Base64 encoded content
}

// =============================================================================
// Sync Options Types
// =============================================================================

export interface GmailSyncOptions {
  syncFrom?: Date // Sync emails from this date
  maxMessages?: number
  labelIds?: string[] // e.g., ['INBOX', 'SENT']
  query?: string // Gmail search query
  includeDrafts?: boolean
  includeSpam?: boolean
  includeTrash?: boolean
}

export interface GmailSyncResult {
  messages: GmailMessage[]
  nextPageToken?: string
  resultSizeEstimate?: number
}

// =============================================================================
// Send Email Types
// =============================================================================

export interface GmailSendOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  inReplyTo?: string
  references?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
  threadId?: string
}

export interface GmailSendResult {
  messageId: string
  threadId?: string
  labelIds?: string[]
}

// =============================================================================
// API Response Types
// =============================================================================

export interface GmailStatusResponse {
  connected: boolean
  providers?: Array<{
    id: string
    provider_email: string
    is_active: boolean
    is_default: boolean
    created_at: string
    user_id?: string | null
  }>
  error?: string
}

export interface GmailAuthUrlResponse {
  authUrl: string
  error?: string
}

export interface GmailSyncResponse {
  success: boolean
  stats: {
    messagesProcessed: number
    contactsCreated: number
    contactsUpdated: number
    conversationsCreated: number
    messagesCreated: number
  }
  message?: string
  error?: string
}

// =============================================================================
// Error Types
// =============================================================================

export interface GmailError {
  code: number
  message: string
  status?: string
  details?: any
}

export interface GmailOAuthError extends GmailError {
  error?: string
  error_description?: string
}

// =============================================================================
// Contact Extraction Types
// =============================================================================

export interface ExtractedContactInfo {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  company?: string
  confidence: number // 0-1 score
  source: 'signature' | 'body' | 'headers' | 'content'
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface GmailConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface GmailIntegrationSettings {
  syncEnabled: boolean
  syncLabels: string[]
  autoCreateContacts: boolean
  syncInterval: number // minutes
  maxSyncMessages: number
}