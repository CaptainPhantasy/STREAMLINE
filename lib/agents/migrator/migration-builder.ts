/**
 * Migration Builder
 * 
 * Generates migration SQL files
 */

import * as fs from 'fs/promises'
import * as path from 'path'

export interface SchemaChange {
  type: 'create_table' | 'alter_table' | 'drop_table' | 'add_column' | 'drop_column' | 'modify_column' | 'add_index' | 'drop_index'
  table?: string
  column?: string
  definition?: string
  indexName?: string
  indexColumns?: string[]
  indexUnique?: boolean
}

export interface Migration {
  filename: string
  sql: string
  rollbackSql: string
  description: string
  timestamp: string
}

/**
 * Migration Builder class
 */
export class MigrationBuilder {
  private migrationsDir: string

  constructor(migrationsDir: string = 'supabase/migrations') {
    this.migrationsDir = migrationsDir
  }

  /**
   * Create migration from schema changes
   */
  async createMigration(changes: SchemaChange[], description: string): Promise<Migration> {
    const timestamp = this.generateTimestamp()
    const filename = `${timestamp}_${this.sanitizeDescription(description)}.sql`
    
    const sql = this.generateMigrationSQL(changes)
    const rollbackSql = this.generateRollbackSQL(changes)
    
    return {
      filename,
      sql,
      rollbackSql,
      description,
      timestamp
    }
  }

  /**
   * Write migration file
   */
  async writeMigration(migration: Migration): Promise<string> {
    const filePath = path.join(process.cwd(), this.migrationsDir, migration.filename)
    const dir = path.dirname(filePath)

    // Create directory if needed
    await fs.mkdir(dir, { recursive: true })

    // Write migration SQL
    const content = `-- ============================================================================
-- ${migration.description}
-- Created: ${migration.timestamp}
-- ============================================================================

${migration.sql}

-- ============================================================================
-- ROLLBACK SQL
-- ============================================================================
-- To rollback this migration, run:
-- ${migration.rollbackSql}
-- ============================================================================
`

    await fs.writeFile(filePath, content, 'utf-8')

    return filePath
  }

  /**
   * Generate migration SQL
   */
  private generateMigrationSQL(changes: SchemaChange[]): string {
    const statements: string[] = []

    for (const change of changes) {
      switch (change.type) {
        case 'create_table':
          if (change.table && change.definition) {
            statements.push(`CREATE TABLE IF NOT EXISTS ${change.table} (\n${change.definition}\n);`)
          }
          break

        case 'alter_table':
          if (change.table && change.definition) {
            statements.push(`ALTER TABLE ${change.table} ${change.definition};`)
          }
          break

        case 'drop_table':
          if (change.table) {
            statements.push(`DROP TABLE IF EXISTS ${change.table};`)
          }
          break

        case 'add_column':
          if (change.table && change.column && change.definition) {
            statements.push(`ALTER TABLE ${change.table} ADD COLUMN IF NOT EXISTS ${change.column} ${change.definition};`)
          }
          break

        case 'drop_column':
          if (change.table && change.column) {
            statements.push(`ALTER TABLE ${change.table} DROP COLUMN IF EXISTS ${change.column};`)
          }
          break

        case 'modify_column':
          if (change.table && change.column && change.definition) {
            statements.push(`ALTER TABLE ${change.table} ALTER COLUMN ${change.column} ${change.definition};`)
          }
          break

        case 'add_index':
          if (change.indexName && change.indexColumns && change.table) {
            const unique = change.indexUnique ? 'UNIQUE' : ''
            const columns = change.indexColumns.join(', ')
            statements.push(`CREATE ${unique} INDEX IF NOT EXISTS ${change.indexName} ON ${change.table}(${columns});`)
          }
          break

        case 'drop_index':
          if (change.indexName) {
            statements.push(`DROP INDEX IF EXISTS ${change.indexName};`)
          }
          break
      }
    }

    return statements.join('\n\n')
  }

  /**
   * Generate rollback SQL
   */
  private generateRollbackSQL(changes: SchemaChange[]): string {
    const statements: string[] = []

    // Reverse the changes
    for (const change of [...changes].reverse()) {
      switch (change.type) {
        case 'create_table':
          if (change.table) {
            statements.push(`DROP TABLE IF EXISTS ${change.table};`)
          }
          break

        case 'drop_table':
          if (change.table && change.definition) {
            statements.push(`CREATE TABLE IF NOT EXISTS ${change.table} (\n${change.definition}\n);`)
          }
          break

        case 'add_column':
          if (change.table && change.column) {
            statements.push(`ALTER TABLE ${change.table} DROP COLUMN IF EXISTS ${change.column};`)
          }
          break

        case 'drop_column':
          if (change.table && change.column && change.definition) {
            statements.push(`ALTER TABLE ${change.table} ADD COLUMN IF NOT EXISTS ${change.column} ${change.definition};`)
          }
          break

        case 'add_index':
          if (change.indexName) {
            statements.push(`DROP INDEX IF EXISTS ${change.indexName};`)
          }
          break

        case 'drop_index':
          if (change.indexName && change.indexColumns && change.table) {
            const unique = change.indexUnique ? 'UNIQUE' : ''
            const columns = change.indexColumns.join(', ')
            statements.push(`CREATE ${unique} INDEX IF NOT EXISTS ${change.indexName} ON ${change.table}(${columns});`)
          }
          break
      }
    }

    return statements.join('\n\n')
  }

  /**
   * Generate timestamp for migration filename
   */
  private generateTimestamp(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    
    return `${year}${month}${day}${hour}${minute}${second}`
  }

  /**
   * Sanitize description for filename
   */
  private sanitizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50)
  }
}

