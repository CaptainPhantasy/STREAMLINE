import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://expbvujyegxmxvatcjqt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cGJ2dWp5ZWd4bXh2YXRjanF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODg4NTUsImV4cCI6MjA3OTE2NDg1NX0.wMHTSHKFvzEwSiQzMl0EVwkFJxSy_TZLJHO4iwRVIO8' // User provided key

console.log('🧪 Testing Supabase Connection with provided key...')
console.log(`   URL: ${supabaseUrl}`)
console.log(`   Key: ${supabaseKey.substring(0, 15)}...`)

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function testConnection() {
    try {
        // Try a simple request that requires the anon key
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })

        if (error) {
            console.error('❌ Connection failed:', error.message)
            console.error('   Details:', error)
        } else {
            console.log('✅ Connection successful!')
            console.log('   Data:', data)
        }

        // Try to sign in
        console.log('\n🔐 Attempting login...')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'DouglasTalley1977@gmail.com',
            password: 'DevP@$$1977'
        })

        if (signInError) {
            console.error('❌ Login failed:', signInError.message)
            console.error('   Full error:', signInError)
        } else {
            console.log('✅ Login successful!')
            console.log('   User:', signInData.user?.email)
        }

        // Also try auth
        const { data: authData, error: authError } = await supabase.auth.getSession()
        if (authError) {
            console.error('❌ Auth check failed:', authError.message)
        } else {
            console.log('✅ Auth check successful (public)')
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err)
    }
}

testConnection()
