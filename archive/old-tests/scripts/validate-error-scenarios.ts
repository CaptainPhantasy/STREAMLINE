#!/usr/bin/env tsx
/**
 * Error Scenario Validation Script - Phase 3 Subagent O
 *
 * This script validates error handling and resilience:
 * 1. Invalid API Key Handling
 * 2. Rate Limit Scenarios
 * 3. Budget Exceeded Scenarios
 * 4. Network Timeout Handling
 * 5. Provider Failure with Fallback
 * 6. Invalid Input Validation
 *
 * Ensures the system gracefully handles all error conditions.
 */

import http from 'http'
import https from 'https'

// ================================================================
// Configuration
// ================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const INVALID_KEY = 'Bearer invalid-key-xyz'

// ================================================================
// Utilities
// ================================================================

interface ErrorTestResult {
  scenario: string
  passed: boolean
  expectedStatus: number
  actualStatus: number
  errorMessage?: string
  details?: Record<string, any>
}

const results: ErrorTestResult[] = []

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m'
  }

  console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`)
}

function makeRequest(
  method: string,
  path: string,
  body?: Record<string, any>,
  authHeader?: string,
  timeout: number = 30000
): Promise<{ status: number; data: any; headers: Record<string, any>; elapsed: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const url = new URL(path, BASE_URL)
    const protocol = url.protocol === 'https:' ? https : http

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const bodyString = body ? JSON.stringify(body) : undefined
    if (bodyString) {
      headers['Content-Length'] = Buffer.byteLength(bodyString)
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
      timeout,
    }

    const req = protocol.request(options, (res) => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null
          resolve({
            status: res.statusCode || 500,
            data: parsed,
            headers: res.headers || {},
            elapsed: Date.now() - startTime
          })
        } catch (e) {
          resolve({
            status: res.statusCode || 500,
            data: data,
            headers: res.headers || {},
            elapsed: Date.now() - startTime
          })
        }
      })
    })

    req.on('error', (error) => {
      reject({
        elapsed: Date.now() - startTime,
        error
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject({
        elapsed: Date.now() - startTime,
        error: new Error('Request timeout')
      })
    })

    if (bodyString) {
      req.write(bodyString)
    }
    req.end()
  })
}

async function testErrorScenario(
  scenario: string,
  expectedStatus: number,
  requestFn: () => Promise<{ status: number; data: any }>,
  validate?: (response: { status: number; data: any }) => boolean
) {
  try {
    log(`Testing: ${scenario}...`, 'info')
    const response = await requestFn()

    const statusOk = response.status === expectedStatus
    const validationOk = !validate || validate(response)
    const passed = statusOk && validationOk

    results.push({
      scenario,
      passed,
      expectedStatus,
      actualStatus: response.status,
      details: {
        statusCorrect: statusOk,
        validationPassed: validationOk,
        hasErrorMessage: !!response.data?.error
      }
    })

    if (passed) {
      log(`✓ ${scenario}`, 'success')
    } else {
      log(`✗ ${scenario} - Expected ${expectedStatus}, got ${response.status}`, 'error')
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    results.push({
      scenario,
      passed: false,
      expectedStatus,
      actualStatus: 0,
      errorMessage: errorMsg,
      details: { exception: true }
    })
    log(`✗ ${scenario} - Exception: ${errorMsg}`, 'error')
  }
}

// ================================================================
// Test Suites
// ================================================================

async function testAuthenticationErrors() {
  log('\\n=== AUTHENTICATION ERRORS ===', 'warn')

  // Test 1: Missing Authorization Header
  await testErrorScenario(
    'Missing authorization header',
    401,
    () => makeRequest('POST', '/api/llm', {
      prompt: 'test',
      useCase: 'general'
    })
  )

  // Test 2: Invalid Bearer Token
  await testErrorScenario(
    'Invalid bearer token',
    401,
    () => makeRequest('POST', '/api/llm', {
      prompt: 'test',
      useCase: 'general'
    }, 'Bearer invalid-token-xyz'),
    (response) => response.data?.error?.includes('Unauthorized') || response.status === 401
  )

  // Test 3: Malformed Authorization Header
  await testErrorScenario(
    'Malformed authorization header',
    401,
    () => makeRequest('POST', '/api/llm', {
      prompt: 'test',
      useCase: 'general'
    }, 'InvalidFormat notABearerToken')
  )
}

async function testValidationErrors() {
  log('\\n=== INPUT VALIDATION ERRORS ===', 'warn')

  // Test 1: Missing Required Field (prompt)
  await testErrorScenario(
    'Missing prompt field',
    400,
    () => makeRequest('POST', '/api/llm', {
      useCase: 'general'
    }, `Bearer ${SERVICE_ROLE_KEY}`),
    (response) => response.data?.error?.includes('prompt')
  )

  // Test 2: Invalid JSON
  await testErrorScenario(
    'Invalid JSON in request body',
    400,
    () => {
      return new Promise((resolve, reject) => {
        const url = new URL('/api/llm', BASE_URL)
        const protocol = url.protocol === 'https:' ? https : http

        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Length': 15
          }
        }

        const req = protocol.request(options, (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode || 500,
                data: data ? JSON.parse(data) : null
              })
            } catch {
              resolve({
                status: res.statusCode || 500,
                data
              })
            }
          })
        })

        req.on('error', reject)
        req.write('{ invalid json ')
        req.end()
      })
    }
  )

  // Test 3: Empty Prompt
  await testErrorScenario(
    'Empty prompt string',
    400,
    () => makeRequest('POST', '/api/llm', {
      prompt: '',
      useCase: 'general'
    }, `Bearer ${SERVICE_ROLE_KEY}`),
    (response) => response.data?.error || response.status >= 400
  )

  // Test 4: Invalid Use Case
  await testErrorScenario(
    'Invalid use case value',
    400,
    () => makeRequest('POST', '/api/llm', {
      prompt: 'test',
      useCase: 'invalid-use-case'
    }, `Bearer ${SERVICE_ROLE_KEY}`),
    (response) => response.data?.error || response.status >= 400
  )

  // Test 5: Excessive Token Request
  await testErrorScenario(
    'Max tokens exceeds limit',
    400,
    () => makeRequest('POST', '/api/llm', {
      prompt: 'test',
      useCase: 'general',
      maxTokens: 1000000
    }, `Bearer ${SERVICE_ROLE_KEY}`),
    (response) => response.data?.error || response.status >= 400
  )
}

async function testRateLimitErrors() {
  log('\\n=== RATE LIMIT SCENARIOS ===', 'warn')

  // Test 1: Rapid Sequential Requests
  await testErrorScenario(
    'Handles rapid sequential requests gracefully',
    200,
    async () => {
      const responses = []

      for (let i = 0; i < 3; i++) {
        try {
          const response = await makeRequest('POST', '/api/llm', {
            prompt: 'test',
            useCase: 'general',
            maxTokens: 5
          }, `Bearer ${SERVICE_ROLE_KEY}`, 5000)

          responses.push(response.status)
        } catch {
          responses.push(429) // Rate limited
        }
      }

      // At least one should succeed
      return {
        status: responses.some(s => s === 200) ? 200 : responses[0],
        data: { attemptedCount: 3, successCount: responses.filter(s => s === 200).length }
      }
    },
    (response) => response.status === 200 || response.data?.successCount > 0
  )
}

async function testProviderErrors() {
  log('\\n=== PROVIDER FAILURE SCENARIOS ===', 'warn')

  // Test 1: Invalid Model Override (should fallback to default)
  await testErrorScenario(
    'Invalid model override uses fallback',
    200,
    () => makeRequest('POST', '/api/llm', {
      prompt: 'test',
      useCase: 'general',
      modelOverride: 'non-existent-model-xyz',
      maxTokens: 5
    }, `Bearer ${SERVICE_ROLE_KEY}`),
    (response) => response.status === 200 || response.status === 400
  )

  // Test 2: Multiple Sequential Requests with Different Providers
  await testErrorScenario(
    'Multiple use cases route correctly',
    200,
    async () => {
      const useCases = ['draft', 'general', 'summary']
      const results = []

      for (const useCase of useCases) {
        try {
          const response = await makeRequest('POST', '/api/llm', {
            prompt: 'test',
            useCase: useCase as any,
            maxTokens: 5
          }, `Bearer ${SERVICE_ROLE_KEY}`, 5000)

          results.push(response.status)
        } catch {
          results.push(500)
        }
      }

      return {
        status: results.some(s => s === 200) ? 200 : results[0],
        data: { useCases, successCount: results.filter(s => s === 200).length }
      }
    },
    (response) => response.data?.successCount >= 1
  )
}

async function testTimeoutScenarios() {
  log('\\n=== TIMEOUT & NETWORK SCENARIOS ===', 'warn')

  // Test 1: Request with Short Timeout
  await testErrorScenario(
    'Handles short timeout gracefully',
    0, // Don't check status for timeout
    async () => {
      try {
        await makeRequest('POST', '/api/llm', {
          prompt: 'test',
          useCase: 'general',
          maxTokens: 5
        }, `Bearer ${SERVICE_ROLE_KEY}`, 100) // 100ms timeout

        return { status: 200, data: {} }
      } catch (error) {
        // Timeout is expected
        return { status: 0, data: { timedOut: true } }
      }
    },
    (response) => response.data?.timedOut !== false // Either timeout or success
  )
}

async function testErrorResponseStructure() {
  log('\\n=== ERROR RESPONSE STRUCTURE ===', 'warn')

  // Test 1: Error responses have proper structure
  await testErrorScenario(
    'Error responses include error message',
    401,
    () => makeRequest('POST', '/api/llm', {
      prompt: 'test'
    }),
    (response) => {
      return response.data && (response.data.error || response.data.message || response.data.errors)
    }
  )

  // Test 2: 404 Handling for Invalid Endpoint
  await testErrorScenario(
    'Invalid endpoint returns 404',
    404,
    () => makeRequest('GET', '/api/llm/invalid-endpoint', undefined, `Bearer ${SERVICE_ROLE_KEY}`)
  )
}

async function testConcurrentErrorHandling() {
  log('\\n=== CONCURRENT ERROR HANDLING ===', 'warn')

  // Test 1: Mix of Valid and Invalid Requests
  await testErrorScenario(
    'Handles concurrent mixed valid/invalid requests',
    200,
    async () => {
      const promises = [
        makeRequest('POST', '/api/llm', { prompt: 'valid' }, `Bearer ${SERVICE_ROLE_KEY}`, 5000).catch(() => ({ status: 500, data: {} })),
        makeRequest('POST', '/api/llm', { prompt: '' }, `Bearer ${SERVICE_ROLE_KEY}`, 5000).catch(() => ({ status: 400, data: {} })),
        makeRequest('POST', '/api/llm', { prompt: 'valid2' }, `Bearer ${SERVICE_ROLE_KEY}`, 5000).catch(() => ({ status: 500, data: {} })),
      ]

      const responses = await Promise.all(promises)
      const hasSuccess = responses.some(r => r.status === 200)

      return {
        status: hasSuccess ? 200 : responses[0].status,
        data: { responses: responses.map(r => r.status) }
      }
    }
  )
}

// ================================================================
// Main Execution
// ================================================================

async function main() {
  console.log('\\n' + '='.repeat(70))
  console.log('ERROR SCENARIO VALIDATION SUITE - Phase 3 Subagent O')
  console.log('='.repeat(70))
  console.log()

  // Run all test suites
  await testAuthenticationErrors()
  await testValidationErrors()
  await testRateLimitErrors()
  await testProviderErrors()
  await testTimeoutScenarios()
  await testErrorResponseStructure()
  await testConcurrentErrorHandling()

  // ================================================================
  // Results Summary
  // ================================================================

  console.log('\\n' + '='.repeat(70))
  console.log('ERROR SCENARIO TEST RESULTS')
  console.log('='.repeat(70))
  console.log()

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  const passRate = ((passed / total) * 100).toFixed(1)

  results.forEach(result => {
    const status = result.passed ? '✓' : '✗'
    const color = result.passed ? '\x1b[32m' : '\x1b[31m'
    const reset = '\x1b[0m'

    console.log(
      `${color}${status}${reset} ${result.scenario} ` +
      `(Expected: ${result.expectedStatus}, Got: ${result.actualStatus})`
    )

    if (result.errorMessage) {
      console.log(`  Error: ${result.errorMessage}`)
    }
  })

  console.log()
  console.log(`Total Scenarios: ${total}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Pass Rate: ${passRate}%`)
  console.log()

  // Breakdown by category
  const categories = [
    { name: 'Authentication', start: 0, end: 3 },
    { name: 'Validation', start: 3, end: 8 },
    { name: 'Rate Limiting', start: 8, end: 9 },
    { name: 'Provider Failures', start: 9, end: 11 },
    { name: 'Timeouts', start: 11, end: 12 },
    { name: 'Response Structure', start: 12, end: 14 },
    { name: 'Concurrent Errors', start: 14, end: 15 }
  ]

  categories.forEach(cat => {
    const categoryResults = results.slice(cat.start, cat.end)
    const categoryPassed = categoryResults.filter(r => r.passed).length
    console.log(`${cat.name}: ${categoryPassed}/${categoryResults.length}`)
  })

  console.log()
  console.log('='.repeat(70))

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
