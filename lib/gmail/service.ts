/**
 * Gmail API Service
 * Handles sending emails via Gmail API
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { createGmailOAuthClient, refreshAccessToken } from './auth'
import type { GmailSendOptions, GmailSendResult } from '@/lib/types/gmail'

/**
 * Send email via Gmail API
 */
export async function sendGmailEmail(
  accessToken: string,
  refreshToken: string,
  options: GmailSendOptions
): Promise<GmailSendResult> {
  const oauth2Client = createGmailOAuthClient()
  
  // Set credentials
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  // Check if token is expired and refresh if needed
  try {
    // Try to use current token
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    
    // Build email message
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to
    const from = options.from || (await getGmailProfile(oauth2Client)).emailAddress || 'me'
    
    const messageParts: string[] = []
    messageParts.push(`To: ${to}`)
    messageParts.push(`From: ${from}`)
    messageParts.push(`Subject: ${options.subject}`)
    
    if (options.replyTo) {
      messageParts.push(`Reply-To: ${options.replyTo}`)
    }
    
    if (options.inReplyTo) {
      messageParts.push(`In-Reply-To: ${options.inReplyTo}`)
    }
    
    if (options.references) {
      messageParts.push(`References: ${options.references}`)
    }
    
    messageParts.push('Content-Type: multipart/alternative; boundary="boundary123"')
    messageParts.push('')
    
    // Add text part
    if (options.text) {
      messageParts.push('--boundary123')
      messageParts.push('Content-Type: text/plain; charset=UTF-8')
      messageParts.push('')
      messageParts.push(options.text)
    }
    
    // Add HTML part
    if (options.html) {
      messageParts.push('--boundary123')
      messageParts.push('Content-Type: text/html; charset=UTF-8')
      messageParts.push('')
      messageParts.push(options.html)
    }
    
    messageParts.push('--boundary123--')
    
    const rawMessage = Buffer.from(messageParts.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
        threadId: options.inReplyTo ? extractThreadId(options.inReplyTo) : undefined,
      },
    })
    
    return {
      messageId: response.data.id || '',
      threadId: response.data.threadId || undefined,
    }
  } catch (error: any) {
    // If token expired, refresh and retry
    if (error.code === 401 || error.message?.includes('Invalid Credentials')) {
      const refreshed = await refreshAccessToken(refreshToken)
      oauth2Client.setCredentials({
        access_token: refreshed.accessToken,
        refresh_token: refreshToken,
      })
      
      // Retry with new token
      return sendGmailEmail(refreshed.accessToken, refreshToken, options)
    }
    
    throw error
  }
}

/**
 * Get Gmail profile (email address)
 */
async function getGmailProfile(oauth2Client: OAuth2Client): Promise<GmailProfile> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const profile = await gmail.users.getProfile({ userId: 'me' })
  return profile.data as GmailProfile
}

/**
 * Extract thread ID from message ID (simplified)
 */
function extractThreadId(messageId: string): string | undefined {
  // Gmail thread IDs are typically the same as the first message ID in the thread
  // This is a simplified implementation
  return undefined
}

