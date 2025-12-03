/**
 * Circuit Breaker Pattern Implementation
 *
 * Three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail fast
 * - HALF_OPEN: Testing if service recovered
 *
 * State transitions:
 * - CLOSED → OPEN: After failureThreshold consecutive failures
 * - OPEN → HALF_OPEN: After cooldownPeriod elapsed
 * - HALF_OPEN → CLOSED: After successThreshold consecutive successes
 * - HALF_OPEN → OPEN: On any failure
 */

import { CircuitBreakerOpenError } from '../errors/provider-errors'

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerConfig {
  failureThreshold?: number // Default: 5 failures → OPEN
  cooldownPeriod?: number // Default: 60000ms (60 seconds)
  successThreshold?: number // Default: 2 successes → CLOSED
}

export interface CircuitBreakerState {
  state: CircuitState
  failureCount: number
  successCount: number
  lastFailureTime: number | null
  lastStateChange: number
}

/**
 * CircuitBreaker class
 *
 * Usage:
 * ```typescript
 * const breaker = new CircuitBreaker({ failureThreshold: 5 })
 * const result = await breaker.execute(async () => {
 *   return await callLLMProvider()
 * })
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number | null = null
  private lastStateChange: number = Date.now()

  private readonly failureThreshold: number
  private readonly cooldownPeriod: number
  private readonly successThreshold: number

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? 5
    this.cooldownPeriod = config.cooldownPeriod ?? 60_000 // 60 seconds
    this.successThreshold = config.successThreshold ?? 2

    // Validate config
    if (this.failureThreshold < 1) {
      throw new Error('failureThreshold must be at least 1')
    }
    if (this.cooldownPeriod < 0) {
      throw new Error('cooldownPeriod must be non-negative')
    }
    if (this.successThreshold < 1) {
      throw new Error('successThreshold must be at least 1')
    }
  }

  /**
   * Executes a function with circuit breaker protection
   *
   * @param fn - The async function to execute
   * @returns The result of the function
   * @throws CircuitBreakerOpenError if circuit is OPEN
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime || 0)
      if (timeSinceLastFailure > this.cooldownPeriod) {
        this.transitionTo('HALF_OPEN')
        console.log('[CircuitBreaker] Transitioning to HALF_OPEN after cooldown', {
          cooldownPeriod: this.cooldownPeriod,
          timeSinceLastFailure,
        })
      } else {
        throw new CircuitBreakerOpenError('Circuit breaker is OPEN', {
          failureCount: this.failureCount,
          lastFailureTime: this.lastFailureTime,
          cooldownRemaining: this.cooldownPeriod - timeSinceLastFailure,
        })
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Handles successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === 'HALF_OPEN') {
      this.successCount++
      console.log('[CircuitBreaker] Success in HALF_OPEN', {
        successCount: this.successCount,
        successThreshold: this.successThreshold,
      })

      if (this.successCount >= this.successThreshold) {
        this.transitionTo('CLOSED')
        console.log('[CircuitBreaker] Transitioning to CLOSED after successful recovery')
      }
    }
  }

  /**
   * Handles failed execution
   */
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    this.successCount = 0 // Reset success count on any failure

    console.log('[CircuitBreaker] Failure recorded', {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
    })

    // HALF_OPEN → OPEN on any failure
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN')
      console.log('[CircuitBreaker] Transitioning to OPEN after failure in HALF_OPEN')
    }
    // CLOSED → OPEN after threshold
    else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.transitionTo('OPEN')
      console.log('[CircuitBreaker] Transitioning to OPEN after failure threshold', {
        failureCount: this.failureCount,
        failureThreshold: this.failureThreshold,
      })
    }
  }

  /**
   * Transitions to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state
    this.state = newState
    this.lastStateChange = Date.now()

    // Reset counters on state change
    if (newState === 'CLOSED') {
      this.failureCount = 0
      this.successCount = 0
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0
    }

    console.log('[CircuitBreaker] State transition', {
      from: oldState,
      to: newState,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Gets the current state of the circuit breaker
   */
  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
    }
  }

  /**
   * Manually resets the circuit breaker to CLOSED state
   */
  reset(): void {
    this.transitionTo('CLOSED')
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    console.log('[CircuitBreaker] Manually reset to CLOSED')
  }

  /**
   * Gets the current configuration
   */
  getConfig(): Required<CircuitBreakerConfig> {
    return {
      failureThreshold: this.failureThreshold,
      cooldownPeriod: this.cooldownPeriod,
      successThreshold: this.successThreshold,
    }
  }

  /**
   * Checks if circuit is currently allowing requests
   */
  isOpen(): boolean {
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime || 0)
      return timeSinceLastFailure <= this.cooldownPeriod
    }
    return false
  }
}
