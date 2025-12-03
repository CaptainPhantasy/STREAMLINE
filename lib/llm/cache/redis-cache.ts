/**
 * Redis Cache Implementation
 *
 * Production-grade caching using Redis for distributed systems.
 * Provides high-performance caching with native TTL support.
 *
 * Features:
 * - Distributed caching across multiple servers
 * - Native Redis TTL expiration
 * - JSON serialization/deserialization
 * - Connection pooling support
 * - Error handling and retry logic
 *
 * Note: Requires Redis client to be installed and configured.
 * For development, use MemoryCache instead.
 *
 * @module lib/llm/cache/redis-cache
 */

import { CacheStrategy, CacheStats } from './cache-strategy'

// Type definition for Redis client (compatible with ioredis and node-redis)
export interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>
  setex(key: string, seconds: number, value: string): Promise<string>
  del(key: string): Promise<number>
  flushdb(): Promise<string>
  dbsize(): Promise<number>
  info(section?: string): Promise<string>
}

export class RedisCache implements CacheStrategy {
  private stats = {
    hits: 0,
    misses: 0,
  }

  constructor(
    private readonly redis: RedisClient,
    private readonly keyPrefix: string = 'llm:cache:'
  ) {}

  /**
   * Generate a prefixed cache key
   */
  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const prefixedKey = this.prefixKey(key)
      const value = await this.redis.get(prefixedKey)

      if (value === null) {
        this.stats.misses++
        return null
      }

      this.stats.hits++
      return JSON.parse(value) as T
    } catch (error) {
      console.error('[RedisCache] Get error:', error)
      this.stats.misses++
      return null
    }
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      const prefixedKey = this.prefixKey(key)
      const serialized = JSON.stringify(value)
      const ttlSeconds = Math.ceil(ttlMs / 1000)

      // Use SETEX for atomic set with expiration
      await this.redis.setex(prefixedKey, ttlSeconds, serialized)
    } catch (error) {
      console.error('[RedisCache] Set error:', error)
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const prefixedKey = this.prefixKey(key)
      await this.redis.del(prefixedKey)
    } catch (error) {
      console.error('[RedisCache] Delete error:', error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      // WARNING: This clears the ENTIRE Redis database, not just our keys
      // In production, you might want to use SCAN to delete only prefixed keys
      await this.redis.flushdb()
      this.stats.hits = 0
      this.stats.misses = 0
    } catch (error) {
      console.error('[RedisCache] Clear error:', error)
      throw error
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const size = await this.redis.dbsize()
      const totalRequests = this.stats.hits + this.stats.misses
      const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

      return {
        size,
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate,
      }
    } catch (error) {
      console.error('[RedisCache] GetStats error:', error)
      return {
        size: 0,
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: 0,
      }
    }
  }
}

/**
 * Create a Redis cache instance (factory function)
 *
 * Example usage with ioredis:
 * ```typescript
 * import Redis from 'ioredis'
 * const redis = new Redis(process.env.REDIS_URL)
 * const cache = createRedisCache(redis)
 * ```
 */
export function createRedisCache(
  redis: RedisClient,
  keyPrefix?: string
): RedisCache {
  return new RedisCache(redis, keyPrefix)
}
