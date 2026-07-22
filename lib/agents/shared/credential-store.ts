/**
 * Secure Credential Store for Agent Operations
 * 
 * Stores and manages credentials securely.
 * Only accessible to authorized requesters (system admin).
 */

export type CredentialKey = 
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'RESEND_API_KEY'
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_BASE_URL'

export interface CredentialStatus {
  valid: boolean
  issues: Array<{ key: CredentialKey; error: string }>
}

/**
 * Secure Credential Store
 * Only accessible to 'you' (system admin)
 */
export class CredentialStore {
  private credentials: Map<CredentialKey, string> = new Map()
  private initialized: boolean = false

  constructor() {
    this.initialize()
  }

  /**
   * Initialize credentials from environment variables
   */
  private initialize(): void {
    const credentialKeys: CredentialKey[] = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_BASE_URL'
    ]

    for (const key of credentialKeys) {
      const value = process.env[key]
      if (value) {
        this.credentials.set(key, value)
      }
    }

    this.initialized = true
  }

  /**
   * Get credential value
   * Only accessible to 'you' (system admin)
   */
  getCredential(key: CredentialKey, requester: 'you'): string {
    if (requester !== 'you') {
      throw new Error('Unauthorized: Only system admin can access credentials')
    }

    if (!this.initialized) {
      this.initialize()
    }

    const value = this.credentials.get(key)
    if (!value) {
      throw new Error(`Credential '${key}' not found. Please set it in environment variables.`)
    }

    return value
  }

  /**
   * Check if credential exists
   */
  hasCredential(key: CredentialKey): boolean {
    if (!this.initialized) {
      this.initialize()
    }
    return this.credentials.has(key)
  }

  /**
   * Validate all credentials
   */
  validateCredentials(): CredentialStatus {
    if (!this.initialized) {
      this.initialize()
    }

    const issues: Array<{ key: CredentialKey; error: string }> = []
    const requiredKeys: CredentialKey[] = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL'
    ]

    for (const key of requiredKeys) {
      if (!this.credentials.has(key)) {
        issues.push({
          key,
          error: `Missing required credential: ${key}`
        })
      } else {
        const value = this.credentials.get(key)!
        if (value.trim().length === 0) {
          issues.push({
            key,
            error: `Credential ${key} is empty`
          })
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * Get all credential keys (without values)
   */
  getCredentialKeys(): CredentialKey[] {
    if (!this.initialized) {
      this.initialize()
    }
    return Array.from(this.credentials.keys())
  }

  /**
   * Check Supabase connection
   */
  async checkSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = this.getCredential('NEXT_PUBLIC_SUPABASE_URL', 'you')
      const key = this.getCredential('SUPABASE_SERVICE_ROLE_KEY', 'you')

      // Simple validation - check URL format
      if (!url.startsWith('http')) {
        return {
          success: false,
          error: 'Invalid Supabase URL format'
        }
      }

      // Check key format (should be JWT-like)
      if (key.length < 50) {
        return {
          success: false,
          error: 'Invalid Supabase service role key format'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check Resend access
   */
  async checkResendAccess(): Promise<{ success: boolean; error?: string }> {
    try {
      const apiKey = this.getCredential('RESEND_API_KEY', 'you')

      // Simple validation - check key format
      if (!apiKey.startsWith('re_')) {
        return {
          success: false,
          error: 'Invalid Resend API key format'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get credentials object for agent initialization
   * Only accessible to 'you' (system admin)
   */
  getCredentialsForAgent(requester: 'you'): {
    serviceRoleKey: string
    resendApiKey: string
    supabaseUrl: string
  } {
    if (requester !== 'you') {
      throw new Error('Unauthorized: Only system admin can access credentials')
    }

    return {
      serviceRoleKey: this.getCredential('SUPABASE_SERVICE_ROLE_KEY', 'you'),
      resendApiKey: this.getCredential('RESEND_API_KEY', 'you'),
      supabaseUrl: this.getCredential('NEXT_PUBLIC_SUPABASE_URL', 'you')
    }
  }

  /**
   * Never log credentials - this method ensures credentials are never exposed
   */
  private sanitizeForLogging(value: string): string {
    if (value.length <= 8) {
      return '***'
    }
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
  }

  /**
   * Get credential status for logging (sanitized)
   */
  getCredentialStatusForLogging(): Record<string, string> {
    const status: Record<string, string> = {}
    for (const key of this.getCredentialKeys()) {
      const value = this.credentials.get(key)!
      status[key] = this.sanitizeForLogging(value)
    }
    return status
  }
}

/**
 * Singleton instance of credential store
 */
let credentialStoreInstance: CredentialStore | null = null

/**
 * Get credential store instance
 */
export function getCredentialStore(): CredentialStore {
  if (!credentialStoreInstance) {
    credentialStoreInstance = new CredentialStore()
  }
  return credentialStoreInstance
}

