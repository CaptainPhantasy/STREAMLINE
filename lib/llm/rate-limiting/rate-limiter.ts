/**
 * Rate Limiter
 *
 * Provides rate limiting enforcement for LLM API requests.
 * Uses token bucket algorithm with configurable per-request cost.
 *
 * Default configuration:
 * - 10 requests/second per account
 * - 50 request burst capacity (5 seconds at normal rate)
 *
 * @module lib/llm/rate-limiting/rate-limiter
 */

import { TokenBucket, type TokenBucketConfig } from './token-bucket'

export interface RateLimitConfig {
  /** Requests per second (default: 10) */
  requestsPerSecond?: number
  /** Burst capacity in number of requests (default: 50) */
  burstCapacity?: number
}

export interface RateLimitError {
  status: 429
  code: 'RATE_LIMIT_EXCEEDED'
  message: string
  retryAfterMs: number
}

/**
 * Rate Limiter for LLM requests
 *
 * Enforces per-account rate limits using token bucket algorithm.
 */
export class RateLimiter {
  private bucket: TokenBucket
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig = {}) {
    this.config = {
      requestsPerSecond: config.requestsPerSecond ?? 10,
      burstCapacity: config.burstCapacity ?? 50,
    }

    // Create token bucket with configuration
    // Each token = one request
    // Refill rate = requests per second
    const bucketConfig: TokenBucketConfig = {
      capacity: this.config.burstCapacity,
      refillRate: this.config.requestsPerSecond,
      initialTokens: this.config.burstCapacity,
    }

    this.bucket = new TokenBucket(bucketConfig)
  }

  /**
   * Check if a request is allowed for an account
   *
   * @param accountId - Account identifier
   * @returns true if request is allowed, error object if rate limited
   */
  checkLimit(accountId: string): true | RateLimitError {
    // Try to consume 1 token (1 request)
    if (this.bucket.tryConsume(accountId, 1)) {
      return true
    }

    // Rate limit exceeded
    const retryAfterMs = this.bucket.getTimeUntilNextToken(accountId)

    return {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Maximum ${this.config.requestsPerSecond} requests/second. Please retry in ${retryAfterMs}ms.`,
      retryAfterMs,
    }
  }

  /**
   * Get current rate limit status for an account
   *
   * @param accountId - Account identifier
   * @returns Current token count and limit info
   */
  getStatus(accountId: string) {
    const stats = this.bucket.getStats(accountId)
    return {
      tokensAvailable: stats.tokens,
      tokensCapacity: stats.capacity,
      requestsPerSecond: this.config.requestsPerSecond,
      requestsRemaining: Math.floor(stats.tokens),
      requestsCapacity: stats.capacity,
    }
  }

  /**
   * Reset rate limit for an account
   *
   * @param accountId - Account identifier
   */
  reset(accountId: string): void {
    this.bucket.reset(accountId)
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.bucket.resetAll()
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    this.bucket.destroy()
  }
}

// Singleton instance
let rateLimiter: RateLimiter | null = null

/**
 * Get or create the global rate limiter instance
 *
 * @param config - Optional configuration for rate limiter
 * @returns The global rate limiter instance
 */
export function getRateLimiter(config?: RateLimitConfig): RateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter(config)
  }
  return rateLimiter
}

/**
 * Reset the global rate limiter
 */
export function resetRateLimiter(): void {
  if (rateLimiter) {
    rateLimiter.destroy()
    rateLimiter = null
  }
}
