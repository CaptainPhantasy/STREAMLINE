/**
 * Simple request cache to prevent duplicate API calls
 * Useful for data that doesn't change frequently
 */

interface CacheEntry {
    data: any
    timestamp: number
}

const cache = new Map<string, CacheEntry>()

const DEFAULT_TTL = 5000 // 5 seconds

/**
 * Fetch with automatic caching and deduplication
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param ttl - Time to live in milliseconds (default: 5000ms)
 * @returns Cached or fresh data
 */
export async function cachedFetch<T = any>(
    url: string,
    options?: RequestInit,
    ttl: number = DEFAULT_TTL
): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options || {})}`
    const cached = cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data
    }

    // Fetch fresh data
    const response = await fetch(url, options)

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the result
    cache.set(cacheKey, {
        data,
        timestamp: Date.now()
    })

    return data
}

/**
 * Clear all cached entries
 */
export function clearCache() {
    cache.clear()
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(url: string, options?: RequestInit) {
    const cacheKey = `${url}-${JSON.stringify(options || {})}`
    cache.delete(cacheKey)
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(ttl: number = DEFAULT_TTL) {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > ttl) {
            cache.delete(key)
        }
    }
}

// Auto-cleanup every minute
if (typeof window !== 'undefined') {
    setInterval(() => clearExpiredCache(), 60000)
}
