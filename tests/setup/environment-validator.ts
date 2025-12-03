/**
 * Environment Validator
 *
 * CRITICAL: This MUST run before any tests execute.
 * Validates that test environment is properly configured.
 *
 * Design Principle: FAIL FAST with clear error messages
 * AI agents need explicit, actionable failure reasons.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

export interface EnvironmentStatus {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config: {
    supabaseUrl: string | null
    hasServiceKey: boolean
    hasAnonKey: boolean
    baseUrl: string
    testAccountExists: boolean
    testUsersExist: Record<string, boolean>
    authFilesExist: Record<string, boolean>
  }
}

export interface TestUser {
  email: string
  role: 'owner' | 'admin' | 'dispatcher' | 'tech' | 'sales'
  password: string
}

// Canonical test users - 317 Plumber realistic users
// All users share the same password for testing convenience
export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

export const TEST_USERS: TestUser[] = [
  { email: 'ryan@317plumber.com', role: 'owner', password: TEST_PASSWORD },
  { email: 'admin@317plumber.com', role: 'admin', password: TEST_PASSWORD },
  { email: 'dispatch@317plumber.com', role: 'dispatcher', password: TEST_PASSWORD },
  { email: 'marcus@317plumber.com', role: 'tech', password: TEST_PASSWORD },
  { email: 'emily@317plumber.com', role: 'sales', password: TEST_PASSWORD },
]

export const TEST_ACCOUNT_SLUG = '317-plumber'

export class EnvironmentValidator {
  private supabase: SupabaseClient | null = null
  private status: EnvironmentStatus

  constructor() {
    this.status = {
      isValid: true,
      errors: [],
      warnings: [],
      config: {
        supabaseUrl: null,
        hasServiceKey: false,
        hasAnonKey: false,
        baseUrl: 'http://localhost:3000',
        testAccountExists: false,
        testUsersExist: {},
        authFilesExist: {},
      },
    }
  }

  /**
   * Run all validations
   * Returns detailed status for AI agents to act on
   */
  async validate(): Promise<EnvironmentStatus> {
    console.log('\n🔍 Validating test environment...\n')

    // Step 1: Check environment variables
    this.checkEnvVars()
    if (this.status.errors.length > 0) {
      return this.finalizeStatus()
    }

    // Step 2: Initialize Supabase client
    this.initSupabase()
    if (!this.supabase) {
      return this.finalizeStatus()
    }

    // Step 3: Check database connectivity
    await this.checkDatabaseConnection()
    if (this.status.errors.length > 0) {
      return this.finalizeStatus()
    }

    // Step 4: Check test account exists
    await this.checkTestAccount()

    // Step 5: Check test users exist
    await this.checkTestUsers()

    // Step 6: Check auth state files
    this.checkAuthFiles()

    return this.finalizeStatus()
  }

  private checkEnvVars(): void {
    console.log('📋 Checking environment variables...')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    this.status.config.supabaseUrl = supabaseUrl || null
    this.status.config.hasServiceKey = !!serviceKey
    this.status.config.hasAnonKey = !!anonKey
    this.status.config.baseUrl = baseUrl

    if (!supabaseUrl) {
      this.addError('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
    } else {
      console.log(`  ✓ Supabase URL: ${supabaseUrl.substring(0, 30)}...`)
    }

    if (!serviceKey) {
      this.addError('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local (required for test setup)')
    } else {
      console.log(`  ✓ Service Role Key: present`)
    }

    if (!anonKey) {
      this.addWarning('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set (may affect some tests)')
    } else {
      console.log(`  ✓ Anon Key: present`)
    }

    console.log(`  ✓ Base URL: ${baseUrl}`)
  }

  private initSupabase(): void {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      this.addError('Cannot initialize Supabase client - missing credentials')
      return
    }

    try {
      this.supabase = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    } catch (error) {
      this.addError(`Failed to initialize Supabase client: ${error}`)
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    console.log('\n📡 Checking database connectivity...')

    if (!this.supabase) {
      this.addError('Supabase client not initialized')
      return
    }

    try {
      // Simple query to verify connection
      const { data, error } = await this.supabase
        .from('accounts')
        .select('count')
        .limit(1)

      if (error) {
        this.addError(`Database connection failed: ${error.message}`)
      } else {
        console.log('  ✓ Database connection successful')
      }
    } catch (error) {
      this.addError(`Database connection exception: ${error}`)
    }
  }

  private async checkTestAccount(): Promise<void> {
    console.log('\n🏢 Checking test account...')

    if (!this.supabase) return

    try {
      const { data: account, error } = await this.supabase
        .from('accounts')
        .select('id, name, slug')
        .eq('slug', TEST_ACCOUNT_SLUG)
        .single()

      if (error || !account) {
        this.status.config.testAccountExists = false
        this.addError(`Test account '${TEST_ACCOUNT_SLUG}' does not exist. Run: npm run test:setup`)
        console.log(`  ✗ Test account '${TEST_ACCOUNT_SLUG}' NOT FOUND`)
      } else {
        this.status.config.testAccountExists = true
        console.log(`  ✓ Test account found: ${account.name} (${account.id})`)
      }
    } catch (error) {
      this.addError(`Failed to check test account: ${error}`)
    }
  }

  private async checkTestUsers(): Promise<void> {
    console.log('\n👥 Checking test users...')

    if (!this.supabase) return

    try {
      const { data: authUsers, error } = await this.supabase.auth.admin.listUsers()

      if (error) {
        this.addError(`Failed to list users: ${error.message}`)
        return
      }

      const existingEmails = new Set(authUsers?.users?.map(u => u.email) || [])

      for (const testUser of TEST_USERS) {
        const exists = existingEmails.has(testUser.email)
        this.status.config.testUsersExist[testUser.role] = exists

        if (exists) {
          console.log(`  ✓ ${testUser.role}: ${testUser.email}`)
        } else {
          console.log(`  ✗ ${testUser.role}: ${testUser.email} NOT FOUND`)
          this.addError(`Test user '${testUser.email}' (${testUser.role}) does not exist. Run: npm run test:setup`)
        }
      }
    } catch (error) {
      this.addError(`Failed to check test users: ${error}`)
    }
  }

  private checkAuthFiles(): void {
    console.log('\n🔐 Checking auth state files...')

    const authDir = resolve(process.cwd(), 'playwright/.auth')

    for (const testUser of TEST_USERS) {
      const filePath = resolve(authDir, `${testUser.role}.json`)
      const exists = existsSync(filePath)
      this.status.config.authFilesExist[testUser.role] = exists

      if (exists) {
        console.log(`  ✓ ${testUser.role}.json`)
      } else {
        console.log(`  ⚠ ${testUser.role}.json NOT FOUND (will be created on first auth)`)
        this.addWarning(`Auth state file for ${testUser.role} does not exist`)
      }
    }
  }

  private addError(message: string): void {
    this.status.errors.push(message)
    this.status.isValid = false
  }

  private addWarning(message: string): void {
    this.status.warnings.push(message)
  }

  private finalizeStatus(): EnvironmentStatus {
    console.log('\n' + '='.repeat(60))

    if (this.status.isValid) {
      console.log('✅ Environment validation PASSED')
    } else {
      console.log('❌ Environment validation FAILED')
      console.log('\nErrors:')
      this.status.errors.forEach(e => console.log(`  • ${e}`))
    }

    if (this.status.warnings.length > 0) {
      console.log('\nWarnings:')
      this.status.warnings.forEach(w => console.log(`  • ${w}`))
    }

    console.log('='.repeat(60) + '\n')

    return this.status
  }
}

/**
 * Validate environment and throw if invalid
 * Use this at the start of test suites
 */
export async function requireValidEnvironment(): Promise<EnvironmentStatus> {
  const validator = new EnvironmentValidator()
  const status = await validator.validate()

  if (!status.isValid) {
    const errorMessage = [
      '❌ TEST ENVIRONMENT NOT READY',
      '',
      'The following issues must be resolved before running tests:',
      ...status.errors.map(e => `  • ${e}`),
      '',
      'To fix, run: npm run test:setup',
      '',
    ].join('\n')

    throw new Error(errorMessage)
  }

  return status
}

// Run if executed directly
if (require.main === module) {
  const validator = new EnvironmentValidator()
  validator.validate().then(status => {
    process.exit(status.isValid ? 0 : 1)
  })
}
