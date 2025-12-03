const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
  console.log('🔍 Checking user account IDs...')

  // Check auth.users for user metadata
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('Auth Error:', authError)
  } else {
    console.log('Auth users found:')
    authUsers.users.forEach(user => {
      console.log(`- Email: ${user.email}`)
      console.log(`  Account ID: ${user.user_metadata?.account_id || 'NOT SET'}`)
      console.log(`  User ID: ${user.id}`)
      console.log('')
    })
  }

  // Check for any navigation commands
  const { data: commands, error: cmdError } = await supabase
    .from('voice_navigation_commands')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (cmdError) {
    console.error('Commands Error:', cmdError)
  } else {
    console.log('Recent navigation commands:')
    commands.forEach(cmd => {
      console.log(`- Page: ${cmd.page}`)
      console.log(`  Account ID: ${cmd.account_id}`)
      console.log(`  Executed: ${cmd.executed}`)
      console.log(`  Created: ${cmd.created_at}`)
      console.log('')
    })
  }
}

checkUsers()