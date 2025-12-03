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

async function testRAGSearch() {
  console.log('🔍 Testing RAG Search Functionality\n')

  const baseUrl = `${supabaseUrl}/functions/v1/rag-search`
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  // Get account
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id')
    .eq('slug', '317plumber')
    .limit(1)

  if (!accounts || accounts.length === 0) {
    console.log('❌ No account found')
    return
  }

  const accountId = accounts[0].id

  // Test 1: Basic search
  console.log('1. Testing basic RAG search...')
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        query: 'How do I fix a leaky faucet?',
        limit: 3,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ SUCCESS`)
      console.log(`   Results: ${data.results?.length || 0}`)
      if (data.context) {
        console.log(`   Context length: ${data.context.length} chars`)
      }
    } else {
      const error = await response.text()
      console.log(`   ⚠️  Response: ${response.status} - ${error.substring(0, 100)}`)
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }

  // Test 2: Search with no results
  console.log('\n2. Testing search with no matching docs...')
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        query: 'xyzabc123nonexistentquery',
        limit: 3,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ SUCCESS (handles no results)`)
      console.log(`   Results: ${data.results?.length || 0}`)
    } else {
      const error = await response.text()
      console.log(`   ⚠️  Response: ${response.status}`)
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }

  // Test 3: Check if knowledge docs exist
  console.log('\n3. Checking knowledge docs in database...')
  const { data: docs, error: docsError } = await supabase
    .from('knowledge_docs')
    .select('id, title')
    .eq('account_id', accountId)
    .limit(5)

  if (docsError) {
    console.log(`   ⚠️  Error: ${docsError.message}`)
  } else {
    console.log(`   ✅ Found ${docs?.length || 0} knowledge docs`)
    if (docs && docs.length > 0) {
      docs.forEach(doc => console.log(`      - ${doc.title || doc.id}`))
    } else {
      console.log('   ⚠️  No knowledge docs found - RAG search may not work without docs')
    }
  }

  console.log('\n✅ RAG search testing complete')
}

testRAGSearch().catch(console.error)

