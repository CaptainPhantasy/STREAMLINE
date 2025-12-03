/**
 * Gmail OAuth 2.0 Authentication Utilities
 */

import { OAuth2Client } from 'google-auth-library'
import type {
  GmailOAuthTokens,
  GmailUserInfo,
  GmailConfig,
  GmailProfile
} from '@/lib/types/gmail'

// Gmail API Scopes
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify', // Needed for reading full messages
  'https://www.googleapis.com/auth/userinfo.email',
]

/**
 * Create OAuth2 client for Gmail
 */
export function createGmailOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/gmail/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET')
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  })
}

/**
 * Generate OAuth authorization URL
 */
export function getGmailAuthUrl(state?: string): string {
  const oauth2Client = createGmailOAuthClient()
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: GMAIL_SCOPES,
    prompt: 'consent', // Force consent to get refresh token
    state: state || undefined,
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GmailOAuthTokens> {
  const oauth2Client = createGmailOAuthClient()

  const { tokens } = await oauth2Client.getToken(code)

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<Pick<GmailOAuthTokens, 'accessToken' | 'expiryDate'>> {
  const oauth2Client = createGmailOAuthClient()

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()

  return {
    accessToken: credentials.access_token!,
    expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  }
}

/**
 * Get user info from access token using Gmail API
 */
export async function getUserInfo(accessToken: string): Promise<GmailUserInfo> {
  const oauth2Client = createGmailOAuthClient()

  oauth2Client.setCredentials({
    access_token: accessToken,
  })

  // Use Gmail API to get user profile
  const { google } = await import('googleapis')
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const profile = await gmail.users.getProfile({ userId: 'me' })

  // Also get user info from OAuth2 API for name and picture
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const userInfo = await oauth2.userinfo.get()

  return {
    email: profile.data.emailAddress!,
    name: userInfo.data.name || null,
    picture: userInfo.data.picture || null,
  }
}

