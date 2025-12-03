/**
 * Microsoft Graph API Integration TypeScript Definitions
 * Provides comprehensive type safety for Microsoft 365 OAuth and API integration
 */

// =============================================================================
// Microsoft OAuth Types
// =============================================================================

export interface MicrosoftOAuthTokens {
  accessToken: string
  refreshToken: string
  expiryDate?: Date | null
}

export interface MicrosoftUserInfo {
  email: string
  name?: string | null
  displayName?: string | null
  surname?: string | null
  givenName?: string | null
  userPrincipalName: string
  id: string
  jobTitle?: string | null
  officeLocation?: string | null
  businessPhones?: string[]
  mobilePhone?: string | null
}

export interface MicrosoftOAuthState {
  userId: string
  accountId: string
  redirectUrl?: string
}

// =============================================================================
// Email Provider Types (reusing from gmail.ts)
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

export interface MicrosoftProviderConfig {
  name?: string
  displayName?: string
  tenantId?: string
  syncEnabled?: boolean
  lastSyncAt?: string
  syncFolders?: string[]
}

// =============================================================================
// Microsoft Graph API Types
// =============================================================================

export interface MicrosoftMessage {
  id: string
  conversationId: string
  subject: string
  from: MicrosoftEmailAddress
  toRecipients: MicrosoftEmailAddress[]
  ccRecipients?: MicrosoftEmailAddress[]
  bccRecipients?: MicrosoftEmailAddress[]
  body: MicrosoftItemBody
  uniqueBody?: MicrosoftItemBody
  sender?: MicrosoftEmailAddress
  webLink: string
  receivedDateTime: string
  sentDateTime: string
  createdDateTime: string
  lastModifiedDateTime: string
  isRead: boolean
  isDraft: boolean
  hasAttachments: boolean
  parentFolderId: string
  importance: 'low' | 'normal' | 'high'
  conversationIndex?: string
  inReplyTo?: string
  replyTo?: MicrosoftEmailAddress[]
}

export interface MicrosoftEmailAddress {
  emailAddress: {
    name?: string
    address: string
  }
}

export interface MicrosoftItemBody {
  contentType: 'text' | 'html'
  content: string
}

export interface MicrosoftAttachment {
  id: string
  contentType: string
  size: number
  isInline: boolean
  name?: string
  lastModifiedDateTime?: string
  '@odata.mediaContentType'?: string
  '@odata.mediaContentLength'?: number
}

export interface MicrosoftMessageAttachment extends MicrosoftAttachment {
  '@odata.mediaDownloadUrl'?: string
}

export interface MicrosoftThread {
  id: string
  topic?: string
  hasAttachments: boolean
  uniqueSenders: string[]
  lastDeliveredDateTime: string
  preview: string
  isRead: boolean
  ccRecipients?: MicrosoftEmailAddress[]
  toRecipients?: MicrosoftEmailAddress[]
}

export interface MicrosoftFolder {
  id: string
  displayName: string
  parentFolderId?: string
  unreadItemCount: number
  totalItemCount: number
  childFolderCount: number
  unreadItemCount?: number
  totalItemCount?: number
  isHidden: boolean
  parentFolderId?: string
  wellKnownName?: string
}

// =============================================================================
// Parsed Email Types (similar to Gmail but adapted for Microsoft)
// =============================================================================

export interface ParsedMicrosoftEmailAddress {
  email: string
  name: string | null
}

export interface ParsedMicrosoftEmail {
  messageId: string
  conversationId: string
  from: ParsedMicrosoftEmailAddress
  to: ParsedMicrosoftEmailAddress[]
  cc?: ParsedMicrosoftEmailAddress[]
  bcc?: ParsedMicrosoftEmailAddress[]
  subject: string | null
  bodyText: string | null
  bodyHtml: string | null
  date: Date
  inReplyTo: string | null
  references: string | null
  attachments?: MicrosoftAttachment[]
  folders: string[]
  isRead: boolean
  isDraft: boolean
  importance: 'low' | 'normal' | 'high'
}

// =============================================================================
// Sync Options Types
// =============================================================================

export interface MicrosoftSyncOptions {
  syncFrom?: Date // Sync emails from this date
  maxMessages?: number
  folderIds?: string[] // e.g., ['inbox', 'sentItems', 'drafts']
  query?: string // Microsoft Graph search query
  includeDrafts?: boolean
  includeAttachments?: boolean
  selectFields?: string[] // Specific fields to select
  expandFields?: string[] // Fields to expand
}

export interface MicrosoftSyncResult {
  messages: MicrosoftMessage[]
  nextPageToken?: string
  resultSizeEstimate?: number
  deltaToken?: string
}

// =============================================================================
// Send Email Types
// =============================================================================

export interface MicrosoftSendOptions {
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
  attachments?: Array<{
    name: string
    contentType: string
    contentBytes: string // Base64 encoded
    isInline?: boolean
  }>
  conversationId?: string
  singleValueExtendedProperties?: Array<{
    id: string
    value: string
  }>
}

export interface MicrosoftSendResult {
  id: string
  conversationId?: string
  parentFolderId?: string
  webLink?: string
}

// =============================================================================
// API Response Types
// =============================================================================

export interface MicrosoftStatusResponse {
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

export interface MicrosoftAuthUrlResponse {
  authUrl: string
  error?: string
}

export interface MicrosoftSyncResponse {
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

export interface MicrosoftError {
  code: string
  message: string
  target?: string
  details?: Array<{
    code: string
    message: string
    target?: string
  }>
  innerError?: {
    code: string
    message: string
    date: string
    request-id: string
    client-request-id: string
  }
}

export interface MicrosoftOAuthError extends MicrosoftError {
  error?: string
  error_description?: string
  error_codes?: number[]
  timestamp?: string
  trace_id?: string
  correlation_id?: string
}

// =============================================================================
// Contact Extraction Types
// =============================================================================

export interface ExtractedMicrosoftContactInfo {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  company?: string
  jobTitle?: string
  confidence: number // 0-1 score
  source: 'signature' | 'body' | 'headers' | 'content'
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface MicrosoftConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  tenantId?: string // Optional: for specific tenant
  authority: string
}

export interface MicrosoftIntegrationSettings {
  syncEnabled: boolean
  syncFolders: string[]
  autoCreateContacts: boolean
  syncInterval: number // minutes
  maxSyncMessages: number
  includeAttachments: boolean
}

// =============================================================================
// Graph API Collection Types
// =============================================================================

export interface MicrosoftCollectionResponse<T> {
  '@odata.nextLink'?: string
  '@odata.deltaLink'?: string
  value: T[]
}

export interface MicrosoftDeltaResponse<T> extends MicrosoftCollectionResponse<T> {
  '@odata.deltaLink'?: string
  '@odata.nextLink'?: string
}

// =============================================================================
// Microsoft Graph API Permissions
// =============================================================================

export interface MicrosoftPermission {
  id: string
  resourceId: string
  type: 'Application' | 'Delegated'
  consentDescription?: string
  consentDisplayName?: string
  adminConsentDescription?: string
  adminConsentDisplayName?: string
  isEnabled: boolean
  value: string
}