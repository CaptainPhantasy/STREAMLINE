/**
 * Cache Strategy Interface
 *
 * Defines a common interface for different caching implementations (memory, Redis, etc.)
 * Allows for pluggable cache backends without changing business logic.
 *
 * @module lib/llm/cache/cache-strategy
 */

export interface CacheStrategy {
  /**
   * Retrieve a value from the cache
   * @param key - The cache key
   * @returns The cached value, or null if not found or expired
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Store a value in the cache with a TTL (Time To Live)
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttlMs - Time to live in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number): Promise<void>

  /**
   * Remove a specific key from the cache
   * @param key - The cache key to delete
   */
  delete(key: string): Promise<void>

  /**
   * Clear all entries from the cache
   */
  clear(): Promise<void>

  /**
   * Get cache statistics (optional)
   */
  getStats?(): Promise<CacheStats>
}

export interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
}
