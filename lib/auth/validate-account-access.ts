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

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function validateAccountAccess(userId: string, accountId: string): Promise<boolean> {
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('account_id')
        .eq('id', userId)
        .single()

    if (!user) return false
    return user.account_id === accountId
}

export { validateAccountAccess }
