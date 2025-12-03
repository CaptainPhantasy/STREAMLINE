import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://expbvujyegxmxvatcjqt.supabase.co'
const serviceKey = 'sb_secret_4_U_HfhcGnqyMZdSkGNHRA_sY6lf89T'

async function testRLS() {
    // 1. Get a token for a test user
    const authClient = createClient(supabaseUrl, serviceKey)
    const { data: authData } = await authClient.auth.signInWithPassword({
        email: 'test@317plumber.com',
        password: 'TestPass123!'
    })
    const token = authData.session?.access_token
    if (!token) { console.log('No token'); return }

    // 2. Create a client with Service Key BUT with User Token header
    const client = createClient(supabaseUrl, serviceKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    })

    // 3. Try to access data that should be restricted
    // For example, try to read another account's data if possible, or just verify we can read our own.
    // Let's just list contacts and see if we get any (we should)
    console.log('Reading contacts...')
    const { data: contacts, error } = await client.from('contacts').select('*').limit(5)

    if (error) {
        console.log('Error reading contacts:', error.message)
    } else {
        console.log(`Read ${contacts.length} contacts`)
    }

    // 4. Verify if we are admin (bypass RLS)
    // We can try to read something we shouldn't, or check if we can see all users?
    // Or check `auth.uid()` in a policy?
}

testRLS()
