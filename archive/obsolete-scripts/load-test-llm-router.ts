#!/usr/bin/env tsx
/**
 * Load Test: LLM Router
 *
 * Simulates 1000 concurrent requests to measure:
 * - Latency under load
 * - Throughput (requests/second)
 * - Error rates
 * - Circuit breaker behavior
 * - Cache effectiveness
 *
 * Usage:
 *   npm run load-test-llm-router
 */

import { MemoryCache, resetMemoryCache } from '@/lib/llm/cache/memory-cache'
import {
  CircuitBreaker,
} from '@/lib/llm/resilience/circuit-breaker'
import {
  MetricsCollector,
  resetMetricsCollector,
} from '@/lib/llm/metrics/collector'

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function colorize(text: string, color: string): string {
  return `${color}${text}${colors.reset}`
}

interface LoadTestConfig {
  totalRequests: number
  concurrentRequests: number
  failureRate: number // 0-1, chance of failure
  latencyMs: number // Simulated provider latency
  enableCircuitBreaker: boolean
}

interface LoadTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  throughputPerSecond: number
  cacheHitRate: number
  errorRate: number
  duration: number
  circuitBreakerTrips: number
}

async function simulateProviderCall(
  config: LoadTestConfig,
  breakerOpen: () => boolean
): Promise<void> {
  if (breakerOpen()) {
    throw new Error('Circuit breaker is open')
  }

  // Simulate latency
  await new Promise((resolve) => setTimeout(resolve, config.latencyMs))

  // Simulate failure
  if (Math.random() < config.failureRate) {
    throw new Error('Simulated provider error')
  }
}

async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  console.log(colorize('\n╔════════════════════════════════════════╗', colors.cyan))
  console.log(colorize('║     LLM Router Load Test              ║', colors.cyan))
  console.log(colorize('╚════════════════════════════════════════╝\n', colors.cyan))

  console.log('Configuration:')
  console.log(`  Total Requests: ${config.totalRequests}`)
  console.log(`  Concurrent: ${config.concurrentRequests}`)
  console.log(`  Failure Rate: ${(config.failureRate * 100).toFixed(1)}%`)
  console.log(`  Simulated Latency: ${config.latencyMs}ms`)
  console.log(`  Circuit Breaker: ${config.enableCircuitBreaker ? 'Enabled' : 'Disabled'}`)
  console.log()

  resetMemoryCache()
  resetMetricsCollector()

  const cache = new MemoryCache()
  const breaker = config.enableCircuitBreaker
    ? new CircuitBreaker({ failureThreshold: 5, cooldownPeriod: 5000 })
    : null
  const metrics = new MetricsCollector()

  const latencies: number[] = []
  let successCount = 0
  let failureCount = 0
  let circuitBreakerTrips = 0
  let cacheHits = 0

  const startTime = Date.now()

  // Queue for managing concurrent requests
  let activeRequests = 0
  let completedRequests = 0
  const queue: (() => Promise<void>)[] = []

  // Generate all tasks
  for (let i = 0; i < config.totalRequests; i++) {
    queue.push(async () => {
      const requestStart = Date.now()
      const cacheKey = `request:${i % 100}` // 100 unique cache keys

      try {
        // Check cache
        const cached = await cache.get(cacheKey)
        if (cached) {
          cacheHits++
          metrics.recordSuccess('cache', 1, 0, 0)
          return
        }

        // Make request with circuit breaker
        if (breaker) {
          try {
            await breaker.execute(async () =>
              simulateProviderCall(config, () => breaker.isOpen())
            )
          } catch (error: any) {
            if (error.message === 'Circuit breaker is open') {
              circuitBreakerTrips++
              throw error
            }
            throw error
          }
        } else {
          await simulateProviderCall(config, () => false)
        }

        // Cache result
        await cache.set(cacheKey, { success: true }, 60000)

        const latency = Date.now() - requestStart
        latencies.push(latency)
        successCount++
        metrics.recordSuccess('provider', latency, 100, 0.01)
      } catch (error: any) {
        const latency = Date.now() - requestStart
        latencies.push(latency)
        failureCount++
        metrics.recordFailure('provider', latency, error)
      }

      completedRequests++
      const progress = Math.round((completedRequests / config.totalRequests) * 100)
      if (completedRequests % 50 === 0) {
        process.stdout.write(
          `\r${colorize(`Progress: ${progress}% (${completedRequests}/${config.totalRequests})`, colors.blue)}`
        )
      }
    })
  }

  // Process queue with concurrency limit
  while (queue.length > 0 || activeRequests > 0) {
    while (activeRequests < config.concurrentRequests && queue.length > 0) {
      activeRequests++
      const task = queue.shift()!
      task()
        .catch(() => {
          // Errors already counted
        })
        .finally(() => {
          activeRequests--
        })
    }

    // Wait a bit before checking queue again
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  const duration = Date.now() - startTime

  // Sort latencies for percentile calculations
  latencies.sort((a, b) => a - b)

  const result: LoadTestResult = {
    totalRequests: config.totalRequests,
    successfulRequests: successCount,
    failedRequests: failureCount,
    averageLatencyMs: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b) / latencies.length) : 0,
    p50LatencyMs: latencies[Math.floor(latencies.length * 0.5)] || 0,
    p95LatencyMs: latencies[Math.floor(latencies.length * 0.95)] || 0,
    p99LatencyMs: latencies[Math.floor(latencies.length * 0.99)] || 0,
    throughputPerSecond: Math.round((config.totalRequests / duration) * 1000),
    cacheHitRate: cacheHits / config.totalRequests,
    errorRate: failureCount / config.totalRequests,
    duration,
    circuitBreakerTrips,
  }

  console.log('\n\nResults:')
  console.log(
    colorize(
      `  ✓ Successful: ${result.successfulRequests}/${result.totalRequests}`,
      colors.green
    )
  )

  if (result.failedRequests > 0) {
    console.log(
      colorize(`  ✗ Failed: ${result.failedRequests}`, colors.red)
    )
  }

  console.log()
  console.log('Performance Metrics:')
  console.log(`  Average Latency: ${colorize(`${result.averageLatencyMs}ms`, colors.yellow)}`)
  console.log(`  P50 Latency: ${result.p50LatencyMs}ms`)
  console.log(`  P95 Latency: ${result.p95LatencyMs}ms`)
  console.log(`  P99 Latency: ${result.p99LatencyMs}ms`)
  console.log(`  Throughput: ${colorize(`${result.throughputPerSecond} req/s`, colors.yellow)}`)
  console.log()

  console.log('Cache Performance:')
  console.log(
    `  Hit Rate: ${colorize(`${(result.cacheHitRate * 100).toFixed(1)}%`, colors.green)}`
  )
  console.log(
    `  Cache Size: ${Math.min(100, Math.ceil(config.totalRequests / 100))} entries`
  )
  console.log()

  if (config.enableCircuitBreaker) {
    console.log('Circuit Breaker:')
    console.log(`  Trips: ${colorize(`${result.circuitBreakerTrips}`, colors.yellow)}`)
    console.log()
  }

  console.log('Summary:')
  console.log(
    `  Total Duration: ${colorize(`${result.duration}ms`, colors.yellow)}`
  )
  console.log(
    `  Error Rate: ${colorize(`${(result.errorRate * 100).toFixed(1)}%`, result.errorRate > 0.05 ? colors.red : colors.green)}`
  )

  console.log()

  // Validation
  const isValid =
    result.errorRate <= 0.1 && // Max 10% error rate
    result.throughputPerSecond >= 100 // Min 100 req/s
  const validationColor = isValid ? colors.green : colors.red
  const validationText = isValid
    ? '✓ Load test PASSED'
    : '✗ Load test FAILED'

  console.log(colorize(`\n${validationText}\n`, validationColor))

  cache.destroy()
  resetMemoryCache()

  return result
}

async function main() {
  try {
    // Test 1: Normal load
    console.log(colorize('\n=== Test 1: Normal Load ===\n', colors.cyan))
    const result1 = await runLoadTest({
      totalRequests: 1000,
      concurrentRequests: 50,
      failureRate: 0.01, // 1% failure
      latencyMs: 100,
      enableCircuitBreaker: false,
    })

    // Test 2: High concurrency
    console.log(colorize('\n=== Test 2: High Concurrency ===\n', colors.cyan))
    const result2 = await runLoadTest({
      totalRequests: 1000,
      concurrentRequests: 200,
      failureRate: 0.05,
      latencyMs: 50,
      enableCircuitBreaker: true,
    })

    // Test 3: Under stress
    console.log(colorize('\n=== Test 3: Stress Test ===\n', colors.cyan))
    const result3 = await runLoadTest({
      totalRequests: 2000,
      concurrentRequests: 500,
      failureRate: 0.1, // 10% failure
      latencyMs: 150,
      enableCircuitBreaker: true,
    })

    // Summary
    console.log(
      colorize(
        '\n╔════════════════════════════════════════╗',
        colors.cyan
      )
    )
    console.log(
      colorize(
        '║         Load Test Summary              ║',
        colors.cyan
      )
    )
    console.log(
      colorize(
        '╚════════════════════════════════════════╝\n',
        colors.cyan
      )
    )

    console.log('Test Results:')
    console.log(
      `  Normal Load:        ${result1.throughputPerSecond} req/s (${result1.averageLatencyMs}ms avg)`
    )
    console.log(
      `  High Concurrency:   ${result2.throughputPerSecond} req/s (${result2.averageLatencyMs}ms avg)`
    )
    console.log(
      `  Stress Test:        ${result3.throughputPerSecond} req/s (${result3.averageLatencyMs}ms avg)`
    )

    console.log()

    const allPassed = [result1, result2, result3].every(
      (r) => r.errorRate <= 0.1
    )

    if (allPassed) {
      console.log(
        colorize('✓ All load tests PASSED\n', colors.green)
      )
      process.exit(0)
    } else {
      console.log(
        colorize('✗ Some load tests FAILED\n', colors.red)
      )
      process.exit(1)
    }
  } catch (error) {
    console.error(colorize('\n✗ Load test error:', colors.red), error)
    process.exit(1)
  }
}

main()
