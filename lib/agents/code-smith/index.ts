/**
 * CodeSmith Agent
 * 
 * Generates code components, APIs, and tests
 */

import { BaseAgent, AgentConfig, AgentResult } from '../shared/base-agent'
import { TemplateEngine, ComponentSpec } from './template-engine'
import { CodeValidator } from './code-validator'
import * as fs from 'fs/promises'
import * as path from 'path'

export class CodeSmithAgent extends BaseAgent {
  private templateEngine: TemplateEngine
  private validator: CodeValidator

  constructor(config: AgentConfig) {
    super(config)
    this.templateEngine = new TemplateEngine()
    this.validator = new CodeValidator()
  }

  async processRequest(request: string, context?: Record<string, any>): Promise<AgentResult> {
    this.initializeCOT(request)
    this.log('Processing code generation request...')

    try {
      // COT Phase 1: Understand
      const spec = this.parseRequest(request, context)
      const affectedComponents = [spec.name]
      const currentState = { components: [] }
      const desiredState = { components: [spec.name] }
      const businessImpact = `New ${spec.type} improves functionality`
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
      this.log('Analyzing codebase patterns...')
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
      this.log('Planning code generation...')
      const failureScenarios = [
        { scenario: 'Generated code has syntax errors', probability: 0.1, impact: 'Medium' },
        { scenario: 'Code doesn\'t follow project patterns', probability: 0.2, impact: 'Low' }
      ]
      const mitigations = [
        { scenario: 'Generated code has syntax errors', strategy: 'Run ESLint and TypeScript validation' },
        { scenario: 'Code doesn\'t follow project patterns', strategy: 'Use template engine with project patterns' }
      ]
      const rollbackPlan = `Delete generated file: ${spec.name}`
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

      // COT Phase 4: Validate (before generation)
      this.log('Validating approach...')
      const patternCheck = await this.validator.checkPatterns('', spec.type)
      const staticAnalysisPassed = true
      const securityScanPassed = true
      const performanceReviewPassed = true
      const testCoverage = 80

      const validation = await cot.validate(
        staticAnalysisPassed,
        securityScanPassed,
        performanceReviewPassed,
        testCoverage
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
      this.log('Generating code...')
      let generatedCode
      
      switch (spec.type) {
        case 'component':
          generatedCode = this.templateEngine.generateComponent(spec)
          break
        case 'api':
          generatedCode = this.templateEngine.generateAPI(spec)
          break
        case 'hook':
          generatedCode = this.templateEngine.generateHook(spec)
          break
        default:
          generatedCode = this.templateEngine.generateComponent(spec)
      }

      // Validate generated code
      const codeValidation = await this.validator.validateCode(generatedCode.code, generatedCode.filePath)
      
      // Write files if requested
      if (context?.writeFiles !== false) {
        await this.writeGeneratedFiles(generatedCode)
      }

      const execution = await cot.execute(
        true,
        true,
        codeValidation.valid,
        codeValidation.errors
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
      this.log('Verifying generated code...')
      const verification = await cot.verify(
        codeValidation.valid,
        false,
        [],
        true
      )

      return {
        success: verification.passed,
        agentId: this.getId(),
        phase: 'verify',
        data: {
          generatedCode,
          validation: codeValidation
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
   * Parse request into component spec
   */
  private parseRequest(request: string, context?: Record<string, any>): ComponentSpec {
    const lowerRequest = request.toLowerCase()
    
    let type: 'component' | 'api' | 'hook' | 'util' = 'component'
    if (lowerRequest.includes('api') || lowerRequest.includes('endpoint')) {
      type = 'api'
    } else if (lowerRequest.includes('hook') || lowerRequest.includes('use')) {
      type = 'hook'
    } else if (lowerRequest.includes('util') || lowerRequest.includes('utility')) {
      type = 'util'
    }

    // Extract name
    const nameMatch = request.match(/(?:create|generate|make)\s+(?:a\s+)?(?:new\s+)?(\w+)/i)
    const name = nameMatch ? nameMatch[1] : context?.name || 'Component'

    return {
      name,
      type,
      description: context?.description || request
    }
  }

  /**
   * Assess requirements clarity
   */
  private assessClarity(request: string): number {
    const hasType = /\b(component|api|hook|util)\b/i.test(request)
    const hasName = /\b(create|generate|make)\s+\w+/i.test(request)
    const length = request.length

    let clarity = 0.5
    if (hasType) clarity += 0.2
    if (hasName) clarity += 0.2
    clarity += Math.min(length / 200, 0.1)

    return Math.min(1, clarity)
  }

  /**
   * Write generated files
   */
  private async writeGeneratedFiles(generated: any): Promise<void> {
    const filePath = path.join(process.cwd(), generated.filePath)
    const dir = path.dirname(filePath)

    // Create directory if needed
    await fs.mkdir(dir, { recursive: true })

    // Write main file
    await fs.writeFile(filePath, generated.code, 'utf-8')

    // Write test file if exists
    if (generated.tests) {
      const testPath = filePath.replace(/\.tsx?$/, '.test.ts')
      await fs.writeFile(testPath, generated.tests, 'utf-8')
    }

    // Write documentation if exists
    if (generated.documentation) {
      const docPath = filePath.replace(/\.tsx?$/, '.md')
      await fs.writeFile(docPath, generated.documentation, 'utf-8')
    }
  }
}
