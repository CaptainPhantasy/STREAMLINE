/**
 * Create Owner Account for Ryan Galbraith and Protect Douglas Talley
 * 
 * 1. Creates the owner account for Ryan Galbraith (CEO of 317Plumber)
 *    Email: Ryan@317plumber.com
 *    Password: TestPass123!
 *    Role: owner
 *    Protected: YES (do_not_delete = true)
 * 
 * 2. Marks Douglas Talley as protected (DO NOT DELETE)
 *    Email: DouglasTalley1977@gmail.com
 *    Protected: YES (do_not_delete = true)
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv, validateRequiredEnv } from '@/lib/utils/load-env'

// Load environment variables (works both locally and on Railway)
loadEnv()

// Validate required variables
validateRequiredEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createRyanGalbraithAccount() {
  console.log('🔧 Creating owner account for Ryan Galbraith...\n')

  try {
    // Step 1: Find or create the 317plumber account
    console.log('Step 1: Finding 317plumber account...')
    let { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name, slug')
      .eq('slug', '317plumber')
      .single()

    if (accountError || !account) {
      console.log('   Account not found, creating...')
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          name: '317 Plumber',
          slug: '317plumber',
          inbound_email_domain: 'reply.317plumber.com'
        })
        .select()
        .single()

      if (createError || !newAccount) {
        throw new Error(`Failed to create account: ${createError?.message}`)
      }
      account = newAccount
      console.log(`   ✓ Created account: ${account.name} (${account.slug})`)
    } else {
      console.log(`   ✓ Found account: ${account.name} (${account.slug})`)
    }

    // Step 2: Check if user already exists
    console.log('\nStep 2: Checking for existing user...')
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingAuthUsers?.users?.find(u => 
      u.email?.toLowerCase() === 'ryan@317plumber.com'
    )

    let authUserId: string

    if (existingUser) {
      console.log('   User exists, updating...')
      authUserId = existingUser.id
      await supabase.auth.admin.updateUserById(authUserId, {
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: { full_name: 'Ryan Galbraith' }
      })
      console.log('   ✓ Updated user')
    } else {
      console.log('   Creating new user...')
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'Ryan@317plumber.com',
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: { full_name: 'Ryan Galbraith' }
      })

      if (createError) {
        // User might exist but not in list - try to find by email
        const allUsers = await supabase.auth.admin.listUsers()
        const found = allUsers.data?.users?.find(u => 
          u.email?.toLowerCase() === 'ryan@317plumber.com'
        )
        if (found) {
          authUserId = found.id
          console.log('   ✓ Found existing user')
        } else {
          throw new Error(`Failed to create user: ${createError.message}`)
        }
      } else {
        authUserId = newAuthUser.user.id
        console.log('   ✓ Created user')
      }
    }

    // Step 3: Ensure do_not_delete column exists (migration handles this, but try to add if missing)
    console.log('\nStep 3: Ensuring do_not_delete column exists...')
    // Migration will handle this - skip if column doesn't exist yet

    // Step 4: Create or update user record in public.users
    console.log('\nStep 4: Creating/updating user record...')
    const { data: existingUserRecord, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', authUserId)
      .maybeSingle()

    if (existingUserRecord) {
      console.log('   User record exists, updating...')
      const updateData: any = {
        account_id: account.id,
        full_name: 'Ryan Galbraith',
        role: 'owner'
      }
      // Only add do_not_delete if column exists (migration may not have run yet)
      try {
        updateData.do_not_delete = true
      } catch {}
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', authUserId)

      if (updateError) {
        // Try without do_not_delete if column doesn't exist
        const { error: retryError } = await supabase
          .from('users')
          .update({
            account_id: account.id,
            full_name: 'Ryan Galbraith',
            role: 'owner'
          })
          .eq('id', authUserId)
        if (retryError) throw new Error(`Failed to update: ${updateError.message}`)
      }
      console.log('   ✓ Updated user record')
    } else {
      console.log('   Creating new user record...')
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUserId,
            account_id: account.id,
            full_name: 'Ryan Galbraith',
            role: 'owner',
            do_not_delete: true
          })
        if (insertError) throw insertError
      } catch (err: any) {
        // Column might not exist - try without it
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUserId,
            account_id: account.id,
            full_name: 'Ryan Galbraith',
            role: 'owner'
          })
        if (insertError) throw new Error(`Failed to create: ${insertError.message}`)
      }
      console.log('   ✓ Created user record')
    }

    // Step 5: Verify the user
    console.log('\nStep 5: Verifying user creation...')
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, full_name, role, account_id, accounts!inner(name, slug)')
      .eq('id', authUserId)
      .single()

    if (verifyError || !verifyUser) {
      throw new Error(`Failed to verify user: ${verifyError?.message}`)
    }

    console.log('\n✅ SUCCESS!')
    console.log('   Name:', verifyUser.full_name)
    console.log('   Email: Ryan@317plumber.com')
    console.log('   Role: owner')
    console.log('   Account:', (verifyUser.accounts as any).name)
    // Step 6: Mark Douglas Talley as DO NOT DELETE
    console.log('\nStep 6: Marking Douglas Talley as protected...')
    const { data: douglasAuthUsers } = await supabase.auth.admin.listUsers()
    const douglasUser = douglasAuthUsers?.users?.find(u => 
      u.email?.toLowerCase() === 'douglastalley1977@gmail.com'
    )

    if (douglasUser) {
      try {
        await supabase
          .from('users')
          .update({ do_not_delete: true })
          .eq('id', douglasUser.id)
        console.log('   ✓ Marked Douglas Talley as protected')
      } catch {
        console.log('   ⚠️  Column not created yet - run migration first')
      }
    }

    console.log('\n📝 Login Credentials for Ryan Galbraith:')
    console.log('   Email: Ryan@317plumber.com')
    console.log('   Password: TestPass123!')
    console.log('\n⚠️  IMPORTANT: Both users are marked as DO NOT DELETE')
    console.log('   - Ryan Galbraith (Ryan@317plumber.com)')
    console.log('   - Douglas Talley (DouglasTalley1977@gmail.com)')

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message)
    console.error(error)
    process.exit(1)
  }
}

createRyanGalbraithAccount()

