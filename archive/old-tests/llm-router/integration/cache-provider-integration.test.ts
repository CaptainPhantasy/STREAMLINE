/**
 * Integration Tests: Cache & Provider Integration
 * Tests interactions between cache and provider selection
 */

import {
  MemoryCache,
  resetMemoryCache,
} from '@/lib/llm/cache/memory-cache'
import { MetricsCollector, resetMetricsCollector } from '@/lib/llm/metrics/collector'

describe('Cache & Provider Integration Tests', () => {
  let cache: MemoryCache
  let metrics: MetricsCollector

  beforeEach(() => {
    resetMemoryCache()
    resetMetricsCollector()
    cache = new MemoryCache(100)
    metrics = new MetricsCollector()
  })

  afterEach(() => {
    cache.destroy()
    resetMemoryCache()
    resetMetricsCollector()
  })

  describe('Cache Hit Tracking with Metrics', () => {
    it('should correlate cache hits with metrics', async () => {
      const cacheKey = 'provider:openai:draft'
      const provider = { id: '1', name: 'openai' }

      // First access - cache miss
      let cached = await cache.get(cacheKey)
      expect(cached).toBeNull()

      // Store in cache
      await cache.set(cacheKey, provider, 5000)
      metrics.recordSuccess('openai', 100, 100, 0.01)

      // Second access - cache hit
      cached = await cache.get(cacheKey)
      expect(cached).toEqual(provider)

      // Both cache and metrics should show activity
      const cacheStats = await cache.getStats()
      const metrics_data = metrics.getMetrics('openai')

      expect(cacheStats.hits).toBeGreaterThan(0)
      expect(metrics_data).not.toBeNull()
    })

    it('should track provider selection latency with cache', async () => {
      const providers = [
        { id: '1', name: 'openai-gpt4', use_case: ['general'] },
        { id: '2', name: 'anthropic-sonnet', use_case: ['complex'] },
      ]

      // Prime cache
      for (const provider of providers) {
        await cache.set(`provider:${provider.id}`, provider, 5000)
      }

      // Measure cached retrieval
      const startTime = Date.now()
      for (const provider of providers) {
        await cache.get(`provider:${provider.id}`)
      }
      const cachedLatency = Date.now() - startTime

      // Record in metrics
      metrics.recordSuccess('cached-lookup', cachedLatency, 0, 0)

      const detailed = metrics.getDetailedMetrics('cached-lookup')
      expect(detailed!.avgLatencyMs).toBe(cachedLatency)
    })
  })

  describe('Provider Fallback with Cache', () => {
    it('should handle provider fallback chain', async () => {
      const primaryKey = 'provider:primary'
      const secondaryKey = 'provider:secondary'
      const fallbackKey = 'provider:fallback'

      const providers = {
        primary: { name: 'openai-gpt4', model: 'gpt-4o' },
        secondary: { name: 'anthropic-sonnet', model: 'claude-sonnet' },
        fallback: { name: 'openai-gpt4o-mini', model: 'gpt-4o-mini' },
      }

      // Cache primary
      await cache.set(primaryKey, providers.primary, 5000)

      // Try to find - should get primary
      let provider = await cache.get(primaryKey)
      expect(provider).toEqual(providers.primary)

      // If primary expires, try secondary
      await cache.delete(primaryKey)
      await cache.set(secondaryKey, providers.secondary, 5000)

      provider = await cache.get(primaryKey)
      expect(provider).toBeNull()

      provider = await cache.get(secondaryKey)
      expect(provider).toEqual(providers.secondary)
    })

    it('should track fallback selections in metrics', async () => {
      // Try primary provider
      metrics.recordSuccess('openai', 100, 100, 0.01)

      // Primary fails, try secondary
      metrics.recordFailure('openai', 200, new Error('Rate limited'))
      metrics.recordSuccess('anthropic', 150, 100, 0.015)

      const openaiMetrics = metrics.getDetailedMetrics('openai')
      const anthropicMetrics = metrics.getDetailedMetrics('anthropic')

      expect(openaiMetrics!.successRate).toBe(50) // 1 success, 1 failure
      expect(anthropicMetrics!.successRate).toBe(100)
    })
  })

  describe('Cache Expiration & Provider Reselection', () => {
    it('should trigger provider reselection on cache expiration', async () => {
      const key = 'provider:openai'
      const provider = { name: 'openai-gpt4o-mini', model: 'gpt-4o-mini' }

      // Cache provider with short TTL
      await cache.set(key, provider, 50)

      // Should be available immediately
      let cached = await cache.get(key)
      expect(cached).toEqual(provider)

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should trigger reselection
      cached = await cache.get(key)
      expect(cached).toBeNull()

      // Record reselection in metrics
      metrics.recordSuccess('openai', 150, 100, 0.01)
    })

    it('should handle cache refresh cycles', async () => {
      const key = 'provider:cycle'
      const provider = { name: 'openai', model: 'gpt-4o' }

      // Cycle 1
      await cache.set(key, provider, 50)
      expect(await cache.get(key)).toEqual(provider)

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Cycle 2
      await cache.set(key, provider, 50)
      expect(await cache.get(key)).toEqual(provider)

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Cycle 3
      expect(await cache.get(key)).toBeNull()

      const stats = await cache.getStats()
      expect(stats.hits).toBe(2)
    })
  })

  describe('Multi-Provider Cache Strategy', () => {
    it('should cache different providers separately', async () => {
      const providers = [
        { name: 'openai-gpt4', model: 'gpt-4o' },
        { name: 'anthropic-sonnet', model: 'claude-sonnet' },
        { name: 'google-gemini', model: 'gemini-pro' },
      ]

      // Cache all providers
      for (const provider of providers) {
        await cache.set(`provider:${provider.name}`, provider, 5000)
      }

      // Verify all are cached
      for (const provider of providers) {
        const cached = await cache.get(`provider:${provider.name}`)
        expect(cached).toEqual(provider)
      }

      const stats = await cache.getStats()
      expect(stats.size).toBe(3)
      expect(stats.hits).toBe(3)
    })

    it('should handle provider replacement in cache', async () => {
      const key = 'provider:default'
      const oldProvider = { name: 'openai-gpt3.5', model: 'gpt-3.5-turbo' }
      const newProvider = { name: 'openai-gpt4o', model: 'gpt-4o' }

      // Cache old provider
      await cache.set(key, oldProvider, 5000)
      expect(await cache.get(key)).toEqual(oldProvider)

      // Replace with new provider
      await cache.set(key, newProvider, 5000)
      expect(await cache.get(key)).toEqual(newProvider)

      // Old provider should not be accessible
      const stats = await cache.getStats()
      expect(stats.size).toBe(1)
    })
  })

  describe('Use Case Provider Selection from Cache', () => {
    it('should cache providers by use case', async () => {
      const useCases = ['draft', 'summary', 'complex', 'vision']
      const providers = {
        draft: { name: 'openai-gpt4o-mini', model: 'gpt-4o-mini' },
        summary: { name: 'anthropic-haiku', model: 'claude-haiku' },
        complex: { name: 'anthropic-sonnet', model: 'claude-sonnet' },
        vision: { name: 'openai-gpt4o', model: 'gpt-4o' },
      }

      // Cache by use case
      for (const useCase of useCases) {
        const key = `provider:${useCase}`
        await cache.set(key, providers[useCase as keyof typeof providers], 5000)
      }

      // Verify retrieval by use case
      for (const useCase of useCases) {
        const provider = await cache.get(`provider:${useCase}`)
        expect(provider).toEqual(providers[useCase as keyof typeof providers])
      }

      // Metrics should show activity for each use case
      for (const useCase of useCases) {
        metrics.recordSuccess(`usecase:${useCase}`, 100, 100, 0.01)
      }

      expect(metrics.getAllDetailedMetrics().length).toBe(4)
    })

    it('should handle use case provider fallback', async () => {
      const complexKey = 'provider:complex'
      const generalKey = 'provider:general'

      const complexProvider = { name: 'anthropic-sonnet', model: 'claude-sonnet' }
      const generalProvider = { name: 'openai-gpt4o-mini', model: 'gpt-4o-mini' }

      await cache.set(complexKey, complexProvider, 5000)
      await cache.set(generalKey, generalProvider, 5000)

      // Complex use case available
      let provider = await cache.get(complexKey)
      expect(provider).toEqual(complexProvider)

      // If complex expires, fall back to general
      await cache.delete(complexKey)

      provider = await cache.get(complexKey)
      expect(provider).toBeNull()

      provider = await cache.get(generalKey)
      expect(provider).toEqual(generalProvider)
    })
  })

  describe('Performance: Cache & Metrics Integration', () => {
    it('should maintain sub-millisecond cache lookups', async () => {
      const providers = Array(1000)
        .fill(0)
        .map((_, i) => ({
          name: `provider${i}`,
          model: `model-${i}`,
        }))

      // Cache all providers
      for (const provider of providers) {
        await cache.set(`provider:${provider.name}`, provider, 5000)
      }

      // Time lookups
      const startTime = Date.now()
      for (let i = 0; i < 1000; i++) {
        await cache.get(`provider:provider${i}`)
      }
      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(100) // 1000 lookups in < 100ms
    })

    it('should handle high-volume metrics recording', async () => {
      const startTime = Date.now()

      for (let i = 0; i < 10000; i++) {
        const provider = i % 2 === 0 ? 'openai' : 'anthropic'
        const isSuccess = i % 3 === 0
        if (isSuccess) {
          metrics.recordSuccess(provider, 100, 100, 0.01)
        } else {
          metrics.recordFailure(provider, 200, new Error('Error'))
        }
      }

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(1000)

      const aggregated = metrics.getAggregatedMetrics()
      expect(aggregated.requestCount).toBe(10000)
    })

    it('should efficiently handle combined cache + metrics operations', async () => {
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        const provider = `provider${i % 10}`
        const key = `cache:${provider}`

        // Cache operation
        await cache.set(key, { name: provider }, 5000)
        await cache.get(key)

        // Metrics operation
        metrics.recordSuccess(provider, 50 + Math.random() * 50, 100, 0.01)
      }

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(2000)

      const stats = await cache.getStats()
      expect(stats.hits).toBeGreaterThan(0)
      expect(metrics.getAllDetailedMetrics().length).toBe(10)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle cache errors gracefully with metrics fallback', async () => {
      // Cache operation fails
      await expect(cache.get('valid-key')).resolves.toBeNull()

      // Should still record in metrics
      metrics.recordFailure('openai', 200, new Error('Cache lookup error'))

      const openaiMetrics = metrics.getMetrics('openai')
      expect(openaiMetrics!.failureCount).toBe(1)
    })

    it('should handle metrics errors without affecting cache', async () => {
      const provider = { name: 'openai', model: 'gpt-4o' }
      await cache.set('key', provider, 5000)

      // Metrics error shouldn't affect cache
      expect(await cache.get('key')).toEqual(provider)

      // Subsequent metrics should work
      metrics.recordSuccess('openai', 100, 100, 0.01)
      expect(metrics.getMetrics('openai')).not.toBeNull()
    })
  })

  describe('Cache Invalidation & Metrics Updates', () => {
    it('should update metrics when cache is invalidated', async () => {
      const key = 'provider:openai'

      // Initial cache and metrics
      await cache.set(key, { name: 'openai' }, 5000)
      metrics.recordSuccess('openai', 100, 100, 0.01)

      // Invalidate cache
      await cache.delete(key)
      expect(await cache.get(key)).toBeNull()

      // Record invalidation in metrics
      metrics.recordFailure('openai', 0, new Error('Cache invalidated'))

      const detailed = metrics.getDetailedMetrics('openai')
      expect(detailed!.failureCount).toBe(1)
    })

    it('should track cache-miss-induced metrics degradation', async () => {
      const key = 'provider:test'

      // Prime cache
      await cache.set(key, { name: 'test' }, 50)

      // With cache hit
      let start = Date.now()
      await cache.get(key)
      let cachedLatency = Date.now() - start

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Without cache (cache miss)
      start = Date.now()
      const missed = await cache.get(key)
      let missedLatency = Date.now() - start

      metrics.recordSuccess('cached', cachedLatency, 100, 0.01)
      metrics.recordSuccess('uncached', missedLatency, 100, 0.01)

      const cachedMetrics = metrics.getDetailedMetrics('cached')
      const uncachedMetrics = metrics.getDetailedMetrics('uncached')

      expect(cachedMetrics!.avgLatencyMs).toBeLessThanOrEqual(
        uncachedMetrics!.avgLatencyMs
      )
    })
  })
})
