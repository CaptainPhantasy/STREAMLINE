/**
 * Migrator Agent
 * 
 * Creates and manages database migrations
 */

import { BaseAgent, AgentConfig, AgentResult } from '../shared/base-agent'
import { MigrationBuilder, SchemaChange } from './migration-builder'
import { SchemaValidator } from './schema-validator'

export class MigratorAgent extends BaseAgent {
  private migrationBuilder: MigrationBuilder
  private validator: SchemaValidator

  constructor(config: AgentConfig) {
    super(config)
    this.migrationBuilder = new MigrationBuilder()
    this.validator = new SchemaValidator()
  }

  async processRequest(request: string, context?: Record<string, any>): Promise<AgentResult> {
    this.initializeCOT(request)
    this.log('Processing migration request...')

    try {
      // COT Phase 1: Understand
      const changes = this.parseRequest(request, context)
      const affectedComponents = changes.map(c => c.table || 'schema').filter(Boolean)
      const currentState = { schema: 'current' }
      const desiredState = { schema: 'updated' }
      const businessImpact = 'Database migration updates schema'
      const requirementsClarity = this.assessClarity(request)

      const cot = this.getCOTFramework()
      const understanding = await cot.understand(
        affectedComponents,
        currentState,
        desiredState,
        businessImpact,
        requirementsClarity
      )

      if (!understanding.passed) {
        return {
          success: false,
          agentId: this.getId(),
          phase: 'understand',
          error: `Understanding failed: ${understanding.errors?.join(', ')}`,
          cotExecution: cot.getExecution()
        }
      }

      // COT Phase 2: Analyze
      this.log('Analyzing current schema...')
      const dependencies: Array<{ from: string; to: string; type: string }> = []
      const circularDeps: string[][] = []
      const breakageRisks: Record<string, number> = {}

      const analysis = await cot.analyze(dependencies, circularDeps, breakageRisks)
      if (!analysis.passed) {
        return {
          success: false,
          agentId: this.getId(),
          phase: 'analyze',
          error: `Analysis failed: ${analysis.errors?.join(', ')}`,
          cotExecution: cot.getExecution()
        }
      }

      // COT Phase 3: Plan
      this.log('Planning migration...')
      const validation = this.validator.validateMigration(changes)
      const failureScenarios = [
        { scenario: 'Migration causes data loss', probability: validation.dataLossRisk ? 0.8 : 0.1, impact: 'Critical' },
        { scenario: 'Migration breaks existing code', probability: validation.backwardCompatible ? 0.1 : 0.7, impact: 'High' }
      ]
      const mitigations = [
        { scenario: 'Migration causes data loss', strategy: 'Backup data before migration' },
        { scenario: 'Migration breaks existing code', strategy: 'Test migration in staging first' }
      ]
      const rollbackPlan = 'Use generated rollback SQL'
      const resourceEstimate = { time: 30, cost: 0 }

      const plan = await cot.plan(failureScenarios, mitigations, rollbackPlan, resourceEstimate)
      if (!plan.passed) {
        return {
          success: false,
          agentId: this.getId(),
          phase: 'plan',
          error: `Planning failed: ${plan.errors?.join(', ')}`,
          cotExecution: cot.getExecution()
        }
      }

      // COT Phase 4: Validate
      this.log('Validating migration safety...')
      if (!this.validator.canSafelyApply(changes)) {
        return {
          success: false,
          agentId: this.getId(),
          phase: 'validate',
          error: `Migration validation failed: ${validation.errors.join(', ')}`,
          cotExecution: cot.getExecution()
        }
      }

      const validationResult = await cot.validate(
        true,
        true,
        validation.performanceImpact !== 'high',
        80
      )
      if (!validationResult.passed) {
        return {
          success: false,
          agentId: this.getId(),
          phase: 'validate',
          error: `Validation failed: ${validationResult.errors?.join(', ')}`,
          cotExecution: cot.getExecution()
        }
      }

      // COT Phase 5: Execute
      this.log('Generating migration...')
      const description = context?.description || request
      const migration = await this.migrationBuilder.createMigration(changes, description)
      
      // Write migration file if requested
      if (context?.writeFile !== false) {
        await this.migrationBuilder.writeMigration(migration)
      }

      const execution = await cot.execute(
        true,
        true,
        true,
        validation.warnings
      )
      if (!execution.passed) {
        return {
          success: false,
          agentId: this.getId(),
          phase: 'execute',
          error: `Execution failed: ${execution.errors?.join(', ')}`,
          cotExecution: cot.getExecution()
        }
      }

      // COT Phase 6: Verify
      this.log('Verifying migration...')
      const verification = await cot.verify(
        true,
        false,
        [],
        true
      )

      return {
        success: verification.passed,
        agentId: this.getId(),
        phase: 'verify',
        data: {
          migration,
          validation
        },
        cotExecution: cot.getExecution()
      }
    } catch (error) {
      return {
        success: false,
        agentId: this.getId(),
        phase: 'execute',
        error: error instanceof Error ? error.message : 'Unknown error',
        cotExecution: this.getCOTExecution()
      }
    }
  }

  /**
   * Parse request into schema changes
   */
  private parseRequest(request: string, context?: Record<string, any>): SchemaChange[] {
    // If changes provided in context, use them
    if (context?.changes && Array.isArray(context.changes)) {
      return context.changes
    }

    // Otherwise, parse from request (simplified)
    const changes: SchemaChange[] = []
    const lowerRequest = request.toLowerCase()

    if (lowerRequest.includes('add table') || lowerRequest.includes('create table')) {
      const tableMatch = request.match(/(?:add|create)\s+table\s+(\w+)/i)
      if (tableMatch) {
        changes.push({
          type: 'create_table',
          table: tableMatch[1],
          definition: 'id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now()'
        })
      }
    }

    if (lowerRequest.includes('add column')) {
      const columnMatch = request.match(/(?:add|create)\s+column\s+(\w+)\s+in\s+table\s+(\w+)/i)
      if (columnMatch) {
        changes.push({
          type: 'add_column',
          table: columnMatch[2],
          column: columnMatch[1],
          definition: 'text'
        })
      }
    }

    return changes.length > 0 ? changes : context?.changes || []
  }

  /**
   * Assess requirements clarity
   */
  private assessClarity(request: string): number {
    const hasTable = /\b(table|column|index)\b/i.test(request)
    const hasAction = /\b(add|create|drop|alter)\b/i.test(request)
    const length = request.length

    let clarity = 0.5
    if (hasTable) clarity += 0.2
    if (hasAction) clarity += 0.2
    clarity += Math.min(length / 200, 0.1)

    return Math.min(1, clarity)
  }
}
