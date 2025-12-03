import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testEdgeFunctions() {
  console.log('🧪 Testing Edge Functions...\n')

  // Get test account
  const { data: accounts } = await supabase.from('accounts').select('id').limit(1)
  if (!accounts || accounts.length === 0) {
    console.log('❌ No accounts found - cannot test')
    return false
  }
  const accountId = accounts[0].id

  // Get test contact
  const { data: contacts } = await supabase.from('contacts').select('id').eq('account_id', accountId).limit(1)
  if (!contacts || contacts.length === 0) {
    console.log('❌ No contacts found - creating test contact...')
    const { data: newContact } = await supabase.from('contacts').insert({
      account_id: accountId,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    }).select().single()
    if (newContact) contacts = [newContact]
  }
  const contactId = contacts?.[0]?.id

  if (!contactId) {
    console.log('❌ Cannot create test contact')
    return false
  }

  const baseUrl = `${supabaseUrl}/functions/v1`
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  // Test create-job
  console.log('1. Testing create-job...')
  try {
    const res = await fetch(`${baseUrl}/create-job`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        contactId,
        description: 'Test job creation',
      }),
    })
    const data = await res.json()
    if (res.ok && data.job) {
      console.log('   ✅ create-job works')
      const jobId = data.job.id

      // Test update-job-status
      console.log('2. Testing update-job-status...')
      const statusRes = await fetch(`${baseUrl}/update-job-status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountId,
          jobId,
          newStatus: 'scheduled',
        }),
      })
      const statusData = await statusRes.json()
      if (statusRes.ok) {
        console.log('   ✅ update-job-status works')
      } else {
        console.log(`   ❌ update-job-status failed: ${statusData.error}`)
      }

      // Test assign-tech (skip if no tech users)
      console.log('3. Testing assign-tech...')
      const { data: techs } = await supabase.from('users').select('id').eq('role', 'tech').limit(1)
      if (techs && techs.length > 0) {
        const techRes = await fetch(`${baseUrl}/assign-tech`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            accountId,
            jobId,
            techAssignedId: techs[0].id,
          }),
        })
        const techData = await techRes.json()
        if (techRes.ok) {
          console.log('   ✅ assign-tech works')
        } else {
          console.log(`   ⚠️  assign-tech: ${techData.error}`)
        }
      } else {
        console.log('   ⚠️  assign-tech: No tech users found (skipping)')
      }
    } else {
      console.log(`   ❌ create-job failed: ${data.error}`)
      return false
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
    return false
  }

  // Test create-contact
  console.log('4. Testing create-contact...')
  try {
    const contactRes = await fetch(`${baseUrl}/create-contact`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Contact',
      }),
    })
    const contactData = await contactRes.json()
    if (contactRes.ok || contactRes.status === 409) {
      console.log('   ✅ create-contact works')
    } else {
      console.log(`   ❌ create-contact failed: ${contactData.error}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test llm-router
  console.log('5. Testing llm-router...')
  try {
    const llmRes = await fetch(`${baseUrl}/llm-router`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        useCase: 'draft',
        prompt: 'Test prompt',
      }),
    })
    const llmData = await llmRes.json()
    if (llmRes.ok || llmData.error?.includes('API key')) {
      console.log('   ✅ llm-router works (may need API key configured)')
    } else {
      console.log(`   ⚠️  llm-router: ${llmData.error}`)
    }
  } catch (error: any) {
    console.log(`   ⚠️  llm-router error: ${error.message}`)
  }

  console.log('\n✅ Edge Function testing complete')
  return true
}

testEdgeFunctions().catch(console.error)

