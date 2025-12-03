/**
 * LLM Monitoring Test Suite
 *
 * Comprehensive tests for metrics collection, health checks, and monitoring system.
 *
 * Usage: npx tsx scripts/test-monitoring.ts
 */

import { MetricsCollector, getMetricsCollector, resetMetricsCollector } from '../lib/llm/metrics/collector'
import { estimateCost } from '../lib/llm/metrics/instrumented-provider'
import { HealthChecker, getHealthChecker, resetHealthChecker } from '../lib/llm/health/health-checker'

// Test colors
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function log(message: string) {
  console.log(`  ${message}`)
}

function logSuccess(test: string) {
  console.log(`${GREEN}✓${RESET} ${test}`)
  results.push({ name: test, passed: true })
}

function logFailure(test: string, error: string) {
  console.log(`${RED}✗${RESET} ${test}`)
  console.log(`  ${RED}Error: ${error}${RESET}`)
  results.push({ name: test, passed: false, error })
}

// ================================================================
// Metrics Collector Tests
// ================================================================

async function testMetricsCollectorBasics() {
  console.log('\n📊 Testing Metrics Collector Basics...\n')

  try {
    const collector = new MetricsCollector()

    // Test: Initial state
    const initialMetrics = collector.getAllMetrics()
    if (initialMetrics.size === 0) {
      logSuccess('Collector initializes with empty metrics')
    } else {
      logFailure('Collector initializes with empty metrics', 'Metrics should be empty initially')
    }

    // Test: Record success
    collector.recordSuccess('test-provider', 100, 500, 0.01)
    const metrics = collector.getMetrics('test-provider')

    if (metrics && metrics.requestCount === 1 && metrics.successCount === 1) {
      logSuccess('Records success metrics correctly')
    } else {
      logFailure('Records success metrics correctly', `Expected counts to be 1, got ${metrics?.requestCount}/${metrics?.successCount}`)
    }

    // Test: Record failure
    collector.recordFailure('test-provider', 50, new Error('Test error'))
    const failMetrics = collector.getMetrics('test-provider')

    if (failMetrics && failMetrics.requestCount === 2 && failMetrics.failureCount === 1) {
      logSuccess('Records failure metrics correctly')
    } else {
      logFailure('Records failure metrics correctly', `Expected requestCount=2, failureCount=1, got ${failMetrics?.requestCount}/${failMetrics?.failureCount}`)
    }

    // Test: Detailed metrics calculation
    const detailed = collector.getDetailedMetrics('test-provider')

    if (detailed && detailed.avgLatencyMs === 75) {
      logSuccess('Calculates average latency correctly')
    } else {
      logFailure('Calculates average latency correctly', `Expected 75ms, got ${detailed?.avgLatencyMs}ms`)
    }

    if (detailed && detailed.successRate === 50) {
      logSuccess('Calculates success rate correctly')
    } else {
      logFailure('Calculates success rate correctly', `Expected 50%, got ${detailed?.successRate}%`)
    }

    // Test: Reset metrics
    collector.reset()
    const afterReset = collector.getAllMetrics()

    if (afterReset.size === 0) {
      logSuccess('Resets metrics correctly')
    } else {
      logFailure('Resets metrics correctly', 'Metrics should be empty after reset')
    }
  } catch (error: any) {
    logFailure('Metrics collector test suite', error.message)
  }
}

async function testMetricsCollectorAggregation() {
  console.log('\n📈 Testing Metrics Aggregation...\n')

  try {
    const collector = new MetricsCollector()

    // Add metrics for multiple providers
    collector.recordSuccess('openai-gpt4o-mini', 100, 500, 0.01)
    collector.recordSuccess('openai-gpt4o-mini', 150, 600, 0.012)
    collector.recordSuccess('anthropic-claude-haiku-4-5', 200, 700, 0.015)
    collector.recordFailure('anthropic-claude-haiku-4-5', 50, new Error('Test'))

    // Test: Get all metrics
    const allMetrics = collector.getAllDetailedMetrics()

    if (allMetrics.length === 2) {
      logSuccess('Returns metrics for all providers')
    } else {
      logFailure('Returns metrics for all providers', `Expected 2 providers, got ${allMetrics.length}`)
    }

    // Test: Aggregated metrics
    const aggregated = collector.getAggregatedMetrics()

    if (aggregated.requestCount === 4) {
      logSuccess('Aggregates total request count correctly')
    } else {
      logFailure('Aggregates total request count correctly', `Expected 4, got ${aggregated.requestCount}`)
    }

    if (aggregated.successCount === 3) {
      logSuccess('Aggregates success count correctly')
    } else {
      logFailure('Aggregates success count correctly', `Expected 3, got ${aggregated.successCount}`)
    }

    if (aggregated.failureCount === 1) {
      logSuccess('Aggregates failure count correctly')
    } else {
      logFailure('Aggregates failure count correctly', `Expected 1, got ${aggregated.failureCount}`)
    }

    // Failures don't record tokens, so total should be 1800 (500 + 600 + 700)
    if (aggregated.totalTokens === 1800) {
      logSuccess('Aggregates total tokens correctly')
    } else {
      logFailure('Aggregates total tokens correctly', `Expected 1800, got ${aggregated.totalTokens}`)
    }
  } catch (error: any) {
    logFailure('Metrics aggregation test suite', error.message)
  }
}

// ================================================================
// Cost Estimation Tests
// ================================================================

async function testCostEstimation() {
  console.log('\n💰 Testing Cost Estimation...\n')

  try {
    // Test: GPT-4o-mini cost
    const gpt4oMiniCost = estimateCost(1_000_000, 'openai-gpt4o-mini')
    if (gpt4oMiniCost === 0.375) {
      logSuccess('Estimates GPT-4o-mini cost correctly ($0.375 per 1M tokens)')
    } else {
      logFailure('Estimates GPT-4o-mini cost correctly', `Expected $0.375, got $${gpt4oMiniCost}`)
    }

    // Test: GPT-4o cost
    const gpt4oCost = estimateCost(1_000_000, 'openai-gpt4o')
    if (gpt4oCost === 6.25) {
      logSuccess('Estimates GPT-4o cost correctly ($6.25 per 1M tokens)')
    } else {
      logFailure('Estimates GPT-4o cost correctly', `Expected $6.25, got $${gpt4oCost}`)
    }

    // Test: Claude Haiku cost
    const haikuCost = estimateCost(1_000_000, 'anthropic-claude-haiku-4-5')
    if (haikuCost === 3.0) {
      logSuccess('Estimates Claude Haiku cost correctly ($3.00 per 1M tokens)')
    } else {
      logFailure('Estimates Claude Haiku cost correctly', `Expected $3.00, got $${haikuCost}`)
    }

    // Test: Claude Sonnet cost
    const sonnetCost = estimateCost(1_000_000, 'anthropic-claude-sonnet-4-5')
    if (sonnetCost === 9.0) {
      logSuccess('Estimates Claude Sonnet cost correctly ($9.00 per 1M tokens)')
    } else {
      logFailure('Estimates Claude Sonnet cost correctly', `Expected $9.00, got $${sonnetCost}`)
    }

    // Test: Small token count
    const smallCost = estimateCost(500, 'openai-gpt4o-mini')
    const expectedSmall = 0.0001875
    if (Math.abs(smallCost - expectedSmall) < 0.0000001) {
      logSuccess('Calculates cost for small token counts correctly')
    } else {
      logFailure('Calculates cost for small token counts correctly', `Expected ~${expectedSmall}, got ${smallCost}`)
    }
  } catch (error: any) {
    logFailure('Cost estimation test suite', error.message)
  }
}

// ================================================================
// Health Checker Tests
// ================================================================

async function testHealthCheckerBasics() {
  console.log('\n🏥 Testing Health Checker Basics...\n')

  try {
    const checker = new HealthChecker({ checkIntervalMs: 5000 })

    // Test: Register provider
    let checkCalled = false
    checker.registerProvider('test-provider', async () => {
      checkCalled = true
    })

    const health = checker.getHealth('test-provider')
    if (health && health.provider === 'test-provider') {
      logSuccess('Registers provider correctly')
    } else {
      logFailure('Registers provider correctly', 'Provider not registered')
    }

    // Test: Check provider
    await checker.checkProvider('test-provider')

    if (checkCalled) {
      logSuccess('Executes health check function')
    } else {
      logFailure('Executes health check function', 'Check function was not called')
    }

    const healthAfterCheck = checker.getHealth('test-provider')
    if (healthAfterCheck && healthAfterCheck.healthy) {
      logSuccess('Records successful health check')
    } else {
      logFailure('Records successful health check', 'Provider should be healthy')
    }

    // Test: Failed health check
    checker.registerProvider('failing-provider', async () => {
      throw new Error('Simulated failure')
    })

    await checker.checkProvider('failing-provider')
    const failedHealth = checker.getHealth('failing-provider')

    if (failedHealth && !failedHealth.healthy) {
      logSuccess('Records failed health check')
    } else {
      logFailure('Records failed health check', 'Provider should be unhealthy')
    }

    if (failedHealth && failedHealth.error === 'Simulated failure') {
      logSuccess('Captures error message from failed check')
    } else {
      logFailure('Captures error message from failed check', `Expected 'Simulated failure', got '${failedHealth?.error}'`)
    }

    // Test: Unregister provider
    checker.unregisterProvider('test-provider')
    const afterUnregister = checker.getHealth('test-provider')

    if (!afterUnregister) {
      logSuccess('Unregisters provider correctly')
    } else {
      logFailure('Unregisters provider correctly', 'Provider should be removed')
    }
  } catch (error: any) {
    logFailure('Health checker test suite', error.message)
  }
}

async function testHealthCheckerStats() {
  console.log('\n📊 Testing Health Checker Stats...\n')

  try {
    const checker = new HealthChecker()

    // Register multiple providers
    checker.registerProvider('healthy-1', async () => {})
    checker.registerProvider('healthy-2', async () => {})
    checker.registerProvider('unhealthy-1', async () => { throw new Error('Fail') })

    // Run checks
    await checker.checkAll()

    // Test: Get all health
    const allHealth = checker.getAllHealth()

    if (allHealth.length === 3) {
      logSuccess('Returns health for all providers')
    } else {
      logFailure('Returns health for all providers', `Expected 3 providers, got ${allHealth.length}`)
    }

    // Test: Health stats
    const stats = checker.getHealthStats()

    if (stats.total === 3) {
      logSuccess('Counts total providers correctly')
    } else {
      logFailure('Counts total providers correctly', `Expected 3, got ${stats.total}`)
    }

    if (stats.healthy === 2) {
      logSuccess('Counts healthy providers correctly')
    } else {
      logFailure('Counts healthy providers correctly', `Expected 2, got ${stats.healthy}`)
    }

    if (stats.unhealthy === 1) {
      logSuccess('Counts unhealthy providers correctly')
    } else {
      logFailure('Counts unhealthy providers correctly', `Expected 1, got ${stats.unhealthy}`)
    }

    // Test: Overall health
    const overallHealthy = checker.getOverallHealth()

    if (!overallHealthy) {
      logSuccess('Reports overall health as unhealthy when any provider fails')
    } else {
      logFailure('Reports overall health as unhealthy when any provider fails', 'Should be unhealthy')
    }
  } catch (error: any) {
    logFailure('Health checker stats test suite', error.message)
  }
}

// ================================================================
// Singleton Tests
// ================================================================

async function testSingletons() {
  console.log('\n🔧 Testing Singleton Patterns...\n')

  try {
    // Test: Metrics collector singleton
    resetMetricsCollector()
    const collector1 = getMetricsCollector()
    const collector2 = getMetricsCollector()

    if (collector1 === collector2) {
      logSuccess('MetricsCollector singleton returns same instance')
    } else {
      logFailure('MetricsCollector singleton returns same instance', 'Instances should be identical')
    }

    collector1.recordSuccess('test', 100, 500, 0.01)
    const metrics = collector2.getMetrics('test')

    if (metrics && metrics.requestCount === 1) {
      logSuccess('MetricsCollector singleton shares state')
    } else {
      logFailure('MetricsCollector singleton shares state', 'State should be shared')
    }

    // Test: Health checker singleton
    resetHealthChecker()
    const checker1 = getHealthChecker()
    const checker2 = getHealthChecker()

    if (checker1 === checker2) {
      logSuccess('HealthChecker singleton returns same instance')
    } else {
      logFailure('HealthChecker singleton returns same instance', 'Instances should be identical')
    }
  } catch (error: any) {
    logFailure('Singleton test suite', error.message)
  }
}

// ================================================================
// Main Test Runner
// ================================================================

async function runTests() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 LLM Monitoring Test Suite')
  console.log('='.repeat(60))

  await testMetricsCollectorBasics()
  await testMetricsCollectorAggregation()
  await testCostEstimation()
  await testHealthCheckerBasics()
  await testHealthCheckerStats()
  await testSingletons()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60) + '\n')

  const totalTests = results.length
  const passedTests = results.filter((r) => r.passed).length
  const failedTests = totalTests - passedTests
  const passRate = ((passedTests / totalTests) * 100).toFixed(1)

  console.log(`Total Tests:  ${totalTests}`)
  console.log(`${GREEN}Passed:       ${passedTests}${RESET}`)
  console.log(`${RED}Failed:       ${failedTests}${RESET}`)
  console.log(`Pass Rate:    ${passRate}%\n`)

  if (failedTests > 0) {
    console.log(`${RED}❌ Some tests failed${RESET}\n`)
    process.exit(1)
  } else {
    console.log(`${GREEN}✅ All tests passed!${RESET}\n`)
    process.exit(0)
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite error:', error)
  process.exit(1)
})
