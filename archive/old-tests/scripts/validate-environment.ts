#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// =============================================================================
// Environment Validation Script
// =============================================================================
// Validates all required environment variables for CRM-AI Pro
// Checks API key formats, tests database connection, and reports issues
//
// Usage:
//   npm run validate-env
//   OR
//   npx tsx scripts/validate-environment.ts
// =============================================================================

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local')
config({ path: envPath })

interface ValidationResult {
  name: string
  required: boolean
  passed: boolean
  value?: string
  error?: string
  warning?: string
}

const results: ValidationResult[] = []
let hasErrors = false
let hasWarnings = false

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function printHeader(text: string) {
  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`)
  console.log(`${colors.cyan}${text}${colors.reset}`)
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`)
}

function printSection(text: string) {
  console.log(`\n${colors.blue}${text}${colors.reset}`)
  console.log(`${colors.gray}${'─'.repeat(70)}${colors.reset}`)
}

function validateEnvVar(
  name: string,
  required: boolean,
  validator?: (value: string) => { valid: boolean; error?: string; warning?: string }
): ValidationResult {
  const value = process.env[name]

  if (!value) {
    const result: ValidationResult = {
      name,
      required,
      passed: !required,
      error: required ? 'Missing (required)' : undefined,
      warning: !required ? 'Not set (optional)' : undefined,
    }

    if (required) hasErrors = true
    if (!required && !value) hasWarnings = true

    return result
  }

  if (validator) {
    const validation = validator(value)
    const result: ValidationResult = {
      name,
      required,
      passed: validation.valid,
      value: value.substring(0, 20) + '...',
      error: validation.error,
      warning: validation.warning,
    }

    if (validation.error) hasErrors = true
    if (validation.warning) hasWarnings = true

    return result
  }

  return {
    name,
    required,
    passed: true,
    value: value.substring(0, 20) + '...',
  }
}

// Validators
function validateOpenAIKey(value: string) {
  if (!value.startsWith('sk-proj-') && !value.startsWith('sk-')) {
    return {
      valid: false,
      error: 'Invalid format (should start with sk-proj- or sk-)',
    }
  }
  if (value.length < 20) {
    return { valid: false, error: 'Key too short (likely invalid)' }
  }
  return { valid: true }
}

function validateAnthropicKey(value: string) {
  if (!value.startsWith('sk-ant-')) {
    return {
      valid: false,
      error: 'Invalid format (should start with sk-ant-)',
    }
  }
  if (value.length < 20) {
    return { valid: false, error: 'Key too short (likely invalid)' }
  }
  return { valid: true }
}

function validateSupabaseUrl(value: string) {
  if (!value.startsWith('https://')) {
    return { valid: false, error: 'Must start with https://' }
  }
  if (!value.includes('.supabase.co')) {
    return {
      valid: true,
      warning: 'Does not look like a standard Supabase URL',
    }
  }
  return { valid: true }
}

function validateSupabaseKey(value: string) {
  if (value.length < 20) {
    return { valid: false, error: 'Key too short (likely invalid)' }
  }
  return { valid: true }
}

function validateBaseUrl(value: string) {
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return { valid: false, error: 'Must start with http:// or https://' }
  }
  return { valid: true }
}

async function main() {
  printHeader('🔍 CRM-AI Pro Environment Validation')

  // Check if .env.local exists
  if (!existsSync(envPath)) {
    console.log(`${colors.red}❌ Error: .env.local file not found${colors.reset}`)
    console.log(`   Expected at: ${envPath}`)
    console.log(`\n   Create it by copying .env.example:`)
    console.log(`   ${colors.gray}cp .env.example .env.local${colors.reset}\n`)
    process.exit(1)
  }

  console.log(`${colors.green}✅ Found .env.local file${colors.reset}`)
  console.log(`   Location: ${colors.gray}${envPath}${colors.reset}`)

  // ===== Supabase Configuration =====
  printSection('📦 Supabase Configuration (Required)')

  results.push(
    validateEnvVar('NEXT_PUBLIC_SUPABASE_URL', true, validateSupabaseUrl)
  )
  results.push(
    validateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true, validateSupabaseKey)
  )
  results.push(
    validateEnvVar('SUPABASE_SERVICE_ROLE_KEY', true, validateSupabaseKey)
  )

  // ===== LLM Provider API Keys =====
  printSection('🤖 LLM Provider API Keys (Required for LLM Router)')

  results.push(validateEnvVar('OPENAI_API_KEY', true, validateOpenAIKey))
  results.push(validateEnvVar('ANTHROPIC_API_KEY', true, validateAnthropicKey))

  // ===== Server Configuration =====
  printSection('🌐 Server Configuration (Required)')

  results.push(validateEnvVar('NEXT_PUBLIC_BASE_URL', true, validateBaseUrl))

  // ===== Feature Flags =====
  printSection('🚩 Feature Flags (Optional)')

  results.push(validateEnvVar('USE_LLM_ROUTER', false))
  results.push(validateEnvVar('LLM_ENABLED', false))
  results.push(validateEnvVar('LLM_OPENAI_ENABLED', false))
  results.push(validateEnvVar('LLM_ANTHROPIC_ENABLED', false))

  // ===== Optional Services =====
  printSection('📧 Optional Services')

  results.push(validateEnvVar('RESEND_API_KEY', false))
  results.push(validateEnvVar('STRIPE_SECRET_KEY', false))
  results.push(validateEnvVar('ELEVENLABS_API_KEY', false))
  results.push(validateEnvVar('GOOGLE_GEMINI_API_KEY', false))
  results.push(validateEnvVar('ZAI_GLM_API_KEY', false))

  // Print results
  printSection('📋 Validation Results')

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌'
    const requiredLabel = result.required ? '[REQUIRED]' : '[OPTIONAL]'
    const statusColor = result.passed ? colors.green : colors.red

    console.log(
      `${icon} ${statusColor}${result.name}${colors.reset} ${colors.gray}${requiredLabel}${colors.reset}`
    )

    if (result.value) {
      console.log(`   ${colors.gray}Value: ${result.value}${colors.reset}`)
    }
    if (result.error) {
      console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`)
    }
    if (result.warning) {
      console.log(`   ${colors.yellow}Warning: ${result.warning}${colors.reset}`)
    }
  }

  // Test Supabase connection
  printSection('🔗 Testing Supabase Connection')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      console.log('Connecting to Supabase...')
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Test connection by querying a table (crmai_audit should exist)
      const { error } = await supabase
        .from('crmai_audit')
        .select('id')
        .limit(1)

      if (error) {
        console.log(`${colors.red}❌ Connection failed${colors.reset}`)
        console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`)
        hasErrors = true
      } else {
        console.log(`${colors.green}✅ Successfully connected to Supabase${colors.reset}`)
      }
    } catch (error: any) {
      console.log(`${colors.red}❌ Connection test failed${colors.reset}`)
      console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`)
      hasErrors = true
    }
  } else {
    console.log(`${colors.yellow}⚠️  Skipping connection test (missing credentials)${colors.reset}`)
  }

  // Summary
  printHeader('📊 Summary')

  const requiredVars = results.filter(r => r.required)
  const passedRequired = requiredVars.filter(r => r.passed).length
  const totalRequired = requiredVars.length

  const optionalVars = results.filter(r => !r.required)
  const passedOptional = optionalVars.filter(r => r.passed).length
  const totalOptional = optionalVars.length

  console.log(`${colors.cyan}Required Variables:${colors.reset}`)
  console.log(
    `  ${passedRequired === totalRequired ? colors.green : colors.red}${passedRequired}/${totalRequired} passed${colors.reset}`
  )

  console.log(`\n${colors.cyan}Optional Variables:${colors.reset}`)
  console.log(`  ${colors.gray}${passedOptional}/${totalOptional} set${colors.reset}`)

  if (hasErrors) {
    console.log(
      `\n${colors.red}❌ Validation failed with errors${colors.reset}`
    )
    console.log(`\n${colors.yellow}📖 For setup instructions, see:${colors.reset}`)
    console.log(`   ${colors.gray}docs/ENVIRONMENT_SETUP.md${colors.reset}`)
    console.log(`\n${colors.yellow}🔧 Common fixes:${colors.reset}`)
    console.log(`   1. Copy .env.example to .env.local: ${colors.gray}cp .env.example .env.local${colors.reset}`)
    console.log(`   2. Get OpenAI key: ${colors.gray}https://platform.openai.com/api-keys${colors.reset}`)
    console.log(`   3. Get Anthropic key: ${colors.gray}https://console.anthropic.com/settings/keys${colors.reset}`)
    console.log(`   4. Get Supabase credentials: ${colors.gray}https://supabase.com/dashboard${colors.reset}`)
    console.log()
    process.exit(1)
  } else if (hasWarnings) {
    console.log(
      `\n${colors.yellow}⚠️  Validation passed with warnings${colors.reset}`
    )
    console.log(
      `   ${colors.gray}Review warnings above for potential issues${colors.reset}\n`
    )
    process.exit(0)
  } else {
    console.log(`\n${colors.green}✅ All validations passed!${colors.reset}`)
    console.log(`\n${colors.cyan}🚀 Next steps:${colors.reset}`)
    console.log(`   1. Setup Supabase secrets: ${colors.gray}./scripts/setup-supabase-secrets.sh${colors.reset}`)
    console.log(`   2. Start dev server: ${colors.gray}PORT=3002 npm run dev${colors.reset}`)
    console.log(`   3. Test LLM Router: ${colors.gray}npm run test:llm-router${colors.reset}`)
    console.log()
    process.exit(0)
  }
}

// Run validation
main().catch((error) => {
  console.error(`\n${colors.red}❌ Fatal error:${colors.reset}`, error.message)
  console.error(error.stack)
  process.exit(1)
})
