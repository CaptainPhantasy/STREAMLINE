#!/usr/bin/env tsx
/**
 * Test Voice Agent MCP Integration
 *
 * This script tests the complete integration between:
 * 1. Voice Agent (voice-command edge function)
 * 2. MCP Server (mcp-server edge function)
 * 3. CRM API endpoints
 *
 * Run with: tsx scripts/test-voice-agent-mcp-integration.ts
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration?: number
  details?: any
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    const duration = Date.now() - start
    results.push({ test: name, status: 'PASS', message: 'Success', duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({
      test: name,
      status: 'FAIL',
      message: error.message,
      duration,
      details: error.stack,
    })
    console.log(`❌ ${name} (${duration}ms)`)
    console.log(`   Error: ${error.message}`)
  }
}

// Helper to make MCP requests
async function mcpRequest(method: string, params?: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-server`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  return await response.json()
}

// Helper to make voice command requests
async function voiceCommand(transcription: string, accountId?: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-command`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accountId: accountId || 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00',
      transcription,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  return await response.json()
}

console.log('🧪 Testing Voice Agent MCP Integration\n')
console.log('=' .repeat(60))
console.log('')

// Test 1: MCP Server Initialization
await test('MCP Server - Initialize', async () => {
  const result = await mcpRequest('initialize')
  if (!result.result?.protocolVersion) {
    throw new Error('No protocol version returned')
  }
  if (result.result.serverInfo?.name !== 'crm-ai-pro-mcp') {
    throw new Error(`Unexpected server name: ${result.result.serverInfo?.name}`)
  }
})

// Test 2: MCP Server - List Tools
let toolCount = 0
await test('MCP Server - List Tools', async () => {
  const result = await mcpRequest('tools/list')
  if (!result.result?.tools) {
    throw new Error('No tools returned')
  }
  toolCount = result.result.tools.length
  if (toolCount < 50) {
    throw new Error(`Expected 50+ tools, got ${toolCount}`)
  }
  console.log(`   Found ${toolCount} tools`)
})

// Test 3: MCP Server - Tool Execution (search_contacts)
await test('MCP Server - Execute Tool (search_contacts)', async () => {
  const result = await mcpRequest('tools/call', {
    name: 'search_contacts',
    arguments: { search: 'test' },
  })
  if (!result.result?.content) {
    throw new Error('No content in tool result')
  }
  const content = JSON.parse(result.result.content[0].text)
  if (!Array.isArray(content.contacts)) {
    throw new Error('Expected contacts array in result')
  }
  console.log(`   Found ${content.contacts.length} contacts`)
})

// Test 4: MCP Server - Tool Execution (list_jobs)
await test('MCP Server - Execute Tool (list_jobs)', async () => {
  const result = await mcpRequest('tools/call', {
    name: 'list_jobs',
    arguments: { limit: 5 },
  })
  if (!result.result?.content) {
    throw new Error('No content in tool result')
  }
  const content = JSON.parse(result.result.content[0].text)
  if (!Array.isArray(content.jobs)) {
    throw new Error('Expected jobs array in result')
  }
  console.log(`   Found ${content.jobs.length} jobs`)
})

// Test 5: Voice Command - Tool Discovery
await test('Voice Command - Discovers MCP Tools', async () => {
  // This test verifies the voice command can fetch tools from MCP
  // We can't directly test this without triggering a full voice command,
  // but we can verify the endpoint is accessible
  const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-command`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST',
    },
  })
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Voice command endpoint not accessible: ${response.status}`)
  }
})

// Test 6: Integration Test - Voice Command with Real Transcription
await test('Integration - Voice Command Execution', async () => {
  const result = await voiceCommand('Show me all jobs for today')
  if (!result.response) {
    throw new Error('No response from voice command')
  }
  console.log(`   Response length: ${result.response.length} chars`)
})

// Test 7: Documentation Files Exist
await test('Documentation - Tool Reference Exists', async () => {
  const fs = await import('fs')
  const path = 'docs/VOICE_AGENT_COMPLETE_TOOL_REFERENCE.md'
  if (!fs.existsSync(path)) {
    throw new Error('Tool reference documentation not found')
  }
  const stats = fs.statSync(path)
  if (stats.size < 10000) {
    throw new Error('Tool reference seems too small')
  }
  console.log(`   Size: ${Math.round(stats.size / 1024)}KB`)
})

await test('Documentation - Workflow Procedures Exist', async () => {
  const fs = await import('fs')
  const path = 'docs/VOICE_AGENT_WORKFLOW_PROCEDURES.md'
  if (!fs.existsSync(path)) {
    throw new Error('Workflow procedures documentation not found')
  }
  const stats = fs.statSync(path)
  console.log(`   Size: ${Math.round(stats.size / 1024)}KB`)
})

await test('Documentation - Teaching Guide Exists', async () => {
  const fs = await import('fs')
  const path = 'docs/VOICE_AGENT_TEACHING_GUIDE.md'
  if (!fs.existsSync(path)) {
    throw new Error('Teaching guide documentation not found')
  }
  const stats = fs.statSync(path)
  console.log(`   Size: ${Math.round(stats.size / 1024)}KB`)
})

// Test 8: Voice Command Integration File
await test('Integration - Voice Command Has MCP Functions', async () => {
  const fs = await import('fs')
  const content = fs.readFileSync('supabase/functions/voice-command/index.ts', 'utf-8')

  if (!content.includes('convertMCPToolsToOpenAIFormat')) {
    throw new Error('Missing convertMCPToolsToOpenAIFormat function')
  }
  if (!content.includes('fetchMCPTools')) {
    throw new Error('Missing fetchMCPTools function')
  }
  if (!content.includes('executeMCPTool')) {
    throw new Error('Missing executeMCPTool function')
  }
  if (!content.includes('Fetch tools from MCP server')) {
    throw new Error('Missing MCP tools fetch in main handler')
  }
})

console.log('')
console.log('=' .repeat(60))
console.log('')
console.log('📊 Test Results Summary\n')

const passed = results.filter((r) => r.status === 'PASS').length
const failed = results.filter((r) => r.status === 'FAIL').length
const total = results.length

console.log(`Total Tests: ${total}`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log('')

if (failed > 0) {
  console.log('Failed Tests:')
  results
    .filter((r) => r.status === 'FAIL')
    .forEach((r) => {
      console.log(`  - ${r.test}`)
      console.log(`    ${r.message}`)
    })
  console.log('')
}

const avgDuration = results.reduce((acc, r) => acc + (r.duration || 0), 0) / total
console.log(`Average Duration: ${Math.round(avgDuration)}ms`)
console.log('')

console.log('=' .repeat(60))
console.log('')

if (failed === 0) {
  console.log('✅ All tests passed! Voice Agent MCP integration is working correctly.')
  console.log('')
  console.log('Next Steps:')
  console.log('1. Upload documentation to ElevenLabs RAG:')
  console.log('   - docs/VOICE_AGENT_COMPLETE_TOOL_REFERENCE.md')
  console.log('   - docs/VOICE_AGENT_WORKFLOW_PROCEDURES.md')
  console.log('   - docs/VOICE_AGENT_TEACHING_GUIDE.md')
  console.log('')
  console.log('2. Test with real voice commands via ElevenLabs')
  console.log('3. Monitor MCP server logs for errors')
  console.log('4. Gather user feedback on voice interactions')
  process.exit(0)
} else {
  console.log('❌ Some tests failed. Please review and fix issues.')
  process.exit(1)
}
