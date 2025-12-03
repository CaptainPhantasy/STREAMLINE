/**
 * Microsoft Graph API Email Sync Utilities
 * Syncs emails from Microsoft 365/Outlook and extracts contact information
 */

import { Client } from '@microsoft/microsoft-graph-client'
import type {
  MicrosoftMessage,
  MicrosoftSyncOptions,
  MicrosoftSyncResult,
  ParsedMicrosoftEmail,
  MicrosoftCollectionResponse,
  MicrosoftAttachment
} from '@/lib/types/microsoft'
import { refreshAccessToken } from './auth'

/**
 * Get Microsoft Graph client
 */
function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: {
      getAccessToken: async () => accessToken,
    },
  })
}

/**
 * Parse Microsoft Graph email message into standardized format
 */
export function parseMicrosoftMessage(message: MicrosoftMessage): ParsedMicrosoftEmail {
  const parseEmailAddress = (emailAddress: any) => ({
    email: emailAddress.emailAddress.address,
    name: emailAddress.emailAddress.name || null,
  })

  return {
    messageId: message.id,
    conversationId: message.conversationId,
    from: parseEmailAddress(message.from),
    to: message.toRecipients.map(parseEmailAddress),
    cc: message.ccRecipients?.map(parseEmailAddress) || [],
    bcc: message.bccRecipients?.map(parseEmailAddress) || [],
    subject: message.subject,
    bodyText: message.body.contentType === 'text' ? message.body.content : null,
    bodyHtml: message.body.contentType === 'html' ? message.body.content : null,
    date: new Date(message.receivedDateTime || message.sentDateTime),
    inReplyTo: message.inReplyTo || null,
    references: null, // Microsoft doesn't provide this directly
    attachments: message.hasAttachments ? [] : undefined, // Would need separate API call
    folders: [], // Would need to determine from parentFolderId
    isRead: message.isRead,
    isDraft: message.isDraft,
    importance: message.importance,
  }
}

/**
 * Fetch messages from Microsoft Graph with automatic token refresh
 */
export async function fetchMicrosoftMessages(
  accessToken: string,
  refreshToken: string,
  options: MicrosoftSyncOptions = {}
): Promise<MicrosoftSyncResult> {
  try {
    const client = getGraphClient(accessToken)

    const top = options.maxMessages || 50
    let url = `/me/messages?$top=${top}&$orderby=receivedDateTime desc`

    // Add date filter
    if (options.syncFrom) {
      const fromDate = options.syncFrom.toISOString()
      url += `&$filter=receivedDateTime ge ${fromDate}`
    }

    // Select specific fields for performance
    const selectFields = [
      'id',
      'conversationId',
      'subject',
      'from',
      'toRecipients',
      'ccRecipients',
      'bccRecipients',
      'body',
      'receivedDateTime',
      'sentDateTime',
      'isRead',
      'isDraft',
      'hasAttachments',
      'importance',
      'inReplyTo',
      'parentFolderId'
    ]

    if (options.selectFields) {
      selectFields.push(...options.selectFields)
    }

    url += `&$select=${selectFields.join(',')}`

    // Custom query filter
    if (options.query) {
      url += `&$search="${options.query}"`
    }

    const response = await client.api(url).get()

    return {
      messages: response.value || [],
      resultSizeEstimate: response.value?.length || 0,
      nextPageToken: response['@odata.nextLink'],
    }
  } catch (error: any) {
    // If token expired, refresh and retry
    if (error.statusCode === 401 || error.code === 'InvalidAuthenticationToken') {
      const refreshed = await refreshAccessToken(refreshToken)
      return fetchMicrosoftMessages(refreshed.accessToken, refreshToken, options)
    }

    console.error('Error fetching Microsoft messages:', error)
    throw error
  }
}

/**
 * Get message attachments (requires separate API call)
 */
export async function getMessageAttachments(
  accessToken: string,
  refreshToken: string,
  messageId: string
): Promise<MicrosoftAttachment[]> {
  try {
    const client = getGraphClient(accessToken)
    const response = await client.api(`/me/messages/${messageId}/attachments`).get()

    return response.value || []
  } catch (error: any) {
    // If token expired, refresh and retry
    if (error.statusCode === 401 || error.code === 'InvalidAuthenticationToken') {
      const refreshed = await refreshAccessToken(refreshToken)
      return getMessageAttachments(refreshed.accessToken, refreshToken, messageId)
    }

    console.error('Error fetching message attachments:', error)
    throw error
  }
}

/**
 * Main sync function that orchestrates the entire email sync process
 */
export async function syncMicrosoftEmails(
  accessToken: string,
  refreshToken: string,
  options: MicrosoftSyncOptions = {}
): Promise<ParsedMicrosoftEmail[]> {
  try {
    // Fetch messages
    const syncResult = await fetchMicrosoftMessages(accessToken, refreshToken, options)

    // Parse each message
    const parsedEmails: ParsedMicrosoftEmail[] = []
    for (const message of syncResult.messages) {
      const parsed = parseMicrosoftMessage(message)

      // If message has attachments and we want to include them
      if (message.hasAttachments && options.includeAttachments) {
        try {
          const attachments = await getMessageAttachments(accessToken, refreshToken, message.id)
          parsed.attachments = attachments
        } catch (attachmentError) {
          console.warn(`Failed to fetch attachments for message ${message.id}:`, attachmentError)
          // Continue without attachments
        }
      }

      parsedEmails.push(parsed)
    }

    return parsedEmails
  } catch (error) {
    console.error('Error syncing Microsoft emails:', error)
    throw error
  }
}

