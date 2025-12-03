import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

// Specific mappings for known users
const USER_MAPPINGS: Record<string, { fullName: string, phone: string }> = {
    'douglastalley1977@gmail.com': { fullName: 'Douglas Talley', phone: '8123405761' },
    'ryan@317plumber.com': { fullName: 'Ryan Galbraith', phone: '3175550001' },
    'cecily@317plumber.com': { fullName: 'Cecily Turner', phone: '3175550002' },
    'maria@317plumber.com': { fullName: 'Maria Lopez', phone: '3175550003' },
    'tom@317plumber.com': { fullName: 'Tom "TJ" Jackson', phone: '3175550004' },
    'sarah@317plumber.com': { fullName: 'Sarah Miller', phone: '3175550005' },
    'test@317plumber.com': { fullName: 'Test User', phone: '3175559999' },
}

async function completeUserProfiles() {
    console.log('👤 Completing User Profiles...\n')

    try {
        // 1. Fetch all users from Auth
        console.log('1. Fetching all users...')
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`)
        }

        if (!users || users.length === 0) {
            console.log('   No users found.')
            return
        }

        console.log(`   Found ${users.length} users.\n`)

        // 2. Iterate and update
        console.log('2. Updating profiles...')

        for (const user of users) {
            const email = user.email
            if (!email) continue

            console.log(`   Processing: ${email}`)

            // Determine correct data
            let fullName = user.user_metadata?.full_name
            let phone = user.phone

            // Check specific mappings
            if (USER_MAPPINGS[email]) {
                fullName = USER_MAPPINGS[email].fullName
                phone = USER_MAPPINGS[email].phone
            } else {
                // Generate defaults if missing
                if (!fullName) {
                    // Use email prefix as name (e.g. "john" from "john@example.com")
                    const namePart = email.split('@')[0]
                    fullName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
                }

                if (!phone) {
                    // Generate deterministic phone: 317555XXXX
                    const emailHash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                    const uniqueSuffix = (emailHash % 10000).toString().padStart(4, '0')
                    phone = `317555${uniqueSuffix}`
                }
            }

            // Update Auth User (phone and metadata)
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                {
                    phone: phone,
                    phone_confirm: true,
                    user_metadata: {
                        ...user.user_metadata,
                        full_name: fullName
                    }
                }
            )

            if (authUpdateError) {
                console.error(`      ❌ Auth update failed: ${authUpdateError.message}`)
            } else {
                console.log(`      ✅ Auth updated: Name="${fullName}", Phone="${phone}"`)
            }

            // Update Public User (full_name)
            // Check if user exists in public.users first
            const { data: publicUser } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single()

            if (publicUser) {
                const { error: publicUpdateError } = await supabaseAdmin
                    .from('users')
                    .update({ full_name: fullName })
                    .eq('id', user.id)

                if (publicUpdateError) {
                    console.error(`      ❌ Public profile update failed: ${publicUpdateError.message}`)
                } else {
                    console.log(`      ✅ Public profile updated`)
                }
            } else {
                console.log(`      ⚠️  No public profile found (skipping public update)`)
            }
        }

        console.log('\n✅ Profile completion finished!')

    } catch (error: any) {
        console.error(`\n❌ Fatal Error: ${error.message}`)
        process.exit(1)
    }
}

// Run the script
completeUserProfiles().catch(console.error)
