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

async function testAllLLMProviders() {
  console.log('🔍 Agent 6: Testing All LLM Providers\n')

  const baseUrl = `${supabaseUrl}/functions/v1/llm-router`
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  // Get all providers from database
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: providers } = await supabase
    .from('llm_providers')
    .select('name, provider, model, use_case, is_active')
    .eq('is_active', true)

  if (!providers || providers.length === 0) {
    console.log('❌ No active providers found')
    return
  }

  console.log(`Found ${providers.length} active providers:\n`)

  const results: any[] = []

  for (const provider of providers) {
    console.log(`Testing: ${provider.name} (${provider.provider}/${provider.model})`)
    console.log(`   Use cases: ${provider.use_case?.join(', ') || 'none'}`)

    // Find a matching use case
    const useCase = provider.use_case?.[0] || 'general'
    const testPrompt = `Test prompt for ${provider.name}`

    try {
      const startTime = Date.now()
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          useCase,
          prompt: testPrompt,
          modelOverride: provider.model,
          maxTokens: 50,
        }),
      })

      const duration = Date.now() - startTime
      const data = await response.json()

      if (response.ok && data.text) {
        console.log(`   ✅ SUCCESS (${duration}ms)`)
        console.log(`   Response: ${data.text.substring(0, 50)}...`)
        results.push({
          provider: provider.name,
          success: true,
          duration,
          tokens: data.usage?.total_tokens || 'N/A',
        })
      } else {
        console.log(`   ❌ FAILED: ${data.error || 'Unknown error'}`)
        results.push({
          provider: provider.name,
          success: false,
          error: data.error,
        })
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`)
      results.push({
        provider: provider.name,
        success: false,
        error: error.message,
      })
    }
    console.log('')
  }

  // Summary
  console.log(`\n📊 Test Summary:`)
  const successful = results.filter(r => r.success).length
  console.log(`   ✅ Successful: ${successful}/${results.length}`)
  console.log(`   ❌ Failed: ${results.length - successful}/${results.length}`)

  if (successful > 0) {
    const avgDuration = results
      .filter(r => r.success && r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success && r.duration).length
    console.log(`   ⏱️  Average duration: ${Math.round(avgDuration)}ms`)
  }

  // Cost tracking check
  console.log(`\n💰 Cost Tracking:`)
  const withTokens = results.filter(r => r.success && r.tokens !== 'N/A')
  if (withTokens.length > 0) {
    console.log(`   ✅ Token usage tracked for ${withTokens.length} providers`)
  } else {
    console.log(`   ⚠️  Token usage not tracked`)
  }

  return results
}

testAllLLMProviders().catch(console.error)

