/**
 * LLM Health Checker
 *
 * Monitors health status of LLM providers through periodic health checks.
 * Uses lightweight "ping" requests to verify provider availability.
 *
 * @module lib/llm/health/health-checker
 */

export interface HealthStatus {
  provider: string
  healthy: boolean
  lastCheck: Date
  latencyMs: number | null
  error: string | null
}

export interface HealthCheckConfig {
  checkIntervalMs?: number // Default: 60000 (1 minute)
  timeoutMs?: number // Default: 5000 (5 seconds)
  maxRetries?: number // Default: 1 (no retries on health check)
}

/**
 * Provider health check function interface
 */
export type HealthCheckFn = () => Promise<void>

/**
 * Monitors health of LLM providers with periodic checks
 */
export class HealthChecker {
  private healthStatus = new Map<string, HealthStatus>()
  private checkFunctions = new Map<string, HealthCheckFn>()
  private timer?: NodeJS.Timeout
  private running = false

  private checkIntervalMs: number
  private timeoutMs: number
  private maxRetries: number

  constructor(config?: HealthCheckConfig) {
    this.checkIntervalMs = config?.checkIntervalMs ?? 60_000 // 1 minute
    this.timeoutMs = config?.timeoutMs ?? 5_000 // 5 seconds
    this.maxRetries = config?.maxRetries ?? 1 // No retries by default
  }

  /**
   * Registers a provider with its health check function
   */
  registerProvider(provider: string, checkFn: HealthCheckFn): void {
    this.checkFunctions.set(provider, checkFn)

    // Initialize health status as unknown
    this.healthStatus.set(provider, {
      provider,
      healthy: false,
      lastCheck: new Date(0), // Epoch time to indicate never checked
      latencyMs: null,
      error: 'Not checked yet',
    })
  }

  /**
   * Unregisters a provider
   */
  unregisterProvider(provider: string): void {
    this.checkFunctions.delete(provider)
    this.healthStatus.delete(provider)
  }

  /**
   * Starts periodic health checks
   */
  start(): void {
    if (this.running) {
      console.warn('[HealthChecker] Already running')
      return
    }

    this.running = true
    console.log(`[HealthChecker] Starting health checks (interval: ${this.checkIntervalMs}ms)`)

    // Run initial check immediately
    this.checkAll().catch((error) => {
      console.error('[HealthChecker] Initial check failed:', error)
    })

    // Schedule periodic checks
    this.timer = setInterval(() => {
      this.checkAll().catch((error) => {
        console.error('[HealthChecker] Periodic check failed:', error)
      })
    }, this.checkIntervalMs)
  }

  /**
   * Stops periodic health checks
   */
  stop(): void {
    if (!this.running) {
      return
    }

    this.running = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = undefined
    }

    console.log('[HealthChecker] Stopped health checks')
  }

  /**
   * Checks health of all registered providers
   */
  async checkAll(): Promise<void> {
    const checks = Array.from(this.checkFunctions.entries()).map(([provider, checkFn]) =>
      this.checkProvider(provider, checkFn)
    )

    await Promise.allSettled(checks)
  }

  /**
   * Checks health of a specific provider
   */
  async checkProvider(provider: string, checkFn?: HealthCheckFn): Promise<void> {
    const fn = checkFn || this.checkFunctions.get(provider)
    if (!fn) {
      throw new Error(`Provider ${provider} not registered`)
    }

    const startTime = Date.now()

    try {
      // Execute health check with timeout
      await this.executeWithTimeout(fn, this.timeoutMs)

      const latencyMs = Date.now() - startTime

      this.healthStatus.set(provider, {
        provider,
        healthy: true,
        lastCheck: new Date(),
        latencyMs,
        error: null,
      })

      console.log(`[HealthChecker] ${provider} is healthy (${latencyMs}ms)`)
    } catch (error: any) {
      const latencyMs = Date.now() - startTime

      this.healthStatus.set(provider, {
        provider,
        healthy: false,
        lastCheck: new Date(),
        latencyMs: null,
        error: error.message || 'Health check failed',
      })

      console.error(`[HealthChecker] ${provider} is unhealthy:`, error.message)
    }
  }

  /**
   * Gets health status for a specific provider
   */
  getHealth(provider: string): HealthStatus | null {
    return this.healthStatus.get(provider) || null
  }

  /**
   * Gets health status for all providers
   */
  getAllHealth(): HealthStatus[] {
    return Array.from(this.healthStatus.values())
  }

  /**
   * Gets overall system health (all providers healthy)
   */
  getOverallHealth(): boolean {
    if (this.healthStatus.size === 0) {
      return false // No providers = unhealthy
    }

    for (const status of this.healthStatus.values()) {
      if (!status.healthy) {
        return false
      }
    }

    return true
  }

  /**
   * Gets count of healthy vs unhealthy providers
   */
  getHealthStats(): { total: number; healthy: number; unhealthy: number } {
    const total = this.healthStatus.size
    let healthy = 0

    for (const status of this.healthStatus.values()) {
      if (status.healthy) {
        healthy++
      }
    }

    return {
      total,
      healthy,
      unhealthy: total - healthy,
    }
  }

  /**
   * Checks if the health checker is running
   */
  isRunning(): boolean {
    return this.running
  }

  /**
   * Executes a function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      ),
    ])
  }
}

// Singleton instance
let healthChecker: HealthChecker | null = null

/**
 * Gets the singleton health checker instance
 */
export function getHealthChecker(config?: HealthCheckConfig): HealthChecker {
  if (!healthChecker) {
    healthChecker = new HealthChecker(config)
  }
  return healthChecker
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetHealthChecker(): void {
  if (healthChecker?.isRunning()) {
    healthChecker.stop()
  }
  healthChecker = null
}
