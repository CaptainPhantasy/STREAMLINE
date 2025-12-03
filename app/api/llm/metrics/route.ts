/**
 * LLM Metrics API Endpoint
 *
 * Provides real-time metrics for LLM provider usage.
 * Includes per-provider metrics and aggregated statistics.
 *
 * GET /api/llm/metrics - Get current metrics
 * POST /api/llm/metrics/reset - Reset metrics (admin only)
 */

import { NextResponse } from 'next/server'
import { getMetricsCollector } from '@/lib/llm/metrics'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/llm/metrics
 *
 * Returns current metrics for all providers
 */
export async function GET(request: Request) {
  try {
    // Check for service role authentication
    const authHeader = request.headers.get('authorization')
    const isServiceRole =
      authHeader?.startsWith('Bearer ') &&
      authHeader.substring(7) === process.env.SUPABASE_SERVICE_ROLE_KEY

    // Authenticate user (skip if service role)
    if (!isServiceRole) {
      const auth = await getAuthenticatedSession(request)
      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check if user is admin
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // Ignore
              }
            },
          },
        }
      )

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', auth.user.id)
        .single()

      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
      }
    }

    // Get metrics
    const collector = getMetricsCollector()
    const providers = collector.getAllDetailedMetrics()
    const aggregated = collector.getAggregatedMetrics()
    const uptimeMs = collector.getUptimeMs()

    // Format for display
    const formatted = providers.map((metrics) => ({
      provider: metrics.provider,
      requests: metrics.requestCount,
      successRate: `${metrics.successRate.toFixed(2)}%`,
      avgLatency: `${metrics.avgLatencyMs}ms`,
      totalTokens: metrics.totalTokens.toLocaleString(),
      totalCost: `$${metrics.totalCost.toFixed(4)}`,
      avgCost: `$${metrics.avgCostPerRequest.toFixed(6)}`,
      errors: metrics.failureCount,
    }))

    // Calculate uptime string
    const uptimeSeconds = Math.floor(uptimeMs / 1000)
    const uptimeMinutes = Math.floor(uptimeSeconds / 60)
    const uptimeHours = Math.floor(uptimeMinutes / 60)
    const uptimeDays = Math.floor(uptimeHours / 24)

    let uptimeString = ''
    if (uptimeDays > 0) {
      uptimeString = `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m`
    } else if (uptimeHours > 0) {
      uptimeString = `${uptimeHours}h ${uptimeMinutes % 60}m`
    } else if (uptimeMinutes > 0) {
      uptimeString = `${uptimeMinutes}m ${uptimeSeconds % 60}s`
    } else {
      uptimeString = `${uptimeSeconds}s`
    }

    return NextResponse.json({
      success: true,
      metrics: formatted,
      aggregated: {
        totalRequests: aggregated.requestCount,
        totalSuccess: aggregated.successCount,
        totalFailures: aggregated.failureCount,
        successRate: `${aggregated.successRate.toFixed(2)}%`,
        avgLatency: `${aggregated.avgLatencyMs}ms`,
        totalTokens: aggregated.totalTokens.toLocaleString(),
        totalCost: `$${aggregated.totalCost.toFixed(4)}`,
        avgCostPerRequest: `$${aggregated.avgCostPerRequest.toFixed(6)}`,
      },
      uptime: uptimeString,
      uptimeMs,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Metrics API] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch metrics',
        code: 'METRICS_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/llm/metrics/reset
 *
 * Resets all metrics (admin only)
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', auth.user.id)
      .single()

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Reset metrics
    const collector = getMetricsCollector()
    collector.reset()

    return NextResponse.json({
      success: true,
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Metrics API] Error resetting metrics:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to reset metrics',
        code: 'METRICS_RESET_ERROR',
      },
      { status: 500 }
    )
  }
}
