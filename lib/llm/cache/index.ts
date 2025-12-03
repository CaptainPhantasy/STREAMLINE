/**
 * LLM Cache Module
 *
 * Exports all caching-related utilities for the LLM Router.
 * Provides memory-based and Redis-based caching strategies.
 *
 * @module lib/llm/cache
 */

// Cache Strategy Interface
export type { CacheStrategy, CacheStats } from './cache-strategy'

// Memory Cache (for development/testing)
export { MemoryCache, getMemoryCache, resetMemoryCache } from './memory-cache'

// Redis Cache (for production)
export { RedisCache, createRedisCache } from './redis-cache'
export type { RedisClient } from './redis-cache'

// Provider Cache Repository
export { CachedProviderRepository } from './provider-cache'
export type { LLMProviderConfig } from './provider-cache'
