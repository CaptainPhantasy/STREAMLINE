/**
 * Gmail Email Sync Service
 * Syncs emails from Gmail and extracts contact information
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { createGmailOAuthClient, refreshAccessToken } from './auth'
import { decrypt } from './encryption'
import type {
  GmailMessage,
  ParsedEmail,
  GmailSyncOptions,
  GmailSyncResult,
  GmailProfile
} from '@/lib/types/gmail'

/**
 * Get Gmail API client with authenticated OAuth
 */
async function getGmailClient(
  accessToken: string,
  refreshToken: string
): Promise<ReturnType<typeof google.gmail>> {
  const oauth2Client = createGmailOAuthClient()
  
  // Check if token needs refresh
  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  } catch (error) {
    // Token might be expired, refresh it
    const refreshed = await refreshAccessToken(refreshToken)
    oauth2Client.setCredentials({
      access_token: refreshed.accessToken,
      refresh_token: refreshToken,
    })
    accessToken = refreshed.accessToken
  }

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

/**
 * Fetch messages from Gmail
 */
export async function fetchGmailMessages(
  accessToken: string,
  refreshToken: string,
  options: {
    maxResults?: number
    query?: string
    pageToken?: string
    labelIds?: string[]
  } = {}
): Promise<GmailSyncResult> {
  const gmail = await getGmailClient(accessToken, refreshToken)

  // List messages
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults: options.maxResults || 50,
    q: options.query,
    pageToken: options.pageToken,
    labelIds: options.labelIds,
  })

  const messageIds = listResponse.data.messages?.map(m => m.id!) || []

  // Fetch full message details
  const messages = await Promise.all(
    messageIds.map(async (id) => {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      })
      return messageResponse.data as GmailMessage
    })
  )

  return {
    messages,
    nextPageToken: listResponse.data.nextPageToken || undefined,
    resultSizeEstimate: listResponse.data.resultSizeEstimate || undefined,
  }
}

/**
 * Parse email message into structured format
 */
export function parseGmailMessage(message: GmailMessage): ParsedEmail {
  const headers = message.payload.headers || []
  
  const getHeader = (name: string): string | null => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase())
    return header?.value || null
  }

  const parseEmailAddress = (address: string | null): { email: string; name: string | null } => {
    if (!address) return { email: '', name: null }
    
    // Parse "Name <email@example.com>" or "email@example.com"
    const match = address.match(/^(?:"?([^"]+)"?\s*)?<?([^\s<>]+@[^\s<>]+)>?$/)
    if (match) {
      return {
        email: match[2].trim(),
        name: match[1]?.trim() || null,
      }
    }
    return { email: address.trim(), name: null }
  }

  const parseEmailList = (list: string | null): string[] => {
    if (!list) return []
    return list.split(',').map(addr => parseEmailAddress(addr.trim()).email).filter(Boolean)
  }

  // Extract body content
  let bodyText: string | null = null
  let bodyHtml: string | null = null

  const extractBody = (payload: any): void => {
    if (payload.body?.data) {
      const data = Buffer.from(payload.body.data, 'base64').toString('utf-8')
      if (payload.mimeType === 'text/plain') {
        bodyText = data
      } else if (payload.mimeType === 'text/html') {
        bodyHtml = data
      }
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
        
        // Recursively check nested parts
        if (part.parts) {
          extractBody(part)
        }
      }
    }
  }

  extractBody(message.payload)

  const fromHeader = getHeader('From')
  const from = parseEmailAddress(fromHeader)

  return {
    messageId: message.id,
    threadId: message.threadId || '',
    from,
    to: parseEmailList(getHeader('To')),
    cc: parseEmailList(getHeader('Cc')) || undefined,
    bcc: parseEmailList(getHeader('Bcc')) || undefined,
    subject: getHeader('Subject'),
    bodyText,
    bodyHtml,
    date: new Date(parseInt(message.internalDate)),
    inReplyTo: getHeader('In-Reply-To'),
    references: getHeader('References'),
  }
}

/**
 * Sync emails from Gmail for an account
 * Returns the raw messages for processing
 */
export async function syncGmailEmails(
  accessToken: string,
  refreshToken: string,
  accountId: string,
  options: GmailSyncOptions = {}
): Promise<GmailMessage[]> {
  // Build query for date range
  let query = ''
  if (options.syncFrom) {
    const timestamp = Math.floor(options.syncFrom.getTime() / 1000)
    query = `after:${timestamp}`
  }

  // Fetch messages
  const { messages } = await fetchGmailMessages(accessToken, refreshToken, {
    maxResults: options.maxMessages || 100,
    query,
    labelIds: options.labelIds || ['INBOX', 'SENT'],
  })

  return messages
}

