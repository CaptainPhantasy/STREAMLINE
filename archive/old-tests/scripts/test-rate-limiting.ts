/**
 * Rate Limiting and Budget Tracking Tests
 *
 * Comprehensive test suite for rate limiting and cost control features.
 * Tests token bucket algorithm, rate limiter enforcement, and budget tracking.
 *
 * Run with: npx ts-node scripts/test-rate-limiting.ts
 *
 * @module scripts/test-rate-limiting
 */

// Use direct relative imports
import { TokenBucket } from '../lib/llm/rate-limiting/token-bucket'
import { RateLimiter } from '../lib/llm/rate-limiting/rate-limiter'
import { BudgetTracker, CostEstimator } from '../lib/llm/cost/budget-tracker'

// Test utilities
const tests: Array<{
  name: string
  fn: () => Promise<void> | void
}> = []

let passed = 0
let failed = 0

function test(name: string, fn: () => Promise<void> | void) {
  tests.push({ name, fn })
}

async function runTests() {
  console.log('\n=== Rate Limiting & Cost Control Test Suite ===\n')

  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`✓ ${name}`)
      passed++
    } catch (error) {
      console.error(`✗ ${name}`)
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`)
      failed++
    }
  }

  console.log(
    `\n=== Results: ${passed} passed, ${failed} failed, ${tests.length} total ===\n`
  )

  process.exit(failed > 0 ? 1 : 0)
}

// ================================================================
// Token Bucket Tests
// ================================================================

test('Token bucket: Should initialize with correct capacity', () => {
  const bucket = new TokenBucket({ capacity: 100, refillRate: 10 })
  const stats = bucket.getStats('account-1')
  if (stats.tokens !== 100) throw new Error(`Expected 100 tokens, got ${stats.tokens}`)
  if (stats.capacity !== 100) throw new Error(`Expected capacity 100, got ${stats.capacity}`)
  bucket.destroy()
})

test('Token bucket: Should consume tokens', () => {
  const bucket = new TokenBucket({ capacity: 100, refillRate: 10 })
  const consumed = bucket.tryConsume('account-1', 30)
  if (!consumed) throw new Error('Failed to consume tokens')
  const stats = bucket.getStats('account-1')
  if (stats.tokens !== 70) throw new Error(`Expected 70 tokens remaining, got ${stats.tokens}`)
  bucket.destroy()
})

test('Token bucket: Should reject when insufficient tokens', () => {
  const bucket = new TokenBucket({ capacity: 10, refillRate: 10 })
  bucket.tryConsume('account-1', 5)
  bucket.tryConsume('account-1', 3)
  bucket.tryConsume('account-1', 2)
  const consumed = bucket.tryConsume('account-1', 1)
  if (consumed) throw new Error('Should have rejected consumption')
  bucket.destroy()
})

test('Token bucket: Should refill over time', async () => {
  const bucket = new TokenBucket({ capacity: 100, refillRate: 10, initialTokens: 0 })
  let stats = bucket.getStats('account-1')
  if (stats.tokens !== 0) throw new Error('Expected 0 tokens initially')

  // Wait 100ms = 1 token at 10 req/sec
  await new Promise(resolve => setTimeout(resolve, 100))

  stats = bucket.getStats('account-1')
  if (stats.tokens < 0.5) throw new Error(`Expected at least 0.5 tokens, got ${stats.tokens}`)
  bucket.destroy()
})

test('Token bucket: Should not exceed capacity', async () => {
  const bucket = new TokenBucket({ capacity: 50, refillRate: 100 })
  bucket.tryConsume('account-1', 50)

  // Wait 500ms for refill at 100 req/sec (should be 50 tokens)
  await new Promise(resolve => setTimeout(resolve, 500))

  const stats = bucket.getStats('account-1')
  if (stats.tokens > 50) throw new Error(`Expected max 50 tokens, got ${stats.tokens}`)
  bucket.destroy()
})

test('Token bucket: Should track multiple accounts independently', () => {
  const bucket = new TokenBucket({ capacity: 100, refillRate: 10 })

  bucket.tryConsume('account-1', 30)
  bucket.tryConsume('account-2', 50)

  const stats1 = bucket.getStats('account-1')
  const stats2 = bucket.getStats('account-2')

  if (stats1.tokens !== 70) throw new Error(`Account 1: expected 70, got ${stats1.tokens}`)
  if (stats2.tokens !== 50) throw new Error(`Account 2: expected 50, got ${stats2.tokens}`)
  bucket.destroy()
})

test('Token bucket: Should reset individual account', () => {
  const bucket = new TokenBucket({ capacity: 100, refillRate: 10 })
  bucket.tryConsume('account-1', 50)
  bucket.reset('account-1')
  const stats = bucket.getStats('account-1')
  if (stats.tokens !== 100) throw new Error(`Expected 100 tokens after reset, got ${stats.tokens}`)
  bucket.destroy()
})

// ================================================================
// Rate Limiter Tests
// ================================================================

test('Rate limiter: Should allow requests within limit', () => {
  const limiter = new RateLimiter({ requestsPerSecond: 10, burstCapacity: 50 })
  for (let i = 0; i < 10; i++) {
    const result = limiter.checkLimit('account-1')
    if (result !== true) throw new Error(`Request ${i + 1} was rejected: ${result.message}`)
  }
  limiter.destroy()
})

test('Rate limiter: Should reject requests exceeding burst capacity', () => {
  const limiter = new RateLimiter({ requestsPerSecond: 10, burstCapacity: 5 })

  // Consume all burst capacity
  for (let i = 0; i < 5; i++) {
    const result = limiter.checkLimit('account-1')
    if (result !== true) throw new Error(`Request ${i + 1} was rejected`)
  }

  // Next request should be rejected
  const result = limiter.checkLimit('account-1')
  if (result === true) throw new Error('Should have been rate limited')
  if (result.status !== 429) throw new Error(`Expected status 429, got ${result.status}`)
  if (result.code !== 'RATE_LIMIT_EXCEEDED') throw new Error(`Expected RATE_LIMIT_EXCEEDED code`)

  limiter.destroy()
})

test('Rate limiter: Should return retry-after time', () => {
  const limiter = new RateLimiter({ requestsPerSecond: 10, burstCapacity: 1 })
  limiter.checkLimit('account-1')

  const result = limiter.checkLimit('account-1')
  if (result === true) throw new Error('Should have been rate limited')
  if (result.retryAfterMs <= 0) throw new Error(`Expected positive retry-after, got ${result.retryAfterMs}`)
  if (result.retryAfterMs > 150) throw new Error(`Retry-after too long: ${result.retryAfterMs}ms`)

  limiter.destroy()
})

test('Rate limiter: Should get status', () => {
  const limiter = new RateLimiter({ requestsPerSecond: 10, burstCapacity: 50 })
  limiter.checkLimit('account-1')
  limiter.checkLimit('account-1')

  const status = limiter.getStatus('account-1')
  if (status.requestsRemaining !== 48) {
    throw new Error(`Expected 48 requests remaining, got ${status.requestsRemaining}`)
  }
  if (status.requestsCapacity !== 50) {
    throw new Error(`Expected capacity 50, got ${status.requestsCapacity}`)
  }

  limiter.destroy()
})

test('Rate limiter: Should reset account', () => {
  const limiter = new RateLimiter({ requestsPerSecond: 10, burstCapacity: 50 })
  limiter.checkLimit('account-1')
  limiter.reset('account-1')

  const status = limiter.getStatus('account-1')
  if (status.requestsRemaining !== 50) {
    throw new Error(`Expected 50 requests after reset, got ${status.requestsRemaining}`)
  }

  limiter.destroy()
})

// ================================================================
// Cost Estimator Tests
// ================================================================

test('Cost estimator: Should estimate GPT-4o cost correctly', () => {
  // GPT-4o: $0.0025/1K input, $0.010/1K output
  const cost = CostEstimator.estimateCost('gpt-4o', 1000, 1000)
  const expected = 0.0025 + 0.010 // $0.0125
  if (Math.abs(cost - expected) > 0.0001) {
    throw new Error(`Expected ~${expected}, got ${cost}`)
  }
})

test('Cost estimator: Should estimate GPT-4o-mini cost correctly', () => {
  // GPT-4o-mini: $0.00015/1K input, $0.0006/1K output
  const cost = CostEstimator.estimateCost('gpt-4o-mini', 1000, 1000)
  const expected = 0.00015 + 0.0006 // $0.00075
  if (Math.abs(cost - expected) > 0.0001) {
    throw new Error(`Expected ~${expected}, got ${cost}`)
  }
})

test('Cost estimator: Should estimate Claude Haiku cost correctly', () => {
  // Claude Haiku: $0.00025/1K input, $0.00125/1K output
  const cost = CostEstimator.estimateCost('claude-haiku-4-5', 1000, 1000)
  const expected = 0.00025 + 0.00125 // $0.0015
  if (Math.abs(cost - expected) > 0.0001) {
    throw new Error(`Expected ~${expected}, got ${cost}`)
  }
})

test('Cost estimator: Should get cost rates', () => {
  const rates = CostEstimator.getCostRates('gpt-4o')
  if (!rates) throw new Error('Failed to get rates')
  if (rates.input !== 0.0025) throw new Error(`Expected input rate 0.0025, got ${rates.input}`)
  if (rates.output !== 0.010) throw new Error(`Expected output rate 0.010, got ${rates.output}`)
})

test('Cost estimator: Should return null for unknown model', () => {
  const rates = CostEstimator.getCostRates('unknown-model')
  if (rates !== null) throw new Error('Expected null for unknown model')
})

// ================================================================
// Budget Tracker Tests
// ================================================================

test('Budget tracker: Should initialize with default budgets', () => {
  const tracker = new BudgetTracker()
  const status = tracker.getStatus('account-1')
  if (status.dailyBudget !== 100) throw new Error(`Expected daily budget 100, got ${status.dailyBudget}`)
  if (status.monthlyBudget !== 1000) throw new Error(`Expected monthly budget 1000, got ${status.monthlyBudget}`)
})

test('Budget tracker: Should track costs', () => {
  const tracker = new BudgetTracker({ dailyBudget: 100, monthlyBudget: 1000 })
  const result = tracker.trackCost('account-1', 25, 'gpt-4o')

  if (typeof result !== 'object' || !('allowed' in result)) {
    throw new Error('Cost tracking should be allowed')
  }

  const status = tracker.getStatus('account-1')
  if (status.dailyUsed !== 25) throw new Error(`Expected daily usage 25, got ${status.dailyUsed}`)
})

test('Budget tracker: Should prevent overspending on daily budget', () => {
  const tracker = new BudgetTracker({ dailyBudget: 50, monthlyBudget: 1000 })
  tracker.trackCost('account-1', 40, 'gpt-4o')

  const result = tracker.trackCost('account-1', 15, 'gpt-4o')
  if (typeof result !== 'object' || 'allowed' in result) {
    throw new Error('Should have prevented overspending')
  }

  if (result.status !== 402) throw new Error(`Expected status 402, got ${result.status}`)
  if (result.code !== 'PAYMENT_REQUIRED') throw new Error(`Expected PAYMENT_REQUIRED code`)
})

test('Budget tracker: Should prevent overspending on monthly budget', () => {
  const tracker = new BudgetTracker({ dailyBudget: 1000, monthlyBudget: 100 })
  tracker.trackCost('account-1', 80, 'gpt-4o')

  const result = tracker.trackCost('account-1', 25, 'gpt-4o')
  if (typeof result !== 'object' || 'allowed' in result) {
    throw new Error('Should have prevented overspending')
  }

  if (result.status !== 402) throw new Error(`Expected status 402, got ${result.status}`)
})

test('Budget tracker: Should alert at 80% threshold', () => {
  const tracker = new BudgetTracker({ dailyBudget: 100, monthlyBudget: 1000, alertThreshold: 80 })
  tracker.trackCost('account-1', 50, 'gpt-4o')
  tracker.trackCost('account-1', 30, 'gpt-4o')

  const status = tracker.getStatus('account-1')
  if (status.alerts.length === 0) throw new Error('Expected budget alert')
  if (!status.alerts[0].includes('80')) throw new Error('Expected 80% alert message')
})

test('Budget tracker: Should track multiple accounts independently', () => {
  const tracker = new BudgetTracker({ dailyBudget: 100, monthlyBudget: 1000 })
  tracker.trackCost('account-1', 30, 'gpt-4o')
  tracker.trackCost('account-2', 50, 'gpt-4o')

  const status1 = tracker.getStatus('account-1')
  const status2 = tracker.getStatus('account-2')

  if (status1.dailyUsed !== 30) throw new Error(`Account 1: expected 30, got ${status1.dailyUsed}`)
  if (status2.dailyUsed !== 50) throw new Error(`Account 2: expected 50, got ${status2.dailyUsed}`)
})

test('Budget tracker: Should reset daily budget at midnight', () => {
  const tracker = new BudgetTracker({ dailyBudget: 100, monthlyBudget: 1000 })
  tracker.trackCost('account-1', 30, 'gpt-4o')

  // Manually manipulate state to simulate day change
  const state = tracker.getState('account-1')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  state.dailyResetDate = yesterday.toISOString().split('T')[0]

  // Next getStatus should reset
  const status = tracker.getStatus('account-1')
  if (status.dailyUsed !== 0) throw new Error('Daily budget should reset at new day')
})

test('Budget tracker: Should reset monthly budget at new month', () => {
  const tracker = new BudgetTracker({ dailyBudget: 1000, monthlyBudget: 100 })
  tracker.trackCost('account-1', 30, 'gpt-4o')

  // Manually manipulate state to simulate month change
  const state = tracker.getState('account-1')
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  state.monthlyResetDate = lastMonth.toISOString().substring(0, 7)

  // Next getStatus should reset
  const status = tracker.getStatus('account-1')
  if (status.monthlyUsed !== 0) throw new Error('Monthly budget should reset at new month')
})

test('Budget tracker: Should handle zero budgets', () => {
  const tracker = new BudgetTracker({ dailyBudget: 0, monthlyBudget: 0 })
  const result = tracker.trackCost('account-1', 0.01, 'gpt-4o')

  if (typeof result !== 'object' || 'allowed' in result) {
    throw new Error('Should prevent spending with 0 budget')
  }
})

// ================================================================
// Integration Tests
// ================================================================

test('Integration: Full request lifecycle with rate limiting and budgets', () => {
  const limiter = new RateLimiter({ requestsPerSecond: 5, burstCapacity: 10 })
  const tracker = new BudgetTracker({ dailyBudget: 100, monthlyBudget: 1000 })

  const accountId = 'account-1'

  // Check rate limit
  const rateLimitResult = limiter.checkLimit(accountId)
  if (rateLimitResult !== true) throw new Error('Rate limit should allow')

  // Check budget
  const cost = CostEstimator.estimateCost('gpt-4o', 100, 50)
  const budgetResult = tracker.trackCost(accountId, cost, 'gpt-4o')
  if (typeof budgetResult !== 'object' || !('allowed' in budgetResult)) {
    throw new Error('Budget should allow')
  }

  // Verify both systems are in sync
  const rateLimitStatus = limiter.getStatus(accountId)
  const budgetStatus = tracker.getStatus(accountId)

  if (rateLimitStatus.requestsRemaining !== 9) throw new Error('Rate limit status incorrect')
  if (budgetStatus.dailyUsed <= 0) throw new Error('Budget not tracking')

  limiter.destroy()
})

// ================================================================
// Performance Tests
// ================================================================

test('Performance: Rate limiter should handle 1000 accounts', () => {
  const limiter = new RateLimiter()
  const start = Date.now()

  for (let i = 0; i < 1000; i++) {
    limiter.checkLimit(`account-${i}`)
  }

  const duration = Date.now() - start
  if (duration > 1000) throw new Error(`Too slow: ${duration}ms for 1000 accounts`)
  console.log(`  (completed in ${duration}ms)`)

  limiter.destroy()
})

test('Performance: Budget tracker should handle 1000 accounts', () => {
  const tracker = new BudgetTracker()
  const start = Date.now()

  for (let i = 0; i < 1000; i++) {
    tracker.trackCost(`account-${i}`, 0.01, 'gpt-4o')
  }

  const duration = Date.now() - start
  if (duration > 1000) throw new Error(`Too slow: ${duration}ms for 1000 accounts`)
  console.log(`  (completed in ${duration}ms)`)
})

// Run all tests
runTests()
