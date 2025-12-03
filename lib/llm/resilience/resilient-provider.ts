/**
 * Resilient Provider Wrapper
 *
 * Combines retry policy and circuit breaker for resilient execution:
 * - Circuit breaker prevents cascade failures
 * - Retry policy handles transient errors
 * - Configurable thresholds and delays
 */

import { CircuitBreaker, CircuitBreakerConfig } from './circuit-breaker'
import { RetryPolicy, RetryConfig } from './retry'

export interface ResilientConfig {
  // Retry configuration
  maxRetries?: number
  initialRetryDelay?: number
  maxRetryDelay?: number
  backoffMultiplier?: number
  jitterFactor?: number

  // Circuit breaker configuration
  circuitBreakerThreshold?: number
  cooldownPeriod?: number
  successThreshold?: number
}

/**
 * ResilientProvider class
 *
 * Wraps any async function with retry and circuit breaker logic.
 *
 * Usage:
 * ```typescript
 * const resilient = new ResilientProvider(
 *   async () => await generateText({ model, prompt }),
 *   { maxRetries: 3, circuitBreakerThreshold: 5 }
 * )
 * const result = await resilient.execute()
 * ```
 */
export class ResilientProvider<T = any> {
  private readonly circuitBreaker: CircuitBreaker
  private readonly retryPolicy: RetryPolicy

  constructor(
    private readonly providerFn: () => Promise<T>,
    config: ResilientConfig = {}
  ) {
    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.circuitBreakerThreshold ?? 5,
      cooldownPeriod: config.cooldownPeriod ?? 60_000,
      successThreshold: config.successThreshold ?? 2,
    })

    // Initialize retry policy
    this.retryPolicy = new RetryPolicy({
      maxAttempts: config.maxRetries ?? 3,
      initialDelayMs: config.initialRetryDelay ?? 100,
      maxDelayMs: config.maxRetryDelay ?? 5_000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      jitterFactor: config.jitterFactor ?? 0.25,
    })
  }

  /**
   * Executes the provider function with resilience patterns
   *
   * Execution flow:
   * 1. Check circuit breaker state (fail fast if OPEN)
   * 2. Execute with retry policy (exponential backoff)
   * 3. Update circuit breaker on success/failure
   *
   * @returns The result of the provider function
   * @throws CircuitBreakerOpenError if circuit is OPEN
   * @throws MaxRetriesExceededError if all retries fail
   * @throws Original error if non-retryable
   */
  async execute(): Promise<T> {
    return this.circuitBreaker.execute(() =>
      this.retryPolicy.execute(() => this.providerFn())
    )
  }

  /**
   * Gets the current circuit breaker state
   */
  getCircuitState() {
    return this.circuitBreaker.getState()
  }

  /**
   * Gets the retry policy configuration
   */
  getRetryConfig() {
    return this.retryPolicy.getConfig()
  }

  /**
   * Gets the circuit breaker configuration
   */
  getCircuitConfig() {
    return this.circuitBreaker.getConfig()
  }

  /**
   * Manually resets the circuit breaker
   */
  resetCircuit(): void {
    this.circuitBreaker.reset()
  }

  /**
   * Checks if the circuit is currently open
   */
  isCircuitOpen(): boolean {
    return this.circuitBreaker.isOpen()
  }
}

/**
 * Helper function to create a resilient wrapper
 *
 * Usage:
 * ```typescript
 * const result = await withResilience(
 *   async () => await generateText({ model, prompt }),
 *   { maxRetries: 3 }
 * )
 * ```
 */
export async function withResilience<T>(
  fn: () => Promise<T>,
  config?: ResilientConfig
): Promise<T> {
  const resilient = new ResilientProvider(fn, config)
  return resilient.execute()
}
