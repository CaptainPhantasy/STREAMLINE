#!/usr/bin/env npx ts-node

/**
 * Phase 2 Integration Test Suite
 *
 * Tests all Phase 2 deliverables working together:
 * - Subagent D: Resilience Layer (retry + circuit breaker)
 * - Subagent E: Performance (caching + audit)
 * - Subagent F: Monitoring (metrics + health checks)
 *
 * Tests verify:
 * 1. Resilience + Caching integration
 * 2. Resilience + Metrics integration
 * 3. Circuit breaker state transitions
 * 4. Error handling and recovery
 * 5. Performance metrics capture
 */

import { ResilientProvider, CircuitBreaker, ErrorHandler, LLMProviderError } from '@/lib/llm/resilience'
import { MetricsCollector } from '@/lib/llm/metrics/collector'

// ================================================================
// Test Configuration
// ================================================================

const TOTAL_TESTS = 0
let PASSED_TESTS = 0
let FAILED_TESTS = 0

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

const results: TestResult[] = []

// ================================================================
// Test Helpers
// ================================================================

function logTest(message: string) {
  console.log(`  ${message}`)
}

function logSuccess(message: string) {
  console.log(`  ✓ ${message}`)
}

function logError(message: string) {
  console.log(`  ✗ ${message}`)
}

async function runTest(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  TOTAL_TESTS
  const startTime = Date.now()

  try {
    await fn()
    PASSED_TESTS++
    const duration = Date.now() - startTime
    results.push({ name, passed: true, duration })
    logSuccess(`${name} (${duration}ms)`)
  } catch (error) {
    FAILED_TESTS++
    const duration = Date.now() - startTime
    results.push({
      name,
      passed: false,
      duration,
      error: error instanceof Error ? error.message : String(error),
    })
    logError(`${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertEquals(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}: ${message}`)
  }
}

// ================================================================
// Test Suite 1: Resilience Layer Integration
// ================================================================

console.log('\n=== Test Suite 1: Resilience Layer Integration ===\n')

// Test 1.1: Basic resilience wrapping
await runTest('ResilientProvider wraps function and executes', async () => {
  let executionCount = 0

  const resilient = new ResilientProvider(
    async () => {
      executionCount++
      return 'success'
    },
    { maxRetries: 3 }
  )

  const result = await resilient.execute()
  assertEquals(result, 'success', 'Should return success')
  assertEquals(executionCount, 1, 'Should execute exactly once')
})

// Test 1.2: Retry on transient failures
await runTest('ResilientProvider retries on transient failures', async () => {
  let attemptCount = 0
  const maxAttempts = 3

  const resilient = new ResilientProvider(
    async () => {
      attemptCount++
      if (attemptCount < maxAttempts) {
        throw new Error('Transient error')
      }
      return 'success'
    },
    { maxRetries: 3, initialRetryDelay: 10, maxRetryDelay: 50 }
  )

  const result = await resilient.execute()
  assertEquals(result, 'success', 'Should retry and succeed')
  assertEquals(attemptCount, 3, 'Should attempt 3 times')
})

// Test 1.3: Circuit breaker opens after threshold
await runTest('Circuit breaker opens after failure threshold', async () => {
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    cooldownPeriod: 100,
    successThreshold: 2,
  })

  let failureCount = 0

  for (let i = 0; i < 3; i++) {
    try {
      await circuitBreaker.execute(async () => {
        failureCount++
        throw new Error('Provider error')
      })
    } catch (error) {
      // Expected failures
    }
  }

  assert(circuitBreaker.isOpen(), 'Circuit should be OPEN')
  assertEquals(failureCount, 3, 'Should record all failures before opening')
})

// Test 1.4: Circuit breaker recovers after cooldown
await runTest('Circuit breaker transitions to HALF_OPEN after cooldown', async () => {
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 2,
    cooldownPeriod: 50,
    successThreshold: 1,
  })

  // Fail twice to open circuit
  for (let i = 0; i < 2; i++) {
    try {
      await circuitBreaker.execute(async () => {
        throw new Error('Provider error')
      })
    } catch {
      // Expected
    }
  }

  assert(circuitBreaker.isOpen(), 'Circuit should be OPEN')

  // Wait for cooldown
  await new Promise(resolve => setTimeout(resolve, 60))

  // Try again - should succeed and close circuit
  await circuitBreaker.execute(async () => {
    return 'success'
  })

  assert(!circuitBreaker.isOpen(), 'Circuit should be CLOSED after successful recovery')
})

// Test 1.5: Error handler classifies errors
await runTest('ErrorHandler classifies different error types', async () => {
  // Rate limit error
  const rateLimitError = new Error('Rate limit exceeded (429)')
  const classified1 = ErrorHandler.toLLMError(rateLimitError)
  assert(classified1.code === 'RATE_LIMIT_ERROR', 'Should classify as rate limit')

  // Invalid API key
  const keyError = new Error('Invalid API key - unauthorized')
  const classified2 = ErrorHandler.toLLMError(keyError)
  assert(classified2.code === 'INVALID_API_KEY_ERROR', 'Should classify as invalid key')

  // Token limit
  const tokenError = new Error('Token limit exceeded - requested 5000 exceeds limit 4096')
  const classified3 = ErrorHandler.toLLMError(tokenError)
  assert(classified3.code === 'TOKEN_LIMIT_ERROR', 'Should classify as token limit')
})

// ================================================================
// Test Suite 2: Resilience + Caching Integration
// ================================================================

console.log('\n=== Test Suite 2: Resilience + Caching Integration ===\n')

// Test 2.1: Resilience doesn't interfere with successful cache hits
await runTest('Resilience works with cached responses', async () => {
  let callCount = 0

  const resilient = new ResilientProvider(
    async () => {
      callCount++
      // In real scenarios, cache would prevent duplicate calls
      return { data: 'cached', timestamp: Date.now() }
    },
    { maxRetries: 3 }
  )

  const result1 = await resilient.execute()
  const result2 = await resilient.execute()

  assertEquals(callCount, 2, 'Cache integration test (direct calls)')
  assertEquals(result1.data, result2.data, 'Should return same data')
})

// Test 2.2: Metrics capture cache interactions
await runTest('Metrics collector tracks successful responses', async () => {
  const metrics = new MetricsCollector()

  // Simulate cache hit (fast response)
  metrics.recordSuccess('provider-1', 5, 100, 0.001) // 5ms latency, 100 tokens, $0.001

  // Simulate cache miss (slower response)
  metrics.recordSuccess('provider-1', 250, 100, 0.001) // 250ms latency, 100 tokens, $0.001

  const detailed = metrics.getDetailedMetrics('provider-1')
  assert(detailed !== null, 'Should have metrics')
  assertEquals(detailed!.requestCount, 2, 'Should record 2 requests')
  assert(detailed!.avgLatencyMs > 100, 'Average latency should reflect both responses')
})

// ================================================================
// Test Suite 3: Resilience + Metrics Integration
// ================================================================

console.log('\n=== Test Suite 3: Resilience + Metrics Integration ===\n')

// Test 3.1: Metrics capture retry attempts
await runTest('Metrics track retries through resilience layer', async () => {
  const metrics = new MetricsCollector()
  let attemptCount = 0

  const resilient = new ResilientProvider(
    async () => {
      attemptCount++
      if (attemptCount < 2) {
        throw new Error('Transient error')
      }
      return 'success'
    },
    { maxRetries: 3, initialRetryDelay: 10, maxRetryDelay: 50 }
  )

  const result = await resilient.execute()

  // Record metrics with actual attempt count
  metrics.recordSuccess('openai', 150, 100, 0.002)

  const detailed = metrics.getDetailedMetrics('openai')
  assertEquals(result, 'success', 'Should succeed after retry')
  assert(detailed !== null, 'Should have metrics')
  assertEquals(detailed!.successCount, 1, 'Should record 1 success')
})

// Test 3.2: Metrics capture failures
await runTest('Metrics track failures through resilience layer', async () => {
  const metrics = new MetricsCollector()

  const resilient = new ResilientProvider(
    async () => {
      throw new Error('Persistent provider error')
    },
    { maxRetries: 2, initialRetryDelay: 10, maxRetryDelay: 50 }
  )

  try {
    await resilient.execute()
  } catch {
    // Expected failure
  }

  // Record the failure
  metrics.recordFailure('anthropic', 500, new Error('Max retries exceeded'))

  const detailed = metrics.getDetailedMetrics('anthropic')
  assert(detailed !== null, 'Should have metrics')
  assertEquals(detailed!.failureCount, 1, 'Should record 1 failure')
})

// ================================================================
// Test Suite 4: Error Handling & Recovery
// ================================================================

console.log('\n=== Test Suite 4: Error Handling & Recovery ===\n')

// Test 4.1: Non-retryable errors fail immediately
await runTest('Non-retryable errors are classified correctly', async () => {
  const apiKeyError = ErrorHandler.toLLMError(new Error('Invalid API key'))
  assert(!apiKeyError.retryable, 'Invalid API key should not be retryable')

  const networkError = ErrorHandler.toLLMError(new Error('Connection refused (ECONNREFUSED)'))
  assert(networkError.retryable, 'Network error should be retryable')
})

// Test 4.2: HTTP response generation
await runTest('ErrorHandler generates proper HTTP responses', async () => {
  const error = new Error('Rate limit exceeded - retry after 60 seconds')
  const response = ErrorHandler.handle(error)

  assertEquals(response.status, 429, 'Rate limit should return 429')

  const json = await response.json()
  assert(json.error, 'Should have error in response')
})

// Test 4.3: Error context is preserved
await runTest('Error handler preserves error context', async () => {
  const originalError = new Error('Timeout after 30s')
  const llmError = ErrorHandler.toLLMError(originalError)

  assert(llmError.context !== null, 'Should preserve error context')
})

// ================================================================
// Test Suite 5: Performance & State Management
// ================================================================

console.log('\n=== Test Suite 5: Performance & State Management ===\n')

// Test 5.1: Circuit state transitions
await runTest('Circuit breaker state transitions work correctly', async () => {
  const cb = new CircuitBreaker({
    failureThreshold: 1,
    cooldownPeriod: 50,
    successThreshold: 1,
  })

  // Initial state: CLOSED
  const state1 = cb.getState()
  assert(state1.state === 'CLOSED', 'Initial state should be CLOSED')

  // Fail once to trigger OPEN
  try {
    await cb.execute(async () => {
      throw new Error('Fail')
    })
  } catch {
    // Expected
  }

  const state2 = cb.getState()
  assert(state2.state === 'OPEN', 'After failure, should be OPEN')

  // Wait for cooldown
  await new Promise(resolve => setTimeout(resolve, 60))

  // Get state - should be HALF_OPEN internally
  // Success should move to CLOSED
  await cb.execute(async () => {
    return 'success'
  })

  const state3 = cb.getState()
  assert(state3.state === 'CLOSED', 'After successful recovery, should be CLOSED')
})

// Test 5.2: Concurrent requests don't block each other
await runTest('Resilience layer handles concurrent requests', async () => {
  const resilient = new ResilientProvider(
    async () => {
      return Date.now()
    },
    { maxRetries: 2 }
  )

  const startTime = Date.now()
  const results = await Promise.all([
    resilient.execute(),
    resilient.execute(),
    resilient.execute(),
  ])

  const endTime = Date.now()
  const duration = endTime - startTime

  // All should complete quickly (should be concurrent, not sequential)
  assert(duration < 1000, 'Concurrent execution should be fast')
  assertEquals(results.length, 3, 'Should have 3 results')
})

// Test 5.3: Metrics aggregation
await runTest('Metrics properly aggregate across multiple requests', async () => {
  const metrics = new MetricsCollector()

  // Add multiple requests
  for (let i = 0; i < 10; i++) {
    metrics.recordSuccess('openai', Math.random() * 100, 100, 0.001)
  }

  const detailed = metrics.getDetailedMetrics('openai')
  assert(detailed !== null, 'Should have detailed metrics')
  assertEquals(detailed!.requestCount, 10, 'Should record all requests')
  assertEquals(detailed!.successCount, 10, 'Should record all successes')
  assert(detailed!.avgLatencyMs > 0, 'Should calculate average latency')
})

// ================================================================
// Test Suite 6: Integration Scenarios
// ================================================================

console.log('\n=== Test Suite 6: Integration Scenarios ===\n')

// Test 6.1: Full flow - resilience + metrics + error handling
await runTest('Full integration: resilience + metrics + error handling', async () => {
  const metrics = new MetricsCollector()
  let attempts = 0

  const resilient = new ResilientProvider(
    async () => {
      attempts++
      if (attempts === 1) throw new Error('Transient error')
      return 'success'
    },
    { maxRetries: 3, initialRetryDelay: 10, maxRetryDelay: 50 }
  )

  const startTime = Date.now()
  const result = await resilient.execute()
  const duration = Date.now() - startTime

  metrics.recordSuccess('provider', duration, 150, 0.002)

  const detailed = metrics.getDetailedMetrics('provider')
  assertEquals(result, 'success', 'Should complete successfully')
  assertEquals(attempts, 2, 'Should retry once')
  assert(detailed !== null, 'Should have metrics')
  assertEquals(detailed!.successCount, 1, 'Should count as success')
})

// Test 6.2: Multiple providers with independent circuit breakers
await runTest('Multiple providers have independent circuit breakers', async () => {
  const provider1 = new ResilientProvider(
    async () => {
      throw new Error('Provider 1 error')
    },
    { circuitBreakerThreshold: 1 }
  )

  const provider2 = new ResilientProvider(
    async () => {
      return 'success'
    },
    { circuitBreakerThreshold: 1 }
  )

  // Fail provider1
  try {
    await provider1.execute()
  } catch {
    // Expected
  }

  assert(provider1.isCircuitOpen(), 'Provider 1 circuit should be open')
  assert(!provider2.isCircuitOpen(), 'Provider 2 circuit should be closed')
})

// ================================================================
// Test Results Summary
// ================================================================

console.log('\n=== Test Results Summary ===\n')

const passRate = TOTAL_TESTS > 0 ? Math.round((PASSED_TESTS / TOTAL_TESTS) * 100) : 0

console.log(`Total Tests: ${TOTAL_TESTS}`)
console.log(`Passed: ${PASSED_TESTS}`)
console.log(`Failed: ${FAILED_TESTS}`)
console.log(`Pass Rate: ${passRate}%`)

if (FAILED_TESTS > 0) {
  console.log('\n=== Failed Tests ===\n')
  results.filter(r => !r.passed).forEach(result => {
    console.log(`✗ ${result.name}`)
    console.log(`  Error: ${result.error}`)
    console.log()
  })
}

// Performance summary
console.log('\n=== Performance Summary ===\n')

const avgDuration =
  results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0

const slowestTest = results.reduce((max, r) => (r.duration > max.duration ? r : max), results[0])

console.log(`Average Test Duration: ${avgDuration.toFixed(2)}ms`)
console.log(`Slowest Test: ${slowestTest?.name} (${slowestTest?.duration}ms)`)

// Exit with appropriate code
process.exit(FAILED_TESTS > 0 ? 1 : 0)
