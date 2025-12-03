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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAuth() {
  console.log('🔐 Setting up authentication...\n')

  try {
    // 1. Get or create account
    let { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('slug', '317plumber')
      .limit(1)

    let accountId: string
    if (!accounts || accounts.length === 0) {
      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert({
          name: '317 Plumber',
          slug: '317plumber',
          inbound_email_domain: 'reply.317plumber.com',
        })
        .select()
        .single()

      if (error) throw error
      accountId = newAccount.id
      console.log('✅ Created account:', accountId)
    } else {
      accountId = accounts[0].id
      console.log('✅ Using existing account:', accountId)
    }

    // 2. Create test user in Auth
    const testEmail = 'test@317plumber.com'
    const testPassword = 'TestPass123!'

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail)

    let userId: string
    if (existingUser) {
      userId = existingUser.id
      console.log('✅ Test user already exists:', testEmail)
    } else {
      // Create user via Admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      })

      if (createError) throw createError
      userId = newUser.user.id
      console.log('✅ Created test user:', testEmail, '| ID:', userId)
    }

    // 3. Create user record in users table
    const { data: existingUserRecord } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUserRecord) {
      console.log('✅ User record already exists in users table')
    } else {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          account_id: accountId,
          full_name: 'Test User',
          role: 'owner',
        })

      if (userError) throw userError
      console.log('✅ Created user record in users table')
    }

    // 4. Test authentication
    console.log('\n🧪 Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (authError) {
      console.log('⚠️  Could not test auth (expected if using service role):', authError.message)
    } else {
      console.log('✅ Authentication test successful')
      console.log('   Session token:', authData.session?.access_token?.substring(0, 20) + '...')
    }

    console.log('\n📋 Test Credentials:')
    console.log('   Email:', testEmail)
    console.log('   Password:', testPassword)
    console.log('   User ID:', userId)
    console.log('   Account ID:', accountId)

    // 5. Test authenticated API endpoint
    console.log('\n🧪 Testing authenticated API endpoint...')
    if (authData?.session?.access_token) {
      const response = await fetch(`http://localhost:3000/api/contacts`, {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ API endpoint accessible:', response.status)
        console.log('   Contacts found:', Array.isArray(data) ? data.length : 'N/A')
      } else {
        const error = await response.text()
        console.log('⚠️  API endpoint returned:', response.status, error.substring(0, 100))
      }
    }

    console.log('\n🎉 Authentication setup complete!')
    return { userId, accountId, email: testEmail, password: testPassword }

  } catch (error: any) {
    console.error('❌ Error setting up authentication:', error)
    process.exit(1)
  }
}

setupAuth()

