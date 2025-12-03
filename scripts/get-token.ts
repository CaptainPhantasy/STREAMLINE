import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getToken() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@317plumber.com',
        password: 'TestPass123!'
    })

    if (error) {
        console.error('Error:', error)
        process.exit(1)
    }

    console.log(data.session?.access_token)
}

getToken()
