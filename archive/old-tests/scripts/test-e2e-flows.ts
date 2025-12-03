import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const baseUrl = 'http://localhost:3000'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testE2EFlows() {
  console.log('🔍 Agent 3: End-to-End Flow Testing\n')

  // 1. Authenticate
  console.log('1. Authenticating...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@317plumber.com',
    password: 'TestPass123!',
  })

  if (authError || !authData.session) {
    console.log(`   ❌ Auth failed: ${authError?.message}`)
    return
  }

  const token = authData.session.access_token
  console.log('   ✅ Authenticated')

  // 2. Create Contact
  console.log('\n2. Creating contact via API...')
  const testEmail = `e2e-test-${Date.now()}@example.com`
  try {
    const contactRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: 'E2E',
        lastName: 'Test',
        phone: '(317) 555-9999',
      }),
    })

    if (contactRes.ok) {
      const contactData = await contactRes.json()
      console.log(`   ✅ Contact created: ${contactData.contact?.id}`)
      const contactId = contactData.contact.id

      // 3. Create Job
      console.log('\n3. Creating job via API...')
      const jobRes = await fetch(`${baseUrl}/api/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          description: 'E2E test job - plumbing repair',
          scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      })

      if (jobRes.ok) {
        const jobData = await jobRes.json()
        console.log(`   ✅ Job created: ${jobData.job?.id || 'created'}`)
      } else {
        const error = await jobRes.text()
        console.log(`   ⚠️  Job creation: ${jobRes.status} - ${error.substring(0, 100)}`)
      }

      // 4. Test AI Draft Generation
      console.log('\n4. Testing AI draft generation...')
      try {
        const draftRes = await fetch(`${baseUrl}/api/ai/draft`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: 'test',
            prompt: 'Write a professional email about a scheduled appointment',
          }),
        })

        if (draftRes.ok) {
          const draftData = await draftRes.json()
          console.log(`   ✅ Draft generated: ${draftData.draft?.substring(0, 50)}...`)
        } else {
          const error = await draftRes.text()
          console.log(`   ⚠️  Draft generation: ${draftRes.status} - ${error.substring(0, 100)}`)
        }
      } catch (error: any) {
        console.log(`   ⚠️  Draft generation error: ${error.message}`)
      }

    } else {
      const error = await contactRes.text()
      console.log(`   ❌ Contact creation failed: ${contactRes.status} - ${error.substring(0, 100)}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
    console.log('   Note: Make sure Next.js dev server is running on port 3000')
  }

  // 5. Test Voice Commands (via edge function)
  console.log('\n5. Testing voice command edge function...')
  try {
    const voiceRes = await fetch(`${supabaseUrl}/functions/v1/voice-command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00',
        transcription: 'Create a new job for fixing a leaky faucet',
      }),
    })

    if (voiceRes.ok) {
      const voiceData = await voiceRes.json()
      console.log(`   ✅ Voice command processed: ${voiceData.response?.substring(0, 50)}...`)
    } else {
      const error = await voiceRes.text()
      console.log(`   ⚠️  Voice command: ${voiceRes.status} - ${error.substring(0, 100)}`)
    }
  } catch (error: any) {
    console.log(`   ⚠️  Voice command error: ${error.message}`)
  }

  console.log('\n✅ E2E flow testing complete')
}

testE2EFlows().catch(console.error)

