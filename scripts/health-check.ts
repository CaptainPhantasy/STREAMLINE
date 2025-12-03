#!/usr/bin/env tsx

/**
 * Health Check Script
 *
 * Verifies that all components of the CRM AI Pro system are running correctly.
 *
 * Usage: npm run health-check
 */

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  url?: string
  error?: string
  responseTime?: number
}

async function checkHealth(url: string, timeout = 5000): Promise<HealthCheckResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CRM-AI-Pro-Health-Check/1.0'
      }
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        service: url,
        status: 'healthy',
        url,
        responseTime
      }
    } else {
      return {
        service: url,
        status: 'unhealthy',
        url,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    return {
      service: url,
      status: 'unhealthy',
      url,
      error: error.message,
      responseTime
    }
  }
}

async function main() {
  console.log('🏥 CRM AI Pro Health Check')
  console.log('=' .repeat(50))

  const checks = [
    // Main CRM Application
    { name: 'CRM App', url: 'http://localhost:3000/api/health' },
    { name: 'CRM App (UI)', url: 'http://localhost:3000' },

    // MCP Server
    { name: 'MCP Server', url: 'http://localhost:3001/health' },

    // LLM Router
    { name: 'LLM Router', url: 'http://localhost:3000/api/llm/health' },

    // Supabase (if using local)
    { name: 'Supabase Studio', url: 'http://localhost:54321' },
    { name: 'Supabase API', url: 'http://localhost:54324/health' },

    // Voice Command API
    { name: 'Voice Command API', url: 'http://localhost:3000/api/voice-command' },

    // MCP API (via Next.js proxy)
    { name: 'MCP API Proxy', url: 'http://localhost:3000/api/mcp' },
  ]

  const results: HealthCheckResult[] = []

  for (const check of checks) {
    console.log(`\n🔍 Checking ${check.name}...`)
    const result = await checkHealth(check.url)
    results.push({ service: check.name, ...result })

    if (result.status === 'healthy') {
      console.log(`  ✅ ${check.name}: Healthy (${result.responseTime}ms)`)
    } else {
      console.log(`  ❌ ${check.name}: ${result.error || 'Unknown error'}`)
    }
  }

  console.log('\n' + '=' .repeat(50))
  console.log('📊 Health Check Summary')

  const healthy = results.filter(r => r.status === 'healthy').length
  const total = results.length

  console.log(`\nOverall Status: ${healthy === total ? '✅ All systems healthy' : `⚠️  ${healthy}/${total} services healthy`}`)

  if (healthy < total) {
    console.log('\nUnhealthy Services:')
    results.filter(r => r.status !== 'healthy').forEach(result => {
      console.log(`  - ${result.service}: ${result.error}`)
    })

    console.log('\nTroubleshooting tips:')
    console.log('1. Make sure Docker containers are running: docker-compose ps')
    console.log('2. Check container logs: docker-compose logs [service-name]')
    console.log('3. Restart services: docker-compose restart [service-name]')
    console.log('4. Full restart: npm run stop && npm run dev:full')

    process.exit(1)
  } else {
    console.log('\n🎉 All services are running correctly!')
    console.log('\nReady for development:')
    console.log('  📱 CRM App: http://localhost:3000')
    console.log('  🎤 Voice Demo: http://localhost:3000/voice-demo')
    console.log('  🔧 MCP Server: http://localhost:3001')
    console.log('  📊 Supabase Studio: http://localhost:54321')
  }
}

main().catch((error) => {
  console.error('Health check failed:', error)
  process.exit(1)
})
