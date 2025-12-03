#!/usr/bin/env tsx

/**
 * Voice Configuration Setup Script
 *
 * Automated setup script for configuring voice agents in CRM-AI-PRO.
 * Validates configuration and provides setup guidance.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

interface VoiceConfig {
  enabled: boolean
  provider: 'elevenlabs' | 'google' | null
  apiKey?: string
  agentId?: string
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorLog(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(title: string) {
  colorLog('cyan', '\n' + '='.repeat(60))
  colorLog('bright', ` ${title}`)
  colorLog('cyan', '='.repeat(60))
}

function logSuccess(message: string) {
  colorLog('green', `✅ ${message}`)
}

function logWarning(message: string) {
  colorLog('yellow', `⚠️  ${message}`)
}

function logError(message: string) {
  colorLog('red', `❌ ${message}`)
}

function logInfo(message: string) {
  colorLog('blue', `ℹ️  ${message}`)
}

/**
 * Load and validate environment variables
 */
function loadVoiceConfig(): VoiceConfig {
  const config: VoiceConfig = {
    enabled: false,
    provider: null,
    isValid: false,
    errors: [],
    warnings: []
  }

  // Load .env.local if it exists
  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''

  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8')
    colorLog('green', 'Loaded .env.local file')
  } else {
    logWarning('.env.local file not found - checking environment variables')
  }

  // Parse environment variables
  const enabled = process.env.NEXT_PUBLIC_ENABLE_VOICE_AGENT ||
    (envContent.match(/NEXT_PUBLIC_ENABLE_VOICE_AGENT=(.+)/i)?.[1] || '').trim()

  const provider = (process.env.NEXT_PUBLIC_VOICE_PROVIDER ||
    (envContent.match(/NEXT_PUBLIC_VOICE_PROVIDER=(.+)/i)?.[1] || '').trim()) as 'elevenlabs' | 'google'

  config.enabled = enabled === 'true'
  config.provider = provider || null

  if (config.enabled) {
    // Provider-specific validation
    if (config.provider === 'elevenlabs') {
      const apiKey = process.env.ELEVENLABS_API_KEY ||
        (envContent.match(/ELEVENLABS_API_KEY=(.+)/i)?.[1] || '').trim()

      const agentId = process.env.ELEVENLABS_AGENT_ID ||
        (envContent.match(/ELEVENLABS_AGENT_ID=(.+)/i)?.[1] || '').trim()

      config.apiKey = apiKey
      config.agentId = agentId

      if (!apiKey) {
        config.errors.push('ELEVENLABS_API_KEY is required when ElevenLabs provider is selected')
      } else if (!apiKey.startsWith('sk_')) {
        config.errors.push('ELEVENLABS_API_KEY must start with "sk_"')
      }

      if (!agentId) {
        config.warnings.push('ELEVENLABS_AGENT_ID not set - using default agent')
      } else if (!agentId.startsWith('agent_')) {
        config.warnings.push('ELEVENLABS_AGENT_ID should start with "agent_"')
      }
    }

    if (config.provider === 'google') {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY ||
        (envContent.match(/GOOGLE_GEMINI_API_KEY=(.+)/i)?.[1] || '').trim()

      config.apiKey = apiKey

      if (!apiKey) {
        config.errors.push('GOOGLE_GEMINI_API_KEY is required when Google provider is selected')
      } else if (!apiKey.startsWith('AIzaSy')) {
        config.errors.push('GOOGLE_GEMINI_API_KEY must start with "AIzaSy"')
      }
    }

    if (!config.provider) {
      config.errors.push('NEXT_PUBLIC_VOICE_PROVIDER must be set to "elevenlabs" or "google"')
    }
  }

  config.isValid = config.errors.length === 0

  return config
}

/**
 * Generate configuration recommendations
 */
function generateRecommendations(config: VoiceConfig): string[] {
  const recommendations: string[] = []

  if (!config.enabled) {
    recommendations.push('Set NEXT_PUBLIC_ENABLE_VOICE_AGENT=true to enable voice features')
  }

  if (config.enabled && !config.provider) {
    recommendations.push('Set NEXT_PUBLIC_VOICE_PROVIDER to "elevenlabs" or "google"')
  }

  if (config.provider === 'elevenlabs' && !config.apiKey) {
    recommendations.push('Get ElevenLabs API key from: https://elevenlabs.io/app/settings/api-keys')
    recommendations.push('Set ELEVENLABS_API_KEY in your .env.local file')
  }

  if (config.provider === 'google' && !config.apiKey) {
    recommendations.push('Get Google Gemini API key from: https://makersuite.google.com/app/apikey')
    recommendations.push('Set GOOGLE_GEMINI_API_KEY in your .env.local file')
  }

  if (config.warnings.length > 0) {
    recommendations.push('Review warnings above for optimal configuration')
  }

  return recommendations
}

/**
 * Create .env.local with voice configuration
 */
function createEnvConfig(config: Partial<VoiceConfig>): void {
  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''

  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8')
  }

  // Update or add voice configuration
  const lines = envContent.split('\n')
  const voiceConfigLines = [
    '# Voice Agent Configuration',
    'NEXT_PUBLIC_ENABLE_VOICE_AGENT=' + (config.enabled?.toString() || 'false'),
    'NEXT_PUBLIC_VOICE_PROVIDER=' + (config.provider || 'elevenlabs')
  ]

  if (config.provider === 'elevenlabs') {
    voiceConfigLines.push(
      'ELEVENLABS_API_KEY=' + (config.apiKey || 'your-elevenlabs-key-here'),
      'ELEVENLABS_AGENT_ID=' + (config.agentId || 'agent_6501katrbe2re0c834kfes3hvk2d')
    )
  }

  if (config.provider === 'google') {
    voiceConfigLines.push(
      'GOOGLE_GEMINI_API_KEY=' + (config.apiKey || 'your-gemini-key-here'),
      'GOOGLE_GEMINI_MODEL=gemini-2.0-flash-exp'
    )
  }

  voiceConfigLines.push('', '# Voice Feature Flags')
  voiceConfigLines.push('NEXT_PUBLIC_ENABLE_VOICE_NAVIGATION=true')
  voiceConfigLines.push('NEXT_PUBLIC_ENABLE_VOICE_UI_ACTIONS=true')
  voiceConfigLines.push('NEXT_PUBLIC_ENABLE_VOICE_TRANSCRIPTION=false')
  voiceConfigLines.push('NEXT_PUBLIC_ENABLE_VOICE_RECORDING=false')

  // Find where to insert voice config
  const insertIndex = lines.findIndex(line => line.includes('# Voice Agent Configuration'))

  if (insertIndex >= 0) {
    // Replace existing voice config
    const endIndex = lines.findIndex((line, index) =>
      index > insertIndex && line.startsWith('# ') && !line.includes('Voice')
    )

    if (endIndex > 0) {
      lines.splice(insertIndex, endIndex - insertIndex, ...voiceConfigLines, '')
    } else {
      lines.splice(insertIndex, 1, ...voiceConfigLines, '')
    }
  } else {
    // Add at the end
    lines.push('', ...voiceConfigLines)
  }

  writeFileSync(envPath, lines.join('\n'))
  logSuccess('Updated .env.local with voice configuration')
}

/**
 * Health check for voice features
 */
async function runHealthCheck(): Promise<boolean> {
  try {
    logInfo('Running voice feature health check...')

    // Check if voice modules exist
    const elevenlabsPath = join(process.cwd(), 'voice-agents/elevenlabs')
    const googlePath = join(process.cwd(), 'voice-agents/google')

    if (existsSync(elevenlabsPath)) {
      logSuccess('ElevenLabs voice module found')
    } else {
      logError('ElevenLabs voice module not found')
    }

    if (existsSync(googlePath)) {
      logSuccess('Google voice module found')
    } else {
      logWarning('Google voice module not found')
    }

    // Check TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' })
      logSuccess('TypeScript compilation successful')
    } catch (error) {
      logError('TypeScript compilation failed')
      return false
    }

    return true
  } catch (error) {
    logError(`Health check failed: ${error}`)
    return false
  }
}

/**
 * Main setup function
 */
async function main() {
  logHeader('CRM-AI-PRO Voice Configuration Setup')

  // Load current configuration
  const config = loadVoiceConfig()

  // Display current status
  logHeader('Current Configuration')

  if (config.enabled) {
    logSuccess(`Voice agent: ENABLED`)
    logInfo(`Provider: ${config.provider || 'Not set'}`)

    if (config.provider === 'elevenlabs') {
      logInfo(`API Key: ${config.apiKey ? 'Configured' : 'Missing'}`)
      logInfo(`Agent ID: ${config.agentId || 'Using default'}`)
    }

    if (config.provider === 'google') {
      logInfo(`API Key: ${config.apiKey ? 'Configured' : 'Missing'}`)
    }
  } else {
    logWarning('Voice agent: DISABLED')
  }

  // Display validation results
  if (config.isValid) {
    logSuccess('Configuration is valid!')
  } else {
    logError('Configuration has errors:')
    config.errors.forEach(error => logError(`  - ${error}`))
  }

  if (config.warnings.length > 0) {
    logWarning('Configuration warnings:')
    config.warnings.forEach(warning => logWarning(`  - ${warning}`))
  }

  // Generate recommendations
  const recommendations = generateRecommendations(config)
  if (recommendations.length > 0) {
    logHeader('Recommendations')
    recommendations.forEach(rec => logInfo(`  ${rec}`))
  }

  // Interactive setup
  logHeader('Interactive Setup')

  if (!config.enabled) {
    colorLog('yellow', '\nWould you like to enable voice features? (y/N): ')
    // In a real implementation, you'd read user input here
    logInfo('(Skipping interactive input - use environment variables to configure)')
  }

  // Health check
  const healthCheckPassed = await runHealthCheck()

  // Summary
  logHeader('Setup Summary')

  if (config.isValid && healthCheckPassed) {
    logSuccess('Voice configuration is ready! 🎉')
    logInfo('Next steps:')
    logInfo('  1. Restart your development server: npm run dev')
    logInfo('  2. Test voice features in the CRM')
    logInfo('  3. Check browser console for any voice-related logs')
  } else {
    logError('Setup incomplete - please address the issues above')
    logInfo('Run this script again after making changes')
  }

  process.exit(config.isValid && healthCheckPassed ? 0 : 1)
}

// Run the setup
main().catch(error => {
  logError(`Setup failed: ${error}`)
  process.exit(1)
})