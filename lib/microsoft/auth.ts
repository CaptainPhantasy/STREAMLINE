/**
 * Microsoft Graph OAuth 2.0 Authentication Utilities
 * Uses Microsoft Identity Platform (Azure AD) and Graph API
 */

import { ConfidentialClientApplication } from '@azure/msal-node'
import type {
  MicrosoftOAuthTokens,
  MicrosoftUserInfo,
  MicrosoftConfig,
  MicrosoftOAuthError
} from '@/lib/types/microsoft'

// Microsoft Graph API Scopes
export const MICROSOFT_SCOPES = [
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/User.ReadBasic.All',
  'https://graph.microsoft.com/Contacts.Read',
  'offline_access', // Required for refresh tokens
]

/**
 * Create Microsoft OAuth configuration
 */
export function createMicrosoftConfig(): MicrosoftConfig {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common'
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/microsoft/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Microsoft OAuth credentials not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET')
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: MICROSOFT_SCOPES,
    tenantId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  }
}

/**
 * Create MSAL client for Microsoft OAuth
 */
export function createMicrosoftOAuthClient(): ConfidentialClientApplication {
  const config = createMicrosoftConfig()

  return new ConfidentialClientApplication({
    auth: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      authority: config.authority,
    },
  })
}

/**
 * Generate OAuth authorization URL
 */
export async function getMicrosoftAuthUrl(state?: string): Promise<string> {
  const msalClient = createMicrosoftOAuthClient()
  const config = createMicrosoftConfig()

  const authCodeUrlParameters = {
    scopes: config.scopes,
    redirectUri: config.redirectUri,
    state: state || undefined,
    prompt: 'consent', // Force consent to get refresh token
  }

  const response = await msalClient.getAuthCodeUrl(authCodeUrlParameters)
  return response
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<MicrosoftOAuthTokens> {
  const msalClient = createMicrosoftOAuthClient()
  const config = createMicrosoftConfig()

  const tokenRequest = {
    code,
    scopes: config.scopes,
    redirectUri: config.redirectUri,
  }

  try {
    const response = await msalClient.acquireTokenByCode(tokenRequest)

    if (!response?.accessToken) {
      throw new Error('Failed to acquire access token from Microsoft')
    }

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || '',
      expiryDate: response.expiresOn ? new Date(response.expiresOn.getTime()) : null,
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    throw new MicrosoftOAuthError(
      error instanceof Error ? error.message : 'Failed to exchange code for tokens'
    )
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<Pick<MicrosoftOAuthTokens, 'accessToken' | 'expiryDate'>> {
  const msalClient = createMicrosoftOAuthClient()
  const config = createMicrosoftConfig()

  const tokenRequest = {
    refreshToken,
    scopes: config.scopes,
  }

  try {
    const response = await msalClient.acquireTokenByRefreshToken(tokenRequest)

    if (!response?.accessToken) {
      throw new Error('Failed to refresh Microsoft access token')
    }

    return {
      accessToken: response.accessToken,
      expiryDate: response.expiresOn ? new Date(response.expiresOn.getTime()) : null,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw new MicrosoftOAuthError(
      error instanceof Error ? error.message : 'Failed to refresh access token'
    )
  }
}

/**
 * Get user info from access token using Microsoft Graph API
 */
export async function getUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
  try {
    // Get user profile information
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch user profile: ${profileResponse.status} ${profileResponse.statusText}`)
    }

    const profile = await profileResponse.json()

    // Get user photo if available
    let photo: string | null = null
    try {
      const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (photoResponse.ok) {
        const photoBuffer = await photoResponse.arrayBuffer()
        photo = `data:image/jpeg;base64,${Buffer.from(photoBuffer).toString('base64')}`
      }
    } catch (photoError) {
      // Photo is optional, ignore errors
      console.debug('Could not fetch user photo:', photoError)
    }

    return {
      email: profile.mail || profile.userPrincipalName || '',
      name: profile.displayName,
      displayName: profile.displayName,
      surname: profile.surname,
      givenName: profile.givenName,
      userPrincipalName: profile.userPrincipalName,
      id: profile.id,
      jobTitle: profile.jobTitle,
      officeLocation: profile.officeLocation,
      businessPhones: profile.businessPhones,
      mobilePhone: profile.mobilePhone,
    }
  } catch (error) {
    console.error('Error getting user info:', error)
    throw error
  }
}

/**
 * Validate Microsoft access token
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    return response.ok
  } catch (error) {
    console.error('Error validating token:', error)
    return false
  }
}

