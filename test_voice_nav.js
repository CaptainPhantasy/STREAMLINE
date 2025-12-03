const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVoiceNavigation() {
  console.log('🧪 Testing voice navigation relay system...')

  // Insert test command
  const { data, error } = await supabase
    .from('voice_navigation_commands')
    .insert({
      account_id: 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00',
      page: '/admin/settings',
      params: { test: true, timestamp: new Date().toISOString() },
      executed: false
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error inserting test command:', error)
    return
  }

  console.log('✅ Test command inserted:', data)
  console.log('📱 Check your browser - it should navigate to /admin/settings')
  console.log('🔍 Also check browser console for [VoiceNavigation] logs')

  // Wait a bit and check if it was executed
  setTimeout(async () => {
    const { data: updated } = await supabase
      .from('voice_navigation_commands')
      .select('*')
      .eq('id', data.id)
      .single()

    if (updated) {
      console.log('\n📊 Command status after 5 seconds:')
      console.log('- Executed:', updated.executed)
      console.log('- Executed at:', updated.executed_at)
    }
  }, 5000)
}

testVoiceNavigation()