import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

async function testAutomationEngine() {
  console.log('🔍 Testing Automation Engine\n')

  const baseUrl = `${supabaseUrl}/functions/v1/automation-engine`
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  // Get account
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id')
    .eq('slug', '317plumber')
    .limit(1)

  if (!accounts || accounts.length === 0) {
    console.log('❌ No account found')
    return
  }

  const accountId = accounts[0].id

  // Test automation trigger
  console.log('1. Testing automation engine trigger...')
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        event: 'message_received',
        entityType: 'message',
        entityId: 'test-message-id',
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ SUCCESS`)
      console.log(`   Actions triggered: ${data.actionsExecuted || 0}`)
    } else {
      const error = await response.text()
      console.log(`   ⚠️  Response: ${response.status} - ${error.substring(0, 100)}`)
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }

  // Check automation rules
  console.log('\n2. Checking automation rules in database...')
  const { data: rules, error: rulesError } = await supabase
    .from('automation_rules')
    .select('id, name, trigger_event, is_active')
    .eq('account_id', accountId)
    .limit(5)

  if (rulesError) {
    if (rulesError.message.includes('does not exist')) {
      console.log('   ⚠️  automation_rules table does not exist - automation engine may not be set up')
    } else {
      console.log(`   ⚠️  Error: ${rulesError.message}`)
    }
  } else {
    console.log(`   ✅ Found ${rules?.length || 0} automation rules`)
    if (rules && rules.length > 0) {
      rules.forEach(rule => console.log(`      - ${rule.name} (${rule.trigger_event})`))
    }
  }

  console.log('\n✅ Automation engine testing complete')
}

testAutomationEngine().catch(console.error)

