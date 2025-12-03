/**
 * JWT Token Handler
 * Provides secure token refresh and validation functionality
 */

import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface TokenPayload {
  userId: string
  accountId: string
  role: string
  type: 'access' | 'refresh'
  iat: number
  exp: number
}

// In-memory token blacklist (in production, use Redis)
const tokenBlacklist = new Set<string>()

/**
 * Generate a secure JWT token
 */
export function generateToken(
  payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>,
  type: 'access' | 'refresh',
  secret: string
): string {
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = type === 'access' ? 15 * 60 : 7 * 24 * 60 * 60 // 15 min or 7 days

  return jwt.sign(
    {
      ...payload,
      type,
      iat: now,
      exp: now + expiresIn
    },
    secret,
    {
      algorithm: 'HS256',
      issuer: 'crm-ai-pro',
      audience: 'crm-ai-pro-users'
    }
  )
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string, secret: string): TokenPayload | null {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return null
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'crm-ai-pro',
      audience: 'crm-ai-pro-users'
    }) as TokenPayload

    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Blacklist a token (invalidate it)
 */
export function blacklistToken(token: string): void {
  tokenBlacklist.add(token)

  // Clean up expired tokens periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupExpiredTokens()
  }
}

/**
 * Clean up expired tokens from blacklist
 */
function cleanupExpiredTokens(): void {
  for (const token of tokenBlacklist) {
    try {
      const decoded = jwt.decode(token) as any
      if (decoded && decoded.exp * 1000 < Date.now()) {
        tokenBlacklist.delete(token)
      }
    } catch {
      // Invalid token, remove from blacklist
      tokenBlacklist.delete(token)
    }
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ success: true; accessToken: string; expiresAt: number } | { success: false; error: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify refresh token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(refreshToken)

    if (error || !user) {
      console.error('Invalid refresh token:', error?.message)
      return { success: false, error: 'Invalid refresh token' }
    }

    // Get user's account and role
    const { data: userData } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    // Generate new access token
    const jwtSecret = process.env.JWT_SECRET!
    const accessToken = generateToken(
      {
        userId: user.id,
        accountId: userData.account_id,
        role: userData.role
      },
      'access',
      jwtSecret
    )

    const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes

    console.log(`Access token refreshed - User: ${user.id}, Account: ${userData.account_id}`)

    return { success: true, accessToken, expiresAt }
  } catch (error) {
    console.error('Token refresh error:', error)
    return { success: false, error: 'Token refresh failed' }
  }
}

/**
 * Create token pair for a user
 */
export async function createTokenPair(
  userId: string,
  accountId: string,
  role: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<TokenPair | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate custom JWT tokens
    const jwtSecret = process.env.JWT_SECRET!
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable not set')
      return null
    }

    const accessToken = generateToken(
      { userId, accountId, role },
      'access',
      jwtSecret
    )

    // Use Supabase refresh token for better security
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: '', // Will be populated from user data
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (error) {
      console.error('Failed to generate refresh token:', error)
      return null
    }

    // Get actual user email for refresh token generation
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    if (!userData.user?.email) {
      return null
    }

    const { data: refreshData, error: refreshError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (refreshError || !refreshData.properties?.hashed_token) {
      console.error('Failed to generate refresh token:', refreshError)
      return null
    }

    const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes

    return {
      accessToken,
      refreshToken: refreshData.properties.hashed_token,
      expiresAt
    }
  } catch (error) {
    console.error('Token pair creation error:', error)
    return null
  }
}

/**
 * Middleware to validate access tokens
 */
export function requireValidToken(token: string): TokenPayload | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable not set')
    return null
  }

  const payload = verifyToken(token, jwtSecret)
  if (!payload) {
    return null
  }

  // Ensure it's an access token
  if (payload.type !== 'access') {
    console.error('Invalid token type: expected access token')
    return null
  }

  return payload
}

/**
 * Check if token is close to expiry (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) {
      return true // No expiry info, assume expired
    }

    const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + (5 * 60)
    return decoded.exp <= fiveMinutesFromNow
  } catch {
    return true // Invalid token, assume expired
  }
}

/**
 * Get token information for debugging
 */
export function getTokenInfo(token: string): {
  userId?: string
  accountId?: string
  role?: string
  type?: string
  expiresAt?: number
  isExpired: boolean
  isBlacklisted: boolean
} {
  try {
    const decoded = jwt.decode(token) as any
    const isExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : true
    const isBlacklisted = tokenBlacklist.has(token)

    return {
      userId: decoded?.userId,
      accountId: decoded?.accountId,
      role: decoded?.role,
      type: decoded?.type,
      expiresAt: decoded?.exp,
      isExpired,
      isBlacklisted
    }
  } catch {
    return {
      isExpired: true,
      isBlacklisted: false
    }
  }
}

/**
 * Validate JWT secret is properly configured
 */
export function validateJWTConfig(): { valid: boolean; error?: string } {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    return { valid: false, error: 'JWT_SECRET environment variable not set' }
  }

  if (jwtSecret.length < 32) {
    return { valid: false, error: 'JWT_SECRET must be at least 32 characters long' }
  }

  // Test token generation and verification
  try {
    const testToken = generateToken(
      { userId: 'test', accountId: 'test', role: 'test' },
      'access',
      jwtSecret
    )

    const verified = verifyToken(testToken, jwtSecret)
    if (!verified) {
      return { valid: false, error: 'JWT token verification test failed' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: `JWT configuration test failed: ${error}` }
  }
}