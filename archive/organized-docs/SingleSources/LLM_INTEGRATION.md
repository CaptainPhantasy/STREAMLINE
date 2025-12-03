# CRM-AI PRO - LLM Integration System
## Single Source of Truth for AI/LLM Router Architecture

**Version:** 1.0
**Last Updated:** November 28, 2025
**Status:** Production Ready (Phase 2 Complete)
**Maintainer:** Development Team

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [LLM Router Core](#llm-router-core)
4. [Caching Layer](#caching-layer)
5. [Rate Limiting](#rate-limiting)
6. [Circuit Breaker Pattern](#circuit-breaker-pattern)
7. [Retry Logic & Resilience](#retry-logic--resilience)
8. [Metrics Collection](#metrics-collection)
9. [Error Handling](#error-handling)
10. [Security & Key Management](#security--key-management)
11. [Health Monitoring](#health-monitoring)
12. [Cost Management & Budget Tracking](#cost-management--budget-tracking)
13. [Audit Logging](#audit-logging)
14. [API Endpoints](#api-endpoints)
15. [Client Integration](#client-integration)
16. [Provider Configuration](#provider-configuration)
17. [Environment Variables](#environment-variables)
18. [Testing & Validation](#testing--validation)
19. [Performance Metrics](#performance-metrics)
20. [Troubleshooting](#troubleshooting)

---

## Executive Summary

### Overview

The **LLM Integration System** is a production-grade AI router that provides intelligent, resilient, and cost-effective access to multiple Large Language Model providers (OpenAI, Anthropic) across the CRM-AI Pro platform.

### Key Features

✅ **Intelligent Routing** - Automatic provider selection based on use case
✅ **Multi-Provider Support** - OpenAI (GPT-4o, GPT-4o-mini) and Anthropic (Claude Sonnet 4.5, Claude Haiku 4.5)
✅ **Resilience Patterns** - Circuit breaker, retry with exponential backoff, timeout handling
✅ **Performance Optimization** - Memory/Redis caching, rate limiting, budget tracking
✅ **Security** - AES-256 key encryption, API key sanitization, audit logging
✅ **Observability** - Real-time metrics, health checks, detailed error tracking
✅ **Cost Control** - Per-account budgets, cost estimation, usage alerts

### Architecture Philosophy

**"Zero-downtime, intelligent routing with automatic failover and comprehensive observability"**

- **Use Case Driven** - Automatically selects optimal model for each task type
- **Resilient by Design** - Handles failures gracefully with automatic retry
- **Observable** - Full visibility into performance, costs, and errors
- **Secure** - Enterprise-grade encryption and sanitization
- **Scalable** - Singleton patterns with distributed caching support

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Applications                          │
│  (/app/api/ai/briefing, /app/api/ai/pricing, etc.)             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              LLM Router Client (Integration Layer)              │
│           /lib/llm/integration/router-client.ts                 │
│  • routerCall() - Non-streaming                                 │
│  • routerCallStream() - Streaming                               │
│  • LLMRouterClient class                                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LLM Router API Endpoint                         │
│                  /app/api/llm/route.ts                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Authentication & Authorization                        │  │
│  │  2. Rate Limiting (Token Bucket)                         │  │
│  │  3. Budget Check (Daily/Monthly)                         │  │
│  │  4. Provider Selection (Use Case Based)                  │  │
│  │  5. Cache Lookup (Memory/Redis)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Resilience Layer (Phase 2D)                        │
│         /lib/llm/resilience/resilient-provider.ts               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Circuit Breaker ──▶ Retry Policy ──▶ Provider Call     │  │
│  │  (5 failures)        (3 attempts)      (generateText)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LLM Provider Layer                            │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   OpenAI SDK         │    │   Anthropic SDK      │          │
│  │  • gpt-4o            │    │  • claude-sonnet-4-5 │          │
│  │  • gpt-4o-mini       │    │  • claude-haiku-4-5  │          │
│  └──────────────────────┘    └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Side Effects (Non-blocking)                    │
│  • Metrics Collection (success/failure rates, latency)          │
│  • Audit Queue (async batch logging)                            │
│  • Cache Updates (provider configs)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Module Organization

```
lib/llm/
├── integration/          # Client-side integration utilities
│   ├── router-client.ts  # Main client for calling LLM Router
│   └── index.ts          # Public exports
├── cache/                # Caching strategies
│   ├── cache-strategy.ts # Interface for cache implementations
│   ├── memory-cache.ts   # In-memory cache (singleton)
│   ├── redis-cache.ts    # Redis cache (production)
│   ├── provider-cache.ts # Cached provider repository
│   └── index.ts
├── rate-limiting/        # Rate limiting (Token Bucket)
│   ├── token-bucket.ts   # Token bucket algorithm
│   ├── rate-limiter.ts   # Rate limiter with account tracking
│   └── index.ts
├── resilience/           # Resilience patterns
│   ├── circuit-breaker.ts # Circuit breaker (CLOSED/OPEN/HALF_OPEN)
│   ├── retry.ts          # Retry with exponential backoff
│   ├── resilient-provider.ts # Combined resilience wrapper
│   └── index.ts
├── metrics/              # Metrics collection
│   ├── collector.ts      # Metrics aggregator (singleton)
│   ├── instrumented-provider.ts # Provider wrapper with metrics
│   └── index.ts
├── errors/               # Error handling
│   ├── base.ts           # Base LLMError class
│   ├── provider-errors.ts # Provider-specific errors
│   ├── handler.ts        # Centralized error handler
│   └── index.ts
├── security/             # Security & key management
│   └── key-manager.ts    # API key encryption/decryption
├── health/               # Health monitoring
│   ├── health-checker.ts # Provider health checks
│   └── index.ts
├── audit/                # Audit logging
│   ├── audit-queue.ts    # Async batch audit logging
│   └── index.ts
├── cost/                 # Cost management
│   └── budget-tracker.ts # Daily/monthly budget tracking
└── startup/              # Startup validation
    └── validator.ts      # Environment validation
```

---

## LLM Router Core

### Provider Selection Algorithm

The router intelligently selects providers based on **use case**, **account configuration**, and **model preferences**:

#### Use Case Mapping

| Use Case | Optimal Model | Reason |
|----------|---------------|--------|
| **draft** | Claude Haiku 4.5 | Fast, cost-effective for simple text generation |
| **summary** | Claude Haiku 4.5 | Quick summarization, low token usage |
| **complex** | Claude Sonnet 4.5 | Advanced reasoning, multi-step tasks |
| **vision** | GPT-4o | Vision capabilities, image analysis |
| **general** | GPT-4o-mini | Balanced performance and cost |
| **voice** | GPT-4o-mini | Lowest latency for real-time responses |

#### Selection Priority

```typescript
// 1. Check for explicit model override
if (modelOverride) {
  return providerRepo.getProviderByModel(modelOverride)
}

// 2. Get providers for use case
const useCaseProviders = providerRepo.getProvidersByUseCase(useCase, accountId)

// 3. Sort by priority:
//    a. Account-specific over global
//    b. Use-case specific preferences (e.g., Claude for complex)
//    c. Non-default over default
const sortedProviders = useCaseProviders.sort(priorityComparator)

// 4. Return top provider
return sortedProviders[0]

// 5. Fallback to default if none found
return providerRepo.getDefaultProvider(accountId)
```

### Streaming vs Non-Streaming

The router supports both streaming and non-streaming responses:

**Non-Streaming (Default)**
```typescript
const response = await routerCall({
  useCase: 'draft',
  prompt: 'Generate an email...',
  maxTokens: 500,
})
// Returns: { text: '...', usage: {...}, provider: 'openai-gpt4o-mini' }
```

**Streaming**
```typescript
const response = await routerCallStream({
  useCase: 'general',
  prompt: 'Tell me a story...',
  stream: true,
})
// Returns: Response (ReadableStream)
// Use result.toDataStreamResponse() for Server-Sent Events
```

### Tool Calling Support

The router supports function calling with automatic format conversion:

```typescript
const response = await routerCall({
  useCase: 'complex',
  prompt: 'What is the weather in SF?',
  tools: {
    getWeather: {
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
        },
      },
    },
  },
  toolChoice: 'auto',
  maxSteps: 3, // Allow multi-step tool calling
})

// Response includes tool calls:
// { toolCalls: [{ toolName: 'getWeather', args: { location: 'SF' } }] }
```

---

## Caching Layer

### Architecture

The caching system uses a **cache-aside (lazy loading)** pattern with pluggable backends:

```typescript
interface CacheStrategy {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlMs: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  getStats?(): Promise<CacheStats>
}
```

### Implementations

#### Memory Cache (Development)

**File:** `/lib/llm/cache/memory-cache.ts`

```typescript
const cache = getMemoryCache()

// Features:
// - TTL-based expiration
// - Automatic cleanup (every 60 seconds)
// - Singleton pattern
// - Cache statistics (hits, misses, hit rate)

// Usage:
await cache.set('key', value, 300_000) // 5 minutes TTL
const value = await cache.get('key')
```

**Performance:**
- ~0.1ms get/set operations
- Zero network overhead
- Memory-bounded (automatic cleanup)

#### Redis Cache (Production)

**File:** `/lib/llm/cache/redis-cache.ts`

```typescript
import Redis from 'ioredis'
import { createRedisCache } from '@/lib/llm/cache/redis-cache'

const redis = new Redis(process.env.REDIS_URL)
const cache = createRedisCache(redis, 'llm:cache:')

// Features:
// - Native Redis TTL (SETEX)
// - Distributed caching across servers
// - Automatic key prefixing
// - Connection pooling support

// Usage:
await cache.set('key', value, 300_000) // 5 minutes TTL
const value = await cache.get('key')
```

**Performance:**
- ~2-5ms get/set operations
- Horizontally scalable
- Shared across all instances

### Provider Configuration Caching

**File:** `/lib/llm/cache/provider-cache.ts`

The `CachedProviderRepository` wraps Supabase queries with caching:

```typescript
const providerRepo = new CachedProviderRepository(supabase, cache, 300_000)

// Cache-aside pattern:
// 1. Check cache
const cached = await cache.get('llm:providers:account-123')
if (cached) return cached

// 2. Query database
const providers = await supabase.from('llm_providers').select('*')

// 3. Store in cache (fire-and-forget)
cache.set('llm:providers:account-123', providers, 300_000)
```

**Cache Keys:**
- `llm:providers:global` - Global providers (no account filter)
- `llm:providers:{accountId}` - Account-specific + global providers

**TTL:** 5 minutes (configurable)

**Cache Invalidation:**
```typescript
// After creating/updating/deleting a provider:
await providerRepo.invalidateCache(accountId)

// Or clear all:
await providerRepo.clearAllCaches()
```

**Performance Impact:**
- Reduces database queries by 90%+
- Improves response time by 50-100ms

---

## Rate Limiting

### Token Bucket Algorithm

**File:** `/lib/llm/rate-limiting/token-bucket.ts`

The rate limiter uses the **token bucket algorithm** for smooth rate limiting:

```
Bucket Capacity: 50 tokens
Refill Rate: 10 tokens/second

Time 0s:  [●●●●●●●●●●] 50/50 tokens
Time 1s:  [●●●●●●●●●●] 50/50 tokens (refilled 10, was full)
Request:  [●●●●●●●●●○] 49/50 tokens (consumed 1)
Time 2s:  [●●●●●●●●●●] 50/50 tokens (refilled 1)
10 rapid:  [●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●○] 40/50 (consumed 10)
```

**Configuration:**
```typescript
const rateLimiter = getRateLimiter({
  requestsPerSecond: 10,    // 10 requests/second sustained
  burstCapacity: 50,         // Up to 50 requests in burst
})

// Check rate limit:
const result = rateLimiter.checkLimit('account-123')

if (result !== true) {
  // Rate limited:
  // { status: 429, code: 'RATE_LIMIT_EXCEEDED', retryAfterMs: 100 }
  return Response with Retry-After header
}
```

**Features:**
- Per-account tracking
- Automatic token refill
- Burst support (5 seconds at normal rate)
- Stale bucket cleanup (1 hour inactive)

**Default Limits:**
- 10 requests/second per account
- 50 request burst capacity

### Rate Limiter Singleton

**File:** `/lib/llm/rate-limiting/rate-limiter.ts`

```typescript
// Get global rate limiter instance:
const rateLimiter = getRateLimiter()

// Check and enforce limit:
const result = rateLimiter.checkLimit(accountId)

// Get current status:
const status = rateLimiter.getStatus(accountId)
// { tokensAvailable: 45, requestsRemaining: 45, ... }

// Reset (admin only):
rateLimiter.reset(accountId)
rateLimiter.resetAll()
```

---

## Circuit Breaker Pattern

### State Machine

**File:** `/lib/llm/resilience/circuit-breaker.ts`

The circuit breaker prevents cascade failures using three states:

```
         ┌─────────┐
         │ CLOSED  │ ◀─── Normal operation
         │ (healthy)│
         └────┬────┘
              │ 5 failures
              ▼
         ┌─────────┐
         │  OPEN   │ ◀─── Fail fast (503)
         │(failing)│
         └────┬────┘
              │ 60 seconds cooldown
              ▼
         ┌─────────┐
         │HALF_OPEN│ ◀─── Testing recovery
         │(testing)│
         └────┬────┘
              │ 2 successes
              │
              └──────────────┐
                             │
                ┌────────────┴────────────┐
                │                         │
         Success (2x) ──▶ CLOSED   Failure ──▶ OPEN
```

### Configuration

```typescript
const breaker = new CircuitBreaker({
  failureThreshold: 5,      // 5 failures → OPEN
  cooldownPeriod: 60_000,   // 60 seconds before HALF_OPEN
  successThreshold: 2,      // 2 successes → CLOSED
})

// Execute with circuit breaker:
try {
  const result = await breaker.execute(async () => {
    return await callLLMProvider()
  })
} catch (error) {
  if (error instanceof CircuitBreakerOpenError) {
    // Circuit is OPEN, fail fast
    // { status: 503, code: 'CIRCUIT_BREAKER_OPEN', cooldownRemaining: 45000 }
  }
}
```

### State Transitions

**CLOSED → OPEN:**
- Trigger: 5 consecutive failures
- Action: Start cooldown timer, reject all requests

**OPEN → HALF_OPEN:**
- Trigger: Cooldown period elapsed (60 seconds)
- Action: Allow limited test requests

**HALF_OPEN → CLOSED:**
- Trigger: 2 consecutive successes
- Action: Resume normal operation

**HALF_OPEN → OPEN:**
- Trigger: Any failure
- Action: Restart cooldown timer

### Monitoring

```typescript
// Get current state:
const state = breaker.getState()
// {
//   state: 'OPEN',
//   failureCount: 5,
//   successCount: 0,
//   lastFailureTime: 1701234567890,
//   lastStateChange: 1701234567890
// }

// Check if open:
const isOpen = breaker.isOpen() // true

// Manual reset (admin):
breaker.reset() // → CLOSED
```

---

## Retry Logic & Resilience

### Exponential Backoff with Jitter

**File:** `/lib/llm/resilience/retry.ts`

The retry policy handles transient failures with intelligent backoff:

```
Attempt 1: [■] Failure
           ↓ Wait 100ms (initial delay)
Attempt 2: [■] Failure
           ↓ Wait 200ms (2x backoff)
Attempt 3: [■] Failure
           ↓ All attempts exhausted
Error: MaxRetriesExceededError
```

**Backoff Formula:**
```
delay = min(maxDelay, initialDelay × (multiplier ^ (attempt - 1)))
jitteredDelay = delay × (1 ± jitterFactor)
```

**Example:**
```typescript
const retry = new RetryPolicy({
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterFactor: 0.25, // ±25%
})

const result = await retry.execute(async () => {
  return await callLLMProvider()
})

// Attempt 1: Immediate (100ms jitter: 75-125ms)
// Attempt 2: 200ms (±25% = 150-250ms)
// Attempt 3: 400ms (±25% = 300-500ms)
```

### Retryable Errors

Only these errors are retried automatically:
- ✅ Rate limit errors (with retry-after)
- ✅ Timeout errors (ETIMEDOUT)
- ✅ Network errors (ECONNRESET, ECONNREFUSED)
- ✅ 5xx server errors (503, 504)
- ❌ Authentication errors (401) - NOT retried
- ❌ Validation errors (400) - NOT retried
- ❌ Token limit errors - NOT retried

### Resilient Provider Wrapper

**File:** `/lib/llm/resilience/resilient-provider.ts`

Combines circuit breaker + retry policy:

```typescript
const resilient = new ResilientProvider(
  async () => await generateText({ model, prompt }),
  {
    maxRetries: 3,
    initialRetryDelay: 100,
    maxRetryDelay: 5000,
    backoffMultiplier: 2,
    circuitBreakerThreshold: 5,
    cooldownPeriod: 60_000,
  }
)

// Execution flow:
// 1. Check circuit breaker (fail fast if OPEN)
// 2. Execute with retry policy (exponential backoff)
// 3. Update circuit breaker on success/failure

const result = await resilient.execute()
```

**Error Handling:**
```typescript
try {
  const result = await resilient.execute()
} catch (error) {
  if (error instanceof CircuitBreakerOpenError) {
    // Circuit is OPEN - fail fast
  } else if (error instanceof MaxRetriesExceededError) {
    // All retries exhausted
  } else {
    // Non-retryable error (e.g., validation)
  }
}
```

---

## Metrics Collection

### Real-Time Metrics

**File:** `/lib/llm/metrics/collector.ts`

The metrics collector tracks performance across all providers:

```typescript
const collector = getMetricsCollector()

// Record success:
collector.recordSuccess(
  'openai-gpt4o-mini',  // provider
  150,                   // latencyMs
  500,                   // tokens used
  0.002                  // cost in USD
)

// Record failure:
collector.recordFailure(
  'openai-gpt4o-mini',
  100,
  new Error('Rate limit exceeded')
)
```

### Metrics Structure

```typescript
interface Metrics {
  requestCount: number
  successCount: number
  failureCount: number
  totalLatencyMs: number
  totalTokens: number
  totalCost: number
}

interface DetailedMetrics extends Metrics {
  provider: string
  avgLatencyMs: number
  successRate: number            // Percentage
  avgTokensPerRequest: number
  avgCostPerRequest: number
  lastUpdated: Date
}
```

### Aggregated Metrics

```typescript
// Get all provider metrics:
const allMetrics = collector.getAllDetailedMetrics()
// [
//   { provider: 'openai-gpt4o-mini', requestCount: 1000, successRate: 99.5, ... },
//   { provider: 'anthropic-claude-sonnet', requestCount: 500, successRate: 98.2, ... }
// ]

// Get aggregated across all providers:
const aggregated = collector.getAggregatedMetrics()
// {
//   provider: 'all',
//   requestCount: 1500,
//   successRate: 99.1,
//   totalCost: 15.42,
//   avgLatencyMs: 180,
//   ...
// }
```

### Metrics API Endpoint

**GET /api/llm/metrics**

Returns formatted metrics for monitoring:

```json
{
  "success": true,
  "metrics": [
    {
      "provider": "openai-gpt4o-mini",
      "requests": 1000,
      "successRate": "99.50%",
      "avgLatency": "150ms",
      "totalTokens": "500,000",
      "totalCost": "$10.50",
      "avgCost": "$0.010500",
      "errors": 5
    }
  ],
  "aggregated": {
    "totalRequests": 1500,
    "successRate": "99.10%",
    "avgLatency": "180ms",
    "totalCost": "$15.42"
  },
  "uptime": "2d 14h 32m",
  "timestamp": "2025-11-28T12:00:00Z"
}
```

**Authorization:** Admin or Owner role required

---

## Error Handling

### Error Hierarchy

**File:** `/lib/llm/errors/base.ts`

All LLM errors extend from `LLMError`:

```typescript
abstract class LLMError extends Error {
  abstract readonly code: string
  abstract readonly retryable: boolean
  abstract readonly statusCode: number
  readonly context?: Record<string, any>
}
```

### Error Types

**File:** `/lib/llm/errors/provider-errors.ts`

| Error Class | Code | Status | Retryable | Description |
|-------------|------|--------|-----------|-------------|
| `LLMProviderError` | `PROVIDER_ERROR` | 502 | ✅ | Generic provider failure |
| `RateLimitError` | `RATE_LIMIT` | 429 | ✅ | Rate limit exceeded |
| `InvalidAPIKeyError` | `INVALID_API_KEY` | 401 | ❌ | Authentication failed |
| `TokenLimitExceededError` | `TOKEN_LIMIT_EXCEEDED` | 400 | ❌ | Request too large |
| `CircuitBreakerOpenError` | `CIRCUIT_BREAKER_OPEN` | 503 | ✅ | Circuit is OPEN |
| `MaxRetriesExceededError` | `MAX_RETRIES_EXCEEDED` | 500 | ❌ | All retries failed |
| `TimeoutError` | `TIMEOUT` | 504 | ✅ | Request timeout |
| `NetworkError` | `NETWORK` | 503 | ✅ | Network failure |
| `ValidationError` | `VALIDATION_ERROR` | 400 | ❌ | Invalid input |

### Error Handler

**File:** `/lib/llm/errors/handler.ts`

The `ErrorHandler` converts any error to structured LLMError:

```typescript
// Centralized error handling:
try {
  const result = await generateText({ model, prompt })
} catch (error) {
  return ErrorHandler.handle(error)
}

// Converts to:
NextResponse.json(
  {
    error: {
      code: 'RATE_LIMIT',
      message: 'Rate limit exceeded. Retry after 60s',
      retryable: true
    }
  },
  {
    status: 429,
    headers: { 'Retry-After': '60' }
  }
)
```

### Error Pattern Matching

```typescript
// Automatic error classification:
const error = new Error('Rate limit exceeded. Retry after 60 seconds')

// ErrorHandler detects pattern and converts:
const llmError = ErrorHandler.toLLMError(error)
// → RateLimitError { code: 'RATE_LIMIT', retryAfter: 60, retryable: true }

// Check if retryable:
const canRetry = ErrorHandler.isRetryable(error) // true

// Get error code:
const code = ErrorHandler.getErrorCode(error) // 'RATE_LIMIT'
```

### Error Sanitization

All error messages are sanitized to prevent API key leakage:

```typescript
// Before sanitization:
'OpenAI API error: Invalid key sk-proj-1234567890abcdef'

// After sanitization:
'OpenAI API error: Invalid key sk-proj-***'

// Patterns removed:
// - sk-... (OpenAI)
// - sk-ant-... (Anthropic)
// - sk-proj-... (OpenAI projects)
// - Bearer <token>
// - api_key=<value>
```

---

## Security & Key Management

### API Key Encryption

**File:** `/lib/llm/security/key-manager.ts`

API keys can be stored encrypted in the database using **AES-256 encryption** via PostgreSQL's `pgcrypto` extension:

```typescript
// Encrypt API key:
const encrypted = await encryptKey('sk-1234567890')
// Store encrypted in database

// Decrypt API key:
const decrypted = await decryptKey(encryptedFromDb)
// Use for API calls
```

**Encryption Flow:**
```
Plaintext API Key
      ↓
pgcrypto::encrypt_aes_256(key, POSTGRES_ENCRYPTION_KEY)
      ↓
Encrypted Binary (bytea)
      ↓
Base64 Encoding
      ↓
Store in llm_providers.encrypted_api_key
```

### Key Retrieval Priority

```typescript
// Priority order for API keys:
// 1. Environment variable (preferred)
const apiKey = process.env.OPENAI_API_KEY

// 2. Decrypted database key (fallback)
if (!apiKey && provider.encrypted_api_key) {
  apiKey = await decryptKey(provider.encrypted_api_key)
}

// 3. Error if not found
if (!apiKey) {
  throw new Error('API key not found')
}
```

**Best Practice:** Use environment variables for API keys in production. Database encryption is for customer-provided keys.

### Key Rotation

```typescript
// Rotate all encryption keys to new password:
const results = await rotateEncryptionKeys(
  'old-password',
  'new-password',
  2 // new version number
)
// [{ provider_id: '...', status: 'rotated' }, ...]
```

**WARNING:** Rotating encryption keys is destructive. Backup before rotation!

### Key Sanitization

```typescript
// Mask API key for logging:
maskApiKey('sk-1234567890abcdef')
// → 'sk-12...cdef'

// Sanitize object:
sanitizeObject({
  apiKey: 'sk-1234567890',
  data: { secret: 'hidden' }
})
// → { apiKey: 'sk-12...90', data: { secret: 'hidd...den' } }
```

### Security Best Practices

✅ **DO:**
- Use environment variables for API keys in production
- Rotate keys every 90 days
- Use separate keys for dev/staging/prod
- Monitor API key usage for anomalies
- Back up `POSTGRES_ENCRYPTION_KEY` securely

❌ **DON'T:**
- Commit API keys to version control
- Log decrypted keys
- Share encryption passwords
- Use the same key across environments
- Store keys in plain text

---

## Health Monitoring

### Health Checker

**File:** `/lib/llm/health/health-checker.ts`

The health checker monitors provider availability with periodic "ping" requests:

```typescript
// Initialize health checker:
const checker = getHealthChecker({
  checkIntervalMs: 60_000,  // 1 minute
  timeoutMs: 5_000,         // 5 seconds
})

// Register providers:
checker.registerProvider('openai-gpt4o-mini', async () => {
  const model = openai('gpt-4o-mini', { apiKey })
  await generateText({ model, prompt: 'ping', maxTokens: 5 })
})

// Start periodic checks:
checker.start()

// Get health status:
const health = checker.getHealth('openai-gpt4o-mini')
// {
//   provider: 'openai-gpt4o-mini',
//   healthy: true,
//   lastCheck: Date,
//   latencyMs: 150,
//   error: null
// }
```

### Health States

| Status | Description |
|--------|-------------|
| `healthy: true` | Provider responding normally |
| `healthy: false` | Provider failing health checks |
| `latencyMs: X` | Last successful check latency |
| `error: "..."` | Last error message |

### Health API Endpoint

**GET /api/llm/health**

Public endpoint for monitoring (no auth required):

```json
{
  "healthy": true,
  "providers": [
    {
      "provider": "openai-gpt4o-mini",
      "healthy": true,
      "latency": "150ms",
      "lastCheck": "2025-11-28T12:00:00Z",
      "error": null
    },
    {
      "provider": "anthropic-claude-sonnet-4-5",
      "healthy": true,
      "latency": "200ms",
      "lastCheck": "2025-11-28T12:00:00Z",
      "error": null
    }
  ],
  "stats": {
    "total": 4,
    "healthy": 4,
    "unhealthy": 0,
    "healthPercentage": "100.0%"
  },
  "timestamp": "2025-11-28T12:00:00Z"
}
```

**Status Codes:**
- `200` - All providers healthy
- `503` - One or more providers unhealthy

---

## Cost Management & Budget Tracking

### Cost Estimation

**File:** `/lib/llm/cost/budget-tracker.ts`

Cost estimation based on token usage and model:

```typescript
// Cost rates per 1K tokens:
const COST_RATES = {
  'gpt-4o': { input: 0.0025, output: 0.010 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'claude-sonnet-4-5': { input: 0.003, output: 0.015 },
  'claude-haiku-4-5': { input: 0.00025, output: 0.00125 },
}

// Estimate cost:
const cost = CostEstimator.estimateCost(
  'gpt-4o-mini',
  1000,  // input tokens
  500    // output tokens
)
// → $0.0005
```

### Budget Tracking

```typescript
const budgetTracker = getBudgetTracker({
  dailyBudget: 100,    // $100/day
  monthlyBudget: 1000, // $1000/month
  alertThreshold: 80,  // Alert at 80%
})

// Track cost:
const result = budgetTracker.trackCost(
  'account-123',
  0.15,  // cost in USD
  'gpt-4o-mini'
)

if (result.status === 402) {
  // Budget exceeded:
  // {
  //   status: 402,
  //   code: 'PAYMENT_REQUIRED',
  //   message: 'Daily budget exceeded. Current: $95.50, Request: $10.00, Limit: $100.00',
  //   budgetStatus: { ... }
  // }
  return error response
}
```

### Budget Status

```typescript
const status = budgetTracker.getStatus('account-123')
// {
//   dailyUsed: 75.50,
//   dailyBudget: 100,
//   dailyPercentage: 75.5,
//   monthlyUsed: 450.25,
//   monthlyBudget: 1000,
//   monthlyPercentage: 45.0,
//   alerts: [
//     'Daily budget at 82.3% ($82.30/$100.00)'
//   ]
// }
```

### Budget Reset

Budgets automatically reset:
- **Daily:** At midnight (00:00) in server timezone
- **Monthly:** On the 1st of each month

---

## Audit Logging

### Async Audit Queue

**File:** `/lib/llm/audit/audit-queue.ts`

The audit queue provides **non-blocking** audit logging with batch writes:

```typescript
const auditQueue = getAuditQueue(supabase)

// Start the queue (once at app startup):
auditQueue.start()

// Enqueue audit event (fire-and-forget):
auditQueue.enqueue({
  type: 'llm_request',
  accountId: 'account-123',
  provider: 'openai',
  model: 'gpt-4o-mini',
  timestamp: new Date(),
  metadata: {
    use_case: 'draft',
    tokens_used: 500,
    prompt_length: 200,
  },
})
// Returns immediately (<1ms)
```

### Queue Configuration

```typescript
const auditQueue = new AuditQueue(supabase, {
  batchSize: 100,         // Flush after 100 events
  flushIntervalMs: 5_000, // Flush every 5 seconds
  maxQueueSize: 1_000,    // Max queue size (prevent memory exhaustion)
})
```

### Flush Triggers

The queue flushes automatically when:
1. **Batch size reached** (100 events)
2. **Timer expires** (5 seconds)
3. **App shutdown** (graceful flush)

### Performance Impact

| Operation | Without Queue | With Queue |
|-----------|---------------|------------|
| Audit log write | 10-20ms | <1ms |
| Database connections | 1 per request | 1 per batch (100 requests) |
| Transaction overhead | High | Low (batched) |

### Queue Statistics

```typescript
const stats = auditQueue.getStats()
// {
//   queueSize: 45,
//   enqueued: 10000,
//   flushed: 9955,
//   failed: 0,
//   dropped: 0,
//   successRate: 0.9955
// }
```

---

## API Endpoints

### POST /api/llm

Main LLM Router endpoint for text generation.

**Authentication:**
- User session (via cookies)
- Service role (via Bearer token)

**Request:**
```typescript
{
  accountId?: string,        // Optional: override account
  useCase: 'draft' | 'summary' | 'complex' | 'vision' | 'general' | 'voice',
  prompt: string,            // Required: user prompt
  systemPrompt?: string,     // Optional: system message
  maxTokens?: number,        // Optional: max tokens (default: provider max)
  temperature?: number,      // Optional: 0-1 (default: 0.7)
  modelOverride?: string,    // Optional: force specific model
  stream?: boolean,          // Optional: stream response (default: false)
  tools?: Record<string, ToolFormat>, // Optional: function calling
  toolChoice?: 'auto' | 'none' | { type: 'function', function: { name: string } },
  maxSteps?: number          // Optional: multi-step tool calling (default: 1)
}
```

**Response (Non-Streaming):**
```json
{
  "success": true,
  "text": "Generated text...",
  "provider": "openai-gpt4o-mini",
  "model": "gpt-4o-mini",
  "toolCalls": [],
  "usage": {
    "totalTokens": 500,
    "promptTokens": 200,
    "completionTokens": 300
  }
}
```

**Response (Streaming):**
Returns `Response` with `ReadableStream` (Server-Sent Events).

**Error Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Rate limit exceeded. Maximum 10 requests/second.",
    "retryable": true
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error (missing prompt, invalid params)
- `401` - Unauthorized (no session)
- `402` - Payment required (budget exceeded)
- `429` - Rate limit exceeded
- `500` - Internal server error
- `502` - Provider error (retryable)
- `503` - Circuit breaker open or provider unavailable
- `504` - Timeout

---

### GET /api/llm/health

Health check endpoint for all LLM providers.

**Authentication:** None (public endpoint)

**Response:**
```json
{
  "healthy": true,
  "providers": [
    {
      "provider": "openai-gpt4o-mini",
      "healthy": true,
      "latency": "150ms",
      "lastCheck": "2025-11-28T12:00:00Z",
      "error": null
    }
  ],
  "stats": {
    "total": 4,
    "healthy": 4,
    "unhealthy": 0,
    "healthPercentage": "100.0%"
  },
  "timestamp": "2025-11-28T12:00:00Z"
}
```

**Status Codes:**
- `200` - All providers healthy
- `503` - One or more providers unhealthy

---

### GET /api/llm/metrics

Real-time metrics for all providers.

**Authentication:** Admin or Owner role required

**Response:**
```json
{
  "success": true,
  "metrics": [
    {
      "provider": "openai-gpt4o-mini",
      "requests": 1000,
      "successRate": "99.50%",
      "avgLatency": "150ms",
      "totalTokens": "500,000",
      "totalCost": "$10.50",
      "avgCost": "$0.010500",
      "errors": 5
    }
  ],
  "aggregated": {
    "totalRequests": 1500,
    "successRate": "99.10%",
    "avgLatency": "180ms",
    "totalCost": "$15.42"
  },
  "uptime": "2d 14h 32m",
  "timestamp": "2025-11-28T12:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not admin/owner)

---

### POST /api/llm/metrics/reset

Reset all metrics (admin only).

**Authentication:** Admin or Owner role required

**Response:**
```json
{
  "success": true,
  "message": "Metrics reset successfully",
  "timestamp": "2025-11-28T12:00:00Z"
}
```

---

## Client Integration

### Router Client

**File:** `/lib/llm/integration/router-client.ts`

The `LLMRouterClient` provides a type-safe client for calling the LLM Router:

```typescript
import { createRouterClient, routerCall, routerCallStream } from '@/lib/llm/integration'

// Method 1: Quick helper functions
const response = await routerCall({
  useCase: 'draft',
  prompt: 'Write an email...',
  maxTokens: 500,
})

// Method 2: Create client instance
const client = createRouterClient()
const response = await client.callJson({
  useCase: 'general',
  prompt: 'Tell me a story...',
})

// Method 3: Streaming
const stream = await routerCallStream({
  useCase: 'general',
  prompt: 'Tell me a story...',
  stream: true,
})
```

### Error Handling

```typescript
try {
  const response = await routerCall({ useCase: 'draft', prompt: '...' })
} catch (error) {
  if (error instanceof LLMRouterError) {
    console.error('LLM Router Error:', error.code, error.message)
    console.log('Status:', error.statusCode)
    console.log('Retryable:', error.retryable)
    console.log('Context:', error.context)
  } else if (error instanceof LLMRouterTimeoutError) {
    console.error('Request timed out after 60 seconds')
  } else if (error instanceof LLMRouterAuthError) {
    console.error('Authentication failed')
  }
}
```

### Fallback Pattern

For zero-downtime migration, use the fallback pattern:

```typescript
const client = createRouterClient()

const response = await client.callWithFallback(
  { useCase: 'draft', prompt: '...' },
  async () => {
    // Fallback: direct OpenAI call
    return await generateText({
      model: openai('gpt-4o-mini'),
      prompt: '...',
    })
  }
)
// If router fails, automatically calls fallback
```

### Health Check

```typescript
const client = createRouterClient()

const isHealthy = await client.healthCheck()
if (!isHealthy) {
  console.warn('LLM Router is unhealthy')
}
```

---

## Provider Configuration

### Database Schema

**Table:** `llm_providers`

```sql
CREATE TABLE llm_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,              -- e.g., 'openai-gpt4o-mini'
  provider TEXT NOT NULL,                 -- 'openai' or 'anthropic'
  model TEXT NOT NULL,                    -- 'gpt-4o-mini', 'claude-sonnet-4-5'
  api_key_encrypted BYTEA,                -- Encrypted API key (optional)
  key_version INTEGER DEFAULT 1,          -- Encryption key version
  account_id UUID REFERENCES accounts(id), -- NULL for global, or account-specific
  is_default BOOLEAN DEFAULT false,       -- Default provider for account
  use_case TEXT[] NOT NULL,               -- ['draft', 'summary', ...]
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Example Configuration

```sql
-- Global providers (account_id = NULL)
INSERT INTO llm_providers (name, provider, model, use_case, max_tokens, is_default) VALUES
  ('openai-gpt4o-mini', 'openai', 'gpt-4o-mini', '{draft,summary,general,voice}', 16384, true),
  ('openai-gpt4o', 'openai', 'gpt-4o', '{vision,complex}', 128000, false),
  ('anthropic-claude-haiku-4-5', 'anthropic', 'claude-haiku-4-5', '{draft,summary}', 200000, false),
  ('anthropic-claude-sonnet-4-5', 'anthropic', 'claude-sonnet-4-5', '{complex}', 200000, false);
```

### Account-Specific Overrides

```sql
-- Account-specific provider (overrides global)
INSERT INTO llm_providers (name, provider, model, account_id, use_case, max_tokens, is_default) VALUES
  ('openai-gpt4o-mini-acme', 'openai', 'gpt-4o-mini', 'account-uuid', '{draft,summary}', 16384, true);
```

**Selection Priority:**
1. Account-specific providers
2. Global providers
3. Default provider

---

## Environment Variables

### Required Variables

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM Providers (at least ONE required)
OPENAI_API_KEY=sk-proj-...           # OpenAI API key
ANTHROPIC_API_KEY=sk-ant-api03-...  # Anthropic API key

# Server
NEXT_PUBLIC_BASE_URL=http://localhost:3002
```

### Optional Variables

```bash
# Encryption (for database key storage)
POSTGRES_ENCRYPTION_KEY=your-secure-32-char-password

# Feature Flags
USE_LLM_ROUTER=true
LLM_ENABLED=true
LLM_OPENAI_ENABLED=true
LLM_ANTHROPIC_ENABLED=true

# Redis (production caching)
REDIS_URL=redis://localhost:6379

# Voice (optional)
ELEVENLABS_API_KEY=sk_...
```

### Validation

The system validates environment variables on startup:

```typescript
// lib/llm/startup/validator.ts
// - Checks SUPABASE_URL and keys
// - Validates at least one LLM provider key
// - Warns if POSTGRES_ENCRYPTION_KEY missing
// - Logs configuration summary
```

**Startup Logs:**
```
[LLM Router] Validating environment...
✓ Supabase configured
✓ OpenAI API key found
✓ Anthropic API key found
⚠ POSTGRES_ENCRYPTION_KEY not set (database key encryption disabled)
[LLM Router] Configuration valid, starting router...
```

---

## Testing & Validation

### Unit Tests

Key modules have unit tests:

```bash
# Run all LLM tests:
npm test lib/llm

# Run specific module tests:
npm test lib/llm/cache
npm test lib/llm/rate-limiting
npm test lib/llm/resilience
```

### Integration Tests

```bash
# Test LLM Router endpoint:
npm test app/api/llm

# Test AI endpoints:
npm test app/api/ai
```

### Manual Testing

**Test LLM Router:**
```bash
curl -X POST http://localhost:3002/api/llm \
  -H "Content-Type: application/json" \
  -d '{
    "useCase": "draft",
    "prompt": "Write a professional email",
    "maxTokens": 500
  }'
```

**Test Health:**
```bash
curl http://localhost:3002/api/llm/health
```

**Test Metrics (with auth):**
```bash
curl http://localhost:3002/api/llm/metrics \
  -H "Cookie: your-session-cookie"
```

### Environment Validation

```bash
# Validate all environment variables:
npm run validate-env

# Or use the startup validator:
node -e "require('./lib/llm/startup/validator').validateEnvironment()"
```

---

## Performance Metrics

### Latency Benchmarks

| Operation | Without Optimization | With Optimization | Improvement |
|-----------|---------------------|-------------------|-------------|
| **Provider lookup** | 50-100ms (DB query) | 1-5ms (cached) | 95% faster |
| **Audit logging** | 10-20ms (sync DB write) | <1ms (async queue) | 90% faster |
| **Rate limit check** | 5-10ms | <1ms (in-memory) | 90% faster |
| **Circuit breaker check** | N/A | <0.1ms | N/A |
| **Error handling** | Variable | <1ms (structured) | Consistent |

### Cache Performance

| Metric | Memory Cache | Redis Cache |
|--------|--------------|-------------|
| **Get operation** | ~0.1ms | ~2-5ms |
| **Set operation** | ~0.1ms | ~2-5ms |
| **Hit rate** | 85-95% | 85-95% |
| **Memory usage** | ~10MB (bounded) | Distributed |
| **Scalability** | Single instance | Multi-instance |

### Throughput

| Metric | Value |
|--------|-------|
| **Max requests/second** | 10 per account (configurable) |
| **Burst capacity** | 50 requests (5 seconds at normal rate) |
| **Concurrent requests** | Unlimited (with rate limiting) |
| **Provider timeout** | 60 seconds |
| **Retry attempts** | 3 (exponential backoff) |

---

## Troubleshooting

### Common Issues

#### 1. "API key not found" Error

**Symptoms:**
```
Error: API key not found for provider: openai
```

**Solution:**
- Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`
- Restart the dev server: `npm run dev`
- Verify with: `echo $OPENAI_API_KEY`

#### 2. Rate Limit Exceeded

**Symptoms:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Maximum 10 requests/second.",
    "retryable": true
  }
}
```

**Solution:**
- Wait for the retry-after period (see `Retry-After` header)
- Increase rate limit (admin):
  ```typescript
  const rateLimiter = getRateLimiter({
    requestsPerSecond: 20,  // Increase limit
    burstCapacity: 100,
  })
  ```
- Check rate limit status:
  ```typescript
  const status = rateLimiter.getStatus(accountId)
  console.log('Tokens remaining:', status.tokensAvailable)
  ```

#### 3. Circuit Breaker Open

**Symptoms:**
```json
{
  "error": {
    "code": "CIRCUIT_BREAKER_OPEN",
    "message": "Circuit breaker is OPEN",
    "retryable": true
  }
}
```

**Solution:**
- Wait for cooldown period (60 seconds)
- Check circuit state:
  ```typescript
  const state = breaker.getState()
  console.log('Circuit state:', state.state)
  console.log('Cooldown remaining:', state.lastFailureTime + 60000 - Date.now())
  ```
- Manually reset (admin):
  ```typescript
  breaker.reset() // → CLOSED
  ```

#### 4. Budget Exceeded

**Symptoms:**
```json
{
  "error": {
    "code": "PAYMENT_REQUIRED",
    "message": "Daily budget exceeded. Current: $95.50, Request: $10.00, Limit: $100.00"
  }
}
```

**Solution:**
- Wait for daily/monthly reset
- Increase budget (admin):
  ```typescript
  const budgetTracker = getBudgetTracker({
    dailyBudget: 200,    // Increase to $200/day
    monthlyBudget: 2000,
  })
  ```
- Check budget status:
  ```typescript
  const status = budgetTracker.getStatus(accountId)
  console.log('Daily used:', status.dailyUsed, '/', status.dailyBudget)
  ```

#### 5. Provider Timeout

**Symptoms:**
```json
{
  "error": {
    "code": "TIMEOUT",
    "message": "Request timed out after 60000ms",
    "retryable": true
  }
}
```

**Solution:**
- Reduce `maxTokens` in request
- Increase timeout (not recommended):
  ```typescript
  const client = createRouterClient(baseUrl, 120000) // 120 seconds
  ```
- Check provider health:
  ```bash
  curl http://localhost:3002/api/llm/health
  ```

### Debug Logging

Enable debug logging to troubleshoot issues:

```typescript
// Add to router-client.ts or route.ts:
console.log('[LLM Router] Request:', {
  useCase,
  provider: provider.name,
  model: provider.model,
  maxTokens,
})

console.log('[LLM Router] Response:', {
  success: true,
  tokens: result.usage?.totalTokens,
  latency: Date.now() - startTime,
})
```

### Health Check

```bash
# Check all providers:
curl http://localhost:3002/api/llm/health

# Expected output:
# {
#   "healthy": true,
#   "providers": [
#     { "provider": "openai-gpt4o-mini", "healthy": true, ... }
#   ]
# }
```

### Metrics Dashboard

```bash
# View real-time metrics (requires admin):
curl http://localhost:3002/api/llm/metrics \
  -H "Cookie: your-session-cookie"

# Expected output:
# {
#   "metrics": [
#     { "provider": "openai-gpt4o-mini", "successRate": "99.50%", ... }
#   ],
#   "aggregated": { "totalRequests": 1500, "successRate": "99.10%", ... }
# }
```

---

## Appendix

### File Reference

**Integration Layer:**
- `/lib/llm/integration/router-client.ts` - LLM Router client
- `/lib/llm/integration/index.ts` - Public exports

**Caching:**
- `/lib/llm/cache/cache-strategy.ts` - Cache interface
- `/lib/llm/cache/memory-cache.ts` - In-memory cache
- `/lib/llm/cache/redis-cache.ts` - Redis cache
- `/lib/llm/cache/provider-cache.ts` - Cached provider repository

**Rate Limiting:**
- `/lib/llm/rate-limiting/token-bucket.ts` - Token bucket algorithm
- `/lib/llm/rate-limiting/rate-limiter.ts` - Rate limiter

**Resilience:**
- `/lib/llm/resilience/circuit-breaker.ts` - Circuit breaker
- `/lib/llm/resilience/retry.ts` - Retry with exponential backoff
- `/lib/llm/resilience/resilient-provider.ts` - Combined wrapper

**Metrics:**
- `/lib/llm/metrics/collector.ts` - Metrics collector

**Errors:**
- `/lib/llm/errors/base.ts` - Base LLMError class
- `/lib/llm/errors/provider-errors.ts` - Provider-specific errors
- `/lib/llm/errors/handler.ts` - Error handler

**Security:**
- `/lib/llm/security/key-manager.ts` - API key encryption

**Health:**
- `/lib/llm/health/health-checker.ts` - Health monitoring

**Audit:**
- `/lib/llm/audit/audit-queue.ts` - Async audit logging

**Cost:**
- `/lib/llm/cost/budget-tracker.ts` - Budget tracking

**API Endpoints:**
- `/app/api/llm/route.ts` - Main LLM Router endpoint
- `/app/api/llm/health/route.ts` - Health check
- `/app/api/llm/metrics/route.ts` - Metrics endpoint

**Example Usage:**
- `/app/api/ai/briefing/route.ts` - AI briefing generation
- `/app/api/ai/pricing/route.ts` - Pricing suggestions
- `/app/api/ai/draft/route.ts` - Email drafting
- `/app/api/ai/meeting-summary/route.ts` - Meeting summaries

---

## Changelog

### Version 1.0 (November 28, 2025)
- Initial release
- Complete LLM Router implementation
- Multi-provider support (OpenAI, Anthropic)
- Resilience patterns (circuit breaker, retry)
- Caching layer (memory, Redis)
- Rate limiting (token bucket)
- Metrics collection
- Error handling
- Security (key encryption)
- Health monitoring
- Budget tracking
- Audit logging

---

**Document Maintainer:** Development Team
**Last Review:** November 28, 2025
**Next Review:** December 28, 2025
**Status:** ✅ Production Ready
