/**
 * API Client for Testing
 *
 * AI agents should test business logic via API before UI.
 * This provides type-safe API testing with clear error messages.
 *
 * Design Principle: API FIRST, UI SECOND
 * If the API is broken, UI tests will fail anyway.
 * Test the foundation first.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

export interface ApiResponse<T> {
  success: boolean
  status: number
  data: T | null
  error: string | null
  responseTimeMs: number
  headers: Record<string, string>
}

export interface ApiTestResult {
  passed: boolean
  endpoint: string
  method: string
  expectedStatus: number
  actualStatus: number
  responseTimeMs: number
  error: string | null
}

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private authToken: string | null = null

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Set auth token for authenticated requests
   */
  setAuthToken(token: string): void {
    this.authToken = token
  }

  /**
   * Clear auth token
   */
  clearAuthToken(): void {
    this.authToken = null
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.defaultHeaders }
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    return headers
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, options?: { timeout?: number }): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options)
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown, options?: { timeout?: number }): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, options)
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, body?: unknown, options?: { timeout?: number }): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, options)
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(path: string, body?: unknown, options?: { timeout?: number }): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, options)
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string, options?: { timeout?: number }): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { timeout?: number }
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    const url = `${this.baseUrl}${path}`
    const timeout = options?.timeout || 10000

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseTimeMs = Date.now() - startTime

      // Extract headers
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      // Parse response body
      let data: T | null = null
      let error: string | null = null

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        try {
          const jsonData = await response.json()
          if (response.ok) {
            data = jsonData as T
          } else {
            error = jsonData.error || jsonData.message || `HTTP ${response.status}`
          }
        } catch {
          error = 'Failed to parse JSON response'
        }
      } else {
        const text = await response.text()
        if (!response.ok) {
          error = text || `HTTP ${response.status}`
        }
      }

      return {
        success: response.ok,
        status: response.status,
        data,
        error,
        responseTimeMs,
        headers,
      }
    } catch (err) {
      const responseTimeMs = Date.now() - startTime

      let error: string
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          error = `Request timeout after ${timeout}ms`
        } else {
          error = err.message
        }
      } else {
        error = String(err)
      }

      return {
        success: false,
        status: 0,
        data: null,
        error,
        responseTimeMs,
        headers: {},
      }
    }
  }

  /**
   * Test an endpoint and return structured result
   * Use this for health checks and API verification
   */
  async testEndpoint(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    expectedStatus: number,
    body?: unknown
  ): Promise<ApiTestResult> {
    const response = await this.request<unknown>(method, path, body)

    return {
      passed: response.status === expectedStatus,
      endpoint: path,
      method,
      expectedStatus,
      actualStatus: response.status,
      responseTimeMs: response.responseTimeMs,
      error: response.status !== expectedStatus
        ? `Expected ${expectedStatus}, got ${response.status}. ${response.error || ''}`
        : null,
    }
  }

  /**
   * Health check - verify API is responding
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get<unknown>('/api/health', { timeout: 5000 })
      return response.success
    } catch {
      // Try a basic endpoint if /api/health doesn't exist
      const response = await this.get<unknown>('/api/auth/session', { timeout: 5000 })
      return response.status > 0 // Any response means API is up
    }
  }
}

/**
 * API Test Suite Runner
 * Runs a batch of API tests and reports results
 */
export class ApiTestRunner {
  private client: ApiClient
  private results: ApiTestResult[] = []

  constructor(baseUrl?: string) {
    this.client = new ApiClient(baseUrl)
  }

  setAuthToken(token: string): void {
    this.client.setAuthToken(token)
  }

  async runTest(
    name: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    expectedStatus: number,
    body?: unknown
  ): Promise<ApiTestResult> {
    console.log(`  Testing: ${method} ${path}`)
    const result = await this.client.testEndpoint(method, path, expectedStatus, body)
    this.results.push(result)

    if (result.passed) {
      console.log(`    ✓ ${name} (${result.responseTimeMs}ms)`)
    } else {
      console.log(`    ✗ ${name}: ${result.error}`)
    }

    return result
  }

  getResults(): ApiTestResult[] {
    return this.results
  }

  getSummary(): { passed: number; failed: number; total: number } {
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    return { passed, failed, total: this.results.length }
  }

  printSummary(): void {
    const summary = this.getSummary()
    console.log('\n' + '='.repeat(50))
    console.log(`API Test Summary: ${summary.passed}/${summary.total} passed`)

    if (summary.failed > 0) {
      console.log('\nFailed tests:')
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  • ${r.method} ${r.endpoint}: ${r.error}`)
        })
    }
    console.log('='.repeat(50))
  }
}

/**
 * Pre-defined API endpoint tests for CRM-AI Pro
 * These verify core API functionality before UI tests
 */
export const crmApiTests = {
  /**
   * Test core API endpoints are responding
   * Run this before any UI tests
   */
  async verifyCoreEndpoints(baseUrl?: string): Promise<{ allPassed: boolean; results: ApiTestResult[] }> {
    const runner = new ApiTestRunner(baseUrl)

    console.log('\n🔌 Verifying Core API Endpoints...\n')

    // Public endpoints (no auth required)
    await runner.runTest('Health Check', 'GET', '/api/health', 200)

    // These may return 401 without auth, which is expected
    await runner.runTest('Jobs API (no auth)', 'GET', '/api/jobs', 401)
    await runner.runTest('Contacts API (no auth)', 'GET', '/api/contacts', 401)
    await runner.runTest('Conversations API (no auth)', 'GET', '/api/conversations', 401)

    runner.printSummary()

    const summary = runner.getSummary()
    return {
      allPassed: summary.failed === 0,
      results: runner.getResults(),
    }
  },

  /**
   * Test authenticated API endpoints
   * Requires valid auth token
   */
  async verifyAuthenticatedEndpoints(
    authToken: string,
    baseUrl?: string
  ): Promise<{ allPassed: boolean; results: ApiTestResult[] }> {
    const runner = new ApiTestRunner(baseUrl)
    runner.setAuthToken(authToken)

    console.log('\n🔐 Verifying Authenticated API Endpoints...\n')

    await runner.runTest('Jobs API (auth)', 'GET', '/api/jobs', 200)
    await runner.runTest('Contacts API (auth)', 'GET', '/api/contacts', 200)
    await runner.runTest('Conversations API (auth)', 'GET', '/api/conversations', 200)
    await runner.runTest('User Profile', 'GET', '/api/auth/me', 200)

    runner.printSummary()

    const summary = runner.getSummary()
    return {
      allPassed: summary.failed === 0,
      results: runner.getResults(),
    }
  },

  /**
   * Test CRUD operations
   * Creates, reads, updates, and deletes test data
   */
  async verifyCRUDOperations(
    authToken: string,
    accountId: string,
    baseUrl?: string
  ): Promise<{ allPassed: boolean; createdIds: { contactId?: string; jobId?: string } }> {
    const client = new ApiClient(baseUrl)
    client.setAuthToken(authToken)

    const createdIds: { contactId?: string; jobId?: string } = {}
    let allPassed = true

    console.log('\n📝 Verifying CRUD Operations...\n')

    // 1. Create Contact
    console.log('  Creating test contact...')
    const contactResponse = await client.post<{ contact: { id: string } }>('/api/contacts', {
      email: `test-${Date.now()}@example.com`,
      first_name: 'API',
      last_name: 'Test',
      phone: '(317) 555-0000',
    })

    if (contactResponse.success && contactResponse.data?.contact?.id) {
      createdIds.contactId = contactResponse.data.contact.id
      console.log(`    ✓ Contact created: ${createdIds.contactId}`)
    } else {
      console.log(`    ✗ Failed to create contact: ${contactResponse.error}`)
      allPassed = false
    }

    // 2. Create Job (if contact was created)
    if (createdIds.contactId) {
      console.log('  Creating test job...')
      const jobResponse = await client.post<{ job: { id: string } }>('/api/jobs', {
        contact_id: createdIds.contactId,
        description: `API Test Job ${Date.now()}`,
        priority: 'medium',
      })

      if (jobResponse.success && jobResponse.data?.job?.id) {
        createdIds.jobId = jobResponse.data.job.id
        console.log(`    ✓ Job created: ${createdIds.jobId}`)
      } else {
        console.log(`    ✗ Failed to create job: ${jobResponse.error}`)
        allPassed = false
      }
    }

    // 3. Read back data
    if (createdIds.jobId) {
      console.log('  Reading job back...')
      const readResponse = await client.get<{ job: { id: string } }>(`/api/jobs/${createdIds.jobId}`)

      if (readResponse.success) {
        console.log(`    ✓ Job read successfully`)
      } else {
        console.log(`    ✗ Failed to read job: ${readResponse.error}`)
        allPassed = false
      }
    }

    // 4. Update job
    if (createdIds.jobId) {
      console.log('  Updating job status...')
      const updateResponse = await client.patch<{ job: { id: string } }>(`/api/jobs/${createdIds.jobId}`, {
        status: 'in_progress',
      })

      if (updateResponse.success) {
        console.log(`    ✓ Job updated successfully`)
      } else {
        console.log(`    ✗ Failed to update job: ${updateResponse.error}`)
        allPassed = false
      }
    }

    // 5. Delete job
    if (createdIds.jobId) {
      console.log('  Deleting test job...')
      const deleteResponse = await client.delete(`/api/jobs/${createdIds.jobId}`)

      if (deleteResponse.success || deleteResponse.status === 204) {
        console.log(`    ✓ Job deleted successfully`)
        createdIds.jobId = undefined
      } else {
        console.log(`    ✗ Failed to delete job: ${deleteResponse.error}`)
        allPassed = false
      }
    }

    // 6. Delete contact
    if (createdIds.contactId) {
      console.log('  Deleting test contact...')
      const deleteResponse = await client.delete(`/api/contacts/${createdIds.contactId}`)

      if (deleteResponse.success || deleteResponse.status === 204) {
        console.log(`    ✓ Contact deleted successfully`)
        createdIds.contactId = undefined
      } else {
        console.log(`    ✗ Failed to delete contact: ${deleteResponse.error}`)
        allPassed = false
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`CRUD Test: ${allPassed ? '✓ PASSED' : '✗ FAILED'}`)
    console.log('='.repeat(50))

    return { allPassed, createdIds }
  },
}

// Singleton for convenience
let _apiClient: ApiClient | null = null

export function getApiClient(): ApiClient {
  if (!_apiClient) {
    _apiClient = new ApiClient()
  }
  return _apiClient
}
