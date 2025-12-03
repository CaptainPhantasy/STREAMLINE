import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixAdminRole() {
  console.log('🔐 Fixing Admin Role Privileges...\n')

  // Get email from command line args or use default
  const email = process.argv[2] || 'test@317plumber.com'
  console.log(`📧 Target email: ${email}\n`)

  try {
    // 1. Get or create account
    let { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('slug', '317plumber')
      .limit(1)

    if (accountError) {
      console.error('❌ Error fetching account:', accountError)
      throw accountError
    }

    let accountId: string
    if (!accounts || accounts.length === 0) {
      console.log('📦 Creating account...')
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          name: '317 Plumber',
          slug: '317plumber',
          inbound_email_domain: 'reply.317plumber.com',
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating account:', createError)
        throw createError
      }
      accountId = newAccount.id
      console.log('✅ Created account:', accountId)
    } else {
      accountId = accounts[0].id
      console.log('✅ Found existing account:', accountId)
    }

    // 2. Find user by email in auth.users
    console.log('\n🔍 Finding user in auth.users...')
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError)
      throw listError
    }

    const authUser = usersList?.users?.find(u => u.email === email)

    if (!authUser) {
      console.error(`❌ User not found: ${email}`)
      console.log('\n💡 To create a new user, run: npm run setup-auth')
      process.exit(1)
    }

    const userId = authUser.id
    console.log(`✅ Found user: ${email} (ID: ${userId})`)

    // 3. Check current role in users table
    console.log('\n🔍 Checking current role...')
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role, account_id')
      .eq('id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Error fetching user record:', fetchError)
      throw fetchError
    }

    if (existingUser) {
      console.log(`   Current role: ${existingUser.role || 'null'}`)
      console.log(`   Current account_id: ${existingUser.account_id}`)

      if (existingUser.role === 'owner' && existingUser.account_id === accountId) {
        console.log('\n✅ User already has owner role and correct account_id!')
        return { userId, accountId, email }
      }
    } else {
      console.log('   No user record found in users table')
    }

    // 4. UPSERT user record with role='owner' (FORCE UPDATE)
    console.log('\n🔧 Updating user record...')
    const { data: updatedUser, error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        account_id: accountId,
        full_name: authUser.user_metadata?.full_name || 'Admin User',
        role: 'owner', // FORCE to owner
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('❌ Error updating user record:', upsertError)
      throw upsertError
    }

    console.log('✅ User record updated successfully!')
    console.log(`   Role: ${updatedUser.role}`)
    console.log(`   Account ID: ${updatedUser.account_id}`)

    // 5. Verify the update
    console.log('\n🔍 Verifying update...')
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, role, account_id')
      .eq('id', userId)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      throw verifyError
    }

    if (verifyUser?.role === 'owner' && verifyUser?.account_id === accountId) {
      console.log('✅ Verification successful!')
      console.log(`   Role: ${verifyUser.role}`)
      console.log(`   Account ID: ${verifyUser.account_id}`)
    } else {
      console.error('❌ Verification failed!')
      console.error(`   Expected role: owner, got: ${verifyUser?.role}`)
      console.error(`   Expected account_id: ${accountId}, got: ${verifyUser?.account_id}`)
      process.exit(1)
    }

    // 6. Test admin endpoint access (optional)
    console.log('\n🧪 Testing admin endpoint access...')
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: 'TestPass123!', // Default password
      })

      if (authError) {
        console.log('⚠️  Could not test auth (password may be different):', authError.message)
        console.log('   This is OK - the role has been updated in the database')
      } else if (authData?.session?.access_token) {
        // Test an admin endpoint
        const testResponse = await fetch(`http://localhost:3000/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${authData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (testResponse.ok) {
          const testData = await testResponse.json()
          if (testData.user?.role === 'owner') {
            console.log('✅ Admin endpoint test successful!')
          } else {
            console.log('⚠️  Admin endpoint accessible but role mismatch')
          }
        } else {
          console.log('⚠️  Admin endpoint test failed (server may not be running)')
        }
      }
    } catch (testError: any) {
      console.log('⚠️  Could not test admin endpoint:', testError.message)
      console.log('   This is OK - the role has been updated in the database')
    }

    console.log('\n🎉 Admin role fix complete!')
    console.log('\n📋 Summary:')
    console.log(`   Email: ${email}`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Account ID: ${accountId}`)
    console.log(`   Role: owner`)
    console.log('\n💡 You can now access admin features in the application!')

    return { userId, accountId, email }

  } catch (error: any) {
    console.error('\n❌ Error fixing admin role:', error)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check that SUPABASE_SERVICE_ROLE_KEY is correct in .env.local')
    console.error('   2. Check that NEXT_PUBLIC_SUPABASE_URL is correct')
    console.error('   3. Verify the user exists in auth.users')
    console.error('   4. Check RLS policies on users table')
    process.exit(1)
  }
}

fixAdminRole()

