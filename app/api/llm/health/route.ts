/**
 * LLM Health Check API Endpoint
 *
 * Provides health status for all LLM providers.
 * Public endpoint for monitoring and load balancers.
 *
 * GET /api/llm/health - Get health status for all providers
 */

import { NextResponse } from 'next/server'
import { getHealthChecker } from '@/lib/llm/health'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Creates health check functions for providers
 * These are lightweight "ping" requests to verify provider availability
 */
function createHealthCheckFunctions() {
  return {
    'openai-gpt4o-mini': async () => {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) throw new Error('OpenAI API key not configured')

      const model = openai('gpt-4o-mini', { apiKey })
      await generateText({
        model,
        prompt: 'ping',
        maxTokens: 5,
        temperature: 0,
      })
    },

    'openai-gpt4o': async () => {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) throw new Error('OpenAI API key not configured')

      const model = openai('gpt-4o', { apiKey })
      await generateText({
        model,
        prompt: 'ping',
        maxTokens: 5,
        temperature: 0,
      })
    },

    'anthropic-claude-haiku-4-5': async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('Anthropic API key not configured')

      const model = anthropic('claude-haiku-4-5', { apiKey })
      await generateText({
        model,
        prompt: 'ping',
        maxTokens: 5,
        temperature: 0,
      })
    },

    'anthropic-claude-sonnet-4-5': async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('Anthropic API key not configured')

      const model = anthropic('claude-sonnet-4-5', { apiKey })
      await generateText({
        model,
        prompt: 'ping',
        maxTokens: 5,
        temperature: 0,
      })
    },

    'anthropic-claude-opus-4-5': async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('Anthropic API key not configured')

      const model = anthropic('claude-opus-4-5', { apiKey })
      await generateText({
        model,
        prompt: 'ping',
        maxTokens: 5,
        temperature: 0,
      })
    },
  }
}

/**
 * Initializes health checker with providers
 * This is called lazily on first health check request
 */
function initializeHealthChecker() {
  const checker = getHealthChecker({
    checkIntervalMs: 60_000, // 1 minute
    timeoutMs: 5_000, // 5 seconds
  })

  // Register all providers
  const healthCheckFns = createHealthCheckFunctions()
  for (const [provider, checkFn] of Object.entries(healthCheckFns)) {
    checker.registerProvider(provider, checkFn)
  }

  // Start periodic checks if not already running
  if (!checker.isRunning()) {
    checker.start()
  }

  return checker
}

/**
 * GET /api/llm/health
 *
 * Returns health status for all providers
 * No authentication required (public endpoint for monitoring)
 */
export async function GET(request: Request) {
  try {
    // Initialize health checker
    const checker = initializeHealthChecker()

    // Get all health statuses
    const allHealth = checker.getAllHealth()
    const overallHealthy = checker.getOverallHealth()
    const stats = checker.getHealthStats()

    // Format response
    const providers = allHealth.map((status) => ({
      provider: status.provider,
      healthy: status.healthy,
      latency: status.latencyMs ? `${status.latencyMs}ms` : null,
      lastCheck: status.lastCheck.toISOString(),
      error: status.error,
    }))

    return NextResponse.json(
      {
        healthy: overallHealthy,
        providers,
        stats: {
          total: stats.total,
          healthy: stats.healthy,
          unhealthy: stats.unhealthy,
          healthPercentage: stats.total > 0 ? `${((stats.healthy / stats.total) * 100).toFixed(1)}%` : '0%',
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: overallHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    console.error('[Health API] Error:', error)
    return NextResponse.json(
      {
        healthy: false,
        error: error.message || 'Health check failed',
        code: 'HEALTH_CHECK_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
