/**
 * Rate Limiting Module
 *
 * Provides rate limiting enforcement for the LLM router.
 * Implements token bucket algorithm for smooth rate limiting.
 *
 * Usage:
 * ```typescript
 * import { getRateLimiter } from '@/lib/llm/rate-limiting'
 *
 * const limiter = getRateLimiter()
 * const result = limiter.checkLimit(accountId)
 *
 * if (result !== true) {
 *   return NextResponse.json(result, { status: result.status })
 * }
 * ```
 *
 * @module lib/llm/rate-limiting
 */

export {
  TokenBucket,
  type TokenBucketConfig,
} from './token-bucket'

export {
  RateLimiter,
  getRateLimiter,
  resetRateLimiter,
  type RateLimitConfig,
  type RateLimitError,
} from './rate-limiter'
