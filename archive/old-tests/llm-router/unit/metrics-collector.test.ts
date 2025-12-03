/**
 * Unit Tests: Metrics Collector
 * Tests for LLM metrics collection and aggregation
 */

import {
  MetricsCollector,
  getMetricsCollector,
  resetMetricsCollector,
  Metrics,
  DetailedMetrics,
} from '@/lib/llm/metrics/collector'

describe('Metrics Collector - Unit Tests', () => {
  let collector: MetricsCollector

  beforeEach(() => {
    resetMetricsCollector()
    collector = new MetricsCollector()
  })

  afterEach(() => {
    resetMetricsCollector()
  })

  describe('Recording Success', () => {
    it('should record a single success', () => {
      collector.recordSuccess('openai', 150, 100, 0.01)

      const metrics = collector.getMetrics('openai')
      expect(metrics).not.toBeNull()
      expect(metrics!.requestCount).toBe(1)
      expect(metrics!.successCount).toBe(1)
      expect(metrics!.failureCount).toBe(0)
      expect(metrics!.totalLatencyMs).toBe(150)
      expect(metrics!.totalTokens).toBe(100)
      expect(metrics!.totalCost).toBe(0.01)
    })

    it('should accumulate multiple successes', () => {
      collector.recordSuccess('openai', 150, 100, 0.01)
      collector.recordSuccess('openai', 200, 120, 0.015)
      collector.recordSuccess('openai', 100, 80, 0.008)

      const metrics = collector.getMetrics('openai')
      expect(metrics!.requestCount).toBe(3)
      expect(metrics!.successCount).toBe(3)
      expect(metrics!.totalLatencyMs).toBe(450)
      expect(metrics!.totalTokens).toBe(300)
      expect(metrics!.totalCost).toBeCloseTo(0.033, 3)
    })

    it('should track different providers separately', () => {
      collector.recordSuccess('openai', 150, 100, 0.01)
      collector.recordSuccess('anthropic', 200, 150, 0.02)

      const openaiMetrics = collector.getMetrics('openai')
      const anthropicMetrics = collector.getMetrics('anthropic')

      expect(openaiMetrics!.requestCount).toBe(1)
      expect(anthropicMetrics!.requestCount).toBe(1)
      expect(openaiMetrics!.totalTokens).toBe(100)
      expect(anthropicMetrics!.totalTokens).toBe(150)
    })
  })

  describe('Recording Failure', () => {
    it('should record a single failure', () => {
      collector.recordFailure('openai', 150, new Error('Test error'))

      const metrics = collector.getMetrics('openai')
      expect(metrics).not.toBeNull()
      expect(metrics!.requestCount).toBe(1)
      expect(metrics!.successCount).toBe(0)
      expect(metrics!.failureCount).toBe(1)
      expect(metrics!.totalLatencyMs).toBe(150)
    })

    it('should accumulate failures', () => {
      collector.recordFailure('openai', 150, new Error('Error 1'))
      collector.recordFailure('openai', 200, new Error('Error 2'))

      const metrics = collector.getMetrics('openai')
      expect(metrics!.failureCount).toBe(2)
      expect(metrics!.requestCount).toBe(2)
    })

    it('should track mixed success and failure', () => {
      collector.recordSuccess('openai', 150, 100, 0.01)
      collector.recordFailure('openai', 200, new Error('Test error'))
      collector.recordSuccess('openai', 100, 80, 0.008)

      const metrics = collector.getMetrics('openai')
      expect(metrics!.requestCount).toBe(3)
      expect(metrics!.successCount).toBe(2)
      expect(metrics!.failureCount).toBe(1)
    })
  })

  describe('Detailed Metrics', () => {
    it('should calculate average latency', () => {
      collector.recordSuccess('openai', 100, 50, 0.005)
      collector.recordSuccess('openai', 200, 100, 0.01)
      collector.recordSuccess('openai', 300, 150, 0.015)

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.avgLatencyMs).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should calculate success rate', () => {
      collector.recordSuccess('openai', 100, 50, 0.005)
      collector.recordSuccess('openai', 100, 50, 0.005)
      collector.recordFailure('openai', 100, new Error('Test'))

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.successRate).toBeCloseTo(66.67, 1)
    })

    it('should calculate average tokens', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('openai', 100, 200, 0.02)
      collector.recordSuccess('openai', 100, 300, 0.03)

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.avgTokensPerRequest).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should calculate average cost', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('openai', 100, 100, 0.02)
      collector.recordSuccess('openai', 100, 100, 0.03)

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.avgCostPerRequest).toBeCloseTo(0.02, 3)
    })

    it('should return null for non-existent provider', () => {
      const detailed = collector.getDetailedMetrics('nonexistent')
      expect(detailed).toBeNull()
    })
  })

  describe('Aggregated Metrics', () => {
    it('should aggregate metrics across providers', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('anthropic', 200, 150, 0.02)

      const aggregated = collector.getAggregatedMetrics()
      expect(aggregated.provider).toBe('all')
      expect(aggregated.requestCount).toBe(3)
      expect(aggregated.successCount).toBe(3)
      expect(aggregated.totalTokens).toBe(350)
    })

    it('should calculate aggregated success rate', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordFailure('anthropic', 100, new Error('Error'))

      const aggregated = collector.getAggregatedMetrics()
      expect(aggregated.successRate).toBeCloseTo(66.67, 1)
    })

    it('should calculate aggregated average latency', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('anthropic', 200, 100, 0.01)

      const aggregated = collector.getAggregatedMetrics()
      expect(aggregated.avgLatencyMs).toBe(150)
    })
  })

  describe('Get All Metrics', () => {
    it('should return metrics for all providers', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('anthropic', 200, 150, 0.02)
      collector.recordSuccess('google', 150, 120, 0.015)

      const allMetrics = collector.getAllMetrics()
      expect(allMetrics.size).toBe(3)
      expect(allMetrics.has('openai')).toBe(true)
      expect(allMetrics.has('anthropic')).toBe(true)
      expect(allMetrics.has('google')).toBe(true)
    })

    it('should return copy of metrics map', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)

      const allMetrics = collector.getAllMetrics()
      allMetrics.set('test', {
        requestCount: 1,
        successCount: 1,
        failureCount: 0,
        totalLatencyMs: 100,
        totalTokens: 100,
        totalCost: 0.01,
      })

      // Original should not be modified
      expect(collector.getAllMetrics().has('test')).toBe(false)
    })
  })

  describe('Get All Detailed Metrics', () => {
    it('should return detailed metrics for all providers', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('anthropic', 200, 150, 0.02)

      const allDetailed = collector.getAllDetailedMetrics()
      expect(allDetailed.length).toBe(2)
      expect(allDetailed.some((m) => m.provider === 'openai')).toBe(true)
      expect(allDetailed.some((m) => m.provider === 'anthropic')).toBe(true)
    })

    it('should calculate all detailed metrics', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('openai', 200, 200, 0.02)

      const allDetailed = collector.getAllDetailedMetrics()
      const openaiMetrics = allDetailed.find((m) => m.provider === 'openai')

      expect(openaiMetrics!.avgLatencyMs).toBe(150)
      expect(openaiMetrics!.avgCostPerRequest).toBeCloseTo(0.015, 3)
    })
  })

  describe('Uptime Tracking', () => {
    it('should track uptime', async () => {
      const startUptime = collector.getUptimeMs()

      await new Promise((resolve) => setTimeout(resolve, 50))

      const endUptime = collector.getUptimeMs()
      expect(endUptime).toBeGreaterThan(startUptime)
      expect(endUptime - startUptime).toBeGreaterThanOrEqual(50)
    })

    it('should reset uptime on reset', () => {
      const startUptime = collector.getUptimeMs()

      collector.reset()

      const newUptime = collector.getUptimeMs()
      expect(newUptime).toBeLessThan(startUptime)
    })
  })

  describe('Reset Operations', () => {
    it('should reset all metrics', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('anthropic', 200, 150, 0.02)

      collector.reset()

      expect(collector.getMetrics('openai')).toBeNull()
      expect(collector.getMetrics('anthropic')).toBeNull()
    })

    it('should reset specific provider metrics', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('anthropic', 200, 150, 0.02)

      collector.resetProvider('openai')

      expect(collector.getMetrics('openai')).toBeNull()
      expect(collector.getMetrics('anthropic')).not.toBeNull()
    })
  })

  describe('JSON Export', () => {
    it('should export metrics to JSON', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('anthropic', 200, 150, 0.02)

      const json = collector.toJSON()

      expect(json.providers).toBeDefined()
      expect(json.aggregated).toBeDefined()
      expect(json.uptimeMs).toBeDefined()
      expect(json.timestamp).toBeDefined()
      expect(Array.isArray(json.providers)).toBe(true)
      expect(json.providers.length).toBe(2)
    })

    it('should include all relevant fields in JSON', () => {
      collector.recordSuccess('openai', 100, 100, 0.01)

      const json = collector.toJSON()
      const openaiMetrics = json.providers.find((m) => m.provider === 'openai')

      expect(openaiMetrics).toBeDefined()
      expect(openaiMetrics.requestCount).toBeDefined()
      expect(openaiMetrics.avgLatencyMs).toBeDefined()
      expect(openaiMetrics.successRate).toBeDefined()
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance from getMetricsCollector', () => {
      const collector1 = getMetricsCollector()
      const collector2 = getMetricsCollector()

      expect(collector1).toBe(collector2)
    })

    it('should create new instance after reset', () => {
      const collector1 = getMetricsCollector()
      collector1.recordSuccess('openai', 100, 100, 0.01)

      resetMetricsCollector()

      const collector2 = getMetricsCollector()
      expect(collector2.getMetrics('openai')).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero latency', () => {
      collector.recordSuccess('openai', 0, 100, 0.01)

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.avgLatencyMs).toBe(0)
    })

    it('should handle zero tokens', () => {
      collector.recordSuccess('openai', 100, 0, 0.01)

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.avgTokensPerRequest).toBe(0)
    })

    it('should handle zero cost', () => {
      collector.recordSuccess('openai', 100, 100, 0)

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.avgCostPerRequest).toBe(0)
    })

    it('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER
      collector.recordSuccess('openai', largeNumber, largeNumber, largeNumber)

      const metrics = collector.getMetrics('openai')
      expect(metrics!.totalLatencyMs).toBe(largeNumber)
    })

    it('should handle many providers', () => {
      for (let i = 0; i < 100; i++) {
        collector.recordSuccess(`provider${i}`, 100, 100, 0.01)
      }

      const allMetrics = collector.getAllMetrics()
      expect(allMetrics.size).toBe(100)
    })
  })

  describe('Calculation Accuracy', () => {
    it('should calculate accurate averages', () => {
      const values = [100, 200, 300, 400, 500]
      values.forEach((latency) => {
        collector.recordSuccess('openai', latency, 100, 0.01)
      })

      const detailed = collector.getDetailedMetrics('openai')
      const expected = values.reduce((a, b) => a + b) / values.length
      expect(detailed!.avgLatencyMs).toBe(expected)
    })

    it('should handle decimal precision', () => {
      collector.recordSuccess('openai', 100, 100, 0.001)
      collector.recordSuccess('openai', 100, 100, 0.002)
      collector.recordSuccess('openai', 100, 100, 0.003)

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.avgCostPerRequest).toBeCloseTo(0.002, 4)
    })

    it('should calculate success rate correctly', () => {
      // 3 successes, 2 failures = 60% success rate
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordSuccess('openai', 100, 100, 0.01)
      collector.recordFailure('openai', 100, new Error('Error 1'))
      collector.recordFailure('openai', 100, new Error('Error 2'))

      const detailed = collector.getDetailedMetrics('openai')
      expect(detailed!.successRate).toBeCloseTo(60, 1)
    })
  })

  describe('Performance', () => {
    it('should handle high volume of success records', () => {
      const startTime = Date.now()

      for (let i = 0; i < 10000; i++) {
        collector.recordSuccess('openai', 100, 100, 0.01)
      }

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(1000) // Should complete in < 1 second
    })

    it('should handle mixed operations efficiently', () => {
      const startTime = Date.now()

      for (let i = 0; i < 5000; i++) {
        collector.recordSuccess('openai', 100, 100, 0.01)
        collector.recordSuccess('anthropic', 150, 150, 0.015)
        collector.recordFailure('google', 200, new Error('Error'))
        collector.getDetailedMetrics('openai')
      }

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(2000)
    })
  })
})
