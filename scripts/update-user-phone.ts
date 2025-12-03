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

async function updateUserPhone() {
    const userId = '4e7caf61-cc73-407b-b18c-407d0d04f9d3'
    const phone = '+18123405761'

    console.log(`📞 Updating phone for user ${userId} to ${phone}...`)

    try {
        const { data: user, error } = await supabase.auth.admin.updateUserById(
            userId,
            { phone: phone }
        )

        if (error) {
            console.error('❌ Error updating user phone:', error)
            return
        }

        console.log('✅ User phone updated successfully!')
        console.log('   New Phone:', user.user.phone)

    } catch (error) {
        console.error('❌ Unexpected error:', error)
    }
}

updateUserPhone()
