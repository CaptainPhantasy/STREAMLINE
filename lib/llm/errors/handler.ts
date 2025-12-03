/**
 * Error Handler for LLM Router
 *
 * Centralizes error handling logic:
 * - Converts any error to LLMError
 * - Maps common provider errors to structured errors
 * - Generates appropriate HTTP responses
 * - Sanitizes errors for logging
 */

import { NextResponse } from 'next/server'
import { LLMError } from './base'
import {
  LLMProviderError,
  RateLimitError,
  InvalidAPIKeyError,
  TokenLimitExceededError,
  CircuitBreakerOpenError,
  UnsupportedProviderError,
  MaxRetriesExceededError,
  TimeoutError,
  NetworkError,
  ValidationError,
} from './provider-errors'

/**
 * Error patterns to match against error messages
 */
const ERROR_PATTERNS = {
  RATE_LIMIT: [
    /rate limit/i,
    /too many requests/i,
    /429/,
    /quota exceeded/i,
  ],
  INVALID_API_KEY: [
    /api key/i,
    /authentication/i,
    /unauthorized/i,
    /invalid key/i,
    /401/,
  ],
  TOKEN_LIMIT: [
    /token limit/i,
    /context length/i,
    /maximum context/i,
    /too many tokens/i,
  ],
  TIMEOUT: [
    /timeout/i,
    /timed out/i,
    /ETIMEDOUT/,
    /ESOCKETTIMEDOUT/,
  ],
  NETWORK: [
    /ECONNRESET/,
    /ECONNREFUSED/,
    /ENOTFOUND/,
    /network error/i,
    /connection error/i,
  ],
}

/**
 * ErrorHandler class for centralized error handling
 */
export class ErrorHandler {
  /**
   * Handles an error and returns an appropriate HTTP response
   */
  static handle(error: unknown): NextResponse {
    const llmError = this.toLLMError(error)

    // Log structured error (with sanitization)
    console.error('[LLM Error]', {
      code: llmError.code,
      message: llmError.message,
      retryable: llmError.retryable,
      statusCode: llmError.statusCode,
      context: llmError.context,
      timestamp: new Date().toISOString(),
    })

    // Build response headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add Retry-After header for rate limits
    if (llmError instanceof RateLimitError) {
      headers['Retry-After'] = llmError.retryAfter.toString()
    }

    // Return client-safe error response
    return NextResponse.json(
      {
        error: llmError.toClientJSON(),
      },
      {
        status: llmError.statusCode,
        headers,
      }
    )
  }

  /**
   * Converts any error to an LLMError
   */
  static toLLMError(error: unknown): LLMError {
    // Already an LLMError
    if (error instanceof LLMError) {
      return error
    }

    // Standard Error object
    if (error instanceof Error) {
      const message = error.message
      const context = { originalError: error.name }

      // Check for rate limit
      if (this.matchesPattern(message, ERROR_PATTERNS.RATE_LIMIT)) {
        const retryAfter = this.extractRetryAfter(message)
        return new RateLimitError(retryAfter, context)
      }

      // Check for invalid API key
      if (this.matchesPattern(message, ERROR_PATTERNS.INVALID_API_KEY)) {
        return new InvalidAPIKeyError(message, context)
      }

      // Check for token limit
      if (this.matchesPattern(message, ERROR_PATTERNS.TOKEN_LIMIT)) {
        const { requested, limit } = this.extractTokenCounts(message)
        return new TokenLimitExceededError(requested, limit, context)
      }

      // Check for timeout
      if (this.matchesPattern(message, ERROR_PATTERNS.TIMEOUT)) {
        return new TimeoutError(message, context)
      }

      // Check for network error
      if (this.matchesPattern(message, ERROR_PATTERNS.NETWORK)) {
        return new NetworkError(message, context)
      }

      // Generic provider error
      return new LLMProviderError(message, context)
    }

    // Unknown error type
    return new LLMProviderError('Unknown error occurred', {
      originalError: String(error),
    })
  }

  /**
   * Checks if a message matches any of the given patterns
   */
  private static matchesPattern(message: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(message))
  }

  /**
   * Extracts retry-after duration from error message
   * Default: 60 seconds
   */
  private static extractRetryAfter(message: string): number {
    const match = message.match(/retry after (\d+)/i)
    if (match) {
      return parseInt(match[1], 10)
    }

    const secondsMatch = message.match(/(\d+)\s*seconds?/i)
    if (secondsMatch) {
      return parseInt(secondsMatch[1], 10)
    }

    return 60 // Default 60 seconds
  }

  /**
   * Extracts token counts from error message
   * Default: requested = 0, limit = 0 (unknown)
   */
  private static extractTokenCounts(message: string): { requested: number; limit: number } {
    // Pattern: "requested 5000 exceeds limit 4096"
    const match = message.match(/(\d+).*?(?:exceeds?|>).*?(\d+)/i)
    if (match) {
      return {
        requested: parseInt(match[1], 10),
        limit: parseInt(match[2], 10),
      }
    }

    return { requested: 0, limit: 0 }
  }

  /**
   * Checks if an error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof LLMError) {
      return error.retryable
    }

    // Default: retry on network/timeout errors
    if (error instanceof Error) {
      const message = error.message
      return (
        this.matchesPattern(message, ERROR_PATTERNS.RATE_LIMIT) ||
        this.matchesPattern(message, ERROR_PATTERNS.TIMEOUT) ||
        this.matchesPattern(message, ERROR_PATTERNS.NETWORK)
      )
    }

    return false
  }

  /**
   * Gets error code from any error
   */
  static getErrorCode(error: unknown): string {
    if (error instanceof LLMError) {
      return error.code
    }
    return 'UNKNOWN_ERROR'
  }
}
