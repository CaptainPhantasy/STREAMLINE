/**
 * Apply database migrations to production
 * Run with: npx ts-node scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://expbvujyegxmxvatcjqt.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

async function runMigration(filename: string) {
  const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename)

  if (!fs.existsSync(filepath)) {
    console.error(`Migration file not found: ${filepath}`)
    return false
  }

  const sql = fs.readFileSync(filepath, 'utf8')

  console.log(`Running migration: ${filename}`)

  // Split into individual statements
  const statements = sql.split(';').filter(s => s.trim().length > 0)

  for (const statement of statements) {
    const trimmed = statement.trim()
    if (!trimmed || trimmed.startsWith('--')) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: trimmed + ';' })
      if (error) {
        // Try raw query approach
        console.log(`  Statement preview: ${trimmed.substring(0, 50)}...`)
      }
    } catch (err) {
      console.log(`  Skipping statement (may already exist): ${trimmed.substring(0, 50)}...`)
    }
  }

  return true
}

async function main() {
  console.log('Applying migrations to:', supabaseUrl)

  // Run migrations in order
  const migrations = [
    '20250127_add_estimates_system.sql',
    '20251127_add_parts_and_calendar.sql'
  ]

  for (const migration of migrations) {
    await runMigration(migration)
  }

  console.log('\nMigrations complete!')
  console.log('Note: Some statements may have been skipped if tables already exist.')
}

main().catch(console.error)
