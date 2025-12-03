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

// Team directory for 317PLUMBER
interface TeamMember {
  name: string
  role: 'owner' | 'admin' | 'dispatcher' | 'tech'
  email: string
  fullName: string
}

const teamMembers: TeamMember[] = [
  // Executive
  { name: 'Ryan Galbraith', role: 'owner', email: 'ryan@317plumber.com', fullName: 'Ryan Galbraith' },
  { name: 'Cecily Turner', role: 'admin', email: 'cecily@317plumber.com', fullName: 'Cecily Turner' },

  // Dispatch & Office
  { name: 'Maria Lopez', role: 'dispatcher', email: 'maria.lopez@317plumber.com', fullName: 'Maria Lopez' },
  { name: 'Kevin Sandler', role: 'dispatcher', email: 'kevin.sandler@317plumber.com', fullName: 'Kevin Sandler' },

  // Field Technicians
  { name: 'Tom "TJ" Jackson', role: 'tech', email: 'tj.jackson@317plumber.com', fullName: 'Tom "TJ" Jackson' },
  { name: 'Derrick Hayes', role: 'tech', email: 'derrick.hayes@317plumber.com', fullName: 'Derrick Hayes' },
  { name: 'Luis Ramirez', role: 'tech', email: 'luis.ramirez@317plumber.com', fullName: 'Luis Ramirez' },
  { name: 'Nathan Cole', role: 'tech', email: 'nathan.cole@317plumber.com', fullName: 'Nathan Cole' },
  { name: 'Shawn Becker', role: 'tech', email: 'shawn.becker@317plumber.com', fullName: 'Shawn Becker' },
  { name: 'Michael "Mikey" Torres', role: 'tech', email: 'mikey.torres@317plumber.com', fullName: 'Michael "Mikey" Torres' },
  { name: 'Andre Whitmore', role: 'tech', email: 'andre.whitmore@317plumber.com', fullName: 'Andre Whitmore' },
  { name: 'Evan Stokes', role: 'tech', email: 'evan.stokes@317plumber.com', fullName: 'Evan Stokes' },
  { name: 'Brian O\'Leary', role: 'tech', email: 'brian.oleary@317plumber.com', fullName: 'Brian O\'Leary' },
  { name: 'Jim Parkhurst', role: 'tech', email: 'jim.parkhurst@317plumber.com', fullName: 'Jim Parkhurst' },
  { name: 'Garrett James', role: 'tech', email: 'garrett.james@317plumber.com', fullName: 'Garrett James' },
  { name: 'Jackson Miller', role: 'tech', email: 'jackson.miller@317plumber.com', fullName: 'Jackson Miller' },

  // Management
  { name: 'Michelle Carter', role: 'admin', email: 'michelle.carter@317plumber.com', fullName: 'Michelle Carter' },
  { name: 'Robert "Bobby" Harmon', role: 'admin', email: 'bobby.harmon@317plumber.com', fullName: 'Robert "Bobby" Harmon' },

  // Sales
  { name: 'Evan Brewer', role: 'admin', email: 'evan.brewer@317plumber.com', fullName: 'Evan Brewer' },
  { name: 'Zoe Cross', role: 'admin', email: 'zoe.cross@317plumber.com', fullName: 'Zoe Cross' },
]

// Default password for all users (should be changed on first login)
const DEFAULT_PASSWORD = '317Plumber2025!'

async function setupUsers() {
  console.log('🏗️  Setting up 317PLUMBER Team Users...\n')

  try {
    // 1. Get account ID
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id, name, slug')
      .eq('slug', '317plumber')
      .limit(1)

    if (accountError) {
      console.error('❌ Error fetching account:', accountError)
      throw accountError
    }

    if (!accounts || accounts.length === 0) {
      console.error('❌ Account "317plumber" not found!')
      console.log('💡 Run setup-auth.ts first to create the account')
      process.exit(1)
    }

    const accountId = accounts[0].id
    console.log(`✅ Found account: ${accounts[0].name} (${accounts[0].slug})`)
    console.log(`   Account ID: ${accountId}\n`)

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // 2. Create/update each user
    for (const member of teamMembers) {
      try {
        console.log(`👤 Processing: ${member.name} (${member.email})...`)

        // Check if user already exists in auth.users
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()

        if (listError) {
          throw new Error(`Failed to list users: ${listError.message}`)
        }

        const existingAuthUser = existingUsers?.users?.find(u => u.email === member.email)

        let userId: string

        // Generate deterministic phone number based on email
        // Pattern: 317555XXXX where XXXX is derived from email
        const emailHash = member.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const uniqueSuffix = (emailHash % 10000).toString().padStart(4, '0')
        const phoneNumber = `317555${uniqueSuffix}`

        if (existingAuthUser) {
          // User exists in auth.users
          userId = existingAuthUser.id
          console.log(`   ⚠️  User already exists in auth.users (ID: ${userId})`)

          // Update password to default (in case it was changed) AND ensure phone number
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: DEFAULT_PASSWORD,
            phone: phoneNumber,
            phone_confirm: true,
            user_metadata: {
              ...existingAuthUser.user_metadata,
              full_name: member.fullName
            }
          })

          if (updateError) {
            console.log(`   ⚠️  Could not update password/phone: ${updateError.message}`)
          } else {
            console.log(`   ✅ Password reset and phone updated`)
          }
        } else {
          // Create new user in auth.users
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: member.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true, // Auto-confirm email
            phone: phoneNumber,
            phone_confirm: true,
            user_metadata: {
              full_name: member.fullName,
              role: member.role
            }
          })

          if (createError) {
            throw new Error(`Failed to create auth user: ${createError.message}`)
          }

          userId = newUser.user.id
          console.log(`   ✅ Created auth user (ID: ${userId})`)
        }

        // 3. Check if user record exists in public.users
        const { data: existingUserRecord, error: fetchError } = await supabase
          .from('users')
          .select('id, role, account_id')
          .eq('id', userId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
          throw new Error(`Failed to check user record: ${fetchError.message}`)
        }

        if (existingUserRecord) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('users')
            .update({
              account_id: accountId,
              full_name: member.fullName,
              role: member.role,
            })
            .eq('id', userId)

          if (updateError) {
            throw new Error(`Failed to update user record: ${updateError.message}`)
          }

          console.log(`   ✅ Updated user record (role: ${member.role})`)
          results.updated++
        } else {
          // Create new user record
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              account_id: accountId,
              full_name: member.fullName,
              role: member.role,
            })

          if (insertError) {
            throw new Error(`Failed to create user record: ${insertError.message}`)
          }

          console.log(`   ✅ Created user record (role: ${member.role})`)
          results.created++
        }

        console.log('') // Blank line between users

      } catch (error: any) {
        console.error(`   ❌ Error processing ${member.name}: ${error.message}\n`)
        results.errors.push(`${member.name} (${member.email}): ${error.message}`)
        results.skipped++
      }
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SETUP SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Created: ${results.created} users`)
    console.log(`🔄 Updated: ${results.updated} users`)
    console.log(`⏭️  Skipped: ${results.skipped} users`)

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      results.errors.forEach(err => console.log(`   - ${err}`))
    }

    console.log(`\n🔐 Default Password: ${DEFAULT_PASSWORD}`)
    console.log('   ⚠️  All users should change their password on first login!')
    console.log('\n💡 Next Steps:')
    console.log('   1. Users can log in with their email and the default password')
    console.log('   2. They should be prompted to change password on first login')
    console.log('   3. Verify users can access the dashboard with their assigned roles')

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

setupUsers()

