/**
 * Microsoft Graph API Service
 * Handles sending emails via Microsoft Graph API
 */

import { Client } from '@microsoft/microsoft-graph-client'
import { refreshAccessToken } from './auth'

export interface MicrosoftSendOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  inReplyTo?: string
  references?: string
  from?: string
}

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
 * Send email via Microsoft Graph API
 */
export async function sendMicrosoftEmail(
  accessToken: string,
  refreshToken: string,
  options: MicrosoftSendOptions
): Promise<{ messageId: string; threadId?: string }> {
  try {
    const client = getGraphClient(accessToken)

    const to = Array.isArray(options.to) ? options.to : [options.to]
    const toRecipients = to.map(email => ({ emailAddress: { address: email } }))

    const message: any = {
      message: {
        subject: options.subject,
        body: {
          contentType: options.html ? 'HTML' : 'Text',
          content: options.html || options.text || '',
        },
        toRecipients,
      },
      saveToSentItems: true,
    }

    // Add reply headers if present
    if (options.inReplyTo || options.references) {
      message.message.internetMessageHeaders = []
      if (options.inReplyTo) {
        message.message.internetMessageHeaders.push({
          name: 'In-Reply-To',
          value: options.inReplyTo,
        })
      }
      if (options.references) {
        message.message.internetMessageHeaders.push({
          name: 'References',
          value: options.references,
        })
      }
    }

    // Send email
    const response = await client.api('/me/sendMail').post(message)

    // Extract message ID from response or use a generated one
    const messageId = response?.id || `msg-${Date.now()}`

    return {
      messageId,
      threadId: options.inReplyTo ? extractThreadId(options.inReplyTo) : undefined,
    }
  } catch (error: any) {
    // If token expired, refresh and retry
    if (error.statusCode === 401 || error.code === 'InvalidAuthenticationToken') {
      const refreshed = await refreshAccessToken(refreshToken)
      return sendMicrosoftEmail(refreshed.accessToken, refreshToken, options)
    }

    throw error
  }
}

/**
 * Extract thread ID from message ID (simplified)
 */
function extractThreadId(messageId: string): string | undefined {
  // Microsoft Graph uses conversationId for threading
  // This would need to be fetched from the original message
  return undefined
}

