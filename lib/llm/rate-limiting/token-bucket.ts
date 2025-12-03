/**
 * Token Bucket Rate Limiter
 *
 * Implements the token bucket algorithm for rate limiting.
 * Tokens are added at a fixed rate. Each request consumes tokens.
 * If insufficient tokens are available, the request is rejected.
 *
 * This implementation uses in-memory storage, suitable for single-instance deployments.
 * For distributed deployments, consider Redis-backed implementation.
 *
 * @module lib/llm/rate-limiting/token-bucket
 */

interface BucketState {
  tokens: number
  lastRefillTime: number
}

export interface TokenBucketConfig {
  /** Maximum tokens in bucket (capacity) */
  capacity: number
  /** Tokens added per second */
  refillRate: number
  /** Initial tokens (defaults to capacity) */
  initialTokens?: number
}

/**
 * Token Bucket Rate Limiter
 *
 * Tracks tokens per account and enforces rate limits using the token bucket algorithm.
 */
export class TokenBucket {
  private buckets: Map<string, BucketState> = new Map()
  private config: TokenBucketConfig
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: TokenBucketConfig) {
    this.config = {
      ...config,
      initialTokens: config.initialTokens ?? config.capacity,
    }

    // Cleanup stale buckets every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleBuckets()
    }, 5 * 60 * 1000)
  }

  /**
   * Try to consume tokens from the bucket
   *
   * @param accountId - Account identifier
   * @param tokensRequested - Number of tokens to consume (default: 1)
   * @returns true if tokens were available and consumed, false otherwise
   */
  tryConsume(accountId: string, tokensRequested: number = 1): boolean {
    const bucket = this.getOrCreateBucket(accountId)

    // Refill bucket first based on elapsed time
    this.refillBucket(bucket)

    // Check if sufficient tokens available
    if (bucket.tokens >= tokensRequested) {
      bucket.tokens -= tokensRequested
      return true
    }

    return false
  }

  /**
   * Get current token count for an account
   *
   * @param accountId - Account identifier
   * @returns Current token count
   */
  getTokenCount(accountId: string): number {
    const bucket = this.getOrCreateBucket(accountId)
    this.refillBucket(bucket)
    return bucket.tokens
  }

  /**
   * Get remaining time (in ms) until next token is available
   *
   * @param accountId - Account identifier
   * @returns Milliseconds until next token, or 0 if tokens available
   */
  getTimeUntilNextToken(accountId: string): number {
    const bucket = this.getOrCreateBucket(accountId)
    this.refillBucket(bucket)

    if (bucket.tokens > 0) {
      return 0
    }

    // Time for one token to be added
    const timePerToken = 1000 / this.config.refillRate
    return Math.ceil(timePerToken)
  }

  /**
   * Reset bucket for an account
   *
   * @param accountId - Account identifier
   */
  reset(accountId: string): void {
    this.buckets.delete(accountId)
  }

  /**
   * Reset all buckets
   */
  resetAll(): void {
    this.buckets.clear()
  }

  /**
   * Get statistics for an account
   */
  getStats(accountId: string): {
    tokens: number
    capacity: number
    refillRate: number
  } {
    const bucket = this.getOrCreateBucket(accountId)
    this.refillBucket(bucket)

    return {
      tokens: bucket.tokens,
      capacity: this.config.capacity,
      refillRate: this.config.refillRate,
    }
  }

  /**
   * Destroy the token bucket (cleanup resources)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.buckets.clear()
  }

  /**
   * Get or create a bucket for an account
   */
  private getOrCreateBucket(accountId: string): BucketState {
    if (!this.buckets.has(accountId)) {
      this.buckets.set(accountId, {
        tokens: this.config.initialTokens!,
        lastRefillTime: Date.now(),
      })
    }
    return this.buckets.get(accountId)!
  }

  /**
   * Refill bucket based on elapsed time
   */
  private refillBucket(bucket: BucketState): void {
    const now = Date.now()
    const elapsedSeconds = (now - bucket.lastRefillTime) / 1000

    // Calculate tokens to add based on elapsed time
    const tokensToAdd = elapsedSeconds * this.config.refillRate
    bucket.tokens = Math.min(
      this.config.capacity,
      bucket.tokens + tokensToAdd
    )

    bucket.lastRefillTime = now
  }

  /**
   * Clean up stale buckets that haven't been used recently
   * Buckets unused for 1 hour are removed
   */
  private cleanupStaleBuckets(): void {
    const now = Date.now()
    const staleThreshold = 60 * 60 * 1000 // 1 hour
    const accountsToDelete: string[] = []

    // Collect accounts to delete
    this.buckets.forEach((bucket, accountId) => {
      if (now - bucket.lastRefillTime > staleThreshold) {
        accountsToDelete.push(accountId)
      }
    })

    // Delete collected accounts
    accountsToDelete.forEach(accountId => {
      this.buckets.delete(accountId)
    })
  }
}
