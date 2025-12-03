/**
 * Cost & Budget Module
 *
 * Provides cost tracking and budget enforcement for the LLM router.
 * Estimates costs based on token usage and enforces budget limits.
 *
 * Usage:
 * ```typescript
 * import { getBudgetTracker, CostEstimator } from '@/lib/llm/cost'
 *
 * // Estimate cost
 * const cost = CostEstimator.estimateCost('gpt-4o', 100, 50)
 *
 * // Track cost against budget
 * const tracker = getBudgetTracker()
 * const result = tracker.trackCost(accountId, cost, 'gpt-4o')
 *
 * if (result !== { allowed: true }) {
 *   return NextResponse.json(result, { status: result.status })
 * }
 * ```
 *
 * @module lib/llm/cost
 */

export {
  BudgetTracker,
  CostEstimator,
  getBudgetTracker,
  resetBudgetTracker,
  type BudgetConfig,
  type BudgetStatus,
  type BudgetExceededError,
} from './budget-tracker'
