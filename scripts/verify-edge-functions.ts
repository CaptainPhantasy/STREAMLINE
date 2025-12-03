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

const functions = [
  'llm-router',
  'create-job',
  'create-contact',
  'update-job-status',
  'assign-tech',
  'generate-reply',
  'voice-command',
  'rag-search',
  'automation-engine',
  'handle-inbound-email',
  'provision-tenant',
]

async function verifyEdgeFunctions() {
  console.log('🔍 Verifying Edge Functions Deployment\n')

  const baseUrl = `${supabaseUrl}/functions/v1`
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  const results: any[] = []

  for (const func of functions) {
    try {
      const response = await fetch(`${baseUrl}/${func}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      })

      const status = response.status
      const isDeployed = status !== 404

      if (isDeployed) {
        console.log(`   ✅ ${func}: Deployed (${status})`)
        results.push({ function: func, deployed: true, status })
      } else {
        console.log(`   ❌ ${func}: Not deployed (404)`)
        results.push({ function: func, deployed: false, status })
      }
    } catch (error: any) {
      console.log(`   ⚠️  ${func}: Error - ${error.message}`)
      results.push({ function: func, deployed: false, error: error.message })
    }
  }

  console.log(`\n📊 Summary:`)
  const deployed = results.filter(r => r.deployed).length
  console.log(`   ✅ Deployed: ${deployed}/${functions.length}`)
  console.log(`   ❌ Not deployed: ${functions.length - deployed}/${functions.length}`)

  if (deployed < functions.length) {
    console.log(`\n⚠️  Missing functions:`)
    results.filter(r => !r.deployed).forEach(r => {
      console.log(`   - ${r.function}`)
    })
  }

  return results
}

verifyEdgeFunctions().catch(console.error)

