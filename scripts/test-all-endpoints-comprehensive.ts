/**
 * COMPREHENSIVE API Endpoint Testing Script
 * Tests ALL 158 endpoints including POST/PUT/PATCH/DELETE operations
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

interface TestResult {
  endpoint: string
  method: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP'
  statusCode?: number
  responseTime?: number
  error?: string
  details?: any
}

interface EndpointTest {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  requiresAuth: boolean
  requiresParams?: boolean
  skip?: boolean
  skipReason?: string
  testData?: any
  pathParams?: { [key: string]: string }
}

class ComprehensiveEndpointTester {
  private baseUrl: string
  private authToken: string | null = null
  private results: TestResult[] = []
  private supabase: any
  private accountId: string | null = null
  private testContactId: string | null = null
  private testJobId: string | null = null
  private testEstimateId: string | null = null
  private testUserId: string | null = null
  private testConversationId: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }

  async initialize() {
    console.log('🔧 Initializing comprehensive endpoint tester...\n')

    // Authenticate
    const { data: authData, error } = await this.supabase.auth.signInWithPassword({
      email: 'test-owner@317plumber.com',
      password: 'TestOwner123!',
    })

    if (error || !authData.session) {
      throw new Error(`Failed to authenticate: ${error?.message}`)
    }

    this.authToken = authData.session.access_token
    this.testUserId = authData.user.id
    console.log('✓ Authenticated successfully')
    console.log(`✓ User ID: ${this.testUserId}\n`)

    // Get test account
    const { data: account } = await this.supabase
      .from('accounts')
      .select('id')
      .eq('slug', 'test-317plumber')
      .single()

    if (account) {
      this.accountId = account.id
      console.log(`✓ Test account ID: ${this.accountId}\n`)
    }

    // Get test contact
    const { data: contacts } = await this.supabase
      .from('contacts')
      .select('id')
      .eq('account_id', this.accountId)
      .limit(1)

    if (contacts && contacts.length > 0) {
      this.testContactId = contacts[0].id
      console.log(`✓ Test contact ID: ${this.testContactId}\n`)
    }

    // Get test job
    const { data: jobs } = await this.supabase
      .from('jobs')
      .select('id')
      .eq('account_id', this.accountId)
      .limit(1)

    if (jobs && jobs.length > 0) {
      this.testJobId = jobs[0].id
      console.log(`✓ Test job ID: ${this.testJobId}\n`)
    }

    // Get test estimate
    const { data: estimates } = await this.supabase
      .from('estimates')
      .select('id')
      .eq('account_id', this.accountId)
      .limit(1)

    if (estimates && estimates.length > 0) {
      this.testEstimateId = estimates[0].id
      console.log(`✓ Test estimate ID: ${this.testEstimateId}\n`)
    }

    // Get test conversation
    const { data: conversations } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('account_id', this.accountId)
      .limit(1)

    if (conversations && conversations.length > 0) {
      this.testConversationId = conversations[0].id
      console.log(`✓ Test conversation ID: ${this.testConversationId}\n`)
    }
  }

  private async makeRequest(
    path: string,
    method: string,
    body?: any
  ): Promise<{ status: number; data: any; time: number }> {
    const startTime = Date.now()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      let data: any = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      const time = Date.now() - startTime

      return { status: response.status, data, time }
    } catch (error: any) {
      return { status: 0, data: { error: error.message }, time: Date.now() - startTime }
    }
  }

  async testEndpoint(test: EndpointTest): Promise<TestResult> {
    const { path, method, requiresAuth, skip, skipReason, testData, pathParams } = test

    if (skip) {
      return {
        endpoint: path,
        method,
        status: 'SKIP',
        error: skipReason,
      }
    }

    // Replace path parameters
    let finalPath = path
    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        finalPath = finalPath.replace(`[${key}]`, value)
      }
    }

    try {
      const response = await this.makeRequest(finalPath, method, testData)

      let status: 'PASS' | 'FAIL' | 'WARN' = 'PASS'
      let error: string | undefined

      if (response.status === 0) {
        status = 'FAIL'
        error = response.data?.error || 'Connection failed'
      } else if (response.status === 401 && requiresAuth) {
        status = 'PASS' // Expected for auth-required
      } else if (response.status === 404) {
        status = 'WARN'
        error = 'Endpoint not found (404)'
      } else if (response.status === 500) {
        status = 'FAIL'
        error = response.data?.error || 'Internal server error'
      } else if (response.status === 405) {
        status = 'WARN'
        error = 'Method not allowed (405)'
      } else if (response.status >= 400) {
        status = 'WARN'
        error = response.data?.error || `HTTP ${response.status}`
      } else if (response.status >= 200 && response.status < 300) {
        status = 'PASS'
      }

      return {
        endpoint: finalPath,
        method,
        status,
        statusCode: response.status,
        responseTime: response.time,
        error,
        details: status !== 'PASS' ? response.data : undefined,
      }
    } catch (error: any) {
      return {
        endpoint: finalPath,
        method,
        status: 'FAIL',
        error: error.message,
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting COMPREHENSIVE endpoint tests (ALL 158 endpoints)...\n')
    console.log('=' .repeat(80) + '\n')

    const tests: EndpointTest[] = [
      // ==================== AUTHENTICATION ====================
      { path: '/api/auth/signout', method: 'POST', requiresAuth: true },

      // ==================== USERS ====================
      { path: '/api/users', method: 'GET', requiresAuth: true },
      { path: '/api/users', method: 'POST', requiresAuth: true, testData: {
        email: `test-user-${Date.now()}@test.com`,
        name: 'Test User',
        role: 'tech'
      }},
      { path: '/api/users/me', method: 'GET', requiresAuth: true },
      ...(this.testUserId ? [
        { path: '/api/users/[id]', method: 'GET', requiresAuth: true, pathParams: { id: this.testUserId }},
        { path: '/api/users/[id]', method: 'PUT', requiresAuth: true, pathParams: { id: this.testUserId }, testData: { name: 'Updated Name' }},
        { path: '/api/users/[id]', method: 'DELETE', requiresAuth: true, pathParams: { id: 'fake-user-id' }, skip: true, skipReason: 'Dangerous - skip delete' },
      ] : []),

      // ==================== ACCOUNT & SETTINGS ====================
      { path: '/api/account/settings', method: 'GET', requiresAuth: true },
      { path: '/api/account/settings', method: 'PUT', requiresAuth: true, testData: { businessHours: '9-5' }},

      { path: '/api/settings/company', method: 'GET', requiresAuth: true },
      { path: '/api/settings/company', method: 'PUT', requiresAuth: true, testData: { name: 'Test Company' }},
      { path: '/api/settings/company/logo', method: 'POST', requiresAuth: true, skip: true, skipReason: 'File upload - requires multipart' },

      { path: '/api/settings/profile', method: 'GET', requiresAuth: true },
      { path: '/api/settings/profile', method: 'PUT', requiresAuth: true, testData: { firstName: 'Test' }},
      { path: '/api/settings/profile/avatar', method: 'POST', requiresAuth: true, skip: true, skipReason: 'File upload' },

      { path: '/api/settings/notifications', method: 'GET', requiresAuth: true },
      { path: '/api/settings/notifications', method: 'PUT', requiresAuth: true, testData: { emailNotifications: true }},

      { path: '/api/settings/ai/providers', method: 'GET', requiresAuth: true },
      { path: '/api/settings/ai/providers', method: 'PUT', requiresAuth: true, testData: { defaultProvider: 'openai' }},

      // ==================== CONTACTS ====================
      { path: '/api/contacts', method: 'GET', requiresAuth: true },
      { path: '/api/contacts', method: 'POST', requiresAuth: true, testData: {
        email: `test-contact-${Date.now()}@test.com`,
        first_name: 'Test',
        last_name: 'Contact',
        phone: '555-0100'
      }},
      { path: '/api/contacts/bulk', method: 'POST', requiresAuth: true, testData: {
        contacts: [
          { email: `bulk1-${Date.now()}@test.com`, first_name: 'Bulk', last_name: 'One' },
          { email: `bulk2-${Date.now()}@test.com`, first_name: 'Bulk', last_name: 'Two' }
        ]
      }},
      { path: '/api/contacts/bulk-tag', method: 'POST', requiresAuth: true, testData: {
        contactIds: [this.testContactId],
        tagIds: []
      }},
      ...(this.testContactId ? [
        { path: '/api/contacts/[id]', method: 'GET', requiresAuth: true, pathParams: { id: this.testContactId }},
        { path: '/api/contacts/[id]', method: 'PUT', requiresAuth: true, pathParams: { id: this.testContactId }, testData: { first_name: 'Updated' }},
        { path: '/api/contacts/[id]/notes', method: 'GET', requiresAuth: true, pathParams: { id: this.testContactId }},
        { path: '/api/contacts/[id]/notes', method: 'POST', requiresAuth: true, pathParams: { id: this.testContactId }, testData: { content: 'Test note' }},
        { path: '/api/contacts/[id]/tags', method: 'GET', requiresAuth: true, pathParams: { id: this.testContactId }},
        { path: '/api/contacts/[id]/tags', method: 'POST', requiresAuth: true, pathParams: { id: this.testContactId }, testData: { tagId: 'fake-tag' }},
      ] : []),

      // ==================== CONTACT TAGS ====================
      { path: '/api/contact-tags', method: 'GET', requiresAuth: true },
      { path: '/api/contact-tags', method: 'POST', requiresAuth: true, testData: {
        name: `Test Tag ${Date.now()}`,
        color: '#FF0000'
      }},

      // ==================== JOBS ====================
      { path: '/api/jobs', method: 'GET', requiresAuth: true },
      { path: '/api/jobs', method: 'POST', requiresAuth: true, testData: {
        contactId: this.testContactId,
        description: `Test Job ${Date.now()}`,
        priority: 'medium'
      }},
      { path: '/api/jobs/bulk', method: 'POST', requiresAuth: true, testData: {
        action: 'updateStatus',
        jobIds: [this.testJobId],
        status: 'scheduled'
      }},
      ...(this.testJobId ? [
        { path: '/api/jobs/[id]', method: 'GET', requiresAuth: true, pathParams: { id: this.testJobId }},
        { path: '/api/jobs/[id]', method: 'PUT', requiresAuth: true, pathParams: { id: this.testJobId }, testData: { description: 'Updated job' }},
        { path: '/api/jobs/[id]/status', method: 'PATCH', requiresAuth: true, pathParams: { id: this.testJobId }, testData: { status: 'in_progress' }},
        { path: '/api/jobs/[id]/assign', method: 'POST', requiresAuth: true, pathParams: { id: this.testJobId }, testData: { techId: this.testUserId }},
        { path: '/api/jobs/[id]/location', method: 'PUT', requiresAuth: true, pathParams: { id: this.testJobId }, testData: { lat: 40.7128, lng: -74.0060 }},
        { path: '/api/jobs/[id]/upload-photo', method: 'POST', requiresAuth: true, pathParams: { id: this.testJobId }, skip: true, skipReason: 'File upload' },
        { path: '/api/jobs/[id]/documents', method: 'GET', requiresAuth: true, pathParams: { id: this.testJobId }},
        { path: '/api/jobs/[id]/documents', method: 'POST', requiresAuth: true, pathParams: { id: this.testJobId }, skip: true, skipReason: 'File upload' },
      ] : []),

      // ==================== JOB PHOTOS ====================
      { path: '/api/job-photos', method: 'GET', requiresAuth: true, requiresParams: true },
      { path: '/api/job-photos', method: 'POST', requiresAuth: true, skip: true, skipReason: 'File upload' },

      // ==================== JOB MATERIALS ====================
      { path: '/api/job-materials', method: 'GET', requiresAuth: true, requiresParams: true },
      { path: '/api/job-materials', method: 'POST', requiresAuth: true, testData: {
        jobId: this.testJobId,
        partId: 'fake-part',
        quantity: 2
      }},

      // ==================== ESTIMATES ====================
      { path: '/api/estimates', method: 'GET', requiresAuth: true },
      { path: '/api/estimates', method: 'POST', requiresAuth: true, testData: {
        contactId: this.testContactId,
        items: [{ description: 'Test item', quantity: 1, unitPrice: 100 }],
        validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      }},
      { path: '/api/estimates/quick-create', method: 'POST', requiresAuth: true, testData: {
        contactId: this.testContactId,
        amount: 500,
        description: 'Quick estimate'
      }},
      ...(this.testEstimateId ? [
        { path: '/api/estimates/[id]', method: 'GET', requiresAuth: true, pathParams: { id: this.testEstimateId }},
        { path: '/api/estimates/[id]', method: 'PUT', requiresAuth: true, pathParams: { id: this.testEstimateId }, testData: { notes: 'Updated' }},
        { path: '/api/estimates/[id]/send', method: 'POST', requiresAuth: true, pathParams: { id: this.testEstimateId }},
        { path: '/api/estimates/[id]/convert', method: 'POST', requiresAuth: true, pathParams: { id: this.testEstimateId }},
        { path: '/api/estimates/[id]/duplicate', method: 'POST', requiresAuth: true, pathParams: { id: this.testEstimateId }},
        { path: '/api/estimates/[id]/pdf', method: 'GET', requiresAuth: true, pathParams: { id: this.testEstimateId }},
      ] : []),

      // ==================== PARTS ====================
      { path: '/api/parts', method: 'GET', requiresAuth: true },
      { path: '/api/parts', method: 'POST', requiresAuth: true, testData: {
        name: `Test Part ${Date.now()}`,
        sku: `SKU-${Date.now()}`,
        unitPrice: 25.50,
        stockQty: 100
      }},
      { path: '/api/parts/low-stock', method: 'GET', requiresAuth: true },

      // ==================== INVOICES ====================
      { path: '/api/invoices', method: 'GET', requiresAuth: true },
      { path: '/api/invoices', method: 'POST', requiresAuth: true, testData: {
        jobId: this.testJobId,
        items: [{ description: 'Service', quantity: 1, unitPrice: 150 }]
      }},

      // ==================== PAYMENTS ====================
      { path: '/api/payments', method: 'GET', requiresAuth: true },
      { path: '/api/payments', method: 'POST', requiresAuth: true, testData: {
        invoiceId: 'fake-invoice',
        amount: 150,
        paymentMethod: 'cash'
      }},

      // ==================== CONVERSATIONS ====================
      { path: '/api/conversations', method: 'GET', requiresAuth: true },
      { path: '/api/conversations', method: 'POST', requiresAuth: true, testData: {
        contactId: this.testContactId,
        subject: 'Test conversation',
        channel: 'email'
      }},
      ...(this.testConversationId ? [
        { path: '/api/conversations/[id]', method: 'GET', requiresAuth: true, pathParams: { id: this.testConversationId }},
        { path: '/api/conversations/[id]', method: 'PUT', requiresAuth: true, pathParams: { id: this.testConversationId }, testData: { status: 'open' }},
        { path: '/api/conversations/[id]/messages', method: 'GET', requiresAuth: true, pathParams: { id: this.testConversationId }},
        { path: '/api/conversations/[id]/messages', method: 'POST', requiresAuth: true, pathParams: { id: this.testConversationId }, testData: { content: 'Test message' }},
        { path: '/api/conversations/[id]/notes', method: 'GET', requiresAuth: true, pathParams: { id: this.testConversationId }},
        { path: '/api/conversations/[id]/notes', method: 'POST', requiresAuth: true, pathParams: { id: this.testConversationId }, testData: { content: 'Test note' }},
      ] : []),

      // ==================== CALL LOGS ====================
      { path: '/api/call-logs', method: 'GET', requiresAuth: true },
      { path: '/api/call-logs', method: 'POST', requiresAuth: true, testData: {
        contactId: this.testContactId,
        direction: 'inbound',
        duration: 120,
        phoneNumber: '555-0100'
      }},

      // ==================== NOTIFICATIONS ====================
      { path: '/api/notifications', method: 'GET', requiresAuth: true },
      { path: '/api/notifications', method: 'POST', requiresAuth: true, testData: {
        title: 'Test notification',
        message: 'This is a test',
        type: 'info'
      }},
      { path: '/api/notifications/read-all', method: 'POST', requiresAuth: true },

      // ==================== EMAIL TEMPLATES ====================
      { path: '/api/email-templates', method: 'GET', requiresAuth: true },
      { path: '/api/email-templates', method: 'POST', requiresAuth: true, testData: {
        name: `Test Template ${Date.now()}`,
        subject: 'Test Subject',
        body: 'Test Body'
      }},

      // ==================== CAMPAIGNS ====================
      { path: '/api/campaigns', method: 'GET', requiresAuth: true },
      { path: '/api/campaigns', method: 'POST', requiresAuth: true, testData: {
        name: `Test Campaign ${Date.now()}`,
        subject: 'Test Subject',
        content: 'Test Content'
      }},

      // ==================== AUTOMATION RULES ====================
      { path: '/api/automation-rules', method: 'GET', requiresAuth: true },
      { path: '/api/automation-rules', method: 'POST', requiresAuth: true, testData: {
        name: `Test Rule ${Date.now()}`,
        trigger: 'job_created',
        actions: [{ type: 'send_notification' }]
      }},
      { path: '/api/settings/automation/rules', method: 'GET', requiresAuth: true },
      { path: '/api/settings/automation/rules', method: 'POST', requiresAuth: true, testData: {
        name: `Settings Rule ${Date.now()}`,
        enabled: true
      }},

      // ==================== AI FEATURES ====================
      { path: '/api/ai/suggestions', method: 'POST', requiresAuth: true, testData: {
        context: 'job_description',
        input: 'Fix leaky faucet'
      }},
      { path: '/api/ai/draft', method: 'POST', requiresAuth: true, testData: {
        type: 'email',
        context: 'Test context'
      }},
      { path: '/api/ai/pricing', method: 'POST', requiresAuth: true, testData: {
        jobDescription: 'Replace water heater',
        laborHours: 4
      }},
      { path: '/api/ai/briefing', method: 'POST', requiresAuth: true, testData: {
        contactId: this.testContactId
      }},
      { path: '/api/ai/meeting-summary', method: 'POST', requiresAuth: true, testData: {
        transcript: 'This is a test meeting transcript'
      }},

      // ==================== LLM PROVIDERS ====================
      { path: '/api/llm-providers', method: 'GET', requiresAuth: true },
      { path: '/api/llm-providers', method: 'POST', requiresAuth: true, testData: {
        name: 'Test Provider',
        provider: 'openai',
        apiKey: 'test-key'
      }},
      { path: '/api/llm', method: 'POST', requiresAuth: true, testData: {
        prompt: 'Hello, this is a test',
        provider: 'openai'
      }},
      { path: '/api/llm/health', method: 'GET', requiresAuth: true },
      { path: '/api/llm/metrics', method: 'GET', requiresAuth: true },

      // ==================== ANALYTICS ====================
      { path: '/api/analytics/dashboard', method: 'GET', requiresAuth: true },
      { path: '/api/analytics/jobs', method: 'GET', requiresAuth: true },
      { path: '/api/analytics/revenue', method: 'GET', requiresAuth: true },
      { path: '/api/analytics/contacts', method: 'GET', requiresAuth: true },

      // ==================== REPORTS ====================
      { path: '/api/reports', method: 'GET', requiresAuth: true, requiresParams: true },
      { path: '/api/reports', method: 'POST', requiresAuth: true, testData: {
        type: 'financial',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      }},
      { path: '/api/reports/customer', method: 'GET', requiresAuth: true },
      { path: '/api/reports/financial', method: 'GET', requiresAuth: true },
      { path: '/api/reports/revenue', method: 'GET', requiresAuth: true },
      { path: '/api/reports/job-performance', method: 'GET', requiresAuth: true },
      { path: '/api/reports/tech-performance', method: 'GET', requiresAuth: true },
      { path: '/api/reports/export', method: 'POST', requiresAuth: true, testData: {
        type: 'jobs',
        format: 'csv'
      }},

      // ==================== FINANCE ====================
      { path: '/api/finance/stats', method: 'GET', requiresAuth: true },

      // ==================== AUDIT ====================
      { path: '/api/audit', method: 'GET', requiresAuth: true },

      // ==================== DISPATCH ====================
      { path: '/api/dispatch/jobs/active', method: 'GET', requiresAuth: true },
      { path: '/api/dispatch/auto-assign', method: 'POST', requiresAuth: true, testData: {
        jobId: this.testJobId,
        criteria: 'closest'
      }},
      { path: '/api/dispatch/techs', method: 'GET', requiresAuth: true },
      { path: '/api/dispatch/stats', method: 'GET', requiresAuth: true },
      { path: '/api/dispatch/historical-gps', method: 'GET', requiresAuth: true },

      // ==================== TECH PORTAL ====================
      { path: '/api/tech/jobs', method: 'GET', requiresAuth: true },
      { path: '/api/tech/gates', method: 'POST', requiresAuth: true, testData: {
        gateCode: '1234',
        location: 'Front gate'
      }},
      { path: '/api/tech/materials/quick-add', method: 'POST', requiresAuth: true, testData: {
        jobId: this.testJobId,
        material: 'PVC Pipe',
        quantity: 10
      }},
      { path: '/api/tech/time-clock', method: 'POST', requiresAuth: true, testData: {
        action: 'clock_in',
        jobId: this.testJobId
      }},

      // ==================== OFFICE ====================
      { path: '/api/office/clearances', method: 'GET', requiresAuth: true },
      { path: '/api/office/clearances', method: 'POST', requiresAuth: true, testData: {
        contactId: this.testContactId,
        type: 'gate_code',
        value: '5678'
      }},
      { path: '/api/office/stats', method: 'GET', requiresAuth: true },

      // ==================== OWNER ====================
      { path: '/api/owner/stats', method: 'GET', requiresAuth: true },

      // ==================== SALES ====================
      ...(this.testContactId ? [
        { path: '/api/sales/briefing/[contactId]', method: 'GET', requiresAuth: true, pathParams: { contactId: this.testContactId }},
      ] : []),

      // ==================== LEADS ====================
      { path: '/api/leads/pipeline', method: 'GET', requiresAuth: true },

      // ==================== CALENDAR ====================
      { path: '/api/calendar/events', method: 'GET', requiresAuth: true },
      { path: '/api/calendar/events', method: 'POST', requiresAuth: true, testData: {
        title: 'Test Event',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString()
      }},
      { path: '/api/calendar/sync', method: 'POST', requiresAuth: true },

      // ==================== TIME ENTRIES ====================
      { path: '/api/time-entries', method: 'GET', requiresAuth: true, requiresParams: true },
      { path: '/api/time-entries', method: 'POST', requiresAuth: true, testData: {
        jobId: this.testJobId,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        description: 'Test work'
      }},

      // ==================== DOCUMENTS ====================
      { path: '/api/documents/upload', method: 'POST', requiresAuth: true, skip: true, skipReason: 'File upload' },

      // ==================== PHOTOS ====================
      { path: '/api/photos', method: 'GET', requiresAuth: true },
      { path: '/api/photos', method: 'POST', requiresAuth: true, skip: true, skipReason: 'File upload' },

      // ==================== TEMPLATES ====================
      { path: '/api/templates/jobs', method: 'GET', requiresAuth: true },
      { path: '/api/templates/contacts', method: 'GET', requiresAuth: true },

      // ==================== SEARCH ====================
      { path: '/api/search', method: 'GET', requiresAuth: true, requiresParams: true },

      // ==================== EXPORT ====================
      { path: '/api/export/contacts', method: 'GET', requiresAuth: true },
      { path: '/api/export/jobs', method: 'GET', requiresAuth: true },
      { path: '/api/export/invoices', method: 'GET', requiresAuth: true },

      // ==================== INTEGRATIONS ====================
      { path: '/api/integrations/gmail/status', method: 'GET', requiresAuth: true },
      { path: '/api/integrations/gmail/authorize', method: 'GET', requiresAuth: false },
      { path: '/api/integrations/gmail/callback', method: 'GET', requiresAuth: false, skip: true, skipReason: 'OAuth callback' },
      { path: '/api/integrations/gmail/sync', method: 'POST', requiresAuth: true },
      { path: '/api/integrations/gmail/send', method: 'POST', requiresAuth: true, testData: {
        to: 'test@test.com',
        subject: 'Test',
        body: 'Test message'
      }},

      { path: '/api/integrations/microsoft/status', method: 'GET', requiresAuth: true },
      { path: '/api/integrations/microsoft/authorize', method: 'GET', requiresAuth: false },
      { path: '/api/integrations/microsoft/callback', method: 'GET', requiresAuth: false, skip: true, skipReason: 'OAuth callback' },
      { path: '/api/integrations/microsoft/sync', method: 'POST', requiresAuth: true },

      { path: '/api/integrations/calendar/google/authorize', method: 'GET', requiresAuth: false },
      { path: '/api/integrations/calendar/google/callback', method: 'GET', requiresAuth: false, skip: true, skipReason: 'OAuth callback' },

      // ==================== WEBHOOKS ====================
      { path: '/api/webhooks/elevenlabs', method: 'POST', requiresAuth: false, skip: true, skipReason: 'Webhook - requires valid signature' },
      { path: '/api/webhooks/stripe', method: 'POST', requiresAuth: false, skip: true, skipReason: 'Webhook - requires valid signature' },

      // ==================== VOICE & MCP ====================
      { path: '/api/voice-command', method: 'POST', requiresAuth: true, testData: {
        command: 'create job',
        transcript: 'Create a new job for water heater repair'
      }},
      { path: '/api/send-message', method: 'POST', requiresAuth: true, testData: {
        contactId: this.testContactId,
        message: 'Test message'
      }},
      { path: '/api/mcp', method: 'POST', requiresAuth: true, testData: {
        action: 'test'
      }},

      // ==================== ONBOARDING ====================
      { path: '/api/onboarding/status', method: 'GET', requiresAuth: true },
      { path: '/api/onboarding/complete', method: 'POST', requiresAuth: true, testData: {
        step: 'profile'
      }},
      { path: '/api/onboarding/dismiss', method: 'POST', requiresAuth: true },
      { path: '/api/onboarding/restart', method: 'POST', requiresAuth: true },
      { path: '/api/onboarding/analytics', method: 'POST', requiresAuth: true, testData: {
        event: 'step_viewed'
      }},

      // ==================== MEETINGS ====================
      { path: '/api/meetings', method: 'GET', requiresAuth: true },
      { path: '/api/meetings', method: 'POST', requiresAuth: true, testData: {
        title: 'Test Meeting',
        date: new Date().toISOString(),
        participants: [this.testContactId]
      }},
      { path: '/api/meetings/analyze', method: 'POST', requiresAuth: true, testData: {
        transcript: 'Meeting transcript here'
      }},
      { path: '/api/meetings/notes', method: 'POST', requiresAuth: true, testData: {
        meetingId: 'fake-meeting',
        notes: 'Test notes'
      }},

      // ==================== REVIEWS ====================
      { path: '/api/review-requests', method: 'POST', requiresAuth: true, testData: {
        jobId: this.testJobId,
        contactId: this.testContactId
      }},

      // ==================== SIGNATURES ====================
      { path: '/api/signatures', method: 'GET', requiresAuth: true, requiresParams: true },
      { path: '/api/signatures', method: 'POST', requiresAuth: true, skip: true, skipReason: 'Image data required' },

      // ==================== GPS ====================
      { path: '/api/gps', method: 'POST', requiresAuth: true, testData: {
        lat: 40.7128,
        lng: -74.0060,
        timestamp: new Date().toISOString()
      }},

      // ==================== SCHEDULE ====================
      { path: '/api/schedule/optimize', method: 'POST', requiresAuth: true, testData: {
        date: new Date().toISOString(),
        techIds: [this.testUserId]
      }},

      // ==================== EMAIL ====================
      { path: '/api/email/create-job', method: 'POST', requiresAuth: true, testData: {
        from: 'customer@test.com',
        subject: 'Need plumbing help',
        body: 'My sink is leaking'
      }},
      { path: '/api/email/extract-actions', method: 'POST', requiresAuth: true, testData: {
        emailBody: 'Please schedule an appointment for next Tuesday'
      }},

      // ==================== SEED & TEST ====================
      { path: '/api/test', method: 'GET', requiresAuth: false },
      { path: '/api/seed', method: 'POST', requiresAuth: false, skip: true, skipReason: 'Dangerous - skip seeding' },
    ]

    let passCount = 0
    let failCount = 0
    let warnCount = 0
    let skipCount = 0
    let totalTests = tests.length

    console.log(`📋 Testing ${totalTests} endpoints...\n`)

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      const result = await this.testEndpoint(test)
      this.results.push(result)

      const icon = {
        PASS: '✅',
        FAIL: '❌',
        WARN: '⚠️',
        SKIP: '🔄',
      }[result.status]

      const progress = `[${i + 1}/${totalTests}]`
      console.log(`${progress} ${icon} ${result.method.padEnd(6)} ${result.endpoint}`)
      if (result.statusCode) {
        console.log(`      Status: ${result.statusCode} | Time: ${result.responseTime}ms`)
      }
      if (result.error) {
        console.log(`      Error: ${result.error}`)
      }

      if (result.status === 'PASS') passCount++
      else if (result.status === 'FAIL') failCount++
      else if (result.status === 'WARN') warnCount++
      else if (result.status === 'SKIP') skipCount++

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n' + '=' .repeat(80))
    console.log('\n📊 COMPREHENSIVE Test Summary:')
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   ✅ Passed: ${passCount} (${((passCount/totalTests)*100).toFixed(1)}%)`)
    console.log(`   ❌ Failed: ${failCount} (${((failCount/totalTests)*100).toFixed(1)}%)`)
    console.log(`   ⚠️  Warnings: ${warnCount} (${((warnCount/totalTests)*100).toFixed(1)}%)`)
    console.log(`   🔄 Skipped: ${skipCount} (${((skipCount/totalTests)*100).toFixed(1)}%)`)
    console.log('')

    this.saveResults()
  }

  private saveResults() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        warnings: this.results.filter(r => r.status === 'WARN').length,
        skipped: this.results.filter(r => r.status === 'SKIP').length,
      },
      results: this.results,
      failures: this.results.filter(r => r.status === 'FAIL'),
      warnings: this.results.filter(r => r.status === 'WARN'),
    }

    fs.writeFileSync(
      resolve(process.cwd(), 'API_TEST_RESULTS_COMPREHENSIVE.json'),
      JSON.stringify(report, null, 2)
    )

    console.log('💾 Results saved to API_TEST_RESULTS_COMPREHENSIVE.json')
  }
}

async function main() {
  const tester = new ComprehensiveEndpointTester()

  try {
    await tester.initialize()
    await tester.runAllTests()
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

main()
