#!/usr/bin/env tsx
/**
 * Performance Optimization Test Suite
 *
 * Tests for caching and async audit logging (Phase 2E).
 *
 * Tests:
 * 1. Memory cache get/set/delete/expire
 * 2. Provider cache hit/miss scenarios
 * 3. Cache TTL expiration
 * 4. Audit queue enqueue/flush
 * 5. Batch processing
 * 6. Graceful shutdown
 * 7. Integration with LLM router
 *
 * Run: npx tsx scripts/test-performance.ts
 */

import { MemoryCache, resetMemoryCache } from '../lib/llm/cache/memory-cache'
import { CachedProviderRepository } from '../lib/llm/cache/provider-cache'
import { AuditQueue, AuditEvent } from '../lib/llm/audit/audit-queue'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ================================================================
// Test Utilities
// ================================================================

let testsPassed = 0
let testsFailed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ ${message}`)
    testsPassed++
  } else {
    console.error(`❌ ${message}`)
    testsFailed++
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ================================================================
// Test 1: Memory Cache - Basic Operations
// ================================================================

async function testMemoryCacheBasicOperations(): Promise<void> {
  console.log('\n🧪 Test 1: Memory Cache - Basic Operations')

  resetMemoryCache()
  const cache = new MemoryCache()

  // Test set and get
  await cache.set('key1', 'value1', 1000)
  const value1 = await cache.get<string>('key1')
  assert(value1 === 'value1', 'Cache set and get works')

  // Test get non-existent key
  const value2 = await cache.get<string>('nonexistent')
  assert(value2 === null, 'Cache returns null for non-existent key')

  // Test delete
  await cache.delete('key1')
  const value3 = await cache.get<string>('key1')
  assert(value3 === null, 'Cache delete works')

  // Test clear
  await cache.set('key2', 'value2', 1000)
  await cache.set('key3', 'value3', 1000)
  await cache.clear()
  const value4 = await cache.get<string>('key2')
  const value5 = await cache.get<string>('key3')
  assert(value4 === null && value5 === null, 'Cache clear works')

  cache.destroy()
}

// ================================================================
// Test 2: Memory Cache - TTL Expiration
// ================================================================

async function testMemoryCacheTTL(): Promise<void> {
  console.log('\n🧪 Test 2: Memory Cache - TTL Expiration')

  resetMemoryCache()
  const cache = new MemoryCache()

  // Test TTL expiration
  await cache.set('expires', 'value', 100) // 100ms TTL
  const value1 = await cache.get<string>('expires')
  assert(value1 === 'value', 'Cache value exists before expiration')

  await sleep(150)
  const value2 = await cache.get<string>('expires')
  assert(value2 === null, 'Cache value expires after TTL')

  cache.destroy()
}

// ================================================================
// Test 3: Memory Cache - Statistics
// ================================================================

async function testMemoryCacheStats(): Promise<void> {
  console.log('\n🧪 Test 3: Memory Cache - Statistics')

  resetMemoryCache()
  const cache = new MemoryCache()

  // Generate cache hits and misses
  await cache.set('key1', 'value1', 1000)
  await cache.get('key1') // hit
  await cache.get('key1') // hit
  await cache.get('nonexistent') // miss
  await cache.get('nonexistent2') // miss

  const stats = await cache.getStats()
  assert(stats.hits === 2, `Cache hits tracked correctly (expected 2, got ${stats.hits})`)
  assert(stats.misses === 2, `Cache misses tracked correctly (expected 2, got ${stats.misses})`)
  assert(stats.hitRate === 0.5, `Cache hit rate calculated correctly (expected 0.5, got ${stats.hitRate})`)
  assert(stats.size === 1, `Cache size correct (expected 1, got ${stats.size})`)

  cache.destroy()
}

// ================================================================
// Test 4: Provider Cache - Mock Supabase
// ================================================================

async function testProviderCacheMock(): Promise<void> {
  console.log('\n🧪 Test 4: Provider Cache - Mock Supabase')

  resetMemoryCache()
  const cache = new MemoryCache()

  // Mock Supabase client with proper query chaining
  const mockProviders = [
    {
      id: '1',
      name: 'openai-gpt4o-mini',
      provider: 'openai',
      model: 'gpt-4o-mini',
      is_default: true,
      use_case: ['draft', 'summary', 'general'],
      max_tokens: 1000,
      is_active: true,
    },
  ]

  const mockSupabase = {
    from: (table: string) => {
      const query = {
        select: (columns: string) => query,
        eq: (column: string, value: any) => query,
        or: (condition: string) => ({ data: mockProviders, error: null }),
        is: (column: string, value: any) => ({ data: mockProviders, error: null }),
      }
      return query
    },
  } as any

  const providerRepo = new CachedProviderRepository(mockSupabase, cache)

  // First call - cache miss (database query)
  try {
    const providers1 = await providerRepo.getProviders()
    assert(providers1.length === 1, 'Provider repository returns providers (cache miss)')
  } catch (error) {
    console.log('  Error:', error)
    assert(false, 'Provider repository returns providers (cache miss)')
  }

  // Second call - cache hit (no database query)
  try {
    const providers2 = await providerRepo.getProviders()
    assert(providers2.length === 1, 'Provider repository returns cached providers (cache hit)')
  } catch (error) {
    console.log('  Error:', error)
    assert(false, 'Provider repository returns cached providers (cache hit)')
  }

  // Check cache stats
  const stats = await cache.getStats()
  assert(stats.hits >= 1, `Cache hit occurred (hits: ${stats.hits})`)

  // Test cache invalidation
  try {
    await providerRepo.invalidateCache()
    const providers3 = await providerRepo.getProviders()
    assert(providers3.length === 1, 'Provider repository works after cache invalidation')
  } catch (error) {
    console.log('  Error:', error)
    assert(false, 'Provider repository works after cache invalidation')
  }

  cache.destroy()
}

// ================================================================
// Test 5: Audit Queue - Enqueue
// ================================================================

async function testAuditQueueEnqueue(): Promise<void> {
  console.log('\n🧪 Test 5: Audit Queue - Enqueue')

  // Mock Supabase client
  const mockSupabase = {
    from: (table: string) => ({
      insert: (records: any[]) => ({
        data: null,
        error: null,
      }),
    }),
  } as any

  const auditQueue = new AuditQueue(mockSupabase, {
    batchSize: 5,
    flushIntervalMs: 1000,
  })

  // Enqueue events
  auditQueue.enqueue({
    type: 'llm_request',
    accountId: 'test-account',
    provider: 'openai',
    model: 'gpt-4o-mini',
    timestamp: new Date(),
    metadata: { tokens: 100 },
  })

  const stats1 = auditQueue.getStats()
  assert(stats1.enqueued === 1, `Audit queue enqueued 1 event (got ${stats1.enqueued})`)
  assert(stats1.queueSize === 1, `Audit queue size is 1 (got ${stats1.queueSize})`)

  // Cleanup
  await auditQueue.stop()
}

// ================================================================
// Test 6: Audit Queue - Batch Flushing
// ================================================================

async function testAuditQueueBatchFlush(): Promise<void> {
  console.log('\n🧪 Test 6: Audit Queue - Batch Flushing')

  let insertedRecords: any[] = []

  // Mock Supabase client
  const mockSupabase = {
    from: (table: string) => ({
      insert: (records: any[]) => {
        insertedRecords = records
        return { data: null, error: null }
      },
    }),
  } as any

  const auditQueue = new AuditQueue(mockSupabase, {
    batchSize: 3,
    flushIntervalMs: 5000, // Long interval to test batch size trigger
  })

  auditQueue.start()

  // Enqueue 3 events (should trigger immediate flush)
  for (let i = 0; i < 3; i++) {
    auditQueue.enqueue({
      type: 'llm_request',
      accountId: 'test-account',
      provider: 'openai',
      model: 'gpt-4o-mini',
      timestamp: new Date(),
      metadata: { index: i },
    })
  }

  // Wait for flush
  await sleep(200)

  assert(insertedRecords.length === 3, `Batch flush triggered at batch size (inserted ${insertedRecords.length})`)

  const stats = auditQueue.getStats()
  assert(stats.flushed === 3, `Audit queue flushed 3 events (got ${stats.flushed})`)

  // Cleanup
  await auditQueue.stop()
}

// ================================================================
// Test 7: Audit Queue - Periodic Flush
// ================================================================

async function testAuditQueuePeriodicFlush(): Promise<void> {
  console.log('\n🧪 Test 7: Audit Queue - Periodic Flush')

  let insertedRecords: any[] = []

  // Mock Supabase client
  const mockSupabase = {
    from: (table: string) => ({
      insert: (records: any[]) => {
        insertedRecords = records
        return { data: null, error: null }
      },
    }),
  } as any

  const auditQueue = new AuditQueue(mockSupabase, {
    batchSize: 100,
    flushIntervalMs: 200, // 200ms interval
  })

  auditQueue.start()

  // Enqueue 2 events (below batch size)
  auditQueue.enqueue({
    type: 'llm_request',
    accountId: 'test-account',
    provider: 'openai',
    model: 'gpt-4o-mini',
    timestamp: new Date(),
    metadata: { index: 1 },
  })

  auditQueue.enqueue({
    type: 'llm_request',
    accountId: 'test-account',
    provider: 'openai',
    model: 'gpt-4o-mini',
    timestamp: new Date(),
    metadata: { index: 2 },
  })

  // Wait for periodic flush
  await sleep(300)

  assert(insertedRecords.length === 2, `Periodic flush triggered (inserted ${insertedRecords.length})`)

  const stats = auditQueue.getStats()
  assert(stats.flushed === 2, `Audit queue flushed 2 events (got ${stats.flushed})`)

  // Cleanup
  await auditQueue.stop()
}

// ================================================================
// Test 8: Audit Queue - Graceful Shutdown
// ================================================================

async function testAuditQueueGracefulShutdown(): Promise<void> {
  console.log('\n🧪 Test 8: Audit Queue - Graceful Shutdown')

  let insertedRecords: any[] = []

  // Mock Supabase client
  const mockSupabase = {
    from: (table: string) => ({
      insert: (records: any[]) => {
        insertedRecords = records
        return { data: null, error: null }
      },
    }),
  } as any

  const auditQueue = new AuditQueue(mockSupabase, {
    batchSize: 100,
    flushIntervalMs: 10000, // Long interval
  })

  auditQueue.start()

  // Enqueue events
  for (let i = 0; i < 5; i++) {
    auditQueue.enqueue({
      type: 'llm_request',
      accountId: 'test-account',
      provider: 'openai',
      model: 'gpt-4o-mini',
      timestamp: new Date(),
      metadata: { index: i },
    })
  }

  // Stop queue (should flush remaining events)
  await auditQueue.stop()

  assert(insertedRecords.length === 5, `Graceful shutdown flushes remaining events (inserted ${insertedRecords.length})`)

  const stats = auditQueue.getStats()
  assert(stats.flushed === 5, `Audit queue flushed all events on shutdown (got ${stats.flushed})`)
}

// ================================================================
// Main Test Runner
// ================================================================

async function main(): Promise<void> {
  console.log('🚀 Phase 2E - Performance Optimization Test Suite\n')
  console.log('Testing caching and async audit logging...\n')

  try {
    await testMemoryCacheBasicOperations()
    await testMemoryCacheTTL()
    await testMemoryCacheStats()
    await testProviderCacheMock()
    await testAuditQueueEnqueue()
    await testAuditQueueBatchFlush()
    await testAuditQueuePeriodicFlush()
    await testAuditQueueGracefulShutdown()

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Tests passed: ${testsPassed}`)
    console.log(`❌ Tests failed: ${testsFailed}`)
    console.log(`📊 Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`)
    console.log('='.repeat(60))

    process.exit(testsFailed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error)
    process.exit(1)
  }
}

main()
