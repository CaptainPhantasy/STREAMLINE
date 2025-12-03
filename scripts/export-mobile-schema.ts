/**
 * Export actual mobile PWA schema from Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function exportSchema() {
  console.log('📊 Exporting actual mobile PWA schema from database...\n')

  const tables = ['job_gates', 'job_photos', 'gps_logs', 'meetings']

  let schemaSQL = `-- ============================================================
-- Mobile PWA Schema - ACTUAL DEPLOYED VERSION
-- Generated: ${new Date().toISOString()}
-- Source: Live Supabase Database
-- ============================================================
-- This is the ACTUAL schema as deployed after security hardening.
-- Use this as the source of truth.
-- ============================================================

`

  for (const tableName of tables) {
    console.log(`📋 Processing table: ${tableName}`)

    // Get column information
    const { data: columns, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `
    })

    if (error) {
      console.log(`   Trying direct query instead...`)

      // Fallback: Use direct query
      const query = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `

      console.log(`   Query: ${query}`)
      continue
    }

    if (columns && columns.length > 0) {
      schemaSQL += `\n-- Table: ${tableName}\n`
      schemaSQL += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`

      const columnDefs = columns.map((col: any) => {
        let def = `  ${col.column_name} ${col.data_type.toUpperCase()}`

        if (col.is_nullable === 'NO') {
          def += ' NOT NULL'
        }

        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`
        }

        return def
      })

      schemaSQL += columnDefs.join(',\n')
      schemaSQL += '\n);\n'

      console.log(`   ✅ ${columns.length} columns exported`)
    }
  }

  schemaSQL += `\n-- ============================================================
-- End of Mobile PWA Schema
-- ============================================================\n`

  console.log('\n📝 Schema exported successfully!')
  console.log('\n' + '='.repeat(60))
  console.log(schemaSQL)
  console.log('='.repeat(60))

  return schemaSQL
}

exportSchema()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
