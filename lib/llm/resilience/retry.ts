/**
 * Retry Policy with Exponential Backoff
 *
 * Implements retry logic for transient failures:
 * - Exponential backoff with jitter
 * - Configurable max attempts
 * - Only retries on retryable errors
 * - Respects rate limit retry-after headers
 */

import { ErrorHandler } from '../errors/handler'
import { RateLimitError, MaxRetriesExceededError } from '../errors/provider-errors'

export interface RetryConfig {
  maxAttempts?: number // Default: 3
  initialDelayMs?: number // Default: 100ms
  maxDelayMs?: number // Default: 5000ms
  backoffMultiplier?: number // Default: 2x
  jitterFactor?: number // Default: 0.25 (±25%)
}

/**
 * RetryPolicy class
 *
 * Usage:
 * ```typescript
 * const retry = new RetryPolicy({ maxAttempts: 3 })
 * const result = await retry.execute(async () => {
 *   return await callLLMProvider()
 * })
 * ```
 */
export class RetryPolicy {
  private readonly maxAttempts: number
  private readonly initialDelayMs: number
  private readonly maxDelayMs: number
  private readonly backoffMultiplier: number
  private readonly jitterFactor: number

  constructor(config: RetryConfig = {}) {
    this.maxAttempts = config.maxAttempts ?? 3
    this.initialDelayMs = config.initialDelayMs ?? 100
    this.maxDelayMs = config.maxDelayMs ?? 5000
    this.backoffMultiplier = config.backoffMultiplier ?? 2
    this.jitterFactor = config.jitterFactor ?? 0.25

    // Validate config
    if (this.maxAttempts < 1) {
      throw new Error('maxAttempts must be at least 1')
    }
    if (this.initialDelayMs < 0) {
      throw new Error('initialDelayMs must be non-negative')
    }
    if (this.maxDelayMs < this.initialDelayMs) {
      throw new Error('maxDelayMs must be >= initialDelayMs')
    }
    if (this.backoffMultiplier < 1) {
      throw new Error('backoffMultiplier must be >= 1')
    }
    if (this.jitterFactor < 0 || this.jitterFactor > 1) {
      throw new Error('jitterFactor must be between 0 and 1')
    }
  }

  /**
   * Executes a function with retry logic
   *
   * @param fn - The async function to execute
   * @returns The result of the function
   * @throws MaxRetriesExceededError if all attempts fail
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error

        // Check if error is retryable
        if (!ErrorHandler.isRetryable(error)) {
          throw error
        }

        // Last attempt - don't wait, just throw
        if (attempt === this.maxAttempts) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, error)

        // Log retry attempt
        console.log(`[Retry] Attempt ${attempt}/${this.maxAttempts} failed, retrying in ${delay}ms`, {
          error: ErrorHandler.getErrorCode(error),
          attempt,
          maxAttempts: this.maxAttempts,
        })

        // Wait before retry
        await this.sleep(delay)
      }
    }

    // All attempts failed
    throw new MaxRetriesExceededError(
      `Failed after ${this.maxAttempts} attempts`,
      this.maxAttempts,
      { lastError: lastError?.message }
    )
  }

  /**
   * Calculates delay for next retry with exponential backoff and jitter
   *
   * @param attempt - Current attempt number (1-indexed)
   * @param error - The error that occurred
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number, error: any): number {
    // Handle rate limit errors with explicit retry-after
    if (error instanceof RateLimitError) {
      return error.retryAfter * 1000 // Convert seconds to milliseconds
    }

    // Exponential backoff: initialDelay * (multiplier ^ (attempt - 1))
    const exponentialDelay = this.initialDelayMs * Math.pow(this.backoffMultiplier, attempt - 1)

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs)

    // Add jitter to prevent thundering herd
    // Jitter range: [delay * (1 - jitter), delay * (1 + jitter)]
    const jitterRange = cappedDelay * this.jitterFactor
    const minDelay = cappedDelay - jitterRange
    const maxDelay = cappedDelay + jitterRange
    const jitteredDelay = minDelay + Math.random() * (maxDelay - minDelay)

    return Math.floor(jitteredDelay)
  }

  /**
   * Sleep for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Gets the current configuration
   */
  getConfig(): Required<RetryConfig> {
    return {
      maxAttempts: this.maxAttempts,
      initialDelayMs: this.initialDelayMs,
      maxDelayMs: this.maxDelayMs,
      backoffMultiplier: this.backoffMultiplier,
      jitterFactor: this.jitterFactor,
    }
  }
}
