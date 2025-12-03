/**
 * Provider-Specific Error Classes
 *
 * Structured error hierarchy for LLM provider failures:
 * - LLMProviderError: Generic provider failures (retryable)
 * - RateLimitError: Rate limit exceeded (retryable with backoff)
 * - InvalidAPIKeyError: Authentication failures (not retryable)
 * - TokenLimitExceededError: Request too large (not retryable)
 * - CircuitBreakerOpenError: Circuit breaker triggered (retryable)
 * - UnsupportedProviderError: Invalid provider name (not retryable)
 * - MaxRetriesExceededError: All retry attempts failed (not retryable)
 */

import { LLMError } from './base'

/**
 * Generic LLM provider error
 * Retryable: Yes (transient failures)
 * Status: 502 Bad Gateway
 */
export class LLMProviderError extends LLMError {
  readonly code = 'PROVIDER_ERROR'
  readonly retryable = true
  readonly statusCode = 502

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}

/**
 * Rate limit exceeded error
 * Retryable: Yes (with backoff)
 * Status: 429 Too Many Requests
 * Context: retryAfter (seconds to wait before retry)
 */
export class RateLimitError extends LLMError {
  readonly code = 'RATE_LIMIT'
  readonly retryable = true
  readonly statusCode = 429

  constructor(
    public readonly retryAfter: number, // seconds
    context?: Record<string, any>
  ) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`, context)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    }
  }

  toClientJSON() {
    return {
      ...super.toClientJSON(),
      retryAfter: this.retryAfter,
    }
  }
}

/**
 * Invalid API key error
 * Retryable: No (requires configuration fix)
 * Status: 401 Unauthorized
 */
export class InvalidAPIKeyError extends LLMError {
  readonly code = 'INVALID_API_KEY'
  readonly retryable = false
  readonly statusCode = 401

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}

/**
 * Token limit exceeded error
 * Retryable: No (request too large)
 * Status: 400 Bad Request
 * Context: requested, limit (token counts)
 */
export class TokenLimitExceededError extends LLMError {
  readonly code = 'TOKEN_LIMIT_EXCEEDED'
  readonly retryable = false
  readonly statusCode = 400

  constructor(
    public readonly requested: number,
    public readonly limit: number,
    context?: Record<string, any>
  ) {
    super(`Token limit exceeded: ${requested} > ${limit}`, context)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      requested: this.requested,
      limit: this.limit,
    }
  }

  toClientJSON() {
    return {
      ...super.toClientJSON(),
      requested: this.requested,
      limit: this.limit,
    }
  }
}

/**
 * Circuit breaker open error
 * Retryable: Yes (after cooldown)
 * Status: 503 Service Unavailable
 */
export class CircuitBreakerOpenError extends LLMError {
  readonly code = 'CIRCUIT_BREAKER_OPEN'
  readonly retryable = true
  readonly statusCode = 503

  constructor(message: string = 'Circuit breaker is OPEN', context?: Record<string, any>) {
    super(message, context)
  }
}

/**
 * Unsupported provider error
 * Retryable: No (configuration error)
 * Status: 400 Bad Request
 */
export class UnsupportedProviderError extends LLMError {
  readonly code = 'UNSUPPORTED_PROVIDER'
  readonly retryable = false
  readonly statusCode = 400

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}

/**
 * Max retries exceeded error
 * Retryable: No (already exhausted retries)
 * Status: 500 Internal Server Error
 * Context: attempts (number of attempts made)
 */
export class MaxRetriesExceededError extends LLMError {
  readonly code = 'MAX_RETRIES_EXCEEDED'
  readonly retryable = false
  readonly statusCode = 500

  constructor(
    message: string,
    public readonly attempts: number,
    context?: Record<string, any>
  ) {
    super(message, context)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      attempts: this.attempts,
    }
  }

  toClientJSON() {
    return {
      ...super.toClientJSON(),
      attempts: this.attempts,
    }
  }
}

/**
 * Timeout error
 * Retryable: Yes (transient network issue)
 * Status: 504 Gateway Timeout
 */
export class TimeoutError extends LLMError {
  readonly code = 'TIMEOUT'
  readonly retryable = true
  readonly statusCode = 504

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}

/**
 * Network error
 * Retryable: Yes (transient network issue)
 * Status: 503 Service Unavailable
 */
export class NetworkError extends LLMError {
  readonly code = 'NETWORK'
  readonly retryable = true
  readonly statusCode = 503

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}

/**
 * Validation error
 * Retryable: No (invalid input)
 * Status: 400 Bad Request
 */
export class ValidationError extends LLMError {
  readonly code = 'VALIDATION_ERROR'
  readonly retryable = false
  readonly statusCode = 400

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}
