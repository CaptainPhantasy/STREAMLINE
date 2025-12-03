import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testAuthenticatedEndpoints() {
  console.log('🧪 Testing Authenticated API Endpoints...\n')

  try {
    // 1. Sign in as test user
    console.log('1. Authenticating test user...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@317plumber.com',
      password: 'TestPass123!',
    })

    if (authError || !authData.session) {
      console.log(`   ❌ Authentication failed: ${authError?.message}`)
      return
    }

    const token = authData.session.access_token
    console.log(`   ✅ Authenticated successfully`)
    console.log(`   Token: ${token.substring(0, 20)}...`)

    // 2. Test GET /api/contacts
    console.log('\n2. Testing GET /api/contacts...')
    try {
      const contactsResponse = await fetch('http://localhost:3000/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        console.log(`   ✅ SUCCESS (${contactsResponse.status})`)
        console.log(`   Contacts found: ${contactsData.contacts?.length || 0}`)
        console.log(`   Total: ${contactsData.total || 0}`)
      } else {
        const error = await contactsResponse.text()
        console.log(`   ❌ FAILED (${contactsResponse.status})`)
        console.log(`   Error: ${error.substring(0, 200)}`)
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`)
      console.log('   Note: Make sure Next.js dev server is running on port 3000')
    }

    // 3. Test POST /api/contacts
    console.log('\n3. Testing POST /api/contacts...')
    try {
      const testEmail = `test-${Date.now()}@example.com`
      const createResponse = await fetch('http://localhost:3000/api/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          firstName: 'Test',
          lastName: 'Contact',
          phone: '(317) 555-9999',
        }),
      })

      if (createResponse.ok) {
        const createData = await createResponse.json()
        console.log(`   ✅ SUCCESS (${createResponse.status})`)
        console.log(`   Contact created: ${createData.contact?.email}`)
        console.log(`   Contact ID: ${createData.contact?.id}`)
      } else {
        const error = await createResponse.text()
        console.log(`   ❌ FAILED (${createResponse.status})`)
        console.log(`   Error: ${error.substring(0, 200)}`)
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`)
    }

    // 4. Test GET /api/jobs
    console.log('\n4. Testing GET /api/jobs...')
    try {
      const jobsResponse = await fetch('http://localhost:3000/api/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        console.log(`   ✅ SUCCESS (${jobsResponse.status})`)
        console.log(`   Jobs found: ${jobsData.jobs?.length || 0}`)
        console.log(`   Total: ${jobsData.total || 0}`)
      } else {
        const error = await jobsResponse.text()
        console.log(`   ❌ FAILED (${jobsResponse.status})`)
        console.log(`   Error: ${error.substring(0, 200)}`)
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`)
    }

    console.log('\n✅ Authentication endpoint testing complete!')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testAuthenticatedEndpoints()

