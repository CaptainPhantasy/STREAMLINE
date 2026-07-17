/**
 * Schema Validator
 * 
 * Validates migration safety
 */

import { SchemaChange } from './migration-builder'

export interface ValidationResult {
  safe: boolean
  warnings: string[]
  errors: string[]
  dataLossRisk: boolean
  backwardCompatible: boolean
  performanceImpact: 'low' | 'medium' | 'high'
}

/**
 * Schema Validator class
 */
export class SchemaValidator {
  /**
   * Validate migration safety
   */
  validateMigration(changes: SchemaChange[]): ValidationResult {
    const warnings: string[] = []
    const errors: string[] = []
    let dataLossRisk = false
    let backwardCompatible = true
    let performanceImpact: 'low' | 'medium' | 'high' = 'low'

    for (const change of changes) {
      // Check for data loss risks
      if (change.type === 'drop_table' || change.type === 'drop_column') {
        dataLossRisk = true
        warnings.push(`${change.type} may cause data loss`)
      }

      // Check for backward compatibility
      if (change.type === 'drop_table' || change.type === 'drop_column' || change.type === 'modify_column') {
        backwardCompatible = false
        warnings.push(`${change.type} may break existing code`)
      }

      // Check for performance impact
      if (change.type === 'add_index') {
        performanceImpact = 'low' // Adding indexes improves performance
      } else if (change.type === 'drop_index') {
        performanceImpact = 'medium'
        warnings.push('Dropping index may impact query performance')
      } else if (change.type === 'modify_column') {
        performanceImpact = 'medium'
        warnings.push('Modifying column may require table rewrite')
      }

      // Validate required fields
      if (change.type === 'create_table' && !change.table) {
        errors.push('create_table requires table name')
      }
      if (change.type === 'add_column' && (!change.table || !change.column)) {
        errors.push('add_column requires table and column names')
      }
      if (change.type === 'add_index' && (!change.indexName || !change.indexColumns)) {
        errors.push('add_index requires index name and columns')
      }
    }

    return {
      safe: errors.length === 0 && !dataLossRisk,
      warnings,
      errors,
      dataLossRisk,
      backwardCompatible,
      performanceImpact
    }
  }

  /**
   * Check if migration can be safely applied
   */
  canSafelyApply(changes: SchemaChange[]): boolean {
    const validation = this.validateMigration(changes)
    return validation.safe && validation.errors.length === 0
  }

  /**
   * Get migration risk level
   */
  getRiskLevel(changes: SchemaChange[]): 'low' | 'medium' | 'high' {
    const validation = this.validateMigration(changes)
    
    if (validation.errors.length > 0 || validation.dataLossRisk) {
      return 'high'
    }
    
    if (validation.warnings.length > 0 || !validation.backwardCompatible) {
      return 'medium'
    }
    
    return 'low'
  }
}

