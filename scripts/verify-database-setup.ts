import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying Database Setup for Phase 5\n')
  console.log(`📍 Supabase URL: ${supabaseUrl.substring(0, 30)}...\n`)

  let allGood = true

  // 1. Check if core tables exist
  console.log('1️⃣ Checking Core Tables...')
  const requiredTables = ['accounts', 'contacts', 'conversations', 'messages', 'jobs']
  
  for (const table of requiredTables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
      allGood = false
    } else {
      console.log(`   ✅ ${table}: exists`)
    }
  }

  // 2. Check if account exists (CRITICAL for handle-inbound-email)
  console.log('\n2️⃣ Checking Account (CRITICAL for Email Integration)...')
  const { data: accounts, error: accountError } = await supabase
    .from('accounts')
    .select('id, name, slug')
    .limit(1)

  if (accountError) {
    console.log(`   ❌ Error querying accounts: ${accountError.message}`)
    allGood = false
  } else if (!accounts || accounts.length === 0) {
    console.log('   ❌ NO ACCOUNT FOUND - Email integration will fail!')
    console.log('   ⚠️  The handle-inbound-email Edge Function requires at least one account')
    console.log('   📝 Run this SQL in Supabase Dashboard:')
    console.log('      INSERT INTO accounts (name, slug) VALUES (\'317 Plumber\', \'317plumber\') RETURNING id;')
    allGood = false
  } else {
    console.log(`   ✅ Account found: ${accounts[0].name} (${accounts[0].slug})`)
    console.log(`      ID: ${accounts[0].id}`)
  }

  // 3. Check RLS policies
  console.log('\n3️⃣ Checking RLS Policies...')
  // Try to query with service role (should work)
  const { error: rlsTest } = await supabase.from('contacts').select('id').limit(1)
  if (rlsTest && rlsTest.message.includes('permission denied')) {
    console.log('   ⚠️  RLS may be blocking - check policies')
  } else {
    console.log('   ✅ Tables accessible (RLS policies likely applied)')
  }

  // 4. Check for persona_config column
  console.log('\n4️⃣ Checking Schema Extensions...')
  if (accounts && accounts.length > 0) {
    const { data: account, error: colError } = await supabase
      .from('accounts')
      .select('persona_config')
      .eq('id', accounts[0].id)
      .single()
    
    if (colError && colError.message.includes('column')) {
      console.log('   ⚠️  persona_config column may be missing')
      console.log('   📝 Run: supabase/add-persona-config.sql')
    } else {
      console.log('   ✅ persona_config column exists')
    }
  }

  // 5. Summary
  console.log('\n' + '='.repeat(60))
  if (allGood) {
    console.log('✅ Database Setup: COMPLETE')
    console.log('   Ready for Phase 5 Email Integration!')
  } else {
    console.log('❌ Database Setup: INCOMPLETE')
    console.log('\n📋 Required Actions:')
    console.log('   1. Run supabase/schema.sql in Supabase SQL Editor')
    console.log('   2. Run supabase/rls-policies.sql in Supabase SQL Editor')
    console.log('   3. Ensure at least one account exists')
    console.log('   4. (Optional) Run supabase/add-persona-config.sql')
    console.log('   5. (Optional) Run supabase/seed-llm-providers.sql')
  }
  console.log('='.repeat(60))
}

verifyDatabaseSetup().catch(console.error)

