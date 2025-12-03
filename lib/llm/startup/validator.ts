/**
 * LLM Router Startup Validator
 *
 * Validates critical environment variables and system configuration at startup.
 * Implements fail-fast principle - exits immediately if critical configs are missing.
 *
 * Features:
 * - Environment variable validation
 * - API key format validation
 * - Database connectivity checks
 * - Clear, actionable error messages
 * - Supports both OpenAI and Anthropic providers
 *
 * Usage:
 * Import and call validateStartup() at application initialization
 *
 * @example
 * import { validateStartup } from '@/lib/llm/startup/validator'
 *
 * // In your server initialization
 * await validateStartup()
 */

import { maskApiKey } from '../security/key-manager'

// ================================================================
// Types
// ================================================================

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  variable?: string
  suggestion: string
}

export interface ValidationWarning {
  code: string
  message: string
  variable?: string
}

// ================================================================
// Configuration
// ================================================================

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const OPTIONAL_LLM_ENV_VARS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'POSTGRES_ENCRYPTION_KEY',
] as const

const ALL_LLM_ENV_VARS = [
  ...OPTIONAL_LLM_ENV_VARS,
] as const

// ================================================================
// Validation Functions
// ================================================================

/**
 * Validates that a required environment variable exists
 */
function validateRequired(varName: string): ValidationError | null {
  const value = process.env[varName]

  if (!value || value.trim() === '') {
    return {
      code: 'MISSING_REQUIRED_VAR',
      message: `Required environment variable '${varName}' is not set`,
      variable: varName,
      suggestion: `Set ${varName} in your .env.local file or environment configuration`,
    }
  }

  return null
}

/**
 * Validates OpenAI API key format
 */
function validateOpenAIKey(apiKey: string): ValidationError | null {
  // OpenAI keys should start with 'sk-' and be at least 20 chars
  if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-')) {
    return {
      code: 'INVALID_OPENAI_KEY_FORMAT',
      message: `OpenAI API key has invalid format (should start with 'sk-' or 'sk-proj-')`,
      variable: 'OPENAI_API_KEY',
      suggestion:
        'Verify your OpenAI API key at https://platform.openai.com/api-keys. ' +
        'Keys should start with "sk-" for legacy keys or "sk-proj-" for project keys.',
    }
  }

  if (apiKey.length < 20) {
    return {
      code: 'INVALID_OPENAI_KEY_LENGTH',
      message: `OpenAI API key is too short (got ${apiKey.length} chars, expected 40+)`,
      variable: 'OPENAI_API_KEY',
      suggestion: 'Ensure you copied the complete API key from OpenAI dashboard',
    }
  }

  // Check for placeholder values
  if (
    apiKey.includes('your-') ||
    apiKey.includes('xxx') ||
    apiKey.toLowerCase().includes('replace')
  ) {
    return {
      code: 'PLACEHOLDER_OPENAI_KEY',
      message: `OpenAI API key appears to be a placeholder value`,
      variable: 'OPENAI_API_KEY',
      suggestion: 'Replace placeholder with your actual OpenAI API key',
    }
  }

  return null
}

/**
 * Validates Anthropic API key format
 */
function validateAnthropicKey(apiKey: string): ValidationError | null {
  // Anthropic keys should start with 'sk-ant-'
  if (!apiKey.startsWith('sk-ant-')) {
    return {
      code: 'INVALID_ANTHROPIC_KEY_FORMAT',
      message: `Anthropic API key has invalid format (should start with 'sk-ant-')`,
      variable: 'ANTHROPIC_API_KEY',
      suggestion:
        'Verify your Anthropic API key at https://console.anthropic.com/settings/keys. ' +
        'Keys should start with "sk-ant-".',
    }
  }

  if (apiKey.length < 30) {
    return {
      code: 'INVALID_ANTHROPIC_KEY_LENGTH',
      message: `Anthropic API key is too short (got ${apiKey.length} chars, expected 60+)`,
      variable: 'ANTHROPIC_API_KEY',
      suggestion: 'Ensure you copied the complete API key from Anthropic console',
    }
  }

  // Check for placeholder values
  if (
    apiKey.includes('your-') ||
    apiKey.includes('xxx') ||
    apiKey.toLowerCase().includes('replace')
  ) {
    return {
      code: 'PLACEHOLDER_ANTHROPIC_KEY',
      message: `Anthropic API key appears to be a placeholder value`,
      variable: 'ANTHROPIC_API_KEY',
      suggestion: 'Replace placeholder with your actual Anthropic API key',
    }
  }

  return null
}

/**
 * Validates Supabase URL format
 */
function validateSupabaseUrl(url: string): ValidationError | null {
  try {
    const parsed = new URL(url)

    if (!parsed.hostname.includes('supabase.co') && !parsed.hostname.includes('localhost')) {
      return {
        code: 'INVALID_SUPABASE_URL',
        message: `Supabase URL has unexpected format: ${parsed.hostname}`,
        variable: 'NEXT_PUBLIC_SUPABASE_URL',
        suggestion:
          'Supabase URLs should end with .supabase.co (or localhost for local dev). ' +
          'Check your Supabase project settings.',
      }
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        code: 'INVALID_SUPABASE_PROTOCOL',
        message: `Supabase URL must use http:// or https://`,
        variable: 'NEXT_PUBLIC_SUPABASE_URL',
        suggestion: 'Add https:// prefix to your Supabase URL',
      }
    }
  } catch (error) {
    return {
      code: 'MALFORMED_SUPABASE_URL',
      message: `Supabase URL is malformed and cannot be parsed`,
      variable: 'NEXT_PUBLIC_SUPABASE_URL',
      suggestion:
        'Ensure URL is valid (e.g., https://xxxxx.supabase.co). ' +
        'Find it in your Supabase project settings.',
    }
  }

  return null
}

/**
 * Validates Supabase keys format
 */
function validateSupabaseKey(
  keyValue: string,
  keyType: 'anon' | 'service'
): ValidationError | null {
  const varName =
    keyType === 'anon' ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY'

  // Supabase keys are JWT tokens (should have 3 parts separated by dots)
  const parts = keyValue.split('.')
  if (parts.length !== 3) {
    return {
      code: 'INVALID_SUPABASE_KEY_FORMAT',
      message: `${varName} has invalid format (not a valid JWT)`,
      variable: varName,
      suggestion:
        'Supabase keys are JWT tokens with 3 parts (header.payload.signature). ' +
        'Copy the key from your Supabase project settings.',
    }
  }

  if (keyValue.length < 100) {
    return {
      code: 'INVALID_SUPABASE_KEY_LENGTH',
      message: `${varName} is too short (got ${keyValue.length} chars)`,
      variable: varName,
      suggestion: 'Ensure you copied the complete key from Supabase project settings',
    }
  }

  return null
}

// ================================================================
// Main Validation
// ================================================================

/**
 * Validates all required environment variables and configuration
 *
 * @returns ValidationResult with errors and warnings
 */
export function validateEnvironment(): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 1. Validate required environment variables exist
  for (const varName of REQUIRED_ENV_VARS) {
    const error = validateRequired(varName)
    if (error) errors.push(error)
  }

  // 2. Validate Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    const urlError = validateSupabaseUrl(supabaseUrl)
    if (urlError) errors.push(urlError)
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (anonKey) {
    const anonKeyError = validateSupabaseKey(anonKey, 'anon')
    if (anonKeyError) errors.push(anonKeyError)
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const serviceKeyError = validateSupabaseKey(serviceKey, 'service')
    if (serviceKeyError) errors.push(serviceKeyError)
  }

  // 3. Validate LLM provider API keys (at least one required)
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  let hasValidLLMProvider = false

  if (openaiKey) {
    const openaiError = validateOpenAIKey(openaiKey)
    if (openaiError) {
      errors.push(openaiError)
    } else {
      hasValidLLMProvider = true
    }
  }

  if (anthropicKey) {
    const anthropicError = validateAnthropicKey(anthropicKey)
    if (anthropicError) {
      errors.push(anthropicError)
    } else {
      hasValidLLMProvider = true
    }
  }

  // At least one LLM provider must be configured
  if (!hasValidLLMProvider) {
    errors.push({
      code: 'NO_LLM_PROVIDERS',
      message: 'No valid LLM provider API keys found',
      suggestion:
        'Set at least one of: OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local. ' +
        'The LLM router requires at least one provider to function.',
    })
  }

  // 4. Warnings for missing optional features
  if (!process.env.POSTGRES_ENCRYPTION_KEY) {
    warnings.push({
      code: 'MISSING_ENCRYPTION_KEY',
      message: 'POSTGRES_ENCRYPTION_KEY not set - database key encryption disabled',
      variable: 'POSTGRES_ENCRYPTION_KEY',
    })
  }

  // Warn if only one provider is configured
  if (hasValidLLMProvider && (!openaiKey || !anthropicKey)) {
    const missing = !openaiKey ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
    warnings.push({
      code: 'SINGLE_PROVIDER_ONLY',
      message: `Only one LLM provider configured. Consider adding ${missing} for redundancy`,
      variable: missing,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates startup configuration and exits if critical errors found
 *
 * @param options.exitOnError - Whether to exit process on errors (default: true in production)
 * @param options.silent - Suppress console output (default: false)
 * @returns ValidationResult
 *
 * @example
 * // At application startup (e.g., in instrumentation.ts or server.ts)
 * await validateStartup()
 */
export async function validateStartup(options?: {
  exitOnError?: boolean
  silent?: boolean
}): Promise<ValidationResult> {
  const { exitOnError = process.env.NODE_ENV === 'production', silent = false } = options || {}

  const result = validateEnvironment()

  if (!silent) {
    // Print results
    if (result.errors.length > 0) {
      console.error('\n🚨 LLM Router Startup Validation FAILED\n')
      console.error('Critical configuration errors detected:\n')

      result.errors.forEach((error, index) => {
        console.error(`${index + 1}. [${error.code}] ${error.message}`)
        if (error.variable) {
          console.error(`   Variable: ${error.variable}`)
        }
        console.error(`   Solution: ${error.suggestion}\n`)
      })

      if (exitOnError) {
        console.error('❌ Exiting due to critical configuration errors')
        console.error('Fix the issues above and restart the application.\n')
        process.exit(1)
      }
    } else {
      console.log('\n✅ LLM Router Startup Validation PASSED')

      // Show configured providers
      const providers: string[] = []
      if (process.env.OPENAI_API_KEY) {
        providers.push(`OpenAI (${maskApiKey(process.env.OPENAI_API_KEY)})`)
      }
      if (process.env.ANTHROPIC_API_KEY) {
        providers.push(`Anthropic (${maskApiKey(process.env.ANTHROPIC_API_KEY)})`)
      }

      console.log(`   Configured providers: ${providers.join(', ')}`)
      console.log(`   Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/https?:\/\//, '')}`)

      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:')
        result.warnings.forEach((warning) => {
          console.log(`   - ${warning.message}`)
        })
      }

      console.log() // Empty line
    }
  }

  return result
}

/**
 * Validates a single provider configuration
 *
 * @param provider - Provider name ('openai', 'anthropic', etc.)
 * @returns True if provider is properly configured
 */
export function isProviderConfigured(provider: string): boolean {
  const normalizedProvider = provider.toLowerCase()

  switch (normalizedProvider) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY
      return !!key && !validateOpenAIKey(key)
    }
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY
      return !!key && !validateAnthropicKey(key)
    }
    default:
      return false
  }
}

/**
 * Gets a list of all configured providers
 */
export function getConfiguredProviders(): string[] {
  const providers: string[] = []

  if (isProviderConfigured('openai')) providers.push('openai')
  if (isProviderConfigured('anthropic')) providers.push('anthropic')

  return providers
}

/**
 * Checks if the system has minimum requirements to run
 */
export function hasMinimumRequirements(): boolean {
  const result = validateEnvironment()
  return result.valid && result.errors.length === 0
}
