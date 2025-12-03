import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

async function testMultiProviderRouting() {
  console.log('🔍 Agent 2: Multi-Provider Routing Testing\n')

  const baseUrl = `${supabaseUrl}/functions/v1/llm-router`
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  const testCases = [
    {
      name: 'Complex Task (should use Anthropic)',
      useCase: 'complex',
      prompt: 'Analyze this complex technical problem and provide a detailed multi-step solution.',
      expectedProvider: 'anthropic',
    },
    {
      name: 'Draft Generation (should use OpenAI)',
      useCase: 'draft',
      prompt: 'Write a professional email to a customer about a scheduled appointment.',
      expectedProvider: 'openai',
    },
    {
      name: 'Summary (should use OpenAI)',
      useCase: 'summary',
      prompt: 'Summarize this conversation in 2 sentences.',
      expectedProvider: 'openai',
    },
    {
      name: 'General Query (should use default)',
      useCase: 'general',
      prompt: 'Answer this general question about plumbing.',
      expectedProvider: 'openai',
    },
  ]

  const results: any[] = []

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`)
    
    try {
      const startTime = Date.now()
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          useCase: testCase.useCase,
          prompt: testCase.prompt,
          maxTokens: 50,
        }),
      })

      const duration = Date.now() - startTime
      const data = await response.json()

      if (response.ok && data.text) {
        const provider = data.provider || 'unknown'
        const model = data.model || 'unknown'
        
        console.log(`   ✅ SUCCESS`)
        console.log(`   Provider: ${provider}`)
        console.log(`   Model: ${model}`)
        console.log(`   Duration: ${duration}ms`)

        const matchesExpected = provider.includes(testCase.expectedProvider)
        if (matchesExpected) {
          console.log(`   ✅ Provider matches expectation (${testCase.expectedProvider})`)
        } else {
          console.log(`   ⚠️  Expected ${testCase.expectedProvider}, got ${provider}`)
        }

        results.push({
          testCase: testCase.name,
          success: true,
          provider,
          matchesExpected,
          duration,
        })
      } else {
        console.log(`   ❌ FAILED: ${data.error || 'Unknown error'}`)
        results.push({
          testCase: testCase.name,
          success: false,
          error: data.error,
        })
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`)
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message,
      })
    }
  }

  // Summary
  console.log(`\n\n📊 Test Summary:`)
  const successful = results.filter(r => r.success).length
  const matched = results.filter(r => r.matchesExpected).length
  console.log(`   ✅ Successful: ${successful}/${results.length}`)
  console.log(`   ✅ Matched expectations: ${matched}/${results.length}`)

  if (matched < results.length) {
    console.log(`\n   ⚠️  Provider selection may need adjustment`)
    console.log(`   Check: supabase/functions/llm-router/index.ts`)
  }

  return results
}

testMultiProviderRouting().catch(console.error)

