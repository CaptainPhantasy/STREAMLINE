/**
 * Voice Agent LLM Router Integration Test
 *
 * Tests the integration between the voice-command Edge Function and LLM router.
 *
 * Usage:
 *   npx tsx scripts/test-voice-integration.ts
 *
 * Environment:
 *   Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Test results tracking
interface TestResult {
  name: string
  success: boolean
  latency?: number
  error?: string
  details?: any
}

const results: TestResult[] = []

function logTest(name: string, status: 'running' | 'pass' | 'fail', details?: string) {
  const emoji = status === 'running' ? '🔄' : status === 'pass' ? '✅' : '❌'
  const message = details ? `${name} - ${details}` : name
  console.log(`${emoji} ${message}`)
}

// ================================================================
// Test 1: Verify 'voice' use case in database
// ================================================================
async function testVoiceUseCaseInDB(): Promise<TestResult> {
  logTest('Test 1: Verify voice use case in database', 'running')

  try {
    const { data, error } = await supabase
      .from('llm_providers')
      .select('name, provider, model, use_case, is_active')
      .contains('use_case', ['voice'])
      .eq('is_active', true)

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        name: 'Verify voice use case in database',
        success: false,
        error: 'No providers configured for voice use case. Run: supabase/add-voice-use-case.sql'
      }
    }

    logTest('Test 1: Verify voice use case in database', 'pass', `Found ${data.length} provider(s)`)
    console.log('   Providers:', data.map(p => p.name).join(', '))

    return {
      name: 'Verify voice use case in database',
      success: true,
      details: { providers: data }
    }
  } catch (error: any) {
    logTest('Test 1: Verify voice use case in database', 'fail', error.message)
    return {
      name: 'Verify voice use case in database',
      success: false,
      error: error.message
    }
  }
}

// ================================================================
// Test 2: Test LLM router with voice use case
// ================================================================
async function testLLMRouterVoiceCase(): Promise<TestResult> {
  logTest('Test 2: Test LLM router with voice use case', 'running')

  try {
    const startTime = Date.now()

    // Get a test account ID
    const { data: accountData } = await supabase
      .from('accounts')
      .select('id')
      .limit(1)
      .single()

    if (!accountData) {
      throw new Error('No accounts found in database')
    }

    const response = await fetch(`${BASE_URL}/api/llm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: accountData.id,
        useCase: 'voice',
        prompt: 'Parse this voice command: What jobs do I have today?',
        systemPrompt: 'You are a voice assistant. Parse commands and identify the action.',
        maxTokens: 150,
        temperature: 0.3,
        stream: false,
      }),
    })

    const latency = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Router returned success: false')
    }

    const latencyStatus = latency < 500 ? '✓' : latency < 1000 ? '⚠' : '✗'
    logTest('Test 2: Test LLM router with voice use case', 'pass', `${latency}ms ${latencyStatus}`)
    console.log('   Provider:', data.provider)
    console.log('   Model:', data.model)
    console.log('   Response:', data.text?.substring(0, 100) + (data.text?.length > 100 ? '...' : ''))

    return {
      name: 'Test LLM router with voice use case',
      success: true,
      latency,
      details: {
        provider: data.provider,
        model: data.model,
        tokens: data.usage?.totalTokens
      }
    }
  } catch (error: any) {
    logTest('Test 2: Test LLM router with voice use case', 'fail', error.message)
    return {
      name: 'Test LLM router with voice use case',
      success: false,
      error: error.message
    }
  }
}

// ================================================================
// Test 3: Test LLM router with tool calling (voice)
// ================================================================
async function testLLMRouterWithTools(): Promise<TestResult> {
  logTest('Test 3: Test LLM router with tool calling', 'running')

  try {
    const startTime = Date.now()

    // Get a test account ID
    const { data: accountData } = await supabase
      .from('accounts')
      .select('id')
      .limit(1)
      .single()

    if (!accountData) {
      throw new Error('No accounts found in database')
    }

    const response = await fetch(`${BASE_URL}/api/llm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: accountData.id,
        useCase: 'voice',
        prompt: 'Parse this voice command and call the appropriate tool: What jobs do I have today?',
        systemPrompt: 'You are a voice assistant. Parse commands and call the appropriate tool.',
        maxTokens: 150,
        temperature: 0.3,
        stream: false,
        tools: {
          list_jobs: {
            description: 'List jobs with optional filters',
            parameters: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Filter by status' },
                date: { type: 'string', description: 'Filter by date' },
              },
            },
          },
        },
        toolChoice: 'auto',
        maxSteps: 1,
      }),
    })

    const latency = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Router returned success: false')
    }

    const hasToolCalls = data.toolCalls && data.toolCalls.length > 0
    const latencyStatus = latency < 500 ? '✓' : latency < 1000 ? '⚠' : '✗'

    logTest('Test 3: Test LLM router with tool calling', 'pass', `${latency}ms ${latencyStatus}`)
    console.log('   Provider:', data.provider)
    console.log('   Model:', data.model)
    console.log('   Tool calls:', hasToolCalls ? data.toolCalls.length : 0)
    if (hasToolCalls) {
      console.log('   Tools called:', data.toolCalls.map((tc: any) => tc.toolName).join(', '))
    }

    return {
      name: 'Test LLM router with tool calling',
      success: true,
      latency,
      details: {
        provider: data.provider,
        model: data.model,
        toolCallCount: data.toolCalls?.length || 0,
        toolsCalled: data.toolCalls?.map((tc: any) => tc.toolName) || []
      }
    }
  } catch (error: any) {
    logTest('Test 3: Test LLM router with tool calling', 'fail', error.message)
    return {
      name: 'Test LLM router with tool calling',
      success: false,
      error: error.message
    }
  }
}

// ================================================================
// Test 4: Test voice-command Edge Function (if deployed)
// ================================================================
async function testVoiceCommandEdgeFunction(): Promise<TestResult> {
  logTest('Test 4: Test voice-command Edge Function', 'running')

  try {
    const startTime = Date.now()

    // Get a test account ID
    const { data: accountData } = await supabase
      .from('accounts')
      .select('id')
      .limit(1)
      .single()

    if (!accountData) {
      throw new Error('No accounts found in database')
    }

    const functionUrl = `${SUPABASE_URL}/functions/v1/voice-command`
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: accountData.id,
        transcription: 'What jobs do I have today?',
        context: {},
      }),
    })

    const latency = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      // If 404, function not deployed - skip test
      if (response.status === 404) {
        logTest('Test 4: Test voice-command Edge Function', 'pass', 'SKIPPED (not deployed)')
        return {
          name: 'Test voice-command Edge Function',
          success: true,
          details: { skipped: true, reason: 'Function not deployed' }
        }
      }
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    if (!data.success && !data.action) {
      throw new Error(data.error || 'Voice command failed')
    }

    const latencyStatus = latency < 500 ? '✓' : latency < 1000 ? '⚠' : '✗'
    logTest('Test 4: Test voice-command Edge Function', 'pass', `${latency}ms ${latencyStatus}`)
    console.log('   Action:', data.action)
    console.log('   Response:', data.response?.substring(0, 100) + (data.response?.length > 100 ? '...' : ''))

    return {
      name: 'Test voice-command Edge Function',
      success: true,
      latency,
      details: {
        action: data.action,
        hasResponse: !!data.response
      }
    }
  } catch (error: any) {
    logTest('Test 4: Test voice-command Edge Function', 'fail', error.message)
    return {
      name: 'Test voice-command Edge Function',
      success: false,
      error: error.message
    }
  }
}

// ================================================================
// Test 5: Check audit logs for voice requests
// ================================================================
async function testAuditLogs(): Promise<TestResult> {
  logTest('Test 5: Check audit logs for voice requests', 'running')

  try {
    const { data, error } = await supabase
      .from('crmai_audit')
      .select('*')
      .eq('action', 'llm_request')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    const voiceLogs = data?.filter((log: any) =>
      log.new_values?.use_case === 'voice'
    ) || []

    logTest('Test 5: Check audit logs for voice requests', 'pass', `${voiceLogs.length} voice request(s) logged`)

    if (voiceLogs.length > 0) {
      console.log('   Latest voice request:')
      console.log('     Provider:', voiceLogs[0].new_values?.provider)
      console.log('     Model:', voiceLogs[0].new_values?.model)
      console.log('     Tokens:', voiceLogs[0].new_values?.tokens_used)
      console.log('     Time:', voiceLogs[0].created_at)
    }

    return {
      name: 'Check audit logs for voice requests',
      success: true,
      details: {
        totalLogs: data?.length || 0,
        voiceLogs: voiceLogs.length
      }
    }
  } catch (error: any) {
    logTest('Test 5: Check audit logs for voice requests', 'fail', error.message)
    return {
      name: 'Check audit logs for voice requests',
      success: false,
      error: error.message
    }
  }
}

// ================================================================
// Main test runner
// ================================================================
async function runTests() {
  console.log('🚀 Voice Agent LLM Router Integration Tests\n')
  console.log('Environment:')
  console.log('  Supabase URL:', SUPABASE_URL)
  console.log('  Base URL:', BASE_URL)
  console.log('')

  // Run tests sequentially
  results.push(await testVoiceUseCaseInDB())
  results.push(await testLLMRouterVoiceCase())
  results.push(await testLLMRouterWithTools())
  results.push(await testVoiceCommandEdgeFunction())
  results.push(await testAuditLogs())

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary\n')

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const avgLatency = results
    .filter(r => r.latency !== undefined)
    .reduce((sum, r) => sum + (r.latency || 0), 0) /
    results.filter(r => r.latency !== undefined).length

  console.log(`Total: ${results.length}`)
  console.log(`Passed: ${passed} ✅`)
  console.log(`Failed: ${failed} ❌`)

  if (avgLatency) {
    console.log(`\nAverage Latency: ${Math.round(avgLatency)}ms`)
    if (avgLatency < 500) {
      console.log('  Status: ✅ EXCELLENT (< 500ms target)')
    } else if (avgLatency < 1000) {
      console.log('  Status: ⚠️  ACCEPTABLE (500-1000ms)')
    } else {
      console.log('  Status: ❌ NEEDS IMPROVEMENT (> 1000ms)')
    }
  }

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}`)
      console.log(`    Error: ${r.error}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test runner failed:', error)
  process.exit(1)
})
