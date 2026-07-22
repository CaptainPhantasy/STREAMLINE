/**
 * Chain of Thought (COT) Framework for Agent Operations
 * 
 * Enforces a 6-phase process for all agent operations:
 * 1. UNDERSTAND → 2. ANALYZE → 3. PLAN → 4. VALIDATE → 5. EXECUTE → 6. VERIFY
 * 
 * Quality gates prevent proceeding without meeting thresholds.
 */

export type COTPhase = 'understand' | 'analyze' | 'plan' | 'validate' | 'execute' | 'verify'

export interface COTChecklist {
  understand: string[]
  analyze: string[]
  plan: string[]
  validate: string[]
  execute: string[]
  verify: string[]
}

export interface COTResult {
  phase: COTPhase
  confidence: number
  passed: boolean
  checklist: string[]
  notes?: string[]
  errors?: string[]
}

export interface COTExecution {
  request: string
  results: COTResult[]
  overallConfidence: number
  canProceed: boolean
  blockedBy?: COTPhase
}

/**
 * Default checklist items for each COT phase
 */
export const DEFAULT_COT_CHECKLIST: COTChecklist = {
  understand: [
    '✅ Identified all affected components',
    '✅ Mapped current vs desired state',
    '✅ Understood business impact',
    '✅ Confirmed requirements clarity'
  ],
  analyze: [
    '✅ Built complete dependency graph',
    '✅ Identified circular dependencies',
    '✅ Assessed breakage risk for each dependency',
    '✅ Documented all touch points'
  ],
  plan: [
    '✅ Generated all failure scenarios',
    '✅ Created mitigation strategies',
    '✅ Planned rollback procedures',
    '✅ Estimated resource requirements'
  ],
  validate: [
    '✅ Static analysis passed',
    '✅ Security scan passed',
    '✅ Performance review completed',
    '✅ Test coverage > 80%'
  ],
  execute: [
    '✅ All changes executed atomically',
    '✅ Pre/post conditions verified',
    '✅ No unexpected side effects',
    '✅ Complete execution log'
  ],
  verify: [
    '✅ All tests passing',
    '✅ No performance regression',
    '✅ No security vulnerabilities',
    '✅ User acceptance validated'
  ]
}

/**
 * Quality gate thresholds for each phase
 */
export const QUALITY_GATES = {
  understand: { minConfidence: 95 },
  analyze: { maxCircularDeps: 0 },
  plan: { minMitigations: 1 },
  validate: { minTestCoverage: 80 },
  execute: { requirePreconditions: true },
  verify: { maxErrors: 0 }
} as const

/**
 * COT Framework class that enforces the 6-phase process
 */
export class COTFramework {
  private execution: Partial<Record<COTPhase, COTResult>> = {}
  private request: string

  constructor(request: string) {
    this.request = request
  }

  /**
   * Phase 1: UNDERSTAND
   * Analyze the request and build understanding
   */
  async understand(
    affectedComponents: string[],
    currentState: Record<string, any>,
    desiredState: Record<string, any>,
    businessImpact: string,
    requirementsClarity: number
  ): Promise<COTResult> {
    const confidence = this.calculateUnderstandingConfidence(
      affectedComponents,
      currentState,
      desiredState,
      businessImpact,
      requirementsClarity
    )

    const checklist = DEFAULT_COT_CHECKLIST.understand.map(item => {
      if (item.includes('affected components')) {
        return affectedComponents.length > 0 ? item : item.replace('✅', '❌')
      }
      if (item.includes('current vs desired')) {
        return Object.keys(currentState).length > 0 && Object.keys(desiredState).length > 0
          ? item : item.replace('✅', '❌')
      }
      if (item.includes('business impact')) {
        return businessImpact ? item : item.replace('✅', '❌')
      }
      if (item.includes('requirements clarity')) {
        return requirementsClarity >= 0.8 ? item : item.replace('✅', '❌')
      }
      return item
    })

    const passed = confidence >= QUALITY_GATES.understand.minConfidence

    const result: COTResult = {
      phase: 'understand',
      confidence,
      passed,
      checklist
    }

    if (!passed) {
      result.errors = [
        `Confidence ${confidence}% is below threshold of ${QUALITY_GATES.understand.minConfidence}%`
      ]
    }

    this.execution.understand = result
    return result
  }

  /**
   * Phase 2: ANALYZE
   * Build dependency graph and assess risks
   */
  async analyze(
    dependencies: Array<{ from: string; to: string; type: string }>,
    circularDeps: string[][],
    breakageRisks: Record<string, number>
  ): Promise<COTResult> {
    const circularDepCount = circularDeps.length
    const passed = circularDepCount <= QUALITY_GATES.analyze.maxCircularDeps

    const checklist = DEFAULT_COT_CHECKLIST.analyze.map(item => {
      if (item.includes('dependency graph')) {
        return dependencies.length > 0 ? item : item.replace('✅', '❌')
      }
      if (item.includes('circular dependencies')) {
        return circularDepCount === 0 ? item : item.replace('✅', '❌')
      }
      if (item.includes('breakage risk')) {
        return Object.keys(breakageRisks).length > 0 ? item : item.replace('✅', '❌')
      }
      if (item.includes('touch points')) {
        return dependencies.length > 0 ? item : item.replace('✅', '❌')
      }
      return item
    })

    const confidence = this.calculateAnalysisConfidence(dependencies, circularDeps, breakageRisks)

    const result: COTResult = {
      phase: 'analyze',
      confidence,
      passed,
      checklist
    }

    if (!passed) {
      result.errors = [
        `Found ${circularDepCount} circular dependencies (max allowed: ${QUALITY_GATES.analyze.maxCircularDeps})`
      ]
    }

    this.execution.analyze = result
    return result
  }

  /**
   * Phase 3: PLAN
   * Generate failure scenarios and mitigation strategies
   */
  async plan(
    failureScenarios: Array<{ scenario: string; probability: number; impact: string }>,
    mitigations: Array<{ scenario: string; strategy: string }>,
    rollbackPlan: string,
    resourceEstimate: { time: number; cost: number }
  ): Promise<COTResult> {
    const hasMitigations = mitigations.length >= QUALITY_GATES.plan.minMitigations
    const passed = hasMitigations && !!rollbackPlan

    const checklist = DEFAULT_COT_CHECKLIST.plan.map(item => {
      if (item.includes('failure scenarios')) {
        return failureScenarios.length > 0 ? item : item.replace('✅', '❌')
      }
      if (item.includes('mitigation strategies')) {
        return hasMitigations ? item : item.replace('✅', '❌')
      }
      if (item.includes('rollback procedures')) {
        return !!rollbackPlan ? item : item.replace('✅', '❌')
      }
      if (item.includes('resource requirements')) {
        return resourceEstimate.time > 0 ? item : item.replace('✅', '❌')
      }
      return item
    })

    const confidence = this.calculatePlanningConfidence(
      failureScenarios,
      mitigations,
      rollbackPlan,
      resourceEstimate
    )

    const result: COTResult = {
      phase: 'plan',
      confidence,
      passed,
      checklist
    }

    if (!passed) {
      result.errors = [
        `Only ${mitigations.length} mitigations found (minimum required: ${QUALITY_GATES.plan.minMitigations})`
      ]
    }

    this.execution.plan = result
    return result
  }

  /**
   * Phase 4: VALIDATE
   * Run static analysis, security scans, and test coverage checks
   */
  async validate(
    staticAnalysisPassed: boolean,
    securityScanPassed: boolean,
    performanceReviewPassed: boolean,
    testCoverage: number
  ): Promise<COTResult> {
    const coveragePassed = testCoverage >= QUALITY_GATES.validate.minTestCoverage
    const passed = staticAnalysisPassed && securityScanPassed && performanceReviewPassed && coveragePassed

    const checklist = DEFAULT_COT_CHECKLIST.validate.map(item => {
      if (item.includes('Static analysis')) {
        return staticAnalysisPassed ? item : item.replace('✅', '❌')
      }
      if (item.includes('Security scan')) {
        return securityScanPassed ? item : item.replace('✅', '❌')
      }
      if (item.includes('Performance review')) {
        return performanceReviewPassed ? item : item.replace('✅', '❌')
      }
      if (item.includes('Test coverage')) {
        return coveragePassed ? item : item.replace('✅', '❌')
      }
      return item
    })

    const confidence = this.calculateValidationConfidence(
      staticAnalysisPassed,
      securityScanPassed,
      performanceReviewPassed,
      testCoverage
    )

    const result: COTResult = {
      phase: 'validate',
      confidence,
      passed,
      checklist
    }

    if (!passed) {
      const errors: string[] = []
      if (!staticAnalysisPassed) errors.push('Static analysis failed')
      if (!securityScanPassed) errors.push('Security scan failed')
      if (!performanceReviewPassed) errors.push('Performance review failed')
      if (!coveragePassed) {
        errors.push(`Test coverage ${testCoverage}% is below threshold of ${QUALITY_GATES.validate.minTestCoverage}%`)
      }
      result.errors = errors
    }

    this.execution.validate = result
    return result
  }

  /**
   * Phase 5: EXECUTE
   * Execute changes atomically with pre/post condition checks
   */
  async execute(
    changesExecuted: boolean,
    preConditionsMet: boolean,
    postConditionsMet: boolean,
    sideEffects: string[]
  ): Promise<COTResult> {
    const noUnexpectedSideEffects = sideEffects.length === 0
    const passed = changesExecuted && preConditionsMet && postConditionsMet && noUnexpectedSideEffects

    const checklist = DEFAULT_COT_CHECKLIST.execute.map(item => {
      if (item.includes('executed atomically')) {
        return changesExecuted ? item : item.replace('✅', '❌')
      }
      if (item.includes('Pre/post conditions')) {
        return preConditionsMet && postConditionsMet ? item : item.replace('✅', '❌')
      }
      if (item.includes('side effects')) {
        return noUnexpectedSideEffects ? item : item.replace('✅', '❌')
      }
      if (item.includes('execution log')) {
        return changesExecuted ? item : item.replace('✅', '❌')
      }
      return item
    })

    const confidence = this.calculateExecutionConfidence(
      changesExecuted,
      preConditionsMet,
      postConditionsMet,
      sideEffects
    )

    const result: COTResult = {
      phase: 'execute',
      confidence,
      passed,
      checklist
    }

    if (!passed) {
      const errors: string[] = []
      if (!changesExecuted) errors.push('Changes not executed')
      if (!preConditionsMet) errors.push('Pre-conditions not met')
      if (!postConditionsMet) errors.push('Post-conditions not met')
      if (!noUnexpectedSideEffects) {
        errors.push(`Unexpected side effects: ${sideEffects.join(', ')}`)
      }
      result.errors = errors
    }

    this.execution.execute = result
    return result
  }

  /**
   * Phase 6: VERIFY
   * Verify all tests pass and no regressions
   */
  async verify(
    testsPassing: boolean,
    performanceRegression: boolean,
    securityVulnerabilities: string[],
    userAcceptance: boolean
  ): Promise<COTResult> {
    const noRegressions = !performanceRegression
    const noSecurityIssues = securityVulnerabilities.length === 0
    const maxErrors = 0
    const errorCount = (testsPassing ? 0 : 1) + (noRegressions ? 0 : 1) + securityVulnerabilities.length
    const passed = testsPassing && noRegressions && noSecurityIssues && userAcceptance && errorCount <= maxErrors

    const checklist = DEFAULT_COT_CHECKLIST.verify.map(item => {
      if (item.includes('tests passing')) {
        return testsPassing ? item : item.replace('✅', '❌')
      }
      if (item.includes('performance regression')) {
        return noRegressions ? item : item.replace('✅', '❌')
      }
      if (item.includes('security vulnerabilities')) {
        return noSecurityIssues ? item : item.replace('✅', '❌')
      }
      if (item.includes('User acceptance')) {
        return userAcceptance ? item : item.replace('✅', '❌')
      }
      return item
    })

    const confidence = this.calculateVerificationConfidence(
      testsPassing,
      performanceRegression,
      securityVulnerabilities,
      userAcceptance
    )

    const result: COTResult = {
      phase: 'verify',
      confidence,
      passed,
      checklist
    }

    if (!passed) {
      const errors: string[] = []
      if (!testsPassing) errors.push('Tests are failing')
      if (performanceRegression) errors.push('Performance regression detected')
      if (!noSecurityIssues) {
        errors.push(`Security vulnerabilities found: ${securityVulnerabilities.join(', ')}`)
      }
      if (!userAcceptance) errors.push('User acceptance not validated')
      result.errors = errors
    }

    this.execution.verify = result
    return result
  }

  /**
   * Get the complete execution result
   */
  getExecution(): COTExecution {
    const results = Object.values(this.execution) as COTResult[]
    const overallConfidence = this.calculateOverallConfidence(results)
    
    // Check if any phase failed
    const failedPhase = results.find(r => !r.passed)
    const canProceed = !failedPhase && results.length === 6

    return {
      request: this.request,
      results,
      overallConfidence,
      canProceed,
      blockedBy: failedPhase?.phase
    }
  }

  /**
   * Check if execution can proceed to next phase
   */
  canProceedToPhase(phase: COTPhase): boolean {
    const phaseOrder: COTPhase[] = ['understand', 'analyze', 'plan', 'validate', 'execute', 'verify']
    const currentIndex = phaseOrder.indexOf(phase)
    
    if (currentIndex === 0) return true // Can always start with understand
    
    // Check if previous phase passed
    const previousPhase = phaseOrder[currentIndex - 1]
    const previousResult = this.execution[previousPhase]
    
    return previousResult?.passed ?? false
  }

  // Private helper methods for confidence calculation

  private calculateUnderstandingConfidence(
    components: string[],
    current: Record<string, any>,
    desired: Record<string, any>,
    impact: string,
    clarity: number
  ): number {
    let confidence = 50 // Base confidence
    
    if (components.length > 0) confidence += 10
    if (Object.keys(current).length > 0) confidence += 10
    if (Object.keys(desired).length > 0) confidence += 10
    if (impact) confidence += 10
    confidence += clarity * 10
    
    return Math.min(100, Math.max(0, confidence))
  }

  private calculateAnalysisConfidence(
    deps: Array<{ from: string; to: string }>,
    circular: string[][],
    risks: Record<string, number>
  ): number {
    let confidence = 60 // Base confidence
    
    if (deps.length > 0) confidence += 10
    if (circular.length === 0) confidence += 15
    if (Object.keys(risks).length > 0) confidence += 15
    
    return Math.min(100, Math.max(0, confidence))
  }

  private calculatePlanningConfidence(
    scenarios: Array<{ probability: number }>,
    mitigations: Array<{ strategy: string }>,
    rollback: string,
    resources: { time: number; cost: number }
  ): number {
    let confidence = 50 // Base confidence
    
    if (scenarios.length > 0) confidence += 15
    if (mitigations.length > 0) confidence += 15
    if (rollback) confidence += 10
    if (resources.time > 0) confidence += 10
    
    return Math.min(100, Math.max(0, confidence))
  }

  private calculateValidationConfidence(
    staticAnalysis: boolean,
    securityScan: boolean,
    performance: boolean,
    coverage: number
  ): number {
    let confidence = 40 // Base confidence
    
    if (staticAnalysis) confidence += 20
    if (securityScan) confidence += 20
    if (performance) confidence += 10
    confidence += (coverage / 100) * 10
    
    return Math.min(100, Math.max(0, confidence))
  }

  private calculateExecutionConfidence(
    executed: boolean,
    pre: boolean,
    post: boolean,
    sideEffects: string[]
  ): number {
    let confidence = 30 // Base confidence
    
    if (executed) confidence += 30
    if (pre) confidence += 15
    if (post) confidence += 15
    if (sideEffects.length === 0) confidence += 10
    
    return Math.min(100, Math.max(0, confidence))
  }

  private calculateVerificationConfidence(
    tests: boolean,
    regression: boolean,
    vulnerabilities: string[],
    acceptance: boolean
  ): number {
    let confidence = 40 // Base confidence
    
    if (tests) confidence += 25
    if (!regression) confidence += 15
    if (vulnerabilities.length === 0) confidence += 10
    if (acceptance) confidence += 10
    
    return Math.min(100, Math.max(0, confidence))
  }

  private calculateOverallConfidence(results: COTResult[]): number {
    if (results.length === 0) return 0
    
    const sum = results.reduce((acc, r) => acc + r.confidence, 0)
    return Math.round(sum / results.length)
  }
}

/**
 * Factory function to create a new COT execution
 */
export function createCOTExecution(request: string): COTFramework {
  return new COTFramework(request)
}
