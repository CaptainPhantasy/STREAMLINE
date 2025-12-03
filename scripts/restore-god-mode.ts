import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function restoreGodMode() {
    const userId = '4e7caf61-cc73-407b-b18c-407d0d04f9d3'
    const email = 'douglastalley1977@gmail.com'

    console.log(`⚡ Restoring GOD TIER ADMIN for ${email} (${userId})...`)

    try {
        // 1. Get the main account
        const { data: account, error: accountError } = await supabase
            .from('accounts')
            .select('id')
            .eq('slug', '317plumber')
            .single()

        if (accountError) {
            console.error('❌ Error fetching account:', accountError)
            return
        }

        console.log(`✅ Found account: ${account.id}`)

        // 2. Update the user record
        const { data: user, error: userError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                account_id: account.id,
                full_name: 'Douglas Talley',
                role: 'owner', // GOD TIER
            }, {
                onConflict: 'id'
            })
            .select()
            .single()

        if (userError) {
            console.error('❌ Error updating user:', userError)
            return
        }

        console.log('✅ User updated successfully!')
        console.log('   ID:', user.id)
        console.log('   Role:', user.role)
        console.log('   Account:', user.account_id)
        console.log('\n👑 GOD MODE RESTORED')

    } catch (error) {
        console.error('❌ Unexpected error:', error)
    }
}

restoreGodMode()
