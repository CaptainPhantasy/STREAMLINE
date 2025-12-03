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

// Protected users who should NOT have their passwords reset
const PROTECTED_EMAILS = [
    'douglastalley1977@gmail.com',
    'ryan@317plumber.com'
]

const STANDARD_PASSWORD = 'TestPass123!'

async function setStandardTestPasswords() {
    console.log('🔐 Setting standard test passwords...\n')
    console.log(`Standard Password: ${STANDARD_PASSWORD}`)
    console.log(`Protected Users: ${PROTECTED_EMAILS.join(', ')}\n`)

    try {
        // 1. List all users
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

        // 2. Iterate and update passwords
        console.log('2. Updating passwords...')
        let updatedCount = 0
        let skippedCount = 0

        for (const user of users) {
            const email = user.email || 'No Email'

            if (PROTECTED_EMAILS.includes(email)) {
                console.log(`   ⚠️  SKIPPING protected user: ${email}`)
                skippedCount++
                continue
            }

            console.log(`   🔄 Updating password for: ${email}`)

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                {
                    password: STANDARD_PASSWORD,
                    email_confirm: true
                }
            )

            if (updateError) {
                console.error(`      ❌ Failed to update: ${updateError.message}`)
            } else {
                console.log(`      ✅ Password updated`)
                updatedCount++
            }
        }

        console.log('\n=====================================')
        console.log(`✅ Update Complete`)
        console.log(`   Updated: ${updatedCount}`)
        console.log(`   Skipped: ${skippedCount}`)
        console.log('=====================================')

    } catch (error: any) {
        console.error(`\n❌ Fatal Error: ${error.message}`)
        process.exit(1)
    }
}

// Run the script
setStandardTestPasswords().catch(console.error)
