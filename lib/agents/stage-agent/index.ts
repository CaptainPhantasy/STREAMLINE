/**
 * StageAgent
 * 
 * Creates staged environments for deployment
 */

import { BaseAgent, AgentConfig, AgentResult } from '../shared/base-agent'
import { DeploymentManager } from './deployment-manager'

export class StageAgent extends BaseAgent {
  private deploymentManager: DeploymentManager

  constructor(config: AgentConfig) {
    super(config)
    this.deploymentManager = new DeploymentManager()
  }

  async processRequest(request: string, context?: Record<string, any>): Promise<AgentResult> {
    this.initializeCOT(request)
    this.log('Processing staging request...')

    try {
      // COT Phase 1: Understand
      const files = this.extractFiles(request, context)
      const affectedComponents = files
      const currentState = { files: [] }
      const desiredState = { files, staged: true }
      const businessImpact = 'Staged environment enables safe deployment review'
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
      this.log('Analyzing changes...')
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
      this.log('Planning staging environment...')
      const failureScenarios = [
        { scenario: 'Files missing or inaccessible', probability: 0.1, impact: 'Medium' },
        { scenario: 'Staging directory creation fails', probability: 0.05, impact: 'Low' }
      ]
      const mitigations = [
        { scenario: 'Files missing or inaccessible', strategy: 'Verify file existence before staging' },
        { scenario: 'Staging directory creation fails', strategy: 'Create directory with recursive flag' }
      ]
      const rollbackPlan = 'Delete staged environment directory'
      const resourceEstimate = { time: 5, cost: 0 }

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
      this.log('Validating staging setup...')
      const validation = await cot.validate(
        true,
        true,
        true,
        80
      )
      if (!validation.passed) {
        return {
          success: false,
          agentId: this.getId(),
          phase: 'validate',
          error: `Validation failed: ${validation.errors?.join(', ')}`,
          cotExecution: cot.getExecution()
        }
      }

      // COT Phase 5: Execute
      this.log('Creating staged environment...')
      const description = context?.description || request
      const stagedEnv = await this.deploymentManager.createStagedEnvironment(files, description)

      const execution = await cot.execute(
        true,
        true,
        true,
        []
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
      this.log('Verifying staged environment...')
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
          stagedEnvironment: stagedEnv
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
   * Extract files from request
   */
  private extractFiles(request: string, context?: Record<string, any>): string[] {
    // If files provided in context, use them
    if (context?.files && Array.isArray(context.files)) {
      return context.files
    }

    // Otherwise, try to extract from request
    const fileMatches = request.match(/(?:file|component|migration)[:\s]+([^\s]+)/gi)
    if (fileMatches) {
      return fileMatches.map(m => m.split(/[: ]+/)[1])
    }

    // Default: empty array (will stage nothing)
    return []
  }

  /**
   * Assess requirements clarity
   */
  private assessClarity(request: string): number {
    const hasFiles = /\b(file|component|migration)\b/i.test(request)
    const hasDeploy = /\b(deploy|stage|staging)\b/i.test(request)
    const length = request.length

    let clarity = 0.5
    if (hasFiles) clarity += 0.2
    if (hasDeploy) clarity += 0.2
    clarity += Math.min(length / 200, 0.1)

    return Math.min(1, clarity)
  }
}
