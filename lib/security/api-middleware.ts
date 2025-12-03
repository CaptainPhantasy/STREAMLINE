/**
 * Comprehensive API Security Middleware
 * Combines authentication, rate limiting, input validation, and CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { withRateLimit, RateLimitConfig } from './rate-limiter'
import { validateRequest, createValidationError } from './validation-schemas'
import { z } from 'zod'

export interface MiddlewareOptions {
  requireAuth?: boolean
  rateLimit?: RateLimitConfig
  validation?: z.ZodSchema<any>
  allowedMethods?: string[]
  maxFileSize?: number
  allowedOrigins?: string[]
  enableCORS?: boolean
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  return forwardedFor?.split(',')[0] ||
         realIp ||
         cfConnectingIp ||
         '127.0.0.1'
}

/**
 * CORS middleware
 */
function handleCORS(request: NextResponse, allowedOrigins: string[] = []): NextResponse {
  const origin = request.headers.get('origin')

  if (allowedOrigins.length === 0 || allowedOrigins.includes('*') ||
      (origin && allowedOrigins.includes(origin))) {
    request.headers.set('Access-Control-Allow-Origin', origin || '*')
  }

  request.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  request.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  request.headers.set('Access-Control-Allow-Credentials', 'true')
  request.headers.set('Access-Control-Max-Age', '86400')

  return request
}

/**
 * CSRF protection for state-changing requests
 */
function validateCSRF(request: NextRequest): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase()

  // Only validate state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { valid: true }
  }

  // Skip CSRF for API requests that use Bearer tokens
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return { valid: true }
  }

  // Check for CSRF token in header or form data
  const csrfToken = request.headers.get('x-csrf-token') ||
                   request.headers.get('csrf-token')

  if (!csrfToken) {
    return { valid: false, error: 'CSRF token missing' }
  }

  // In a real implementation, validate the token against session
  // For now, just ensure it's present and has reasonable length
  if (csrfToken.length < 20) {
    return { valid: false, error: 'Invalid CSRF token' }
  }

  return { valid: true }
}

/**
 * Security headers middleware
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  )

  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

/**
 * File upload validation
 */
function validateFileUpload(request: NextRequest, maxSize: number = 50 * 1024 * 1024): { valid: boolean; error?: string } {
  const contentType = request.headers.get('content-type')

  if (!contentType?.includes('multipart/form-data')) {
    return { valid: true } // Not a file upload request
  }

  // Check content length if available
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  return { valid: true }
}

/**
 * Request logging middleware
 */
function logRequest(request: NextRequest, options: MiddlewareOptions): void {
  const timestamp = new Date().toISOString()
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const method = request.method
  const url = request.url

  console.log(`[API Request] ${timestamp} - ${method} ${url} - IP: ${ip} - UA: ${userAgent}`)

  // Log sensitive operations
  if (options.requireAuth || ['POST', 'PUT', 'DELETE'].includes(method)) {
    console.log(`[Sensitive Operation] ${timestamp} - ${method} ${url} - IP: ${ip}`)
  }
}

/**
 * Main security middleware function
 */
export async function withSecurity(
  request: NextRequest,
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
): Promise<NextResponse> {
  const {
    requireAuth = false,
    rateLimit = 'default',
    validation,
    allowedMethods,
    maxFileSize = 50 * 1024 * 1024,
    allowedOrigins = [],
    enableCORS = false
  } = options

  // Log the request
  logRequest(request, options)

  // Check allowed methods
  if (allowedMethods && !allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405, headers: { 'Allow': allowedMethods.join(', ') } }
    )
  }

  // Handle OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    if (enableCORS) {
      return handleCORS(response, allowedOrigins)
    }
    return response
  }

  // Apply rate limiting
  if (rateLimit) {
    const rateLimitResponse = await withRateLimit(request, async () => {
      return new NextResponse(null, { status: 200 })
    }, rateLimit)

    if (rateLimitResponse.status === 429) {
      return rateLimitResponse
    }
  }

  // Validate file uploads
  const fileValidation = validateFileUpload(request, maxFileSize)
  if (!fileValidation.valid) {
    return NextResponse.json(
      { error: fileValidation.error },
      { status: 413 }
    )
  }

  // CSRF protection
  const csrfValidation = validateCSRF(request)
  if (!csrfValidation.valid) {
    return NextResponse.json(
      { error: csrfValidation.error },
      { status: 403 }
    )
  }

  // Authentication
  let session = null
  let context = {}

  if (requireAuth) {
    session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    context = { session, user: session.user }
  }

  // Input validation
  if (validation) {
    let body: unknown

    try {
      // Handle different content types
      const contentType = request.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        body = await request.json()
      } else if (contentType?.includes('multipart/form-data')) {
        // For form data, we'll validate at the route level
        // since multipart parsing is complex
        body = null
      } else if (['GET', 'DELETE'].includes(request.method)) {
        // For GET/DELETE, validate URL parameters
        const url = new URL(request.url)
        const params: Record<string, string> = {}
        url.searchParams.forEach((value, key) => {
          params[key] = value
        })
        body = params
      } else {
        body = {}
      }

      if (body !== null) {
        const validation = validateRequest(validation, body)
        if (!validation.success) {
          return NextResponse.json(
            createValidationError(validation.details),
            { status: 400 }
          )
        }
      }
    } catch (error) {
      console.error('Validation error:', error)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
  }

  // Execute the handler
  try {
    const response = await handler(request, context)

    // Add security headers
    addSecurityHeaders(response)

    // Add CORS headers if enabled
    if (enableCORS) {
      return handleCORS(response, allowedOrigins)
    }

    return response
  } catch (error) {
    console.error('Handler execution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Preconfigured middleware for common use cases
 */
export const middlewarePresets = {
  // Public endpoint with rate limiting
  public: {
    requireAuth: false,
    rateLimit: 'default' as RateLimitConfig,
    enableCORS: true
  },

  // Authenticated endpoint
  authenticated: {
    requireAuth: true,
    rateLimit: 'default' as RateLimitConfig,
    enableCORS: true
  },

  // Sensitive endpoint with strict rate limiting
  sensitive: {
    requireAuth: true,
    rateLimit: 'strict' as RateLimitConfig,
    enableCORS: true
  },

  // File upload endpoint
  fileUpload: {
    requireAuth: true,
    rateLimit: 'upload' as RateLimitConfig,
    maxFileSize: 50 * 1024 * 1024,
    enableCORS: true
  },

  // Voice command endpoint
  voiceCommand: {
    requireAuth: true,
    rateLimit: 'voice' as RateLimitConfig,
    enableCORS: true
  },

  // Webhook endpoint (no auth, but strict rate limiting)
  webhook: {
    requireAuth: false,
    rateLimit: 'strict' as RateLimitConfig,
    allowedMethods: ['POST'],
    enableCORS: false
  }
}

export default withSecurity