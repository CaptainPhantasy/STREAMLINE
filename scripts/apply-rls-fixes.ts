import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applyRLSFixes() {
  console.log('🔧 Applying RLS Performance Fixes...\n')

  try {
    const sqlFile = readFileSync(resolve(process.cwd(), 'supabase/fix-rls-performance.sql'), 'utf-8')
    
    // Split by semicolons and filter out empty statements
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length < 10) continue // Skip very short statements
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        // If exec_sql doesn't exist, try direct query
        if (error?.message?.includes('function') || error?.message?.includes('exec_sql')) {
          // Use REST API to execute SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
            },
            body: JSON.stringify({ sql: statement }),
          })
          
          if (!response.ok) {
            // Try alternative: execute via Supabase client (may not work for DDL)
            console.log(`   ⚠️  Statement ${i + 1}: Cannot execute via API (DDL statements need SQL editor)`)
            console.log(`   Statement: ${statement.substring(0, 100)}...`)
            continue
          }
        }
        
        if (error) {
          console.log(`   ⚠️  Statement ${i + 1}: ${error.message}`)
        } else {
          console.log(`   ✅ Statement ${i + 1}: Success`)
        }
      } catch (err: any) {
        console.log(`   ⚠️  Statement ${i + 1}: ${err.message}`)
      }
    }

    console.log('\n⚠️  Note: DDL statements (CREATE, DROP, ALTER) must be run in Supabase SQL Editor')
    console.log('   Please copy the contents of supabase/fix-rls-performance.sql to Supabase Dashboard')
    console.log('   → SQL Editor → New Query → Paste → Run\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n📋 Manual Instructions:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Click "New Query"')
    console.log('3. Copy contents of supabase/fix-rls-performance.sql')
    console.log('4. Paste and click "Run"')
  }
}

applyRLSFixes()

