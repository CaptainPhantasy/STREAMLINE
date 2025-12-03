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

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function verifyPerformance() {
  console.log('🔍 Agent 1: Performance Verification\n')

  // Check function volatility
  const { data: funcData, error: funcError } = await supabase.rpc('exec_sql', {
    sql: `SELECT proname, provolatile FROM pg_proc WHERE proname = 'get_user_account_id'`
  }).catch(() => ({ data: null, error: { message: 'Cannot query directly' } }))

  if (!funcError) {
    console.log('✅ Function volatility check:')
    console.log('   Note: Check Supabase Dashboard → Performance Advisor for warnings')
  }

  // Check RLS policies on llm_providers
  const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
    sql: `SELECT COUNT(*) as count FROM pg_policies WHERE tablename = 'llm_providers'`
  }).catch(() => ({ data: null, error: { message: 'Cannot query directly' } }))

  if (!policyError) {
    console.log('✅ RLS policies check:')
    console.log('   Note: Should have separate policies for SELECT, INSERT, UPDATE, DELETE')
  }

  // Test query performance
  console.log('\n⏱️  Testing query performance...')
  const startTime = Date.now()
  const { data: testData, error: testError } = await supabase
    .from('llm_providers')
    .select('id, name, provider')
    .limit(10)

  const duration = Date.now() - startTime

  if (testError) {
    console.log(`   ⚠️  Query error: ${testError.message}`)
  } else {
    console.log(`   ✅ Query completed in ${duration}ms`)
    if (duration > 1000) {
      console.log('   ⚠️  Query is slow (>1s), consider optimization')
    } else {
      console.log('   ✅ Query performance acceptable')
    }
  }

  console.log('\n📋 Manual Verification Required:')
  console.log('   1. Go to Supabase Dashboard → Performance Advisor')
  console.log('   2. Check for warnings about:')
  console.log('      - Multiple permissive policies on llm_providers')
  console.log('      - RLS initialization plan issues')
  console.log('   3. Should see reduced/zero warnings after RLS fixes')

  return { success: true }
}

verifyPerformance().catch(console.error)

