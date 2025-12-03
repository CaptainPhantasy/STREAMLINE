/**
 * LLM Metrics Module
 *
 * Exports metrics collection utilities for LLM router monitoring.
 *
 * @module lib/llm/metrics
 */

export {
  MetricsCollector,
  getMetricsCollector,
  resetMetricsCollector,
  type Metrics,
  type DetailedMetrics,
} from './collector'

export {
  InstrumentedProvider,
  executeWithMetrics,
  estimateCost,
  type ProviderResponse,
} from './instrumented-provider'
