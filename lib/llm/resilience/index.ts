/**
 * LLM Resilience Layer - Public API
 *
 * Exports all resilience patterns and utilities:
 * - RetryPolicy: Exponential backoff with jitter
 * - CircuitBreaker: Fail-fast on repeated failures
 * - ResilientProvider: Combined retry + circuit breaker
 */

// Circuit Breaker
export { CircuitBreaker } from './circuit-breaker'
export type { CircuitState, CircuitBreakerConfig, CircuitBreakerState } from './circuit-breaker'

// Retry Policy
export { RetryPolicy } from './retry'
export type { RetryConfig } from './retry'

// Resilient Provider
export { ResilientProvider, withResilience } from './resilient-provider'
export type { ResilientConfig } from './resilient-provider'

// Error Classes
export { LLMError } from '../errors/base'
export {
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
} from '../errors/provider-errors'

// Error Handler
export { ErrorHandler } from '../errors/handler'
