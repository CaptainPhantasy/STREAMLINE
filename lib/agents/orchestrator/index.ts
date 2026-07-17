/**
 * Agent Orchestrator
 * 
 * Main coordinator that processes requests, spins up agents, and manages execution flow
 */

import { AgentCoordinator, AgentType } from './agent-coordinator'
import { TaskQueue, Task } from './task-queue'
import { BaseAgent, AgentResult } from '../shared/base-agent'
import { getCredentialStore } from '../shared/credential-store'
import { createCOTExecution } from '../shared/cot-framework'

export interface OrchestratorRequest {
  request: string
  user: 'you'
  priority?: 'critical' | 'high' | 'medium' | 'low'
  context?: Record<string, any>
}

export interface OrchestratorResult {
  success: boolean
  ticketId: string
  agents: Array<{
    type: AgentType
    id: string
    result: AgentResult
  }>
  cotExecution?: ReturnType<ReturnType<typeof createCOTExecution>['getExecution']>
  error?: string
}

/**
 * Agent Orchestrator class
 */
export class AgentOrchestrator {
  private coordinator: AgentCoordinator
  private taskQueue: TaskQueue
  private credentialStore = getCredentialStore()

  constructor() {
    this.coordinator = new AgentCoordinator()
    this.taskQueue = new TaskQueue({ maxConcurrentTasks: 5 })
  }

  /**
   * Process a request from the user
   */
  async processRequest(request: OrchestratorRequest): Promise<OrchestratorResult> {
    const ticketId = this.generateTicketId()
    
    this.log(`[ORCHESTRATOR] ✓ Ticket received: ${ticketId}`)
    this.log(`[ORCHESTRATOR] Analyzing requirements...`)

    try {
      // COT Phase 1: Understand
      const cot = createCOTExecution(request.request)
      const understanding = await this.understandRequest(request, cot)
      
      this.log(`[ORCHESTRATOR] Understanding: ${understanding.confidence}% confidence`)

      if (!understanding.passed) {
        return {
          success: false,
          ticketId,
          agents: [],
          cotExecution: cot.getExecution(),
          error: `Understanding phase failed: ${understanding.errors?.join(', ')}`
        }
      }

      // Determine required agents
      const requiredAgents = this.determineAgents(request.request)
      this.log(`[ORCHESTRATOR] Spinning up specialist agents:`)
      requiredAgents.forEach(type => {
        this.log(`  - ${this.getAgentDisplayName(type)}`)
      })

      // Spin up agents
      const agentPool = await this.spinUpAgents(requiredAgents, ticketId)

      // Coordinate execution
      const results = await this.coordinateExecution(agentPool, request, ticketId, cot)

      // Generate result
      const result: OrchestratorResult = {
        success: results.every(r => r.result.success),
        ticketId,
        agents: results,
        cotExecution: cot.getExecution()
      }

      // Report result
      this.reportResult(result)

      return result
    } catch (error) {
      return {
        success: false,
        ticketId,
        agents: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * COT Phase 1: Understand the request
   */
  private async understandRequest(
    request: OrchestratorRequest,
    cot: ReturnType<typeof createCOTExecution>
  ): Promise<{ confidence: number; passed: boolean; errors?: string[] }> {
    // Analyze request to identify components
    const affectedComponents = this.identifyComponents(request.request)
    const currentState = {} // Would be populated by analyzing codebase
    const desiredState = {} // Would be populated by understanding request
    const businessImpact = this.assessBusinessImpact(request.request)
    const requirementsClarity = this.assessRequirementsClarity(request.request)

    const result = await cot.understand(
      affectedComponents,
      currentState,
      desiredState,
      businessImpact,
      requirementsClarity
    )

    return {
      confidence: result.confidence,
      passed: result.passed,
      errors: result.errors
    }
  }

  /**
   * Determine which agents are needed for the request
   */
  private determineAgents(request: string): AgentType[] {
    const agents: AgentType[] = []
    const lowerRequest = request.toLowerCase()

    // Bug fixing
    if (lowerRequest.includes('bug') || lowerRequest.includes('fix') || lowerRequest.includes('error')) {
      agents.push('bug-hunter')
    }

    // Code generation
    if (lowerRequest.includes('generate') || lowerRequest.includes('create') || lowerRequest.includes('component') || lowerRequest.includes('api')) {
      agents.push('code-smith')
    }

    // Database migration
    if (lowerRequest.includes('migrate') || lowerRequest.includes('schema') || lowerRequest.includes('database')) {
      agents.push('migrator')
    }

    // Deployment/staging
    if (lowerRequest.includes('deploy') || lowerRequest.includes('stage') || lowerRequest.includes('staging')) {
      agents.push('stage-agent')
    }

    // Default: if no specific agent identified, use bug-hunter and code-smith
    if (agents.length === 0) {
      agents.push('bug-hunter', 'code-smith')
    }

    return agents
  }

  /**
   * Spin up required agents
   */
  private async spinUpAgents(types: AgentType[], ticketId: string): Promise<BaseAgent[]> {
    const agents: BaseAgent[] = []

    for (const type of types) {
      const agent = await this.coordinator.spinUpAgent(type, `${ticketId}-${type}`)
      agents.push(agent)
      this.log(`[ORCHESTRATOR] ✓ ${this.getAgentDisplayName(type)} spun up (${agent.getId()})`)
    }

    return agents
  }

  /**
   * Coordinate execution across agents
   */
  private async coordinateExecution(
    agents: BaseAgent[],
    request: OrchestratorRequest,
    ticketId: string,
    cot: ReturnType<typeof createCOTExecution>
  ): Promise<Array<{ type: AgentType; id: string; result: AgentResult }>> {
    const results: Array<{ type: AgentType; id: string; result: AgentResult }> = []

    // Execute agents in parallel
    const executions = agents.map(async agent => {
      const agentType = this.getAgentTypeFromId(agent.getId())
      const result = await this.coordinator.executeAgentTask(agent, request.request, request.context)
      
      this.log(`[${agent.getName().toUpperCase()}] ✓ ${result.phase}: ${result.success ? 'Success' : 'Failed'}`)
      if (result.error) {
        this.log(`[${agent.getName().toUpperCase()}] Error: ${result.error}`)
      }

      return {
        type: agentType,
        id: agent.getId(),
        result
      }
    })

    const settledResults = await Promise.allSettled(executions)
    
    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        results.push(settled.value)
      } else {
        this.log(`[ORCHESTRATOR] Agent execution failed: ${settled.reason}`)
      }
    }

    return results
  }

  /**
   * Report result to user
   */
  private reportResult(result: OrchestratorResult): void {
    if (result.success) {
      this.log(`[ORCHESTRATOR] ✓ All agents completed successfully`)
    } else {
      this.log(`[ORCHESTRATOR] ⚠ Some agents failed`)
    }

    // Log COT execution summary
    if (result.cotExecution) {
      this.log(`[ORCHESTRATOR] Overall confidence: ${result.cotExecution.overallConfidence}%`)
      if (!result.cotExecution.canProceed) {
        this.log(`[ORCHESTRATOR] Blocked by phase: ${result.cotExecution.blockedBy}`)
      }
    }
  }

  /**
   * Generate unique ticket ID
   */
  private generateTicketId(): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `TICKET-${timestamp}-${random}`
  }

  /**
   * Identify affected components from request
   */
  private identifyComponents(request: string): string[] {
    const components: string[] = []
    const lowerRequest = request.toLowerCase()

    // Common component patterns
    if (lowerRequest.includes('api')) components.push('api')
    if (lowerRequest.includes('component')) components.push('components')
    if (lowerRequest.includes('page')) components.push('pages')
    if (lowerRequest.includes('database') || lowerRequest.includes('migration')) components.push('database')
    if (lowerRequest.includes('auth')) components.push('authentication')
    if (lowerRequest.includes('email')) components.push('email')

    return components.length > 0 ? components : ['unknown']
  }

  /**
   * Assess business impact
   */
  private assessBusinessImpact(request: string): string {
    const lowerRequest = request.toLowerCase()
    
    if (lowerRequest.includes('critical') || lowerRequest.includes('urgent')) {
      return 'High - Critical issue affecting production'
    }
    if (lowerRequest.includes('bug') || lowerRequest.includes('error')) {
      return 'Medium - Bug fix required'
    }
    if (lowerRequest.includes('feature') || lowerRequest.includes('enhancement')) {
      return 'Low - Feature enhancement'
    }
    
    return 'Unknown - Impact assessment needed'
  }

  /**
   * Assess requirements clarity
   */
  private assessRequirementsClarity(request: string): number {
    // Simple heuristic: longer requests with specific terms are clearer
    const hasSpecificTerms = /\b(create|fix|update|delete|generate|migrate)\b/i.test(request)
    const hasFileReferences = /\b(file|component|api|endpoint|migration)\b/i.test(request)
    const lengthScore = Math.min(request.length / 100, 1)
    
    let clarity = 0.5 // Base clarity
    
    if (hasSpecificTerms) clarity += 0.2
    if (hasFileReferences) clarity += 0.2
    clarity += lengthScore * 0.1
    
    return Math.min(1, clarity)
  }

  /**
   * Get agent display name
   */
  private getAgentDisplayName(type: AgentType): string {
    const names: Record<AgentType, string> = {
      'bug-hunter': 'BugHunter Agent (Analysis & Fix Generation)',
      'code-smith': 'CodeSmith Agent (Code Generation)',
      'migrator': 'Migrator Agent (Database Operations)',
      'stage-agent': 'StageAgent (Deployment)'
    }
    return names[type]
  }

  /**
   * Get agent type from agent ID
   */
  private getAgentTypeFromId(id: string): AgentType {
    if (id.includes('bug-hunter')) return 'bug-hunter'
    if (id.includes('code-smith')) return 'code-smith'
    if (id.includes('migrator')) return 'migrator'
    if (id.includes('stage-agent')) return 'stage-agent'
    return 'bug-hunter' // Default
  }

  /**
   * Log message
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${message}`)
  }

  /**
   * Get orchestrator status
   */
  getStatus(): {
    activeAgents: number
    activeTasks: number
    queueSize: number
  } {
    return {
      activeAgents: this.coordinator.getActiveAgents().length,
      activeTasks: this.coordinator.getActiveTasksCount(),
      queueSize: this.taskQueue.size()
    }
  }
}

/**
 * Singleton instance
 */
let orchestratorInstance: AgentOrchestrator | null = null

/**
 * Get orchestrator instance
 */
export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator()
  }
  return orchestratorInstance
}

