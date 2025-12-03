/**
 * Create Sales User for 317 Plumber
 * 
 * Usage: npx tsx scripts/create-sales-user.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const ACCOUNT_ID = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'

async function createSalesUser() {
  console.log('🔧 Creating sales user...\n')

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'sales@317plumber.com',
    password: 'TestPass123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Emily Davis'
    }
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('⚠️ Auth user already exists, checking users table...')
      
      // Get existing auth user
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingAuth = existingUsers?.users.find(u => u.email === 'sales@317plumber.com')
      
      if (existingAuth) {
        // Check if in users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', existingAuth.id)
          .single()

        if (!existingUser) {
          // Add to users table
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: existingAuth.id,
              account_id: ACCOUNT_ID,
              full_name: 'Emily Davis',
              role: 'sales'
            })

          if (insertError) {
            console.error('❌ Failed to add to users table:', insertError.message)
          } else {
            console.log('✅ Added existing auth user to users table as sales')
          }
        } else if (existingUser.role !== 'sales') {
          // Update role to sales
          await supabase
            .from('users')
            .update({ role: 'sales' })
            .eq('id', existingAuth.id)
          console.log('✅ Updated existing user to sales role')
        } else {
          console.log('✅ Sales user already exists and configured correctly')
        }
      }
      return
    }
    console.error('❌ Failed to create auth user:', authError.message)
    return
  }

  console.log('✅ Auth user created:', authUser.user.email)

  // Create users table entry
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      account_id: ACCOUNT_ID,
      full_name: 'Emily Davis',
      role: 'sales'
    })

  if (userError) {
    console.error('❌ Failed to create user record:', userError.message)
    return
  }

  console.log('✅ User record created')
  console.log('\n' + '='.repeat(40))
  console.log('🎉 Sales user created!')
  console.log('='.repeat(40))
  console.log(`
📧 Email: sales@317plumber.com
🔑 Password: TestPass123!
👤 Name: Emily Davis
🏷️ Role: sales

Login and you'll be redirected to /sales/dashboard
`)
}

createSalesUser().catch(console.error)

