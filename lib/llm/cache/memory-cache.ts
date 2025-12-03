/**
 * In-Memory Cache Implementation
 *
 * Provides a simple, fast in-memory cache for development and testing.
 * Uses a Map with TTL-based expiration and automatic cleanup.
 *
 * Features:
 * - TTL-based expiration
 * - Automatic cleanup of expired entries
 * - Thread-safe for Next.js environment
 * - Singleton pattern for global usage
 * - Cache statistics tracking
 *
 * @module lib/llm/cache/memory-cache
 */

import { CacheStrategy, CacheStats } from './cache-strategy'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class MemoryCache implements CacheStrategy {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null
  private stats = {
    hits: 0,
    misses: 0,
  }

  /**
   * Creates a new MemoryCache instance
   * @param cleanupIntervalMs - How often to clean up expired entries (default: 60 seconds)
   */
  constructor(private readonly cleanupIntervalMs: number = 60_000) {
    this.startCleanup()
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired()
    }, this.cleanupIntervalMs)

    // Ensure cleanup stops when process exits
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => this.stopCleanup())
    }
  }

  /**
   * Stop automatic cleanup
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Remove all expired entries from the cache
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
  }

  /**
   * Check if an entry has expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const expiresAt = Date.now() + ttlMs

    this.cache.set(key, {
      value,
      expiresAt,
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.stats.hits = 0
    this.stats.misses = 0
  }

  async getStats(): Promise<CacheStats> {
    const size = this.cache.size
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    return {
      size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    }
  }

  /**
   * Get the number of entries in the cache (including expired)
   */
  getSize(): number {
    return this.cache.size
  }

  /**
   * Cleanup and destroy the cache instance
   */
  destroy(): void {
    this.stopCleanup()
    this.cache.clear()
  }
}

// Singleton instance for global usage
let globalCache: MemoryCache | null = null

/**
 * Get the global memory cache instance (singleton)
 */
export function getMemoryCache(): MemoryCache {
  if (!globalCache) {
    globalCache = new MemoryCache()
  }
  return globalCache
}

/**
 * Reset the global cache instance (useful for testing)
 */
export function resetMemoryCache(): void {
  if (globalCache) {
    globalCache.destroy()
    globalCache = null
  }
}
