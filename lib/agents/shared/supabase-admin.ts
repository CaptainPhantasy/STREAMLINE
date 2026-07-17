/**
 * Supabase Admin Client for Agent Operations
 * 
 * Provides service role access to Supabase for agent operations.
 * Bypasses RLS and provides direct database access.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface SupabaseAdminOptions {
  serviceRoleKey: string
  supabaseUrl: string
}

export interface SQLExecutionResult {
  success: boolean
  data?: any
  error?: string
  rowCount?: number
}

export interface SchemaQueryResult {
  success: boolean
  tables?: Array<{
    name: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      default?: any
    }>
  }>
  error?: string
}

/**
 * Supabase Admin Client for agent operations
 */
export class SupabaseAdminClient {
  private client: ReturnType<typeof createSupabaseClient>
  private serviceRoleKey: string
  private auditLog: Array<{ timestamp: Date; operation: string; result: any }> = []

  constructor(options: SupabaseAdminOptions) {
    this.serviceRoleKey = options.serviceRoleKey
    this.client = createSupabaseClient(options.supabaseUrl, options.serviceRoleKey, {
      auth: {
        persistSession: false
      }
    })
  }

  /**
   * Execute raw SQL query (bypasses RLS)
   */
  async executeSQL(query: string, params?: any[]): Promise<SQLExecutionResult> {
    try {
      // Log operation
      const timestamp = new Date()
      
      // Use Supabase RPC for SQL execution if needed
      // For direct SQL, we'll use the REST API
      const response = await this.client.rpc('exec_sql' as never, {
        query,
        params: params || []
      } as never)

      if (response.error) throw response.error

      const responseData: unknown = response.data
      const result: SQLExecutionResult = {
        success: true,
        data: responseData,
        rowCount: Array.isArray(responseData) ? responseData.length : undefined
      }

      this.auditLog.push({
        timestamp,
        operation: 'executeSQL',
        result: { query: query.substring(0, 100), success: true }
      })

      return result
    } catch (error) {
      const result: SQLExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      this.auditLog.push({
        timestamp: new Date(),
        operation: 'executeSQL',
        result: { query: query.substring(0, 100), success: false, error: result.error }
      })

      return result
    }
  }

  /**
   * Direct SQL execution via REST API
   */
  /**
   * Query table data (bypasses RLS with service role)
   */
  async queryTable(
    table: string,
    options?: {
      select?: string
      filters?: Record<string, any>
      limit?: number
      offset?: number
      orderBy?: { column: string; ascending?: boolean }
    }
  ): Promise<SQLExecutionResult> {
    try {
      let query = this.client.from(table).select(options?.select || '*')

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true
        })
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data,
        rowCount: Array.isArray(data) ? data.length : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Insert data into table
   */
  async insertTable(table: string, data: Record<string, any> | Array<Record<string, any>>): Promise<SQLExecutionResult> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data as never)
        .select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: result,
        rowCount: Array.isArray(result) ? result.length : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update table data
   */
  async updateTable(
    table: string,
    filters: Record<string, any>,
    updates: Record<string, any>
  ): Promise<SQLExecutionResult> {
    try {
      let query = this.client.from(table).update(updates as never)

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data, error } = await query.select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data,
        rowCount: Array.isArray(data) ? data.length : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete from table
   */
  async deleteTable(table: string, filters: Record<string, any>): Promise<SQLExecutionResult> {
    try {
      let query = this.client.from(table).delete()

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data, error } = await query.select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data,
        rowCount: Array.isArray(data) ? data.length : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get database schema information
   */
  async getSchema(): Promise<SchemaQueryResult> {
    try {
      // Query information_schema for table and column info
      const { data, error } = await this.client.rpc('get_schema_info' as never)

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to retrieve schema'
        }
      }

      // For now, return basic structure
      // Full schema query would require custom RPC function
      return {
        success: true,
        tables: []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(): Array<{ timestamp: Date; operation: string; result: any }> {
    return [...this.auditLog]
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = []
  }

  /**
   * Get the underlying Supabase client (for advanced operations)
   */
  getClient() {
    return this.client
  }
}

/**
 * Factory function to create Supabase admin client
 */
export function createSupabaseAdminClient(options: SupabaseAdminOptions): SupabaseAdminClient {
  return new SupabaseAdminClient(options)
}
