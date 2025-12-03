/**
 * Build actual schema SQL from column definitions
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://expbvujyegxmxvatcjqt.supabase.co'
const supabaseKey = 'sb_secret_4_U_HfhcGnqyMZdSkGNHRA_sY6lf89T'

const supabase = createClient(supabaseUrl, supabaseKey)

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

function buildColumnDef(col: ColumnInfo): string {
  let def = `  ${col.column_name} ${mapDataType(col.data_type)}`

  if (col.is_nullable === 'NO') {
    def += ' NOT NULL'
  }

  if (col.column_default) {
    def += ` DEFAULT ${col.column_default}`
  }

  return def
}

function mapDataType(pgType: string): string {
  const typeMap: Record<string, string> = {
    'uuid': 'UUID',
    'text': 'TEXT',
    'integer': 'INTEGER',
    'boolean': 'BOOLEAN',
    'numeric': 'NUMERIC',
    'timestamp with time zone': 'TIMESTAMPTZ',
    'jsonb': 'JSONB',
  }
  return typeMap[pgType] || pgType.toUpperCase()
}

async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const { data, error } = await supabase
    .from('information_schema.columns' as any)
    .select('column_name, data_type, is_nullable, column_default')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .order('ordinal_position')

  if (error) {
    console.error(`Error fetching ${tableName}:`, error)
    return []
  }

  return data || []
}

async function buildSchema() {
  console.log('🔨 Building actual schema from live database...\n')

  const schema = `-- ============================================================
-- Mobile PWA Schema - ACTUAL DEPLOYED VERSION
-- Generated: ${new Date().toISOString()}
-- Source: Live Supabase Database (expbvujyegxmxvatcjqt)
-- ============================================================
-- This schema reflects the ACTUAL state after security hardening.
-- This is the source of truth.
-- ============================================================

`

  let fullSchema = schema

  const tables = ['job_gates', 'job_photos', 'gps_logs', 'meetings']

  for (const tableName of tables) {
    console.log(`📋 Processing: ${tableName}`)

    const columns = await getTableColumns(tableName)

    if (columns.length === 0) {
      console.log(`   ⚠️  No columns found (may need different query method)`)
      continue
    }

    fullSchema += `\n-- ============================================================\n`
    fullSchema += `-- Table: ${tableName}\n`
    fullSchema += `-- ============================================================\n`
    fullSchema += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`
    fullSchema += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`

    const nonIdColumns = columns.filter(c => c.column_name !== 'id')
    const columnDefs = nonIdColumns.map(buildColumnDef)

    fullSchema += columnDefs.join(',\n')
    fullSchema += '\n);\n'

    console.log(`   ✅ ${columns.length} columns`)
  }

  fullSchema += `\n-- ============================================================\n`
  fullSchema += `-- Indexes\n`
  fullSchema += `-- ============================================================\n\n`

  fullSchema += `CREATE INDEX IF NOT EXISTS idx_job_gates_job_id ON job_gates(job_id);\n`
  fullSchema += `CREATE INDEX IF NOT EXISTS idx_job_gates_status ON job_gates(status);\n`
  fullSchema += `CREATE INDEX IF NOT EXISTS idx_job_gates_requires_exception ON job_gates(requires_exception) WHERE requires_exception = TRUE;\n\n`

  fullSchema += `CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);\n`
  fullSchema += `CREATE INDEX IF NOT EXISTS idx_job_photos_created_at ON job_photos(created_at);\n\n`

  fullSchema += `CREATE INDEX IF NOT EXISTS idx_gps_logs_job_id ON gps_logs(job_id);\n`
  fullSchema += `CREATE INDEX IF NOT EXISTS idx_gps_logs_user_id ON gps_logs(user_id);\n`
  fullSchema += `CREATE INDEX IF NOT EXISTS idx_gps_logs_created_at ON gps_logs(created_at);\n\n`

  fullSchema += `CREATE INDEX IF NOT EXISTS idx_meetings_contact_id ON meetings(contact_id);\n`
  fullSchema += `CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);\n`
  fullSchema += `CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);\n\n`

  fullSchema += `-- ============================================================\n`
  fullSchema += `-- End of Schema\n`
  fullSchema += `-- ============================================================\n`

  return fullSchema
}

buildSchema()
  .then(schema => {
    console.log('\n✅ Schema built successfully!\n')
    console.log('='.repeat(70))
    console.log(schema)
    console.log('='.repeat(70))
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
