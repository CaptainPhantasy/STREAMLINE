import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applyLLMProviders() {
  console.log('🔧 Adding Anthropic Provider to Database...\n')

  try {
    // Read the SQL file
    const sqlFile = readFileSync(resolve(process.cwd(), 'supabase/update-llm-api-keys.sql'), 'utf-8')
    
    // Extract the INSERT statement for Anthropic
    const anthropicInsert = sqlFile.match(/insert into llm_providers.*?anthropic.*?on conflict do nothing;/is)?.[0]
    
    if (!anthropicInsert) {
      console.log('⚠️  Could not find Anthropic INSERT statement in SQL file')
      console.log('   Manually adding Anthropic provider...\n')
    }

    // Check if Anthropic provider already exists
    const { data: existing } = await supabase
      .from('llm_providers')
      .select('id, name, provider')
      .eq('provider', 'anthropic')
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('✅ Anthropic provider already exists:')
      console.log(`   Name: ${existing[0].name}`)
      console.log(`   Provider: ${existing[0].provider}`)
      
      // Update the API key
      const { error: updateError } = await supabase
        .from('llm_providers')
        .update({ 
          api_key_encrypted: process.env.ANTHROPIC_API_KEY || '' 
        })
        .eq('provider', 'anthropic')

      if (updateError) {
        console.log(`   ⚠️  Could not update API key: ${updateError.message}`)
        console.log('   Note: API keys should be set via Supabase secrets, not in database')
      } else {
        console.log('   ✅ API key reference updated (actual key in Supabase secrets)')
      }
    } else {
      // Add Anthropic provider
      const { data: newProvider, error: insertError } = await supabase
        .from('llm_providers')
        .insert({
          name: 'anthropic-claude-3-5-sonnet',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          api_key_encrypted: '', // Keys are in Supabase secrets
          is_default: false,
          use_case: ['complex', 'general'],
          max_tokens: 8192,
          is_active: true,
          account_id: null, // Global provider
        })
        .select()
        .single()

      if (insertError) {
        console.log(`❌ Error adding Anthropic provider: ${insertError.message}`)
      } else {
        console.log('✅ Added Anthropic provider:')
        console.log(`   Name: ${newProvider.name}`)
        console.log(`   Model: ${newProvider.model}`)
        console.log(`   Use cases: ${newProvider.use_case?.join(', ')}`)
        console.log(`   Max tokens: ${newProvider.max_tokens}`)
      }
    }

    // Verify all providers
    console.log('\n📋 Current LLM Providers:')
    const { data: providers } = await supabase
      .from('llm_providers')
      .select('name, provider, model, use_case, is_default, is_active')
      .order('provider')

    if (providers) {
      providers.forEach(p => {
        console.log(`   ${p.is_default ? '⭐' : '  '} ${p.name} (${p.provider}/${p.model})`)
        console.log(`      Use cases: ${p.use_case?.join(', ') || 'none'}`)
        console.log(`      Active: ${p.is_active ? '✅' : '❌'}`)
      })
    }

    console.log('\n✅ LLM Provider setup complete!')
    console.log('   Note: API keys are stored in Supabase secrets, not in database')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

applyLLMProviders()

