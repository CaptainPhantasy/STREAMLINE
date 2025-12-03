#!/usr/bin/env tsx
/**
 * MCP Integration Test Script
 *
 * Tests the integration between MCP tools and the LLM router.
 * Verifies that AI-powered tools work correctly.
 *
 * Usage:
 *   npx tsx scripts/test-mcp-integration.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  details?: any
}

const results: TestResult[] = []

/**
 * Helper to run a test
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now()
  try {
    await testFn()
    results.push({
      name,
      passed: true,
      duration: Date.now() - start,
    })
    console.log(`✅ ${name}`)
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    })
    console.error(`❌ ${name}`)
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Helper to make MCP API requests
 */
async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  }

  const response = await fetch(`${baseUrl}/api/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  const result = await response.json()

  if (result.error) {
    throw new Error(`MCP Error: ${result.error.message || JSON.stringify(result.error)}`)
  }

  // Parse the content text
  if (result.result?.content?.[0]?.text) {
    return JSON.parse(result.result.content[0].text)
  }

  return result.result
}

/**
 * Test 1: Environment Variables
 */
async function testEnvironmentVariables(): Promise<void> {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_BASE_URL',
  ]

  const missing = requiredVars.filter((v) => !process.env[v])

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}

/**
 * Test 2: MCP Server is Running
 */
async function testMCPServerRunning(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

  const response = await fetch(`${baseUrl}/api/mcp`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`MCP server not responding (HTTP ${response.status})`)
  }

  const data = await response.json()

  if (!data.success || data.service !== 'mcp-server') {
    throw new Error('MCP server health check failed')
  }
}

/**
 * Test 3: List Tools (should include AI tools)
 */
async function testListTools(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const response = await fetch(`${baseUrl}/api/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to list tools (HTTP ${response.status})`)
  }

  const result = await response.json()
  const tools = result.result?.tools || []

  const aiTools = [
    'generate_job_description',
    'draft_customer_response',
    'summarize_job_notes',
    'analyze_customer_sentiment',
    'generate_invoice_description',
  ]

  const missingTools = aiTools.filter(
    (name) => !tools.some((t: any) => t.name === name)
  )

  if (missingTools.length > 0) {
    throw new Error(`Missing AI tools: ${missingTools.join(', ')}`)
  }

  console.log(`   Found ${tools.length} total tools, including ${aiTools.length} AI-powered tools`)
}

/**
 * Test 4: generate_job_description Tool
 */
async function testGenerateJobDescription(): Promise<void> {
  const result = await callMCPTool('generate_job_description', {
    jobType: 'plumbing repair',
    customerNotes: 'Kitchen sink is leaking badly, water pooling under the sink',
    additionalContext: 'Customer wants it fixed ASAP',
  })

  if (!result.success) {
    throw new Error(result.error || 'Tool call failed')
  }

  if (!result.description || result.description.length < 10) {
    throw new Error('Generated description is too short or empty')
  }

  console.log(`   Generated description: "${result.description.substring(0, 100)}..."`)
}

/**
 * Test 5: Existing Tool Still Works (regression test)
 */
async function testExistingToolWorks(): Promise<void> {
  const result = await callMCPTool('get_dashboard_stats', {})

  if (result.error) {
    throw new Error(result.error)
  }

  // Should return some stats
  if (!result || typeof result !== 'object') {
    throw new Error('Dashboard stats returned invalid data')
  }

  console.log('   Existing tools still work correctly')
}

/**
 * Test 6: LLM Router Connectivity
 */
async function testLLMRouterConnectivity(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const response = await fetch(`${baseUrl}/api/llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      accountId: 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00',
      useCase: 'general',
      prompt: 'Say "test successful" and nothing else',
      maxTokens: 50,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM Router not responding (HTTP ${response.status})`)
  }

  const result = await response.json()

  if (result.error) {
    throw new Error(`LLM Router error: ${result.error}`)
  }

  if (!result.text || result.text.length === 0) {
    throw new Error('LLM Router returned empty response')
  }

  console.log('   LLM Router is accessible from MCP tools')
}

/**
 * Test 7: Error Handling
 */
async function testErrorHandling(): Promise<void> {
  // Try to call an AI tool with missing required parameters
  try {
    await callMCPTool('generate_job_description', {
      jobType: 'plumbing',
      // Missing customerNotes
    })
    throw new Error('Should have thrown an error for missing required parameter')
  } catch (error) {
    // Expected to fail
    if (error instanceof Error && !error.message.includes('Should have thrown')) {
      // This is the expected error
      console.log('   Error handling works correctly')
    } else {
      throw error
    }
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 MCP Integration Test Suite\n')
  console.log('=' .repeat(60))

  await runTest('1. Environment Variables', testEnvironmentVariables)
  await runTest('2. MCP Server Running', testMCPServerRunning)
  await runTest('3. List Tools (with AI tools)', testListTools)
  await runTest('4. generate_job_description Tool', testGenerateJobDescription)
  await runTest('5. Existing Tools Still Work', testExistingToolWorks)
  await runTest('6. LLM Router Connectivity', testLLMRouterConnectivity)
  await runTest('7. Error Handling', testErrorHandling)

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Test Results:\n')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log(`Total: ${total}`)
  console.log(`Passed: ${passed} ✅`)
  console.log(`Failed: ${failed} ❌`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}`)
        console.log(`    Error: ${r.error}`)
      })
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  console.log(`\nTotal Duration: ${totalDuration}ms`)

  if (failed > 0) {
    process.exit(1)
  }

  console.log('\n✅ All tests passed!')
}

// Run tests
main().catch((error) => {
  console.error('\n💥 Test suite failed:', error)
  process.exit(1)
})
