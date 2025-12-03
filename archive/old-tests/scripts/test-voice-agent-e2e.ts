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

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testVoiceAgentE2E() {
  console.log('🔍 Testing Voice Agent End-to-End\n')

  // Get account and test contact
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

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email')
    .eq('account_id', accountId)
    .limit(1)

  if (!contacts || contacts.length === 0) {
    console.log('❌ No contacts found')
    return
  }

  const contactId = contacts[0].id
  const contactName = `${contacts[0].first_name} ${contacts[0].last_name}`

  console.log(`Using account: ${accountId}`)
  console.log(`Using contact: ${contactName} (${contactId})\n`)

  const baseUrl = `${supabaseUrl}/functions/v1/voice-command`
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  // Test 1: Create job via voice
  console.log('1. Testing: "Create a job for fixing a leaky faucet"')
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        transcription: `Create a new job for ${contactName} to fix a leaky kitchen faucet. Schedule it for tomorrow at 2pm.`,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      if (data.response || data.success) {
        console.log(`   ✅ SUCCESS`)
        if (data.response) {
          console.log(`   Response: ${data.response.substring(0, 150)}...`)
        }
        if (data.action) {
          console.log(`   Action: ${data.action}`)
        }
        if (data.jobId) {
          console.log(`   Job created: ${data.jobId}`)
        }
        if (data.contacts) {
          console.log(`   Contacts found: ${data.contacts.length}`)
        }
      } else {
        console.log(`   ⚠️  Response OK but no data: ${JSON.stringify(data).substring(0, 100)}`)
      }
    } else {
      const errorText = await response.text().catch(() => '')
      const errorData = errorText ? JSON.parse(errorText).catch(() => ({ error: errorText })) : data
      console.log(`   ❌ FAILED (${response.status}): ${errorData.error || errorData.details || errorText.substring(0, 200)}`)
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
    if (error.stack) {
      console.log(`   Stack: ${error.stack.substring(0, 200)}`)
    }
  }

  // Test 2: Search contacts
  console.log('\n2. Testing: "Search for contacts named John"')
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        transcription: 'Search for contacts named John',
      }),
    })

    const data = await response.json()

    if (response.ok && data.response) {
      console.log(`   ✅ SUCCESS`)
      console.log(`   Response: ${data.response.substring(0, 150)}...`)
      if (data.contacts) {
        console.log(`   Contacts found: ${data.contacts.length}`)
      }
    } else {
      console.log(`   ❌ FAILED: ${data.error || 'Unknown error'}`)
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }

  // Test 3: Update job status
  console.log('\n3. Testing: "Update job status to completed"')
  try {
    // Get a job first
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('account_id', accountId)
      .limit(1)

    if (jobs && jobs.length > 0) {
      const jobId = jobs[0].id
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountId,
          transcription: `Update job ${jobId} status to completed`,
        }),
      })

      const data = await response.json()

      if (response.ok && data.response) {
        console.log(`   ✅ SUCCESS`)
        console.log(`   Response: ${data.response.substring(0, 150)}...`)
      } else {
        console.log(`   ❌ FAILED: ${data.error || 'Unknown error'}`)
      }
    } else {
      console.log('   ⚠️  No jobs found to test')
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }

  // Test 4: Assign technician
  console.log('\n4. Testing: "Assign a technician to the job"')
  try {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('account_id', accountId)
      .limit(1)

    if (jobs && jobs.length > 0) {
      const jobId = jobs[0].id
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountId,
          transcription: `Assign a technician to job ${jobId}`,
        }),
      })

      const data = await response.json()

      if (response.ok && data.response) {
        console.log(`   ✅ SUCCESS`)
        console.log(`   Response: ${data.response.substring(0, 150)}...`)
      } else {
        console.log(`   ❌ FAILED: ${data.error || 'Unknown error'}`)
      }
    } else {
      console.log('   ⚠️  No jobs found to test')
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }

  console.log('\n✅ Voice agent E2E testing complete')
}

testVoiceAgentE2E().catch(console.error)

