/**
 * Database Verifier
 *
 * AI agents need to verify that UI actions produce actual database changes.
 * This module provides type-safe, assertion-friendly database verification.
 *
 * Design Principle: DATABASE IS SOURCE OF TRUTH
 * UI tests should verify state changes in the database, not just visual elements.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

export interface VerificationResult<T> {
  success: boolean
  data: T | null
  error: string | null
  query: string
  executionTimeMs: number
}

export interface JobRecord {
  id: string
  account_id: string
  contact_id: string | null
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}

export interface ContactRecord {
  id: string
  account_id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  created_at: string
}

export interface UserRecord {
  id: string
  account_id: string
  role: string
  full_name: string
  email?: string
}

export interface ConversationRecord {
  id: string
  account_id: string
  contact_id: string
  channel: string
  status: string
  created_at: string
}

export class DatabaseVerifier {
  private supabase: SupabaseClient

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('DatabaseVerifier requires SUPABASE_URL and SERVICE_ROLE_KEY')
    }

    this.supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  /**
   * Verify a job was created with expected properties
   * Use after UI "Create Job" action
   */
  async verifyJobCreated(
    criteria: Partial<JobRecord> & { description: string }
  ): Promise<VerificationResult<JobRecord>> {
    const startTime = Date.now()
    const query = `jobs.select(*).match(${JSON.stringify(criteria)})`

    try {
      let queryBuilder = this.supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      // Apply criteria
      if (criteria.description) {
        queryBuilder = queryBuilder.eq('description', criteria.description)
      }
      if (criteria.account_id) {
        queryBuilder = queryBuilder.eq('account_id', criteria.account_id)
      }
      if (criteria.status) {
        queryBuilder = queryBuilder.eq('status', criteria.status)
      }

      const { data, error } = await queryBuilder.single()

      return {
        success: !error && !!data,
        data: data as JobRecord | null,
        error: error?.message || null,
        query,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Exception: ${error}`,
        query,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Verify a job status was updated
   * Use after UI status change action
   */
  async verifyJobStatus(
    jobId: string,
    expectedStatus: string
  ): Promise<VerificationResult<JobRecord>> {
    const startTime = Date.now()
    const query = `jobs.select(*).eq(id, ${jobId})`

    try {
      const { data, error } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      const statusMatches = data?.status === expectedStatus

      return {
        success: !error && statusMatches,
        data: data as JobRecord | null,
        error: error?.message || (statusMatches ? null : `Expected status '${expectedStatus}', got '${data?.status}'`),
        query,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Exception: ${error}`,
        query,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Verify a contact was created
   * Use after UI "Add Contact" action
   */
  async verifyContactCreated(
    criteria: Partial<ContactRecord> & { email: string }
  ): Promise<VerificationResult<ContactRecord>> {
    const startTime = Date.now()
    const query = `contacts.select(*).eq(email, ${criteria.email})`

    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('email', criteria.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Verify additional criteria if provided
      let criteriaMatch = true
      let mismatchReason = ''

      if (data && criteria.first_name && data.first_name !== criteria.first_name) {
        criteriaMatch = false
        mismatchReason = `first_name: expected '${criteria.first_name}', got '${data.first_name}'`
      }
      if (data && criteria.last_name && data.last_name !== criteria.last_name) {
        criteriaMatch = false
        mismatchReason = `last_name: expected '${criteria.last_name}', got '${data.last_name}'`
      }

      return {
        success: !error && !!data && criteriaMatch,
        data: data as ContactRecord | null,
        error: error?.message || (criteriaMatch ? null : mismatchReason),
        query,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Exception: ${error}`,
        query,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Verify a user exists with expected role
   * Use for auth verification
   */
  async verifyUserExists(
    email: string,
    expectedRole?: string
  ): Promise<VerificationResult<UserRecord>> {
    const startTime = Date.now()
    const query = `auth.users + users.select(*)`

    try {
      // First check auth.users
      const { data: authUsers, error: authError } = await this.supabase.auth.admin.listUsers()

      if (authError) {
        return {
          success: false,
          data: null,
          error: `Auth query failed: ${authError.message}`,
          query,
          executionTimeMs: Date.now() - startTime,
        }
      }

      const authUser = authUsers?.users?.find(u => u.email === email)

      if (!authUser) {
        return {
          success: false,
          data: null,
          error: `User with email '${email}' not found in auth.users`,
          query,
          executionTimeMs: Date.now() - startTime,
        }
      }

      // Now check public.users for role
      const { data: publicUser, error: publicError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (publicError || !publicUser) {
        return {
          success: false,
          data: null,
          error: `User exists in auth but not in public.users table`,
          query,
          executionTimeMs: Date.now() - startTime,
        }
      }

      // Check role if specified
      if (expectedRole && publicUser.role !== expectedRole) {
        return {
          success: false,
          data: { ...publicUser, email } as UserRecord,
          error: `Expected role '${expectedRole}', got '${publicUser.role}'`,
          query,
          executionTimeMs: Date.now() - startTime,
        }
      }

      return {
        success: true,
        data: { ...publicUser, email } as UserRecord,
        error: null,
        query,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Exception: ${error}`,
        query,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Verify record count matches expectation
   * Use for bulk operations or list verification
   */
  async verifyRecordCount(
    table: string,
    criteria: Record<string, unknown>,
    expectedCount: number,
    comparison: 'exact' | 'atLeast' | 'atMost' = 'exact'
  ): Promise<VerificationResult<{ count: number }>> {
    const startTime = Date.now()
    const query = `${table}.select(count).match(${JSON.stringify(criteria)})`

    try {
      let queryBuilder = this.supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      // Apply criteria
      for (const [key, value] of Object.entries(criteria)) {
        queryBuilder = queryBuilder.eq(key, value)
      }

      const { count, error } = await queryBuilder

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
          query,
          executionTimeMs: Date.now() - startTime,
        }
      }

      const actualCount = count || 0
      let matches = false
      let reason = ''

      switch (comparison) {
        case 'exact':
          matches = actualCount === expectedCount
          reason = `Expected exactly ${expectedCount}, got ${actualCount}`
          break
        case 'atLeast':
          matches = actualCount >= expectedCount
          reason = `Expected at least ${expectedCount}, got ${actualCount}`
          break
        case 'atMost':
          matches = actualCount <= expectedCount
          reason = `Expected at most ${expectedCount}, got ${actualCount}`
          break
      }

      return {
        success: matches,
        data: { count: actualCount },
        error: matches ? null : reason,
        query,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Exception: ${error}`,
        query,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Wait for a condition to be true (with timeout)
   * Use when UI action triggers async database update
   */
  async waitForCondition<T>(
    checkFn: () => Promise<VerificationResult<T>>,
    options: {
      timeoutMs?: number
      intervalMs?: number
      description?: string
    } = {}
  ): Promise<VerificationResult<T>> {
    const { timeoutMs = 5000, intervalMs = 500, description = 'condition' } = options
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const result = await checkFn()

      if (result.success) {
        return result
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }

    return {
      success: false,
      data: null,
      error: `Timeout waiting for ${description} after ${timeoutMs}ms`,
      query: 'waitForCondition',
      executionTimeMs: Date.now() - startTime,
    }
  }

  /**
   * Get test account ID
   * Use this to get the correct account_id for test data
   */
  async getTestAccountId(slug: string = '317-plumber'): Promise<string | null> {
    const { data } = await this.supabase
      .from('accounts')
      .select('id')
      .eq('slug', slug)
      .single()

    return data?.id || null
  }

  /**
   * Clean up test data created during a test
   * Use in test.afterEach or test.afterAll
   */
  async cleanupTestData(options: {
    jobIds?: string[]
    contactIds?: string[]
    conversationIds?: string[]
  }): Promise<void> {
    const { jobIds, contactIds, conversationIds } = options

    if (jobIds && jobIds.length > 0) {
      await this.supabase.from('jobs').delete().in('id', jobIds)
    }

    if (conversationIds && conversationIds.length > 0) {
      // Delete messages first (foreign key)
      await this.supabase.from('messages').delete().in('conversation_id', conversationIds)
      await this.supabase.from('conversations').delete().in('id', conversationIds)
    }

    if (contactIds && contactIds.length > 0) {
      await this.supabase.from('contacts').delete().in('id', contactIds)
    }
  }
}

// Singleton instance for convenience
let _instance: DatabaseVerifier | null = null

export function getDbVerifier(): DatabaseVerifier {
  if (!_instance) {
    _instance = new DatabaseVerifier()
  }
  return _instance
}

/**
 * Assertion helpers for use in tests
 * These throw with clear error messages for AI agents
 */
export const dbAssert = {
  async jobCreated(criteria: Partial<JobRecord> & { description: string }): Promise<JobRecord> {
    const result = await getDbVerifier().verifyJobCreated(criteria)
    if (!result.success) {
      throw new Error(`DB Assertion Failed: Job not created. ${result.error}\nQuery: ${result.query}`)
    }
    return result.data!
  },

  async jobStatus(jobId: string, expectedStatus: string): Promise<JobRecord> {
    const result = await getDbVerifier().verifyJobStatus(jobId, expectedStatus)
    if (!result.success) {
      throw new Error(`DB Assertion Failed: Job status mismatch. ${result.error}\nQuery: ${result.query}`)
    }
    return result.data!
  },

  async contactCreated(criteria: Partial<ContactRecord> & { email: string }): Promise<ContactRecord> {
    const result = await getDbVerifier().verifyContactCreated(criteria)
    if (!result.success) {
      throw new Error(`DB Assertion Failed: Contact not created. ${result.error}\nQuery: ${result.query}`)
    }
    return result.data!
  },

  async userExists(email: string, expectedRole?: string): Promise<UserRecord> {
    const result = await getDbVerifier().verifyUserExists(email, expectedRole)
    if (!result.success) {
      throw new Error(`DB Assertion Failed: User not found. ${result.error}\nQuery: ${result.query}`)
    }
    return result.data!
  },

  async recordCount(
    table: string,
    criteria: Record<string, unknown>,
    expectedCount: number,
    comparison: 'exact' | 'atLeast' | 'atMost' = 'exact'
  ): Promise<number> {
    const result = await getDbVerifier().verifyRecordCount(table, criteria, expectedCount, comparison)
    if (!result.success) {
      throw new Error(`DB Assertion Failed: Record count mismatch. ${result.error}\nQuery: ${result.query}`)
    }
    return result.data!.count
  },
}
