import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createAutomationRulesTable() {
  console.log('🔍 Agent 2: Creating automation_rules table\n')

  try {
    // Read SQL file
    const sqlFile = readFileSync(
      resolve(process.cwd(), 'supabase/add-automation-rules.sql'),
      'utf-8'
    )

    console.log('✅ SQL file loaded')
    console.log('   Note: DDL statements must be run in Supabase SQL Editor')

    // Check if table exists
    const { data: existing, error: checkError } = await supabase
      .from('automation_rules')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('   ✅ Table already exists')
      
      // Add sample rule
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('slug', '317plumber')
        .limit(1)

      if (accounts && accounts.length > 0) {
        const accountId = accounts[0].id

        // Check if sample rule exists
        const { data: existingRule } = await supabase
          .from('automation_rules')
          .select('id')
          .eq('name', 'Auto-draft for unreplied messages')
          .eq('account_id', accountId)
          .single()

        if (!existingRule) {
          const { error: insertError } = await supabase
            .from('automation_rules')
            .insert({
              account_id: accountId,
              name: 'Auto-draft for unreplied messages',
              trigger: 'unreplied_time',
              trigger_config: { minutes: 15 },
              action: 'create_draft',
              action_config: {},
              is_active: true,
            })

          if (insertError) {
            console.log(`   ⚠️  Could not insert sample rule: ${insertError.message}`)
          } else {
            console.log('   ✅ Sample automation rule created')
          }
        } else {
          console.log('   ✅ Sample rule already exists')
        }
      }
    } else {
      console.log('   ❌ Table does not exist')
      console.log('\n📋 Manual Steps Required:')
      console.log('   1. Go to Supabase Dashboard → SQL Editor')
      console.log('   2. Copy contents of supabase/add-automation-rules.sql')
      console.log('   3. Paste and run')
    }

    return { success: !checkError }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
}

createAutomationRulesTable().catch(console.error)

