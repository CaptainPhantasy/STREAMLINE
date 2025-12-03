#!/usr/bin/env tsx

/**
 * Development Environment Setup Script
 *
 * Sets up the complete development environment for CRM AI Pro
 * including Docker, MCP server, and ElevenLabs integration.
 *
 * Usage: npm run setup:dev
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

const log = (message: string) => console.log(`🔧 ${message}`)
const error = (message: string) => console.error(`❌ ${message}`)
const success = (message: string) => console.log(`✅ ${message}`)

async function main() {
  try {
    log('Setting up CRM AI Pro development environment...')

    // Check prerequisites
    await checkPrerequisites()

    // Setup environment variables
    await setupEnvironment()

    // Setup Docker environment
    await setupDocker()

    // MCP server is deployed on Supabase - no local setup needed

    // Configure ElevenLabs integration
    await configureElevenLabs()

    // Setup Supabase edge functions
    await setupEdgeFunctions()

    success('Development environment setup complete!')
    log('')
    log('Next steps:')
    log('1. Run: npm run dev:full')
    log('2. Open: http://localhost:3000')
    log('3. Test voice agent: http://localhost:3000/voice-demo')
    log('4. MCP server is deployed at: https://expbvujyegxmxvatcjqt.supabase.co/functions/v1/mcp-server')

  } catch (err) {
    error(`Setup failed: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}

async function checkPrerequisites() {
  log('Checking prerequisites...')

  // Check Node.js version
  const nodeVersion = process.version
  if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
    throw new Error(`Node.js version ${nodeVersion} not supported. Please use Node.js 18 or 20.`)
  }

  // Check Docker
  try {
    execSync('docker --version', { stdio: 'pipe' })
    success('Docker is installed')
  } catch {
    throw new Error('Docker is not installed. Please install Docker Desktop.')
  }

  // Check Docker Compose
  try {
    execSync('docker-compose --version', { stdio: 'pipe' })
    success('Docker Compose is installed')
  } catch {
    throw new Error('Docker Compose is not installed.')
  }

  // Check Supabase CLI
  try {
    execSync('supabase --version', { stdio: 'pipe' })
    success('Supabase CLI is installed')
  } catch {
    log('Supabase CLI not found. Installing...')
    execSync('npm install -g supabase', { stdio: 'inherit' })
  }
}

async function setupEnvironment() {
  log('Setting up environment variables...')

  const envExamplePath = join(process.cwd(), '.env.example')
  const envPath = join(process.cwd(), '.env.local')

  if (!existsSync(envExamplePath)) {
    // Create basic .env.example
    const envExample = `# CRM AI Pro Environment Variables

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM Router Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# ElevenLabs Voice Agent
ELEVENLABS_AGENT_ID=agent_6501katrbe2re0c834kfes3hvk2d
ELEVENLABS_API_KEY=your-elevenlabs-key

# Email Service
RESEND_API_KEY=your-resend-key

# Development
NODE_ENV=development
`
    writeFileSync(envExamplePath, envExample)
    log('Created .env.example')
  }

  if (!existsSync(envPath)) {
    log('Please configure your .env.local file with actual API keys.')
    log('Copy .env.example to .env.local and fill in your credentials.')
    throw new Error('Environment file not configured')
  }

  success('Environment variables configured')
}

async function setupDocker() {
  log('Setting up Docker environment...')

  // Check if docker-compose.yml exists
  if (!existsSync(join(process.cwd(), 'docker-compose.yml'))) {
    throw new Error('docker-compose.yml not found')
  }

  // Pull base images
  try {
    execSync('docker-compose pull', { stdio: 'inherit' })
    success('Docker images pulled')
  } catch (err) {
    log('Warning: Could not pull Docker images, will build from scratch')
  }
}

async function setupMCPServer() {
  log('Setting up MCP server...')

  const mcpDir = join(process.cwd(), 'mcp-server')
  if (!existsSync(mcpDir)) {
    throw new Error('MCP server directory not found')
  }

  // Install MCP server dependencies
  execSync('cd mcp-server && npm install', { stdio: 'inherit' })
  success('MCP server dependencies installed')
}

async function configureElevenLabs() {
  log('Configuring ElevenLabs voice agent...')

  const elevenlabsScript = join(process.cwd(), 'scripts', 'configure-elevenlabs-agent.ts')
  if (existsSync(elevenlabsScript)) {
    execSync(`tsx ${elevenlabsScript}`, { stdio: 'inherit' })
    success('ElevenLabs agent configured')
  } else {
    log('ElevenLabs configuration script not found, skipping automated setup')
    log('Manual setup required: Configure agent_6501katrbe2re0c834kfes3hvk2d in ElevenLabs dashboard')
  }
}

async function setupEdgeFunctions() {
  log('Setting up Supabase edge functions...')

  const functionsDir = join(process.cwd(), 'supabase', 'functions')
  if (!existsSync(functionsDir)) {
    log('Edge functions directory not found, skipping')
    return
  }

  try {
    // Deploy edge functions
    execSync('supabase functions deploy', { stdio: 'inherit' })
    success('Edge functions deployed')
  } catch (err) {
    log('Warning: Could not deploy edge functions automatically')
    log('Run: supabase functions deploy manually after setting up Supabase project')
  }
}

// Run the setup
main().catch((err) => {
  error(`Setup failed: ${err}`)
  process.exit(1)
})
