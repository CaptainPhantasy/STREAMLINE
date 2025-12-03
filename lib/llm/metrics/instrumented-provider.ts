/**
 * Instrumented Provider Wrapper
 *
 * Wraps LLM provider calls with automatic metrics collection.
 * Transparently records success/failure, latency, tokens, and costs.
 *
 * @module lib/llm/metrics/instrumented-provider
 */

import type { MetricsCollector } from './collector'

export interface ProviderResponse {
  text: string
  usage: {
    totalTokens: number
    promptTokens: number
    completionTokens: number
  }
  toolCalls?: any[]
  finishReason?: string
}

/**
 * Cost estimation for different providers/models
 * Prices are per million tokens (input + output combined for simplicity)
 */
const COST_PER_MILLION_TOKENS: Record<string, number> = {
  // OpenAI
  'gpt-4o-mini': 0.375, // $0.15 input + $0.60 output / 2 (avg)
  'gpt-4o': 6.25, // $2.50 input + $10.00 output / 2 (avg)
  'gpt-4-turbo': 15.0, // $10 input + $30 output / 2 (avg)
  'gpt-3.5-turbo': 1.0, // $0.50 input + $1.50 output / 2 (avg)

  // Anthropic
  'claude-haiku-4-5': 3.0, // $0.80 input + $4.00 output / 2 (avg)
  'claude-sonnet-4-5': 9.0, // $3.00 input + $15.00 output / 2 (avg)
  'claude-3-5-sonnet-20241022': 9.0, // Same as sonnet-4-5
  'claude-opus-4': 45.0, // $15.00 input + $75.00 output / 2 (avg)
}

/**
 * Estimates the cost of a request based on tokens used
 */
export function estimateCost(tokens: number, providerModel: string): number {
  // Extract model name from provider-model format (e.g., "openai-gpt4o-mini" -> "gpt-4o-mini")
  const modelName = providerModel
    .replace(/^openai-/, '')
    .replace(/^anthropic-/, '')
    .replace(/gpt4o/g, 'gpt-4o') // Normalize gpt4o -> gpt-4o

  const costPerMillion = COST_PER_MILLION_TOKENS[modelName] || 1.0 // Default $1 per million
  return (tokens / 1_000_000) * costPerMillion
}

/**
 * Wraps a provider function call with metrics collection
 */
export class InstrumentedProvider {
  constructor(
    private readonly providerFn: () => Promise<ProviderResponse>,
    private readonly providerName: string,
    private readonly metrics: MetricsCollector
  ) {}

  /**
   * Executes the provider function and records metrics
   */
  async execute(): Promise<ProviderResponse> {
    const startTime = Date.now()

    try {
      const response = await this.providerFn()
      const latencyMs = Date.now() - startTime
      const cost = estimateCost(response.usage.totalTokens, this.providerName)

      this.metrics.recordSuccess(
        this.providerName,
        latencyMs,
        response.usage.totalTokens,
        cost
      )

      return response
    } catch (error) {
      const latencyMs = Date.now() - startTime
      this.metrics.recordFailure(this.providerName, latencyMs, error as Error)
      throw error
    }
  }
}

/**
 * Helper function to create an instrumented provider execution
 */
export async function executeWithMetrics<T extends ProviderResponse>(
  providerFn: () => Promise<T>,
  providerName: string,
  metrics: MetricsCollector
): Promise<T> {
  const instrumented = new InstrumentedProvider(
    providerFn as () => Promise<ProviderResponse>,
    providerName,
    metrics
  )
  return instrumented.execute() as Promise<T>
}
