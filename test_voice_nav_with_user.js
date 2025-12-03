const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWithUser() {
  console.log('🧪 Testing voice navigation with real user ID...')

  // Use a real user ID from the database
  const realUserId = '4e7caf61-cc73-407b-b18c-407d0d04f9d3' // douglastalley1977@gmail.com

  // First, set the account_id for this user
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    realUserId,
    { user_metadata: { account_id: 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00' } }
  )

  if (updateError) {
    console.error('Error updating user metadata:', updateError)
  } else {
    console.log('✅ User metadata updated with account_id')
  }

  // Now insert a test command
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
  console.log('📱 Now open http://localhost:3002 in your browser')
  console.log('🔑 Login with douglastalley1977@gmail.com')
  console.log('🔍 The page should automatically navigate to /admin/settings')

  // Wait and check execution
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

      if (updated.executed) {
        console.log('\n🎉 SUCCESS! Voice navigation is working!')
        console.log('The MCP agent can now navigate pages using voice commands.')
      } else {
        console.log('\n⚠️ Command not yet executed. Make sure you are logged in and the page is open.')
      }
    }
  }, 5000)
}

testWithUser()