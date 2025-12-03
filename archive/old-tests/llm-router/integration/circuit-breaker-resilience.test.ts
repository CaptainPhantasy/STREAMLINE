/**
 * Integration Tests: Circuit Breaker & Resilience
 * Tests circuit breaker integration with provider requests
 */

import {
  CircuitBreaker,
  CircuitBreakerOpenError,
} from '@/lib/llm/resilience/circuit-breaker'
import { MetricsCollector, resetMetricsCollector } from '@/lib/llm/metrics/collector'

describe('Circuit Breaker & Resilience Integration Tests', () => {
  let breaker: CircuitBreaker
  let metrics: MetricsCollector

  beforeEach(() => {
    resetMetricsCollector()
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      cooldownPeriod: 200,
      successThreshold: 2,
    })
    metrics = new MetricsCollector()
  })

  afterEach(() => {
    resetMetricsCollector()
  })

  describe('Provider Request Protection', () => {
    it('should protect provider requests from cascading failures', async () => {
      const maxAttempts = 5
      let successCount = 0
      let circuitBreakerErrors = 0

      const makeRequest = jest.fn(async () => {
        throw new Error('Provider timeout')
      })

      for (let i = 0; i < maxAttempts; i++) {
        try {
          await breaker.execute(makeRequest)
          successCount++
        } catch (error) {
          if (error instanceof CircuitBreakerOpenError) {
            circuitBreakerErrors++
          } else {
            metrics.recordFailure('provider', 100, error as Error)
          }
        }
      }

      // After 3 failures, remaining 2 should be circuit breaker errors
      expect(circuitBreakerErrors).toBe(2)
      expect(makeRequest).toHaveBeenCalledTimes(3)
    })

    it('should fail fast when circuit is open', async () => {
      const makeRequest = jest.fn(async () => {
        throw new Error('Provider error')
      })

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(makeRequest)
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState().state).toBe('OPEN')

      // Now requests should fail immediately without calling makeRequest
      const openErrors: CircuitBreakerOpenError[] = []
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(makeRequest)
        } catch (error) {
          if (error instanceof CircuitBreakerOpenError) {
            openErrors.push(error)
          }
        }
      }

      expect(openErrors.length).toBe(5)
      // makeRequest should still only be called 3 times (during failure phase)
      expect(makeRequest).toHaveBeenCalledTimes(3)
    })
  })

  describe('Provider Metrics During Circuit Breaker States', () => {
    it('should track provider latency during normal operation', async () => {
      const latencies = [100, 110, 105]
      let callCount = 0

      const makeRequest = jest.fn(async () => {
        const latency = latencies[callCount++]
        return new Promise((resolve) => setTimeout(resolve, latency / 1000))
      })

      for (let i = 0; i < 3; i++) {
        const start = Date.now()
        try {
          await breaker.execute(makeRequest)
          const elapsed = Date.now() - start
          metrics.recordSuccess('provider', elapsed, 100, 0.01)
        } catch (e) {
          // Error
        }
      }

      const detailed = metrics.getDetailedMetrics('provider')
      expect(detailed).not.toBeNull()
      expect(detailed!.requestCount).toBe(3)
      expect(detailed!.successRate).toBe(100)
    })

    it('should not record metrics for circuit breaker rejections', async () => {
      const errorFn = jest.fn(async () => {
        throw new Error('Provider error')
      })

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(errorFn)
        } catch (e) {
          metrics.recordFailure('provider', 100, e as Error)
        }
      }

      expect(breaker.getState().state).toBe('OPEN')

      // Try to execute while OPEN
      try {
        await breaker.execute(errorFn)
      } catch (e) {
        // Don't record - this is a circuit breaker rejection, not a provider error
      }

      const openMetrics = metrics.getMetrics('provider')
      expect(openMetrics!.failureCount).toBe(3) // Only initial failures
    })
  })

  describe('Recovery Flow with Metrics', () => {
    it('should track full recovery cycle', async () => {
      const errorFn = jest.fn(async () => {
        throw new Error('Transient error')
      })
      const successFn = jest.fn(async () => 'success')

      // Phase 1: Failures trigger OPEN
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(errorFn)
        } catch (e) {
          metrics.recordFailure('provider', 100, e as Error)
        }
      }

      expect(breaker.getState().state).toBe('OPEN')
      let metrics_data = metrics.getMetrics('provider')
      expect(metrics_data!.failureCount).toBe(3)

      // Phase 2: Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 250))

      // Phase 3: Successful recovery transitions to CLOSED
      try {
        await breaker.execute(successFn)
        metrics.recordSuccess('provider', 50, 100, 0.01)
      } catch (e) {
        // Expected during HALF_OPEN
      }

      try {
        await breaker.execute(successFn)
        metrics.recordSuccess('provider', 50, 100, 0.01)
      } catch (e) {
        // Might fail if still recovering
      }

      // Breaker should eventually close
      expect(breaker.getState().state).toBe('CLOSED')

      // Metrics should show recovery
      metrics_data = metrics.getMetrics('provider')
      expect(metrics_data!.successCount).toBeGreaterThan(0)
    })
  })

  describe('Multi-Provider Circuit Breaking', () => {
    it('should isolate failures by provider', async () => {
      const breaker1 = new CircuitBreaker({ failureThreshold: 2, cooldownPeriod: 200 })
      const breaker2 = new CircuitBreaker({ failureThreshold: 2, cooldownPeriod: 200 })

      const failingFn = jest.fn(async () => {
        throw new Error('Provider error')
      })
      const successFn = jest.fn(async () => 'success')

      // Fail provider 1
      for (let i = 0; i < 2; i++) {
        try {
          await breaker1.execute(failingFn)
        } catch (e) {
          metrics.recordFailure('provider1', 100, e as Error)
        }
      }

      expect(breaker1.getState().state).toBe('OPEN')
      expect(breaker2.getState().state).toBe('CLOSED')

      // Provider 2 should still work
      await breaker2.execute(successFn)
      metrics.recordSuccess('provider2', 50, 100, 0.01)

      // Metrics should show separate tracking
      const provider1Metrics = metrics.getDetailedMetrics('provider1')
      const provider2Metrics = metrics.getDetailedMetrics('provider2')

      expect(provider1Metrics!.failureCount).toBe(2)
      expect(provider2Metrics!.successCount).toBe(1)
    })

    it('should handle fallback provider logic', async () => {
      const primaryBreaker = new CircuitBreaker({ failureThreshold: 1, cooldownPeriod: 200 })
      const fallbackBreaker = new CircuitBreaker({ failureThreshold: 3, cooldownPeriod: 200 })

      const primaryError = jest.fn(async () => {
        throw new Error('Primary provider error')
      })
      const fallbackSuccess = jest.fn(async () => 'fallback success')

      // Primary fails and opens
      try {
        await primaryBreaker.execute(primaryError)
      } catch (e) {
        metrics.recordFailure('primary', 100, e as Error)
      }

      expect(primaryBreaker.getState().state).toBe('OPEN')

      // Use fallback instead
      try {
        await fallbackBreaker.execute(fallbackSuccess)
        metrics.recordSuccess('fallback', 50, 100, 0.01)
      } catch (e) {
        // Should not happen
        fail('Fallback should succeed')
      }

      const aggregated = metrics.getAggregatedMetrics()
      expect(aggregated.successCount).toBe(1)
      expect(aggregated.failureCount).toBe(1)
    })
  })

  describe('Degraded Mode Operation', () => {
    it('should operate in degraded mode when primary is unavailable', async () => {
      const primaryBreaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 500,
      })
      const retryFn = jest.fn(async () => {
        throw new Error('Error')
      })
      const altFn = jest.fn(async () => 'alternative')

      // Primary goes down
      for (let i = 0; i < 1; i++) {
        try {
          await primaryBreaker.execute(retryFn)
        } catch (e) {
          metrics.recordFailure('primary', 100, e as Error)
        }
      }

      // Make requests using alternative strategy
      let altSuccesses = 0
      for (let i = 0; i < 10; i++) {
        if (primaryBreaker.isOpen()) {
          try {
            await altFn()
            altSuccesses++
            metrics.recordSuccess('alternative', 50, 100, 0.01)
          } catch (e) {
            metrics.recordFailure('alternative', 100, e as Error)
          }
        }
      }

      expect(altSuccesses).toBe(10)
      const altMetrics = metrics.getDetailedMetrics('alternative')
      expect(altMetrics!.successRate).toBe(100)
    })
  })

  describe('Health Check with Circuit Breaker', () => {
    it('should perform health check during HALF_OPEN', async () => {
      const unhealthyFn = jest.fn(async () => {
        throw new Error('Service unhealthy')
      })
      const healthyFn = jest.fn(async () => 'healthy')

      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 100,
        successThreshold: 1,
      })

      // Initial failure
      try {
        await breaker.execute(unhealthyFn)
      } catch (e) {
        metrics.recordFailure('service', 100, e as Error)
      }

      expect(breaker.getState().state).toBe('OPEN')

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Health check during HALF_OPEN (attempt successful operation)
      try {
        await breaker.execute(healthyFn)
        metrics.recordSuccess('service', 50, 100, 0.01)
      } catch (e) {
        // If still OPEN, that's OK - it's a failed health check
        metrics.recordFailure('service', 100, e as Error)
      }

      // Should eventually transition to CLOSED if health check succeeds
      const finalState = breaker.getState().state
      expect(['CLOSED', 'HALF_OPEN']).toContain(finalState)
    })
  })

  describe('Timeout Handling with Circuit Breaker', () => {
    it('should treat timeouts as failures', async () => {
      const timeoutFn = jest.fn(async () => {
        return new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 50)
        )
      })

      const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownPeriod: 200 })

      for (let i = 0; i < 2; i++) {
        try {
          const start = Date.now()
          await breaker.execute(timeoutFn)
          const latency = Date.now() - start
          metrics.recordFailure('provider', latency, new Error('Timeout'))
        } catch (e) {
          const latency = 100 // Approximate
          metrics.recordFailure('provider', latency, e as Error)
        }
      }

      expect(breaker.getState().state).toBe('OPEN')

      const serviceMetrics = metrics.getDetailedMetrics('provider')
      expect(serviceMetrics!.failureCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Configuration Validation with Metrics', () => {
    it('should respect custom thresholds', async () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 5,
        cooldownPeriod: 500,
        successThreshold: 3,
      })

      const errorFn = jest.fn(async () => {
        throw new Error('Error')
      })

      // Should not open until 5 failures
      for (let i = 0; i < 4; i++) {
        try {
          await customBreaker.execute(errorFn)
        } catch (e) {
          metrics.recordFailure('provider', 100, e as Error)
        }
      }

      expect(customBreaker.getState().state).toBe('CLOSED')
      expect(customBreaker.getState().failureCount).toBe(4)

      // 5th failure should open
      try {
        await customBreaker.execute(errorFn)
      } catch (e) {
        metrics.recordFailure('provider', 100, e as Error)
      }

      expect(customBreaker.getState().state).toBe('OPEN')
    })
  })

  describe('Concurrent Circuit Breaker Operations', () => {
    it('should handle concurrent requests safely', async () => {
      const successFn = jest.fn(async () => 'success')

      const requests = Array(100)
        .fill(0)
        .map((_, i) =>
          breaker.execute(successFn).then((result) => {
            metrics.recordSuccess('provider', 10 + Math.random() * 50, 100, 0.01)
            return result
          })
        )

      await Promise.allSettled(requests)

      const detailed = metrics.getDetailedMetrics('provider')
      expect(detailed!.requestCount).toBe(100)
      expect(detailed!.successCount).toBe(100)
    })
  })

  describe('Performance: Circuit Breaker with Metrics', () => {
    it('should handle high throughput', async () => {
      const fn = jest.fn(async () => 'success')

      const startTime = Date.now()
      for (let i = 0; i < 1000; i++) {
        try {
          await breaker.execute(fn)
          metrics.recordSuccess('provider', 10, 100, 0.01)
        } catch (e) {
          // Unlikely
        }
      }
      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(5000) // Should complete in reasonable time
      expect(fn).toHaveBeenCalledTimes(1000)
    })
  })
})
