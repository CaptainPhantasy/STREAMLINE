/**
 * Core API Tests
 *
 * API-first testing: Verify business logic before UI.
 * These tests run WITHOUT Playwright - pure API/database testing.
 *
 * Run with: npm run test:api
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { requireValidEnvironment, TEST_USERS, TEST_ACCOUNT_SLUG } from '../setup/environment-validator'
import { ApiClient, crmApiTests } from '../helpers/api-client'
import { getDbVerifier, dbAssert } from '../helpers/database-verifier'

// Load environment
config({ path: resolve(process.cwd(), '.env.local') })

describe('Core API Tests', () => {
  let supabase: SupabaseClient
  let apiClient: ApiClient
  let authToken: string
  let accountId: string

  beforeAll(async () => {
    // Validate environment FIRST
    // This will throw with clear error if not ready
    await requireValidEnvironment()

    // Initialize clients
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    apiClient = new ApiClient('http://localhost:3000')

    // Get auth token for test user
    const testUser = TEST_USERS.find(u => u.role === 'owner')!
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    if (authError || !authData.session) {
      throw new Error(`Failed to authenticate test user: ${authError?.message}`)
    }

    authToken = authData.session.access_token
    apiClient.setAuthToken(authToken)

    // Get account ID
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('slug', TEST_ACCOUNT_SLUG)
      .single()

    if (!account) {
      throw new Error(`Test account ${TEST_ACCOUNT_SLUG} not found`)
    }

    accountId = account.id
  })

  afterAll(async () => {
    // Sign out
    await supabase.auth.signOut()
  })

  describe('Health & Connectivity', () => {
    it('should connect to database', async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('count')
        .limit(1)

      expect(error).toBeNull()
    })

    it('should respond to API requests', async () => {
      const isHealthy = await apiClient.healthCheck()
      expect(isHealthy).toBe(true)
    })
  })

  describe('Authentication', () => {
    it('should reject unauthenticated requests to protected endpoints', async () => {
      const unauthClient = new ApiClient()
      const response = await unauthClient.get('/api/jobs')

      expect(response.status).toBe(401)
    })

    it('should accept authenticated requests', async () => {
      const response = await apiClient.get('/api/jobs')

      expect(response.success).toBe(true)
      expect(response.status).toBe(200)
    })
  })

  describe('Jobs API', () => {
    let createdJobId: string | null = null

    afterAll(async () => {
      // Cleanup created job
      if (createdJobId) {
        await supabase.from('jobs').delete().eq('id', createdJobId)
      }
    })

    it('should list jobs', async () => {
      const response = await apiClient.get<{ jobs: unknown[] }>('/api/jobs')

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.jobs)).toBe(true)
    })

    it('should create a job', async () => {
      // First get a contact
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('account_id', accountId)
        .limit(1)

      if (!contacts || contacts.length === 0) {
        console.warn('No contacts available, skipping job creation test')
        return
      }

      const response = await apiClient.post<{ job: { id: string } }>('/api/jobs', {
        contact_id: contacts[0].id,
        description: 'API Test Job - ' + Date.now(),
        priority: 'medium',
      })

      expect(response.success).toBe(true)
      expect(response.data?.job?.id).toBeDefined()

      createdJobId = response.data!.job.id

      // Verify in database
      const dbJob = await dbAssert.jobCreated({
        description: response.data!.job.id ? 'API Test Job' : '',
      }).catch(() => null)

      // Job should exist in database
      const { data: verifyJob } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', createdJobId)
        .single()

      expect(verifyJob).toBeDefined()
      expect(verifyJob?.priority).toBe('medium')
    })
  })

  describe('Contacts API', () => {
    let createdContactId: string | null = null

    afterAll(async () => {
      if (createdContactId) {
        await supabase.from('contacts').delete().eq('id', createdContactId)
      }
    })

    it('should list contacts', async () => {
      const response = await apiClient.get<{ contacts: unknown[] }>('/api/contacts')

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.contacts)).toBe(true)
    })

    it('should create a contact', async () => {
      const testEmail = `api-test-${Date.now()}@test.com`

      const response = await apiClient.post<{ contact: { id: string } }>('/api/contacts', {
        email: testEmail,
        first_name: 'API',
        last_name: 'Test',
        phone: '(317) 555-9999',
      })

      expect(response.success).toBe(true)
      expect(response.data?.contact?.id).toBeDefined()

      createdContactId = response.data!.contact.id

      // Verify in database
      const contact = await dbAssert.contactCreated({ email: testEmail })
      expect(contact.first_name).toBe('API')
      expect(contact.last_name).toBe('Test')
    })

    it('should search contacts', async () => {
      const response = await apiClient.get<{ contacts: unknown[] }>('/api/contacts?search=test')

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.contacts)).toBe(true)
    })
  })

  describe('Conversations API', () => {
    it('should list conversations', async () => {
      const response = await apiClient.get<{ conversations: unknown[] }>('/api/conversations')

      expect(response.success).toBe(true)
      // May be empty array, that's okay
      expect(response.data?.conversations !== undefined || response.status === 200).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const response = await apiClient.get('/api/jobs')

      // API should respond within 2 seconds
      expect(response.responseTimeMs).toBeLessThan(2000)
    })

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        apiClient.get('/api/jobs'),
        apiClient.get('/api/contacts'),
        apiClient.get('/api/conversations'),
      ]

      const responses = await Promise.all(requests)

      // All should succeed
      responses.forEach(response => {
        expect(response.success).toBe(true)
      })
    })
  })
})
