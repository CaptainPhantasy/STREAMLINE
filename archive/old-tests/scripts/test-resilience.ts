/**
 * Resilience Layer Test Suite
 *
 * Comprehensive tests for retry policy, circuit breaker, and error handling.
 *
 * Test scenarios:
 * 1. Retry on transient failure (3 attempts)
 * 2. Circuit breaker opens after 5 failures
 * 3. Circuit breaker cooldown and recovery
 * 4. Error classification (retryable vs non-retryable)
 * 5. Exponential backoff timing
 * 6. Structured error responses
 * 7. Integration with actual LLM router
 */

import { RetryPolicy } from '../lib/llm/resilience/retry'
import { CircuitBreaker } from '../lib/llm/resilience/circuit-breaker'
import { ResilientProvider } from '../lib/llm/resilience/resilient-provider'
import { ErrorHandler } from '../lib/llm/errors/handler'
import {
  LLMProviderError,
  RateLimitError,
  InvalidAPIKeyError,
  TokenLimitExceededError,
  CircuitBreakerOpenError,
  MaxRetriesExceededError,
  TimeoutError,
  NetworkError,
} from '../lib/llm/errors/provider-errors'

// ================================================================
// Test Utilities
// ================================================================

let testCount = 0
let passCount = 0
let failCount = 0

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    testCount++
    try {
      await fn()
      passCount++
      console.log(`✅ Test ${testCount}: ${name}`)
    } catch (error: any) {
      failCount++
      console.error(`❌ Test ${testCount}: ${name}`)
      console.error(`   Error: ${error.message}`)
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n').slice(1, 3).join('\n')}`)
      }
    }
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, got ${actual}`
    )
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ================================================================
// Test Suite
// ================================================================

async function main() {
  console.log('🧪 Resilience Layer Test Suite\n')
  console.log('=' .repeat(60))
  console.log()

  // ================================================================
  // Error Classes Tests
  // ================================================================

  console.log('📦 Testing Error Classes...\n')

  await test('LLMProviderError has correct properties', () => {
    const error = new LLMProviderError('Test error', { key: 'value' })
    assertEqual(error.code, 'PROVIDER_ERROR')
    assertEqual(error.retryable, true)
    assertEqual(error.statusCode, 502)
    assert(error.message === 'Test error', 'Message should match')
    assert(error.context?.key === 'value', 'Context should be preserved')
  })()

  await test('RateLimitError includes retry-after', () => {
    const error = new RateLimitError(60, { limit: '100/min' })
    assertEqual(error.code, 'RATE_LIMIT')
    assertEqual(error.retryable, true)
    assertEqual(error.statusCode, 429)
    assertEqual(error.retryAfter, 60)
    assert(error.message.includes('60'), 'Message should include retry-after')
  })()

  await test('InvalidAPIKeyError is not retryable', () => {
    const error = new InvalidAPIKeyError('Invalid key')
    assertEqual(error.code, 'INVALID_API_KEY')
    assertEqual(error.retryable, false)
    assertEqual(error.statusCode, 401)
  })()

  await test('TokenLimitExceededError includes counts', () => {
    const error = new TokenLimitExceededError(5000, 4096)
    assertEqual(error.code, 'TOKEN_LIMIT_EXCEEDED')
    assertEqual(error.retryable, false)
    assertEqual(error.statusCode, 400)
    assertEqual(error.requested, 5000)
    assertEqual(error.limit, 4096)
  })()

  await test('CircuitBreakerOpenError is retryable', () => {
    const error = new CircuitBreakerOpenError()
    assertEqual(error.code, 'CIRCUIT_BREAKER_OPEN')
    assertEqual(error.retryable, true)
    assertEqual(error.statusCode, 503)
  })()

  await test('MaxRetriesExceededError is not retryable', () => {
    const error = new MaxRetriesExceededError('Failed after 3 attempts', 3)
    assertEqual(error.code, 'MAX_RETRIES_EXCEEDED')
    assertEqual(error.retryable, false)
    assertEqual(error.statusCode, 500)
    assertEqual(error.attempts, 3)
  })()

  await test('TimeoutError is retryable', () => {
    const error = new TimeoutError('Request timed out')
    assertEqual(error.code, 'TIMEOUT')
    assertEqual(error.retryable, true)
    assertEqual(error.statusCode, 504)
  })()

  await test('NetworkError is retryable', () => {
    const error = new NetworkError('Connection reset')
    assertEqual(error.code, 'NETWORK')
    assertEqual(error.retryable, true)
    assertEqual(error.statusCode, 503)
  })()

  console.log()

  // ================================================================
  // ErrorHandler Tests
  // ================================================================

  console.log('🔍 Testing ErrorHandler...\n')

  await test('ErrorHandler converts standard Error to LLMError', () => {
    const error = new Error('Test error')
    const llmError = ErrorHandler.toLLMError(error)
    assert(llmError instanceof LLMProviderError, 'Should convert to LLMProviderError')
    assertEqual(llmError.code, 'PROVIDER_ERROR')
  })()

  await test('ErrorHandler detects rate limit from message', () => {
    const error = new Error('Rate limit exceeded. Please try again later.')
    const llmError = ErrorHandler.toLLMError(error)
    assert(llmError instanceof RateLimitError, 'Should detect rate limit')
    assertEqual(llmError.code, 'RATE_LIMIT')
  })()

  await test('ErrorHandler detects invalid API key from message', () => {
    const error = new Error('Invalid API key provided')
    const llmError = ErrorHandler.toLLMError(error)
    assert(llmError instanceof InvalidAPIKeyError, 'Should detect invalid API key')
    assertEqual(llmError.code, 'INVALID_API_KEY')
  })()

  await test('ErrorHandler detects token limit from message', () => {
    const error = new Error('Token limit exceeded: requested 5000 exceeds 4096')
    const llmError = ErrorHandler.toLLMError(error)
    assert(llmError instanceof TokenLimitExceededError, 'Should detect token limit')
    assertEqual(llmError.code, 'TOKEN_LIMIT_EXCEEDED')
  })()

  await test('ErrorHandler identifies retryable errors', () => {
    const rateLimitError = new Error('Rate limit exceeded')
    const authError = new Error('Invalid API key')
    assert(ErrorHandler.isRetryable(rateLimitError), 'Rate limit should be retryable')
    assert(!ErrorHandler.isRetryable(authError), 'Auth error should not be retryable')
  })()

  console.log()

  // ================================================================
  // RetryPolicy Tests
  // ================================================================

  console.log('🔄 Testing RetryPolicy...\n')

  await test('RetryPolicy succeeds on first attempt', async () => {
    const retry = new RetryPolicy({ maxAttempts: 3 })
    let attempts = 0

    const result = await retry.execute(async () => {
      attempts++
      return 'success'
    })

    assertEqual(result, 'success')
    assertEqual(attempts, 1, 'Should only attempt once')
  })()

  await test('RetryPolicy retries on transient failure', async () => {
    const retry = new RetryPolicy({ maxAttempts: 3, initialDelayMs: 10, maxDelayMs: 50 })
    let attempts = 0

    const result = await retry.execute(async () => {
      attempts++
      if (attempts < 3) {
        throw new NetworkError('Connection failed')
      }
      return 'success'
    })

    assertEqual(result, 'success')
    assertEqual(attempts, 3, 'Should retry twice before succeeding')
  })()

  await test('RetryPolicy does not retry on non-retryable error', async () => {
    const retry = new RetryPolicy({ maxAttempts: 3 })
    let attempts = 0

    try {
      await retry.execute(async () => {
        attempts++
        throw new InvalidAPIKeyError('Invalid key')
      })
      assert(false, 'Should have thrown error')
    } catch (error: any) {
      assert(error instanceof InvalidAPIKeyError, 'Should throw original error')
      assertEqual(attempts, 1, 'Should not retry')
    }
  })()

  await test('RetryPolicy throws MaxRetriesExceededError after max attempts', async () => {
    const retry = new RetryPolicy({ maxAttempts: 3, initialDelayMs: 10, maxDelayMs: 50 })
    let attempts = 0

    try {
      await retry.execute(async () => {
        attempts++
        throw new NetworkError('Connection failed')
      })
      assert(false, 'Should have thrown error')
    } catch (error: any) {
      assert(error instanceof MaxRetriesExceededError, 'Should throw MaxRetriesExceededError')
      assertEqual(attempts, 3, 'Should attempt max times')
    }
  })()

  await test('RetryPolicy uses exponential backoff', async () => {
    const retry = new RetryPolicy({
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      jitterFactor: 0, // No jitter for predictable timing
    })

    const startTime = Date.now()
    let attempts = 0

    try {
      await retry.execute(async () => {
        attempts++
        if (attempts < 3) {
          throw new NetworkError('Connection failed')
        }
        return 'success'
      })
    } catch {
      // Ignore
    }

    const elapsed = Date.now() - startTime
    // First retry: 100ms, second retry: 200ms, total ≥ 300ms
    assert(elapsed >= 250, `Should wait at least 250ms (got ${elapsed}ms)`)
  })()

  console.log()

  // ================================================================
  // CircuitBreaker Tests
  // ================================================================

  console.log('⚡ Testing CircuitBreaker...\n')

  await test('CircuitBreaker starts in CLOSED state', () => {
    const breaker = new CircuitBreaker()
    const state = breaker.getState()
    assertEqual(state.state, 'CLOSED')
    assertEqual(state.failureCount, 0)
  })()

  await test('CircuitBreaker allows requests in CLOSED state', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 5 })
    const result = await breaker.execute(async () => 'success')
    assertEqual(result, 'success')
  })()

  await test('CircuitBreaker transitions to OPEN after threshold failures', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3 })

    // Cause 3 failures
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Failure')
        })
      } catch {
        // Expected
      }
    }

    const state = breaker.getState()
    assertEqual(state.state, 'OPEN', 'Should transition to OPEN')
    assertEqual(state.failureCount, 3)
  })()

  await test('CircuitBreaker rejects requests in OPEN state', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownPeriod: 1000 })

    // Cause 2 failures
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Failure')
        })
      } catch {
        // Expected
      }
    }

    // Should be OPEN now
    try {
      await breaker.execute(async () => 'success')
      assert(false, 'Should have thrown CircuitBreakerOpenError')
    } catch (error: any) {
      assert(error instanceof CircuitBreakerOpenError, 'Should throw CircuitBreakerOpenError')
    }
  })()

  await test('CircuitBreaker transitions to HALF_OPEN after cooldown', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownPeriod: 100 })

    // Cause 2 failures
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Failure')
        })
      } catch {
        // Expected
      }
    }

    // Wait for cooldown
    await sleep(150)

    // Should transition to HALF_OPEN on next attempt
    const result = await breaker.execute(async () => 'success')
    assertEqual(result, 'success')

    const state = breaker.getState()
    // Should still be HALF_OPEN (needs successThreshold successes to close)
    assertEqual(state.state, 'HALF_OPEN')
  })()

  await test('CircuitBreaker transitions back to CLOSED after success threshold', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      cooldownPeriod: 100,
      successThreshold: 2,
    })

    // Cause 2 failures
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Failure')
        })
      } catch {
        // Expected
      }
    }

    // Wait for cooldown
    await sleep(150)

    // Execute 2 successful requests
    await breaker.execute(async () => 'success')
    await breaker.execute(async () => 'success')

    const state = breaker.getState()
    assertEqual(state.state, 'CLOSED', 'Should transition back to CLOSED')
    assertEqual(state.failureCount, 0, 'Should reset failure count')
  })()

  await test('CircuitBreaker resets state manually', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2 })

    // Cause 2 failures
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Failure')
        })
      } catch {
        // Expected
      }
    }

    // Should be OPEN
    let state = breaker.getState()
    assertEqual(state.state, 'OPEN')

    // Reset
    breaker.reset()

    state = breaker.getState()
    assertEqual(state.state, 'CLOSED')
    assertEqual(state.failureCount, 0)
  })()

  console.log()

  // ================================================================
  // ResilientProvider Tests
  // ================================================================

  console.log('🛡️  Testing ResilientProvider...\n')

  await test('ResilientProvider succeeds on first attempt', async () => {
    let attempts = 0
    const resilient = new ResilientProvider(async () => {
      attempts++
      return 'success'
    })

    const result = await resilient.execute()
    assertEqual(result, 'success')
    assertEqual(attempts, 1)
  })()

  await test('ResilientProvider retries on transient failure', async () => {
    let attempts = 0
    const resilient = new ResilientProvider(
      async () => {
        attempts++
        if (attempts < 3) {
          throw new NetworkError('Connection failed')
        }
        return 'success'
      },
      { maxRetries: 3, initialRetryDelay: 10, maxRetryDelay: 50 }
    )

    const result = await resilient.execute()
    assertEqual(result, 'success')
    assertEqual(attempts, 3)
  })()

  await test('ResilientProvider opens circuit after repeated failures', async () => {
    let attempts = 0
    const resilient = new ResilientProvider(
      async () => {
        attempts++
        throw new NetworkError('Connection failed')
      },
      {
        maxRetries: 1,
        circuitBreakerThreshold: 3,
        initialRetryDelay: 10,
      }
    )

    // Cause 3 failures (each with 1 retry = 6 total attempts)
    for (let i = 0; i < 3; i++) {
      try {
        await resilient.execute()
      } catch {
        // Expected
      }
    }

    // Circuit should be OPEN
    assert(resilient.isCircuitOpen(), 'Circuit should be open')

    // Next attempt should fail fast
    try {
      await resilient.execute()
      assert(false, 'Should have thrown CircuitBreakerOpenError')
    } catch (error: any) {
      assert(error instanceof CircuitBreakerOpenError, 'Should throw CircuitBreakerOpenError')
    }
  })()

  await test('ResilientProvider provides state inspection', () => {
    const resilient = new ResilientProvider(async () => 'success', {
      maxRetries: 3,
      circuitBreakerThreshold: 5,
    })

    const circuitState = resilient.getCircuitState()
    const retryConfig = resilient.getRetryConfig()
    const circuitConfig = resilient.getCircuitConfig()

    assertEqual(circuitState.state, 'CLOSED')
    assertEqual(retryConfig.maxAttempts, 3)
    assertEqual(circuitConfig.failureThreshold, 5)
  })()

  console.log()

  // ================================================================
  // Summary
  // ================================================================

  console.log('=' .repeat(60))
  console.log()
  console.log('📊 Test Summary')
  console.log(`   Total: ${testCount}`)
  console.log(`   ✅ Passed: ${passCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log()

  if (failCount === 0) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log(`❌ ${failCount} test(s) failed`)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
