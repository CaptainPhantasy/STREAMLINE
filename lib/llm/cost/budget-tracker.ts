/**
 * Budget Tracker
 *
 * Tracks LLM usage costs against daily and monthly budgets.
 * Prevents requests when budget is exceeded.
 * Alerts when approaching budget limits (80% threshold).
 *
 * Cost estimation based on token usage:
 * - OpenAI GPT-4o: $0.0025/1K input, $0.010/1K output
 * - OpenAI GPT-4o-mini: $0.00015/1K input, $0.0006/1K output
 * - Claude 3.5 Sonnet: $0.003/1K input, $0.015/1K output
 * - Claude 3 Haiku: $0.00025/1K input, $0.00125/1K output
 *
 * @module lib/llm/cost/budget-tracker
 */

interface BudgetState {
  dailyCost: number
  monthlyCost: number
  dailyResetDate: string // YYYY-MM-DD
  monthlyResetDate: string // YYYY-MM
  lastAlertTime: number
  alertsSent: number
}

export interface BudgetConfig {
  /** Daily budget in USD */
  dailyBudget?: number
  /** Monthly budget in USD */
  monthlyBudget?: number
  /** Alert threshold as percentage (default: 80) */
  alertThreshold?: number
}

export interface BudgetStatus {
  dailyUsed: number
  dailyBudget: number | null
  dailyPercentage: number
  monthlyUsed: number
  monthlyBudget: number | null
  monthlyPercentage: number
  alerts: string[]
}

export interface BudgetExceededError {
  status: 402
  code: 'PAYMENT_REQUIRED'
  message: string
  budgetStatus: BudgetStatus
}

/**
 * Cost Estimator
 *
 * Estimates costs based on token usage and model
 */
export class CostEstimator {
  private static readonly COST_RATES: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.0025, output: 0.010 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-sonnet-4-5': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-haiku-4-5': { input: 0.00025, output: 0.00125 },
  }

  /**
   * Estimate cost for a request
   *
   * @param model - Model name
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @returns Estimated cost in USD
   */
  static estimateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const rates = this.COST_RATES[model]

    if (!rates) {
      // Default fallback: assume $0.002 per 1K tokens average
      const totalTokens = (inputTokens + outputTokens) / 1000
      return totalTokens * 0.002
    }

    const inputCost = (inputTokens / 1000) * rates.input
    const outputCost = (outputTokens / 1000) * rates.output

    return inputCost + outputCost
  }

  /**
   * Get cost rates for a model
   *
   * @param model - Model name
   * @returns Cost rates or null if not found
   */
  static getCostRates(model: string): { input: number; output: number } | null {
    return this.COST_RATES[model] ?? null
  }
}

/**
 * Budget Tracker
 *
 * Tracks usage costs against budgets and enforces limits
 */
export class BudgetTracker {
  private budgets: Map<string, BudgetState> = new Map()
  private config: Required<BudgetConfig>

  constructor(config: BudgetConfig = {}) {
    this.config = {
      dailyBudget: config.dailyBudget ?? 100, // $100/day default
      monthlyBudget: config.monthlyBudget ?? 1000, // $1000/month default
      alertThreshold: config.alertThreshold ?? 80,
    }
  }

  /**
   * Track a cost against an account's budget
   *
   * @param accountId - Account identifier
   * @param cost - Cost in USD
   * @param model - Model name (for logging)
   * @returns Budget status and any validation errors
   */
  trackCost(
    accountId: string,
    cost: number,
    model: string
  ): { allowed: true } | BudgetExceededError {
    const state = this.getOrCreateBudget(accountId)
    const today = this.getTodayString()
    const month = this.getMonthString()

    // Reset daily budget if new day
    if (state.dailyResetDate !== today) {
      state.dailyResetDate = today
      state.dailyCost = 0
      state.lastAlertTime = 0
      state.alertsSent = 0
    }

    // Reset monthly budget if new month
    if (state.monthlyResetDate !== month) {
      state.monthlyResetDate = month
      state.monthlyCost = 0
    }

    // Check if adding this cost would exceed limits
    const newDailyCost = state.dailyCost + cost
    const newMonthlyCost = state.monthlyCost + cost

    // Check daily budget
    if (
      this.config.dailyBudget !== undefined &&
      this.config.dailyBudget !== null &&
      newDailyCost > this.config.dailyBudget
    ) {
      return {
        status: 402,
        code: 'PAYMENT_REQUIRED',
        message: `Daily budget exceeded. Current: $${state.dailyCost.toFixed(2)}, Request: $${cost.toFixed(2)}, Limit: $${this.config.dailyBudget.toFixed(2)}`,
        budgetStatus: this.getStatus(accountId),
      }
    }

    // Check monthly budget
    if (
      this.config.monthlyBudget !== undefined &&
      this.config.monthlyBudget !== null &&
      newMonthlyCost > this.config.monthlyBudget
    ) {
      return {
        status: 402,
        code: 'PAYMENT_REQUIRED',
        message: `Monthly budget exceeded. Current: $${state.monthlyCost.toFixed(2)}, Request: $${cost.toFixed(2)}, Limit: $${this.config.monthlyBudget.toFixed(2)}`,
        budgetStatus: this.getStatus(accountId),
      }
    }

    // Add cost to tracking
    state.dailyCost = newDailyCost
    state.monthlyCost = newMonthlyCost

    return { allowed: true }
  }

  /**
   * Get budget status for an account
   *
   * @param accountId - Account identifier
   * @returns Budget status including usage and alerts
   */
  getStatus(accountId: string): BudgetStatus {
    const state = this.getOrCreateBudget(accountId)
    const today = this.getTodayString()
    const month = this.getMonthString()

    // Reset daily budget if new day
    if (state.dailyResetDate !== today) {
      state.dailyResetDate = today
      state.dailyCost = 0
      state.lastAlertTime = 0
      state.alertsSent = 0
    }

    // Reset monthly budget if new month
    if (state.monthlyResetDate !== month) {
      state.monthlyResetDate = month
      state.monthlyCost = 0
    }

    const dailyPercentage =
      this.config.dailyBudget !== undefined && this.config.dailyBudget !== null && this.config.dailyBudget > 0
        ? (state.dailyCost / this.config.dailyBudget) * 100
        : 0

    const monthlyPercentage =
      this.config.monthlyBudget !== undefined && this.config.monthlyBudget !== null && this.config.monthlyBudget > 0
        ? (state.monthlyCost / this.config.monthlyBudget) * 100
        : 0

    const alerts: string[] = []

    // Check for alerts
    if (
      this.config.dailyBudget !== undefined &&
      this.config.dailyBudget !== null &&
      this.config.dailyBudget > 0 &&
      dailyPercentage >= this.config.alertThreshold
    ) {
      alerts.push(
        `Daily budget at ${dailyPercentage.toFixed(1)}% ($${state.dailyCost.toFixed(2)}/$${this.config.dailyBudget.toFixed(2)})`
      )
    }

    if (
      this.config.monthlyBudget !== undefined &&
      this.config.monthlyBudget !== null &&
      this.config.monthlyBudget > 0 &&
      monthlyPercentage >= this.config.alertThreshold
    ) {
      alerts.push(
        `Monthly budget at ${monthlyPercentage.toFixed(1)}% ($${state.monthlyCost.toFixed(2)}/$${this.config.monthlyBudget.toFixed(2)})`
      )
    }

    return {
      dailyUsed: state.dailyCost,
      dailyBudget: this.config.dailyBudget,
      dailyPercentage,
      monthlyUsed: state.monthlyCost,
      monthlyBudget: this.config.monthlyBudget,
      monthlyPercentage,
      alerts,
    }
  }

  /**
   * Reset budget for an account (useful for testing)
   *
   * @param accountId - Account identifier
   */
  reset(accountId: string): void {
    this.budgets.delete(accountId)
  }

  /**
   * Reset all budgets
   */
  resetAll(): void {
    this.budgets.clear()
  }

  /**
   * Get raw budget state for testing
   */
  getState(accountId: string): BudgetState {
    return this.getOrCreateBudget(accountId)
  }

  /**
   * Get or create budget for an account
   */
  private getOrCreateBudget(accountId: string): BudgetState {
    if (!this.budgets.has(accountId)) {
      const today = this.getTodayString()
      const month = this.getMonthString()

      this.budgets.set(accountId, {
        dailyCost: 0,
        monthlyCost: 0,
        dailyResetDate: today,
        monthlyResetDate: month,
        lastAlertTime: 0,
        alertsSent: 0,
      })
    }

    return this.budgets.get(accountId)!
  }

  /**
   * Get today's date as YYYY-MM-DD
   */
  private getTodayString(): string {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  /**
   * Get current month as YYYY-MM
   */
  private getMonthString(): string {
    const now = new Date()
    return now.toISOString().substring(0, 7)
  }
}

// Singleton instance
let budgetTracker: BudgetTracker | null = null

/**
 * Get or create the global budget tracker instance
 *
 * @param config - Optional configuration for budget tracker
 * @returns The global budget tracker instance
 */
export function getBudgetTracker(config?: BudgetConfig): BudgetTracker {
  if (!budgetTracker) {
    budgetTracker = new BudgetTracker(config)
  }
  return budgetTracker
}

/**
 * Reset the global budget tracker
 */
export function resetBudgetTracker(): void {
  if (budgetTracker) {
    budgetTracker = null
  }
}
