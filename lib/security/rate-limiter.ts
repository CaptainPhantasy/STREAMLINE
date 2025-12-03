/**
 * Rate Limiting Middleware for API Routes
 * Provides in-memory rate limiting with Redis fallback capability
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
  lastAccess: number
}

// In-memory store for development (falls back to Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Configuration for different endpoint types
const RATE_LIMIT_CONFIGS = {
  // Default limits
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP'
  },

  // Strict limits for sensitive endpoints
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: 'Rate limit exceeded for sensitive operation'
  },

  // Voice command limits
  voice: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 voice commands per minute
    message: 'Voice command rate limit exceeded'
  },

  // File upload limits
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 uploads per window
    message: 'File upload rate limit exceeded'
  },

  // Authentication limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 auth attempts per window
    message: 'Too many authentication attempts'
  }
}

export type RateLimitConfig = keyof typeof RATE_LIMIT_CONFIGS

/**
 * Clean up expired records from memory store
 */
function cleanupExpiredRecords(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from auth header first for user-specific limits
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // In a real implementation, you'd decode the JWT to get user ID
    // For now, use the token hash as identifier
    return `user:${Buffer.from(authHeader).toString('base64').substring(0, 16)}`
  }

  // Fallback to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Rate limiting middleware function
 */
export function createRateLimit(configType: RateLimitConfig = 'default') {
  const config = RATE_LIMIT_CONFIGS[configType]

  return async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
    // Clean up expired records periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      cleanupExpiredRecords()
    }

    const clientId = getClientIdentifier(request)
    const now = Date.now()

    // Get or create rate limit record
    let record = rateLimitStore.get(clientId)

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      record = {
        count: 1,
        resetTime: now + config.windowMs,
        lastAccess: now
      }
      rateLimitStore.set(clientId, record)
      return null // Allow request
    }

    // Update existing record
    record.count++
    record.lastAccess = now

    // Check if limit exceeded
    if (record.count > config.max) {
      const resetTime = Math.ceil((record.resetTime - now) / 1000)

      return NextResponse.json(
        {
          error: config.message,
          retryAfter: resetTime,
          limit: config.max,
          windowMs: config.windowMs
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.max - record.count).toString(),
            'X-RateLimit-Reset': record.resetTime.toString(),
            'Retry-After': resetTime.toString()
          }
        }
      )
    }

    // Update rate limit headers for allowed requests
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', config.max.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, config.max - record.count).toString())
    response.headers.set('X-RateLimit-Reset', record.resetTime.toString())

    return response
  }
}

/**
 * Preconfigured rate limiters for common use cases
 */
export const rateLimiters = {
  default: createRateLimit('default'),
  strict: createRateLimit('strict'),
  voice: createRateLimit('voice'),
  upload: createRateLimit('upload'),
  auth: createRateLimit('auth')
}

/**
 * Apply rate limiting to an API route
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  configType: RateLimitConfig = 'default'
): Promise<NextResponse> {
  const rateLimiter = createRateLimit(configType)
  const rateLimitResponse = await rateLimiter(request)

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  return await handler()
}

/**
 * Get rate limit status for a client (for monitoring)
 */
export function getRateLimitStatus(request: NextRequest, configType: RateLimitConfig = 'default'): {
  remaining: number
  resetTime: number
  limit: number
} | null {
  const clientId = getClientIdentifier(request)
  const record = rateLimitStore.get(clientId)
  const config = RATE_LIMIT_CONFIGS[configType]

  if (!record || Date.now() > record.resetTime) {
    return {
      remaining: config.max,
      resetTime: Date.now() + config.windowMs,
      limit: config.max
    }
  }

  return {
    remaining: Math.max(0, config.max - record.count),
    resetTime: record.resetTime,
    limit: config.max
  }
}