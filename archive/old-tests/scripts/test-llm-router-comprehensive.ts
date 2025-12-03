import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

interface TestCase {
  useCase: string
  prompt: string
  expectedProvider?: string
  expectedModel?: string
  description: string
}

interface TestResult {
  testCase: string
  success: boolean
  provider?: string
  model?: string
  tokens?: number | string
  duration?: number
  responseLength?: number
  error?: string
}

async function testLLMRouter() {
  console.log('🧪 Comprehensive LLM Router Testing')
  console.log('=====================================\n')
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Testing: OpenAI and Anthropic providers only\n`)

  // Authenticate first
  console.log('🔐 Authenticating test user...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@317plumber.com',
    password: 'TestPass123!',
  })

  if (authError || !authData.session) {
    console.log(`❌ Authentication failed: ${authError?.message}`)
    console.log('   Note: Make sure test user exists. Run: npx tsx scripts/setup-317plumber-users.ts')
    process.exit(1)
  }

  const token = authData.session.access_token
  console.log(`✅ Authenticated successfully\n`)

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const testCases: TestCase[] = [
    {
      useCase: 'draft',
      prompt: 'Draft a professional email to a customer confirming their plumbing appointment for tomorrow at 2 PM.',
      expectedProvider: 'anthropic',
      expectedModel: 'claude-haiku-4-5',
      description: 'Draft generation (should use Claude Haiku 4.5 - fastest & cheapest)'
    },
    {
      useCase: 'summary',
      prompt: 'Summarize this conversation: Customer called about a leaky faucet. We scheduled a visit for next Tuesday. They will need to be home between 1-3 PM.',
      expectedProvider: 'anthropic',
      expectedModel: 'claude-haiku-4-5',
      description: 'Summary generation (should use Claude Haiku 4.5 or GPT-4o-mini)'
    },
    {
      useCase: 'complex',
      prompt: 'Analyze the following plumbing problem: Customer reports low water pressure on second floor only, all other floors normal. What are the most likely causes and recommended diagnostic steps?',
      expectedProvider: 'anthropic',
      expectedModel: 'claude-3-5-sonnet',
      description: 'Complex analysis (should prefer Claude Sonnet 3.5)'
    },
    {
      useCase: 'general',
      prompt: 'What are the top 3 reasons homeowners should get annual plumbing inspections?',
      expectedProvider: 'openai',
      expectedModel: 'gpt-4o-mini',
      description: 'General queries (should use default: GPT-4o-mini or Haiku 4.5)'
    },
  ]

  const results: TestResult[] = []

  for (const testCase of testCases) {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`📝 Test: ${testCase.description}`)
    console.log(`   Use case: ${testCase.useCase}`)
    console.log(`   Expected: ${testCase.expectedProvider}/${testCase.expectedModel || 'any'}`)

    try {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/api/llm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          useCase: testCase.useCase,
          prompt: testCase.prompt,
          maxTokens: 150, // Keep responses short for testing
        }),
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`   ❌ FAILED (HTTP ${response.status})`)
        console.log(`   Error: ${errorText.substring(0, 200)}`)
        results.push({
          testCase: testCase.description,
          success: false,
          error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
        })
        continue
      }

      const data = await response.json()

      if (data.success && data.text) {
        const provider = data.provider || 'unknown'
        const model = data.model || 'unknown'
        const tokens = data.usage?.total_tokens || 'N/A'

        console.log(`   ✅ SUCCESS`)
        console.log(`   Provider: ${provider}`)
        console.log(`   Model: ${model}`)
        console.log(`   Tokens: ${tokens}`)
        console.log(`   Duration: ${duration}ms`)
        console.log(`   Response: ${data.text.substring(0, 80)}...`)

        results.push({
          testCase: testCase.description,
          success: true,
          provider,
          model,
          tokens,
          duration,
          responseLength: data.text.length,
        })

        // Check if provider/model matches expectation
        const providerMatch = !testCase.expectedProvider ||
          provider.toLowerCase().includes(testCase.expectedProvider.toLowerCase())
        const modelMatch = !testCase.expectedModel ||
          model.toLowerCase().includes(testCase.expectedModel.toLowerCase())

        if (!providerMatch || !modelMatch) {
          console.log(`   ⚠️  Expected ${testCase.expectedProvider}/${testCase.expectedModel}, got ${provider}/${model}`)
        }
      } else {
        console.log(`   ❌ FAILED - Invalid response format`)
        console.log(`   Response: ${JSON.stringify(data).substring(0, 200)}`)
        results.push({
          testCase: testCase.description,
          success: false,
          error: 'Invalid response format',
        })
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`)
      if (error.message.includes('ECONNREFUSED')) {
        console.log(`   Note: Make sure Next.js dev server is running: PORT=3002 npm run dev`)
      }
      results.push({
        testCase: testCase.description,
        success: false,
        error: error.message,
      })
    }
  }

  // Test fallback chain
  console.log(`\n${'─'.repeat(70)}`)
  console.log(`🔄 Test: Fallback Chain`)
  console.log(`   Testing with invalid use case (should fallback to default)...`)

  try {
    const response = await fetch(`${baseUrl}/api/llm`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        useCase: 'invalid-use-case-12345',
        prompt: 'Test fallback mechanism',
        maxTokens: 50,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.text) {
        console.log(`   ✅ Fallback working - Provider: ${data.provider || 'default'}`)
        console.log(`   Model: ${data.model || 'unknown'}`)
        results.push({
          testCase: 'Fallback chain',
          success: true,
          provider: data.provider,
          model: data.model,
        })
      } else {
        console.log(`   ⚠️  Response received but may not be valid`)
        results.push({
          testCase: 'Fallback chain',
          success: false,
          error: 'Invalid response format',
        })
      }
    } else {
      console.log(`   ❌ Fallback test failed (HTTP ${response.status})`)
      results.push({
        testCase: 'Fallback chain',
        success: false,
        error: `HTTP ${response.status}`,
      })
    }
  } catch (error: any) {
    console.log(`   ❌ Fallback test error: ${error.message}`)
    results.push({
      testCase: 'Fallback chain',
      success: false,
      error: error.message,
    })
  }

  // Test missing prompt validation
  console.log(`\n${'─'.repeat(70)}`)
  console.log(`🔍 Test: Input Validation`)
  console.log(`   Testing with missing prompt (should return 400)...`)

  try {
    const response = await fetch(`${baseUrl}/api/llm`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        useCase: 'general',
        // prompt missing
      }),
    })

    if (response.status === 400) {
      console.log(`   ✅ Validation working - Returns 400 for missing prompt`)
      results.push({
        testCase: 'Input validation',
        success: true,
      })
    } else {
      console.log(`   ⚠️  Expected 400, got ${response.status}`)
      results.push({
        testCase: 'Input validation',
        success: false,
        error: `Expected 400, got ${response.status}`,
      })
    }
  } catch (error: any) {
    console.log(`   ❌ Validation test error: ${error.message}`)
    results.push({
      testCase: 'Input validation',
      success: false,
      error: error.message,
    })
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`)
  console.log('📊 Test Summary')
  console.log(`${'='.repeat(70)}`)

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const total = results.length
  const successRate = ((successful / total) * 100).toFixed(1)

  console.log(`\n✅ Successful: ${successful}/${total}`)
  console.log(`❌ Failed: ${failed}/${total}`)
  console.log(`📈 Success Rate: ${successRate}%`)

  if (successful > 0) {
    const resultsWithDuration = results.filter(r => r.duration)
    if (resultsWithDuration.length > 0) {
      const avgDuration = resultsWithDuration
        .reduce((sum, r) => sum + (r.duration || 0), 0) / resultsWithDuration.length
      console.log(`⏱️  Average duration: ${Math.round(avgDuration)}ms`)
    }

    const providers = [...new Set(results.filter(r => r.provider).map(r => r.provider))]
    console.log(`🔌 Providers used: ${providers.join(', ')}`)

    const models = [...new Set(results.filter(r => r.model).map(r => r.model))]
    console.log(`🤖 Models used: ${models.join(', ')}`)
  }

  // Detailed results
  console.log(`\n${'─'.repeat(70)}`)
  console.log('Detailed Results:')
  console.log(`${'─'.repeat(70)}`)
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${index + 1}. ${icon} ${result.testCase}`)
    if (result.provider) console.log(`   Provider: ${result.provider}`)
    if (result.model) console.log(`   Model: ${result.model}`)
    if (result.duration) console.log(`   Duration: ${result.duration}ms`)
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log(`\n${'='.repeat(70)}`)

  if (failed === 0) {
    console.log('🎉 All tests passed!')
    console.log('\nNext steps:')
    console.log('  1. Test in production environment')
    console.log('  2. Monitor token usage in crmai_audit table')
    console.log('  3. Review provider costs in OpenAI/Anthropic dashboards')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed. Review output above.')
    console.log('\nTroubleshooting:')
    console.log('  1. Verify API keys are set correctly in .env.local')
    console.log('  2. Check dev server is running: PORT=3002 npm run dev')
    console.log('  3. Ensure test user exists: npx tsx scripts/setup-317plumber-users.ts')
    console.log('  4. Review logs for detailed error messages')
    process.exit(1)
  }
}

// Run tests
testLLMRouter().catch((error) => {
  console.error('\n❌ Fatal error:', error.message)
  console.error(error.stack)
  process.exit(1)
})
