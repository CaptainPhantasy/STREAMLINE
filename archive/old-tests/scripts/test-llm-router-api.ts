import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

async function testLLMRouterAPI() {
  console.log('🧪 Testing LLM Router API Endpoint\n')
  console.log(`Base URL: ${baseUrl}\n`)

  const results: TestResult[] = []

  try {
    // 1. Authenticate
    console.log('1. Authenticating test user...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@317plumber.com',
      password: 'TestPass123!',
    })

    if (authError || !authData.session) {
      console.log(`   ❌ Authentication failed: ${authError?.message}`)
      console.log('   Note: Make sure test user exists. Check: scripts/setup-auth.ts')
      return
    }

    const token = authData.session.access_token
    console.log(`   ✅ Authenticated successfully`)
    console.log(`   Token: ${token.substring(0, 20)}...\n`)

    // 2. Test: Unauthorized (no token)
    console.log('2. Testing unauthorized request...')
    try {
      const response = await fetch(`${baseUrl}/api/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'test' }),
      })

      if (response.status === 401) {
        console.log('   ✅ Returns 401 for unauthorized request')
        results.push({ name: 'Unauthorized request', passed: true })
      } else {
        console.log(`   ❌ Expected 401, got ${response.status}`)
        results.push({ name: 'Unauthorized request', passed: false, error: `Got ${response.status} instead of 401` })
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      results.push({ name: 'Unauthorized request', passed: false, error: error.message })
    }

    // 3. Test: Missing prompt
    console.log('\n3. Testing validation (missing prompt)...')
    try {
      const response = await fetch(`${baseUrl}/api/llm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      if (response.status === 400 && data.error?.includes('Prompt is required')) {
        console.log('   ✅ Returns 400 for missing prompt')
        results.push({ name: 'Missing prompt validation', passed: true })
      } else {
        console.log(`   ❌ Expected 400, got ${response.status}`)
        results.push({ name: 'Missing prompt validation', passed: false, error: `Got ${response.status}` })
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      results.push({ name: 'Missing prompt validation', passed: false, error: error.message })
    }

    // 4. Test: Draft use case (should route to Claude Haiku 4.5)
    console.log('\n4. Testing draft use case (should route to Claude Haiku 4.5)...')
    try {
      const response = await fetch(`${baseUrl}/api/llm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useCase: 'draft',
          prompt: 'Draft a short thank you message.',
          maxTokens: 50, // Minimal tokens for testing
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Request successful (${response.status})`)
        console.log(`   Provider: ${data.provider}`)
        console.log(`   Model: ${data.model}`)

        if (data.provider === 'anthropic-claude-haiku-4-5' || data.model === 'claude-haiku-4-5') {
          console.log('   ✅ Correctly routed to Claude Haiku 4.5')
          results.push({ name: 'Draft use case routing', passed: true, details: { provider: data.provider, model: data.model } })
        } else {
          console.log(`   ⚠️  Routed to ${data.provider}/${data.model} instead of Haiku 4.5`)
          results.push({ name: 'Draft use case routing', passed: false, error: `Got ${data.provider}/${data.model}`, details: data })
        }
      } else {
        const error = await response.text()
        console.log(`   ❌ Request failed (${response.status})`)
        console.log(`   Error: ${error.substring(0, 200)}`)
        results.push({ name: 'Draft use case routing', passed: false, error: `Status ${response.status}` })
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      if (error.message.includes('ECONNREFUSED')) {
        console.log('   Note: Make sure Next.js dev server is running: PORT=3002 npm run dev')
      }
      results.push({ name: 'Draft use case routing', passed: false, error: error.message })
    }

    // 5. Test: Complex use case (should route to Claude Sonnet)
    console.log('\n5. Testing complex use case (should route to Claude Sonnet)...')
    try {
      const response = await fetch(`${baseUrl}/api/llm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useCase: 'complex',
          prompt: 'Explain quantum computing briefly.',
          maxTokens: 50,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Request successful (${response.status})`)
        console.log(`   Provider: ${data.provider}`)
        console.log(`   Model: ${data.model}`)

        if (data.provider?.includes('sonnet') || data.model?.includes('sonnet')) {
          console.log('   ✅ Correctly routed to Claude Sonnet')
          results.push({ name: 'Complex use case routing', passed: true, details: { provider: data.provider, model: data.model } })
        } else {
          console.log(`   ⚠️  Routed to ${data.provider}/${data.model} instead of Sonnet`)
          results.push({ name: 'Complex use case routing', passed: false, error: `Got ${data.provider}/${data.model}`, details: data })
        }
      } else {
        const error = await response.text()
        console.log(`   ❌ Request failed (${response.status})`)
        console.log(`   Error: ${error.substring(0, 200)}`)
        results.push({ name: 'Complex use case routing', passed: false, error: `Status ${response.status}` })
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      results.push({ name: 'Complex use case routing', passed: false, error: error.message })
    }

    // 6. Test: Response format
    console.log('\n6. Testing response format...')
    try {
      const response = await fetch(`${baseUrl}/api/llm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useCase: 'general',
          prompt: 'Say hello.',
          maxTokens: 10,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const hasRequiredFields =
          data.success === true &&
          typeof data.text === 'string' &&
          data.provider &&
          data.model &&
          data.usage

        if (hasRequiredFields) {
          console.log('   ✅ Response format is correct')
          console.log(`   Fields: success=${data.success}, text.length=${data.text.length}, provider=${data.provider}, model=${data.model}`)
          results.push({ name: 'Response format', passed: true })
        } else {
          console.log('   ❌ Response missing required fields')
          console.log(`   Got: ${JSON.stringify(Object.keys(data))}`)
          results.push({ name: 'Response format', passed: false, error: 'Missing required fields', details: data })
        }
      } else {
        results.push({ name: 'Response format', passed: false, error: `Status ${response.status}` })
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      results.push({ name: 'Response format', passed: false, error: error.message })
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`)
    console.log('📊 Test Summary')
    console.log(`${'='.repeat(60)}`)

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length

    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${result.name}`)
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })

    console.log(`\n✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`)

    if (failed === 0) {
      console.log('\n🎉 All tests passed!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some tests failed. Review output above.')
      process.exit(1)
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

testLLMRouterAPI()
