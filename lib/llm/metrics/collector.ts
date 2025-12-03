/**
 * LLM Metrics Collector
 *
 * Collects and aggregates metrics for LLM provider requests.
 * Tracks success/failure rates, latency, token usage, and costs.
 *
 * @module lib/llm/metrics/collector
 */

export interface Metrics {
  requestCount: number
  successCount: number
  failureCount: number
  totalLatencyMs: number
  totalTokens: number
  totalCost: number
}

export interface DetailedMetrics extends Metrics {
  provider: string
  avgLatencyMs: number
  successRate: number
  avgTokensPerRequest: number
  avgCostPerRequest: number
  lastUpdated: Date
}

/**
 * Collects and aggregates metrics for LLM providers
 */
export class MetricsCollector {
  private metrics = new Map<string, Metrics>()
  private startTime = Date.now()

  /**
   * Records a successful LLM request
   */
  recordSuccess(provider: string, latencyMs: number, tokens: number, cost: number): void {
    const metrics = this.getOrCreate(provider)
    metrics.requestCount++
    metrics.successCount++
    metrics.totalLatencyMs += latencyMs
    metrics.totalTokens += tokens
    metrics.totalCost += cost
  }

  /**
   * Records a failed LLM request
   */
  recordFailure(provider: string, latencyMs: number, error: Error): void {
    const metrics = this.getOrCreate(provider)
    metrics.requestCount++
    metrics.failureCount++
    metrics.totalLatencyMs += latencyMs
  }

  /**
   * Gets metrics for a specific provider
   */
  getMetrics(provider: string): Metrics | null {
    return this.metrics.get(provider) || null
  }

  /**
   * Gets detailed metrics with calculated fields
   */
  getDetailedMetrics(provider: string): DetailedMetrics | null {
    const metrics = this.metrics.get(provider)
    if (!metrics) return null

    return {
      ...metrics,
      provider,
      avgLatencyMs: metrics.requestCount > 0
        ? Math.round(metrics.totalLatencyMs / metrics.requestCount)
        : 0,
      successRate: metrics.requestCount > 0
        ? (metrics.successCount / metrics.requestCount) * 100
        : 0,
      avgTokensPerRequest: metrics.requestCount > 0
        ? Math.round(metrics.totalTokens / metrics.requestCount)
        : 0,
      avgCostPerRequest: metrics.requestCount > 0
        ? metrics.totalCost / metrics.requestCount
        : 0,
      lastUpdated: new Date(),
    }
  }

  /**
   * Gets all metrics across all providers
   */
  getAllMetrics(): Map<string, Metrics> {
    return new Map(this.metrics)
  }

  /**
   * Gets all detailed metrics across all providers
   */
  getAllDetailedMetrics(): DetailedMetrics[] {
    const detailed: DetailedMetrics[] = []
    for (const [provider] of this.metrics) {
      const detailedMetric = this.getDetailedMetrics(provider)
      if (detailedMetric) {
        detailed.push(detailedMetric)
      }
    }
    return detailed
  }

  /**
   * Gets aggregated metrics across all providers
   */
  getAggregatedMetrics(): DetailedMetrics {
    let totalRequests = 0
    let totalSuccess = 0
    let totalFailure = 0
    let totalLatency = 0
    let totalTokens = 0
    let totalCost = 0

    for (const metrics of this.metrics.values()) {
      totalRequests += metrics.requestCount
      totalSuccess += metrics.successCount
      totalFailure += metrics.failureCount
      totalLatency += metrics.totalLatencyMs
      totalTokens += metrics.totalTokens
      totalCost += metrics.totalCost
    }

    return {
      provider: 'all',
      requestCount: totalRequests,
      successCount: totalSuccess,
      failureCount: totalFailure,
      totalLatencyMs: totalLatency,
      totalTokens: totalTokens,
      totalCost: totalCost,
      avgLatencyMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
      successRate: totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0,
      avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      lastUpdated: new Date(),
    }
  }

  /**
   * Gets uptime in milliseconds
   */
  getUptimeMs(): number {
    return Date.now() - this.startTime
  }

  /**
   * Resets all metrics
   */
  reset(): void {
    this.metrics.clear()
    this.startTime = Date.now()
  }

  /**
   * Resets metrics for a specific provider
   */
  resetProvider(provider: string): void {
    this.metrics.delete(provider)
  }

  /**
   * Gets or creates metrics for a provider
   */
  private getOrCreate(provider: string): Metrics {
    if (!this.metrics.has(provider)) {
      this.metrics.set(provider, {
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        totalLatencyMs: 0,
        totalTokens: 0,
        totalCost: 0,
      })
    }
    return this.metrics.get(provider)!
  }

  /**
   * Exports metrics to JSON
   */
  toJSON(): Record<string, any> {
    return {
      providers: this.getAllDetailedMetrics(),
      aggregated: this.getAggregatedMetrics(),
      uptimeMs: this.getUptimeMs(),
      timestamp: new Date().toISOString(),
    }
  }
}

// Singleton instance
let metricsCollector: MetricsCollector | null = null

/**
 * Gets the singleton metrics collector instance
 */
export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector()
  }
  return metricsCollector
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetMetricsCollector(): void {
  metricsCollector = null
}
