import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://expbvujyegxmxvatcjqt.supabase.co',
    'sb_secret_4_U_HfhcGnqyMZdSkGNHRA_sY6lf89T'
)

async function test() {
    console.log('1. Getting token...')
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@317plumber.com',
        password: 'TestPass123!'
    })

    if (signInError) {
        console.error('Sign in error:', signInError.message)
        return
    }

    const token = authData.session?.access_token
    if (!token) {
        console.log('No token received')
        return
    }
    console.log('Token received')

    console.log('2. Validating token...')
    const { data: userData, error: getUserError } = await supabase.auth.getUser(token)

    if (getUserError) {
        console.log('GetUser Error:', getUserError.message)
    } else {
        console.log('User ID:', userData.user?.id)
    }
}

test()
