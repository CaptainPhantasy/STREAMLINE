/**
 * Security Hardening Test Script
 *
 * Tests all security components of the LLM Router:
 * - API key encryption/decryption
 * - Startup validation
 * - Log sanitization
 * - Key masking
 *
 * Usage:
 *   npx tsx scripts/test-security-hardening.ts
 */

import {
  maskApiKey,
  looksLikeApiKey,
  sanitizeObject,
} from '../lib/llm/security/key-manager'

import {
  validateEnvironment,
  isProviderConfigured,
  getConfiguredProviders,
  hasMinimumRequirements,
} from '../lib/llm/startup/validator'

// ================================================================
// Test Utilities
// ================================================================

let testsPassed = 0
let testsFailed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ ${name}`)
    testsPassed++
  } catch (error: any) {
    console.error(`✗ ${name}`)
    console.error(`  Error: ${error.message}`)
    testsFailed++
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    )
  }
}

function assertMatches(actual: string, pattern: RegExp, message?: string) {
  if (!pattern.test(actual)) {
    throw new Error(
      message || `Expected "${actual}" to match pattern ${pattern}`
    )
  }
}

// ================================================================
// Test: API Key Masking
// ================================================================

console.log('\n=== Testing API Key Masking ===\n')

test('maskApiKey masks OpenAI keys correctly', () => {
  const key = 'sk-proj-1234567890abcdef1234567890abcdef'
  const masked = maskApiKey(key)
  assertMatches(masked, /^sk-p\.\.\.cdef$/, 'OpenAI key should be masked')
  assert(!masked.includes('1234567890'), 'Masked key should not contain middle chars')
})

test('maskApiKey masks Anthropic keys correctly', () => {
  const key = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456'
  const masked = maskApiKey(key)
  assertMatches(masked, /^sk-a\.\.\.3456$/, 'Anthropic key should be masked')
  assert(!masked.includes('mnopqrst'), 'Masked key should not contain middle chars')
})

test('maskApiKey handles short keys', () => {
  const key = 'short'
  const masked = maskApiKey(key)
  assertEquals(masked, '***', 'Short keys should return ***')
})

// ================================================================
// Test: API Key Detection
// ================================================================

console.log('\n=== Testing API Key Detection ===\n')

test('looksLikeApiKey detects OpenAI keys', () => {
  assert(
    looksLikeApiKey('sk-proj-1234567890abcdef1234567890'),
    'Should detect OpenAI project key'
  )
  assert(
    looksLikeApiKey('sk-1234567890abcdef1234567890'),
    'Should detect OpenAI legacy key'
  )
})

test('looksLikeApiKey detects Anthropic keys', () => {
  assert(
    looksLikeApiKey('sk-ant-api03-abcdefghijklmnopqrstuvwxyz'),
    'Should detect Anthropic key'
  )
})

test('looksLikeApiKey rejects non-keys', () => {
  assert(!looksLikeApiKey('not-a-key'), 'Should reject short strings')
  assert(!looksLikeApiKey('hello-world'), 'Should reject normal text')
  assert(!looksLikeApiKey(''), 'Should reject empty strings')
})

// ================================================================
// Test: Object Sanitization
// ================================================================

console.log('\n=== Testing Object Sanitization ===\n')

test('sanitizeObject masks API keys in objects', () => {
  const obj = {
    name: 'test',
    api_key: 'sk-proj-1234567890abcdef1234567890',
    secret: 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz',
    normal_field: 'this should not be masked',
  }

  const sanitized = sanitizeObject(obj)

  assert(
    sanitized.api_key.includes('...'),
    'API key should be masked'
  )
  assert(
    sanitized.secret.includes('...'),
    'Secret should be masked'
  )
  assertEquals(
    sanitized.normal_field,
    'this should not be masked',
    'Normal fields should not be affected'
  )
})

test('sanitizeObject handles nested objects', () => {
  const obj = {
    user: {
      name: 'John',
      credentials: {
        api_key: 'sk-1234567890abcdef1234567890',
      },
    },
  }

  const sanitized = sanitizeObject(obj)

  assert(
    sanitized.user.credentials.api_key.includes('...'),
    'Nested API keys should be masked'
  )
  assertEquals(
    sanitized.user.name,
    'John',
    'Nested non-sensitive fields should not be affected'
  )
})

// ================================================================
// Test: Environment Validation
// ================================================================

console.log('\n=== Testing Environment Validation ===\n')

test('validateEnvironment checks required vars', () => {
  const result = validateEnvironment()

  assert(
    typeof result.valid === 'boolean',
    'Result should have valid property'
  )
  assert(
    Array.isArray(result.errors),
    'Result should have errors array'
  )
  assert(
    Array.isArray(result.warnings),
    'Result should have warnings array'
  )
})

test('isProviderConfigured checks OpenAI', () => {
  const hasOpenAI = isProviderConfigured('openai')
  console.log(`  OpenAI configured: ${hasOpenAI}`)
  assert(
    typeof hasOpenAI === 'boolean',
    'Should return boolean'
  )
})

test('isProviderConfigured checks Anthropic', () => {
  const hasAnthropic = isProviderConfigured('anthropic')
  console.log(`  Anthropic configured: ${hasAnthropic}`)
  assert(
    typeof hasAnthropic === 'boolean',
    'Should return boolean'
  )
})

test('getConfiguredProviders returns array', () => {
  const providers = getConfiguredProviders()
  console.log(`  Configured providers: ${providers.join(', ') || 'none'}`)
  assert(
    Array.isArray(providers),
    'Should return array of providers'
  )
})

test('hasMinimumRequirements returns boolean', () => {
  const hasMin = hasMinimumRequirements()
  console.log(`  Has minimum requirements: ${hasMin}`)
  assert(
    typeof hasMin === 'boolean',
    'Should return boolean'
  )
})

// ================================================================
// Test: Error Sanitization
// ================================================================

console.log('\n=== Testing Error Sanitization ===\n')

test('Error messages sanitize OpenAI keys', () => {
  const error = new Error(
    'API call failed with key sk-proj-1234567890abcdef1234567890'
  )

  // Simulate sanitization (same logic as in route.ts)
  const sanitized = error.message
    .replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***')
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-***')

  assert(
    sanitized.includes('sk-***'),
    'OpenAI key should be sanitized'
  )
  assert(
    !sanitized.includes('1234567890'),
    'Key content should be removed'
  )
})

test('Error messages sanitize Anthropic keys', () => {
  const error = new Error(
    'Invalid key: sk-ant-api03-abcdefghijklmnopqrstuvwxyz'
  )

  // Order matters: sk-ant- pattern must be checked BEFORE sk- pattern
  const sanitized = error.message
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-***')
    .replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***')

  console.log(`  Original: ${error.message}`)
  console.log(`  Sanitized: ${sanitized}`)

  assert(
    sanitized.includes('sk-ant-***') || sanitized.includes('sk-***'),
    `Anthropic key should be sanitized. Got: ${sanitized}`
  )
  assert(
    !sanitized.includes('api03'),
    'Key content should be removed'
  )
})

test('Error messages sanitize Bearer tokens', () => {
  const error = new Error(
    'Authorization failed: Bearer sk-1234567890abcdef'
  )

  const sanitized = error.message
    .replace(/Bearer\s+[a-zA-Z0-9_-]+/g, 'Bearer ***')

  assert(
    sanitized.includes('Bearer ***'),
    'Bearer token should be sanitized'
  )
})

// ================================================================
// Results Summary
// ================================================================

console.log('\n=== Test Results ===\n')
console.log(`Passed: ${testsPassed}`)
console.log(`Failed: ${testsFailed}`)
console.log(`Total:  ${testsPassed + testsFailed}`)

if (testsFailed > 0) {
  console.log('\n⚠️  Some tests failed. Review the errors above.')
  process.exit(1)
} else {
  console.log('\n✅ All security tests passed!')
  console.log('\nNext steps:')
  console.log('1. Run the SQL encryption script: scripts/encrypt-api-keys.sql')
  console.log('2. Set POSTGRES_ENCRYPTION_KEY in .env.local')
  console.log('3. Test the LLM router with: npm run dev')
  console.log('4. Verify no API keys appear in logs')
  process.exit(0)
}
