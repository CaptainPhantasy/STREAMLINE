/**
 * LLM Router Key Manager
 *
 * Provides secure API key management with encryption/decryption capabilities
 * using Supabase's pgcrypto extension.
 *
 * Features:
 * - AES-256 encryption for API keys
 * - Key rotation support
 * - Secure key retrieval with decryption
 * - Environment variable fallback
 *
 * Security Best Practices:
 * - Encryption password stored in POSTGRES_ENCRYPTION_KEY env var
 * - Never log decrypted keys
 * - Use encrypted keys in database, environment variables for runtime
 * - Rotate encryption keys periodically
 */

import { createClient } from '@supabase/supabase-js'

// ================================================================
// Types
// ================================================================

export interface EncryptedKey {
  id: string
  name: string
  provider: string
  model: string
  encrypted_api_key: Buffer | null
  key_version: number | null
  is_active: boolean
}

export interface DecryptedProvider {
  id: string
  name: string
  provider: string
  model: string
  api_key: string
  is_active: boolean
}

export interface KeyRotationResult {
  provider_id: string
  provider_name: string
  status: string
}

// ================================================================
// Configuration
// ================================================================

const ENCRYPTION_PASSWORD = process.env.POSTGRES_ENCRYPTION_KEY || ''

if (!ENCRYPTION_PASSWORD) {
  console.warn(
    '⚠️  POSTGRES_ENCRYPTION_KEY not set. Database key encryption/decryption will fail. ' +
    'This is acceptable if using environment variables for API keys.'
  )
}

// ================================================================
// Helper Functions
// ================================================================

/**
 * Gets a Supabase client with service role permissions
 * Required for executing encrypted key functions
 */
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Sanitizes error messages to prevent API key leakage in logs
 */
function sanitizeError(error: any): Error {
  const message = error.message || String(error)

  // Remove potential API key patterns
  const sanitized = message
    .replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***REDACTED***')
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-***REDACTED***')
    .replace(/Bearer\s+[a-zA-Z0-9_-]+/g, 'Bearer ***REDACTED***')
    .replace(/api[_-]?key["\s:=]+[a-zA-Z0-9_-]+/gi, 'api_key=***REDACTED***')

  const sanitizedError = new Error(sanitized)
  sanitizedError.name = error.name || 'KeyManagerError'
  return sanitizedError
}

// ================================================================
// Core Key Management Functions
// ================================================================

/**
 * Encrypts an API key using pgcrypto AES-256 encryption
 *
 * @param apiKey - The plaintext API key to encrypt
 * @param encryptionPassword - Optional encryption password (defaults to env var)
 * @returns The encrypted key as a base64 string
 *
 * @example
 * const encrypted = await encryptKey('sk-1234567890')
 * // Store encrypted in database
 */
export async function encryptKey(
  apiKey: string,
  encryptionPassword?: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key cannot be empty')
  }

  const password = encryptionPassword || ENCRYPTION_PASSWORD
  if (!password) {
    throw new Error('Encryption password not provided and POSTGRES_ENCRYPTION_KEY not set')
  }

  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase.rpc('encrypt_api_key', {
      api_key: apiKey,
      encryption_password: password,
    })

    if (error) {
      throw sanitizeError(error)
    }

    if (!data) {
      throw new Error('Encryption returned null data')
    }

    // Convert bytea to base64 for storage
    return Buffer.from(data).toString('base64')
  } catch (error) {
    throw sanitizeError(error)
  }
}

/**
 * Decrypts an API key using pgcrypto AES-256 decryption
 *
 * @param encryptedKey - The encrypted key (base64 string or Buffer)
 * @param encryptionPassword - Optional encryption password (defaults to env var)
 * @returns The decrypted plaintext API key
 *
 * @example
 * const decrypted = await decryptKey(encryptedKeyFromDb)
 * // Use decrypted key for API calls
 */
export async function decryptKey(
  encryptedKey: string | Buffer,
  encryptionPassword?: string
): Promise<string> {
  if (!encryptedKey) {
    throw new Error('Encrypted key cannot be empty')
  }

  const password = encryptionPassword || ENCRYPTION_PASSWORD
  if (!password) {
    throw new Error('Encryption password not provided and POSTGRES_ENCRYPTION_KEY not set')
  }

  try {
    const supabase = getServiceClient()

    // Convert to Buffer if string
    const keyBuffer = typeof encryptedKey === 'string'
      ? Buffer.from(encryptedKey, 'base64')
      : encryptedKey

    const { data, error } = await supabase.rpc('decrypt_api_key', {
      encrypted_key: keyBuffer,
      encryption_password: password,
    })

    if (error) {
      throw sanitizeError(error)
    }

    if (!data) {
      throw new Error('Decryption returned null data')
    }

    return data
  } catch (error) {
    throw sanitizeError(error)
  }
}

/**
 * Rotates encryption keys for all providers to a new encryption password
 *
 * WARNING: This is a destructive operation. Ensure you have backups.
 *
 * @param oldPassword - Current encryption password
 * @param newPassword - New encryption password
 * @param newKeyVersion - New key version number (incrementing integer)
 * @returns Array of rotation results for each provider
 *
 * @example
 * const results = await rotateEncryptionKeys(
 *   'old-password',
 *   'new-password',
 *   2
 * )
 * console.log(results) // [{ provider_id: '...', status: 'rotated' }, ...]
 */
export async function rotateEncryptionKeys(
  oldPassword: string,
  newPassword: string,
  newKeyVersion: number
): Promise<KeyRotationResult[]> {
  if (!oldPassword || !newPassword) {
    throw new Error('Both old and new passwords are required for key rotation')
  }

  if (newKeyVersion < 1) {
    throw new Error('Key version must be a positive integer')
  }

  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase.rpc('rotate_encryption_keys', {
      old_password: oldPassword,
      new_password: newPassword,
      new_key_version: newKeyVersion,
    })

    if (error) {
      throw sanitizeError(error)
    }

    return data || []
  } catch (error) {
    throw sanitizeError(error)
  }
}

// ================================================================
// High-Level API Key Retrieval
// ================================================================

/**
 * Gets an API key for a provider, with automatic fallback to environment variables
 *
 * Priority order:
 * 1. Environment variable (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
 * 2. Decrypted database key
 *
 * @param providerId - The provider ID from llm_providers table
 * @returns The decrypted API key or null if not found
 *
 * @example
 * const apiKey = await getProviderApiKey('provider-uuid')
 * if (apiKey) {
 *   // Use API key
 * }
 */
export async function getProviderApiKey(
  providerId: string
): Promise<string | null> {
  try {
    const supabase = getServiceClient()

    // Fetch provider details
    const { data: provider, error } = await supabase
      .from('llm_providers')
      .select('provider, encrypted_api_key')
      .eq('id', providerId)
      .single()

    if (error) {
      throw sanitizeError(error)
    }

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`)
    }

    // Check environment variable first (preferred method)
    let apiKey: string | undefined

    switch (provider.provider.toLowerCase()) {
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY
        break
      case 'anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY
        break
      default:
        // Try generic provider-specific env var
        const envVarName = `${provider.provider.toUpperCase()}_API_KEY`
        apiKey = process.env[envVarName]
    }

    if (apiKey) {
      return apiKey
    }

    // Fallback to decrypted database key
    if (provider.encrypted_api_key) {
      return await decryptKey(provider.encrypted_api_key)
    }

    return null
  } catch (error) {
    throw sanitizeError(error)
  }
}

/**
 * Validates that all active providers have accessible API keys
 *
 * @returns Object with validation results
 *
 * @example
 * const validation = await validateAllProviderKeys()
 * if (!validation.valid) {
 *   console.error('Missing keys:', validation.missingKeys)
 * }
 */
export async function validateAllProviderKeys(): Promise<{
  valid: boolean
  validProviders: string[]
  missingKeys: string[]
  errors: Record<string, string>
}> {
  const validProviders: string[] = []
  const missingKeys: string[] = []
  const errors: Record<string, string> = {}

  try {
    const supabase = getServiceClient()

    // Get all active providers
    const { data: providers, error } = await supabase
      .from('llm_providers')
      .select('id, name, provider')
      .eq('is_active', true)

    if (error) {
      throw sanitizeError(error)
    }

    if (!providers || providers.length === 0) {
      return {
        valid: false,
        validProviders: [],
        missingKeys: [],
        errors: { general: 'No active providers found in database' },
      }
    }

    // Check each provider
    for (const provider of providers) {
      try {
        const apiKey = await getProviderApiKey(provider.id)

        if (apiKey) {
          validProviders.push(provider.name)
        } else {
          missingKeys.push(provider.name)
        }
      } catch (error: any) {
        errors[provider.name] = error.message
        missingKeys.push(provider.name)
      }
    }

    return {
      valid: missingKeys.length === 0,
      validProviders,
      missingKeys,
      errors,
    }
  } catch (error) {
    throw sanitizeError(error)
  }
}

// ================================================================
// Utility Functions
// ================================================================

/**
 * Checks if a string appears to be an API key (without revealing its value)
 *
 * @param value - String to check
 * @returns True if string matches API key patterns
 */
export function looksLikeApiKey(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false
  }

  // Common API key patterns
  const patterns = [
    /^sk-[a-zA-Z0-9_-]{20,}$/,           // OpenAI
    /^sk-ant-[a-zA-Z0-9_-]{20,}$/,       // Anthropic
    /^[a-zA-Z0-9_-]{32,}$/,              // Generic long keys
  ]

  return patterns.some(pattern => pattern.test(value))
}

/**
 * Masks an API key for logging (shows first/last 4 chars only)
 *
 * @param apiKey - API key to mask
 * @returns Masked version like "sk-12...xy89"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***'
  }

  const start = apiKey.substring(0, 4)
  const end = apiKey.substring(apiKey.length - 4)
  return `${start}...${end}`
}

/**
 * Sanitizes an object by removing or masking API keys
 * Useful for safe logging
 *
 * @param obj - Object to sanitize
 * @returns Sanitized copy of object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    const value = sanitized[key]

    // Check if key name suggests it's an API key
    if (
      typeof key === 'string' &&
      (key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('password'))
    ) {
      if (typeof value === 'string' && looksLikeApiKey(value)) {
        sanitized[key] = maskApiKey(value) as any
      }
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
      sanitized[key] = sanitizeObject(value)
    }
  }

  return sanitized
}
