/**
 * Verify and Setup Test Users for All Roles
 * 
 * This script:
 * 1. Checks which test users exist for each role (owner, admin, dispatcher, tech)
 * 2. Creates missing test users
 * 3. Documents all test user credentials
 * 
 * Usage: npx tsx scripts/verify-test-users.ts
 */

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

// Standardized test users for all roles
// These are the PRIMARY test users that should exist for testing
// Standard test password for all test accounts
const STANDARD_TEST_PASSWORD = 'TestPass123!'

const REQUIRED_TEST_USERS = [
  {
    email: 'test-owner@317plumber.com',
    password: STANDARD_TEST_PASSWORD,
    role: 'owner' as const,
    fullName: 'Test Owner User'
  },
  {
    email: 'test-admin@317plumber.com',
    password: STANDARD_TEST_PASSWORD,
    role: 'admin' as const,
    fullName: 'Test Admin User'
  },
  {
    email: 'test-dispatcher@317plumber.com',
    password: STANDARD_TEST_PASSWORD,
    role: 'dispatcher' as const,
    fullName: 'Test Dispatcher User'
  },
  {
    email: 'test-tech@317plumber.com',
    password: STANDARD_TEST_PASSWORD,
    role: 'tech' as const,
    fullName: 'Test Tech User'
  }
]

interface UserStatus {
  email: string
  role: 'owner' | 'admin' | 'dispatcher' | 'tech'
  exists: boolean
  hasAuthUser: boolean
  hasUserRecord: boolean
  userId?: string
  currentRole?: string
  accountId?: string
}

async function verifyTestUsers() {
  console.log('🔍 Verifying Test Users for All Roles...\n')
  console.log('='.repeat(70))

  try {
    // 1. Get account ID
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name, slug')
      .eq('slug', '317plumber')
      .single()

    if (accountError || !account) {
      console.error('❌ Account "317plumber" not found!')
      console.error('   Run setup-auth.ts first to create the account')
      process.exit(1)
    }

    const accountId = account.id
    console.log(`✅ Found account: ${account.name} (${account.slug})`)
    console.log(`   Account ID: ${accountId}\n`)

    // 2. Get all existing auth users
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing auth users:', listError)
      throw listError
    }

    // 3. Get all existing user records
    const { data: userRecords, error: usersError } = await supabase
      .from('users')
      .select('id, role, account_id, full_name')
      .eq('account_id', accountId)

    if (usersError) {
      console.error('❌ Error fetching user records:', usersError)
      throw usersError
    }

    // 4. Check status of each required test user
    const statuses: UserStatus[] = []
    const results = {
      verified: 0,
      created: 0,
      updated: 0,
      errors: [] as string[]
    }

    console.log('📋 Checking Required Test Users:\n')

    for (const testUser of REQUIRED_TEST_USERS) {
      const status: UserStatus = {
        email: testUser.email,
        role: testUser.role,
        exists: false,
        hasAuthUser: false,
        hasUserRecord: false
      }

      // Check if auth user exists
      const authUser = authUsers?.find(u => u.email === testUser.email)
      if (authUser) {
        status.hasAuthUser = true
        status.userId = authUser.id
      }

      // Check if user record exists
      const userRecord = userRecords?.find(u => u.id === authUser?.id)
      if (userRecord) {
        status.hasUserRecord = true
        status.currentRole = userRecord.role
        status.accountId = userRecord.account_id
      }

      status.exists = status.hasAuthUser && status.hasUserRecord &&
        status.currentRole === testUser.role &&
        status.accountId === accountId

      statuses.push(status)

      // Display status
      if (status.exists) {
        console.log(`✅ ${testUser.role.toUpperCase().padEnd(12)} - ${testUser.email}`)
        console.log(`   User ID: ${status.userId}`)
        results.verified++
      } else {
        console.log(`⚠️  ${testUser.role.toUpperCase().padEnd(12)} - ${testUser.email}`)
        if (!status.hasAuthUser) {
          console.log('   ❌ Missing: Auth user')
        }
        if (!status.hasUserRecord) {
          console.log('   ❌ Missing: User record')
        }
        if (status.currentRole !== testUser.role) {
          console.log(`   ⚠️  Wrong role: ${status.currentRole} (expected: ${testUser.role})`)
        }
        if (status.accountId !== accountId) {
          console.log(`   ⚠️  Wrong account: ${status.accountId} (expected: ${accountId})`)
        }
      }
    }

    // 5. Create/update missing users
    console.log('\n' + '='.repeat(70))
    console.log('🔧 Creating/Updating Missing Test Users...\n')

    for (let i = 0; i < REQUIRED_TEST_USERS.length; i++) {
      const testUser = REQUIRED_TEST_USERS[i]
      const status = statuses[i]

      if (status.exists) {
        continue // Skip if already exists correctly
      }

      try {
        console.log(`👤 Processing: ${testUser.email} (${testUser.role})...`)

        let userId: string

        // Generate deterministic phone number based on email
        // Pattern: 317555XXXX where XXXX is derived from email
        const emailHash = testUser.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const uniqueSuffix = (emailHash % 10000).toString().padStart(4, '0')
        const phoneNumber = `317555${uniqueSuffix}`

        // Create or get auth user
        if (!status.hasAuthUser) {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
            phone: phoneNumber,
            phone_confirm: true,
            user_metadata: {
              full_name: testUser.fullName,
              role: testUser.role
            }
          })

          if (createError) {
            throw new Error(`Failed to create auth user: ${createError.message}`)
          }

          userId = newUser.user.id
          console.log(`   ✅ Created auth user (ID: ${userId})`)
          results.created++
        } else {
          userId = status.userId!

          // Update password to ensure it's correct AND ensure phone number
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: testUser.password,
            phone: phoneNumber,
            phone_confirm: true,
            user_metadata: {
              full_name: testUser.fullName,
              role: testUser.role
            }
          })

          if (updateError) {
            console.log(`   ⚠️  Could not update password/phone: ${updateError.message}`)
          } else {
            console.log(`   ✅ Updated password and phone`)
          }
        }

        // Create or update user record
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            account_id: accountId,
            full_name: testUser.fullName,
            role: testUser.role
          }, {
            onConflict: 'id'
          })

        if (upsertError) {
          throw new Error(`Failed to upsert user record: ${upsertError.message}`)
        }

        if (status.hasUserRecord) {
          console.log(`   ✅ Updated user record (role: ${testUser.role})`)
          results.updated++
        } else {
          console.log(`   ✅ Created user record (role: ${testUser.role})`)
          results.created++
        }

        console.log('')

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}\n`)
        results.errors.push(`${testUser.email}: ${error.message}`)
      }
    }

    // 6. Final verification
    console.log('='.repeat(70))
    console.log('🔍 Final Verification...\n')

    const { data: { users: finalAuthUsers } } = await supabase.auth.admin.listUsers()
    const { data: finalUserRecords } = await supabase
      .from('users')
      .select('id, role, account_id, full_name')
      .eq('account_id', accountId)

    const finalStatuses: UserStatus[] = []

    for (const testUser of REQUIRED_TEST_USERS) {
      const authUser = finalAuthUsers?.find(u => u.email === testUser.email)
      const userRecord = finalUserRecords?.find(u => u.id === authUser?.id)

      const finalStatus: UserStatus = {
        email: testUser.email,
        role: testUser.role,
        exists: false,
        hasAuthUser: !!authUser,
        hasUserRecord: !!userRecord,
        userId: authUser?.id,
        currentRole: userRecord?.role,
        accountId: userRecord?.account_id
      }

      finalStatus.exists = finalStatus.hasAuthUser &&
        finalStatus.hasUserRecord &&
        finalStatus.currentRole === testUser.role &&
        finalStatus.accountId === accountId

      finalStatuses.push(finalStatus)
    }

    // 7. Summary
    console.log('='.repeat(70))
    console.log('📊 SUMMARY')
    console.log('='.repeat(70))
    console.log(`✅ Verified: ${results.verified} users`)
    console.log(`🆕 Created: ${results.created} users`)
    console.log(`🔄 Updated: ${results.updated} users`)

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      results.errors.forEach(err => console.log(`   - ${err}`))
    }

    // 8. Display credentials
    console.log('\n' + '='.repeat(70))
    console.log('🔐 TEST USER CREDENTIALS')
    console.log('='.repeat(70))
    console.log('\nThese are the standardized test users for all roles:\n')

    for (const testUser of REQUIRED_TEST_USERS) {
      const status = finalStatuses.find(s => s.email === testUser.email)
      const statusIcon = status?.exists ? '✅' : '❌'

      console.log(`${statusIcon} ${testUser.role.toUpperCase().padEnd(12)}`)
      console.log(`   Email:    ${testUser.email}`)
      console.log(`   Password: ${testUser.password}`)
      console.log(`   Name:     ${testUser.fullName}`)
      if (status?.userId) {
        console.log(`   User ID:  ${status.userId}`)
      }
      console.log('')
    }

    // Check if all users exist
    const allExist = finalStatuses.every(s => s.exists)

    if (allExist) {
      console.log('✅ All test users are properly configured!\n')
    } else {
      console.log('⚠️  Some test users are missing or misconfigured.\n')
      process.exit(1)
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

verifyTestUsers()

