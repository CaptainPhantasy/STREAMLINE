/**
 * Unit Tests: Memory Cache
 * Tests for in-memory cache implementation with TTL
 */

import {
  MemoryCache,
  getMemoryCache,
  resetMemoryCache,
} from '@/lib/llm/cache/memory-cache'

describe('Memory Cache - Unit Tests', () => {
  let cache: MemoryCache

  beforeEach(() => {
    resetMemoryCache()
    cache = new MemoryCache(100) // 100ms cleanup interval for faster tests
  })

  afterEach(() => {
    cache.destroy()
    resetMemoryCache()
  })

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      await cache.set('key1', 'value1', 5000)
      const value = await cache.get('key1')
      expect(value).toBe('value1')
    })

    it('should return null for missing keys', async () => {
      const value = await cache.get('nonexistent')
      expect(value).toBeNull()
    })

    it('should store multiple values', async () => {
      await cache.set('key1', 'value1', 5000)
      await cache.set('key2', 'value2', 5000)
      await cache.set('key3', 'value3', 5000)

      expect(await cache.get('key1')).toBe('value1')
      expect(await cache.get('key2')).toBe('value2')
      expect(await cache.get('key3')).toBe('value3')
    })

    it('should delete values', async () => {
      await cache.set('key1', 'value1', 5000)
      await cache.delete('key1')
      const value = await cache.get('key1')
      expect(value).toBeNull()
    })

    it('should clear all values', async () => {
      await cache.set('key1', 'value1', 5000)
      await cache.set('key2', 'value2', 5000)
      await cache.clear()

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBeNull()
    })
  })

  describe('TTL Expiration', () => {
    it('should expire values after TTL', async () => {
      const ttl = 50 // 50ms
      await cache.set('key1', 'value1', ttl)

      expect(await cache.get('key1')).toBe('value1')

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, ttl + 10))

      expect(await cache.get('key1')).toBeNull()
    })

    it('should handle different TTLs', async () => {
      await cache.set('short', 'value', 50)
      await cache.set('long', 'value', 5000)

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(await cache.get('short')).toBeNull()
      expect(await cache.get('long')).toBe('value')
    })

    it('should not expire values before TTL', async () => {
      await cache.set('key1', 'value1', 500)

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(await cache.get('key1')).toBe('value1')
    })
  })

  describe('Statistics', () => {
    it('should track cache hits', async () => {
      await cache.set('key1', 'value1', 5000)
      await cache.get('key1')
      await cache.get('key1')

      const stats = await cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(0)
    })

    it('should track cache misses', async () => {
      await cache.get('nonexistent1')
      await cache.get('nonexistent2')

      const stats = await cache.getStats()
      expect(stats.misses).toBe(2)
      expect(stats.hits).toBe(0)
    })

    it('should calculate hit rate correctly', async () => {
      await cache.set('key1', 'value1', 5000)
      await cache.get('key1') // hit
      await cache.get('key1') // hit
      await cache.get('nonexistent') // miss

      const stats = await cache.getStats()
      expect(stats.hitRate).toBeCloseTo(2 / 3, 2)
    })

    it('should track cache size', async () => {
      await cache.set('key1', 'value1', 5000)
      await cache.set('key2', 'value2', 5000)

      const stats = await cache.getStats()
      expect(stats.size).toBe(2)
    })

    it('should reset statistics on clear', async () => {
      await cache.set('key1', 'value1', 5000)
      await cache.get('key1')
      await cache.clear()

      const stats = await cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.size).toBe(0)
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const cache1 = getMemoryCache()
      const cache2 = getMemoryCache()
      expect(cache1).toBe(cache2)
    })

    it('should create new instance after reset', async () => {
      const cache1 = getMemoryCache()
      await cache1.set('key1', 'value1', 5000)

      resetMemoryCache()

      const cache2 = getMemoryCache()
      const value = await cache2.get('key1')
      expect(value).toBeNull()
    })
  })

  describe('Data Types', () => {
    it('should store strings', async () => {
      await cache.set('key', 'string value', 5000)
      expect(await cache.get('key')).toBe('string value')
    })

    it('should store numbers', async () => {
      await cache.set('key', 42, 5000)
      expect(await cache.get('key')).toBe(42)
    })

    it('should store objects', async () => {
      const obj = { a: 1, b: 'test' }
      await cache.set('key', obj, 5000)
      expect(await cache.get('key')).toEqual(obj)
    })

    it('should store arrays', async () => {
      const arr = [1, 2, 3, 'test']
      await cache.set('key', arr, 5000)
      expect(await cache.get('key')).toEqual(arr)
    })

    it('should store booleans', async () => {
      await cache.set('true', true, 5000)
      await cache.set('false', false, 5000)
      expect(await cache.get('true')).toBe(true)
      expect(await cache.get('false')).toBe(false)
    })

    it('should store null values', async () => {
      await cache.set('key', null, 5000)
      expect(await cache.get('key')).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very short TTL', async () => {
      await cache.set('key', 'value', 1)
      await new Promise((resolve) => setTimeout(resolve, 5))
      expect(await cache.get('key')).toBeNull()
    })

    it('should handle very long TTL', async () => {
      await cache.set('key', 'value', 86400000) // 24 hours
      expect(await cache.get('key')).toBe('value')
    })

    it('should handle overwriting values', async () => {
      await cache.set('key', 'value1', 5000)
      await cache.set('key', 'value2', 5000)
      expect(await cache.get('key')).toBe('value2')
    })

    it('should handle deleting non-existent keys', async () => {
      await expect(cache.delete('nonexistent')).resolves.not.toThrow()
    })

    it('should handle empty string keys', async () => {
      await cache.set('', 'value', 5000)
      expect(await cache.get('')).toBe('value')
    })

    it('should handle special character keys', async () => {
      const key = 'key:with:colons:and-dashes_and_underscores'
      await cache.set(key, 'value', 5000)
      expect(await cache.get(key)).toBe('value')
    })
  })

  describe('Concurrency', () => {
    it('should handle concurrent gets', async () => {
      await cache.set('key', 'value', 5000)
      const results = await Promise.all([
        cache.get('key'),
        cache.get('key'),
        cache.get('key'),
      ])
      expect(results).toEqual(['value', 'value', 'value'])
    })

    it('should handle concurrent sets', async () => {
      await Promise.all([
        cache.set('key1', 'value1', 5000),
        cache.set('key2', 'value2', 5000),
        cache.set('key3', 'value3', 5000),
      ])

      expect(await cache.get('key1')).toBe('value1')
      expect(await cache.get('key2')).toBe('value2')
      expect(await cache.get('key3')).toBe('value3')
    })

    it('should handle mixed concurrent operations', async () => {
      await Promise.all([
        cache.set('key1', 'value1', 5000),
        cache.set('key2', 'value2', 5000),
        cache.get('key1'),
        cache.get('key2'),
        cache.delete('key1'),
      ])

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBe('value2')
    })
  })

  describe('Memory Efficiency', () => {
    it('should clean up expired entries', async () => {
      await cache.set('key1', 'value1', 50)
      await cache.set('key2', 'value2', 5000)

      let stats = await cache.getStats()
      expect(stats.size).toBe(2)

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 150))

      stats = await cache.getStats()
      expect(stats.size).toBe(1)
    })

    it('should clean up multiple expired entries', async () => {
      for (let i = 0; i < 100; i++) {
        await cache.set(`key${i}`, `value${i}`, 50)
      }

      let stats = await cache.getStats()
      expect(stats.size).toBe(100)

      await new Promise((resolve) => setTimeout(resolve, 150))

      stats = await cache.getStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('Performance', () => {
    it('should handle 1000 sets and gets', async () => {
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        await cache.set(`key${i}`, `value${i}`, 5000)
      }

      for (let i = 0; i < 1000; i++) {
        await cache.get(`key${i}`)
      }

      const elapsed = Date.now() - startTime
      // Should complete 2000 operations in < 1 second
      expect(elapsed).toBeLessThan(1000)
    })
  })
})
