/**
 * Agent Coordinator
 * 
 * Manages agent lifecycle: creation, execution, monitoring, cleanup
 */

import { BaseAgent, AgentConfig, AgentResult } from '../shared/base-agent'
import { getCredentialStore } from '../shared/credential-store'

export type AgentType = 'bug-hunter' | 'code-smith' | 'migrator' | 'stage-agent'

export interface AgentPool {
  agents: Map<string, BaseAgent>
  activeTasks: Map<string, Promise<AgentResult>>
}

/**
 * Agent Coordinator class
 */
export class AgentCoordinator {
  private pool: AgentPool = {
    agents: new Map(),
    activeTasks: new Map()
  }
  private credentialStore = getCredentialStore()

  /**
   * Create and spin up an agent
   */
  async spinUpAgent(type: AgentType, taskId: string): Promise<BaseAgent> {
    // Check if agent already exists for this task
    if (this.pool.agents.has(taskId)) {
      return this.pool.agents.get(taskId)!
    }

    // Get credentials
    const credentials = this.credentialStore.getCredentialsForAgent('you')

    // Create agent config
    const config: AgentConfig = {
      id: `${type}-${taskId}-${Date.now()}`,
      name: this.getAgentName(type),
      credentials,
      userId: undefined // Will be set by orchestrator if needed
    }

    // Import and create agent based on type
    let agent: BaseAgent
    switch (type) {
      case 'bug-hunter':
        const { BugHunterAgent } = await import('../bug-hunter')
        agent = new BugHunterAgent(config)
        break
      case 'code-smith':
        const { CodeSmithAgent } = await import('../code-smith')
        agent = new CodeSmithAgent(config)
        break
      case 'migrator':
        const { MigratorAgent } = await import('../migrator')
        agent = new MigratorAgent(config)
        break
      case 'stage-agent':
        const { StageAgent } = await import('../stage-agent')
        agent = new StageAgent(config)
        break
      default:
        throw new Error(`Unknown agent type: ${type}`)
    }

    // Store agent in pool
    this.pool.agents.set(taskId, agent)

    return agent
  }

  /**
   * Execute agent task
   */
  async executeAgentTask(
    agent: BaseAgent,
    request: string,
    context?: Record<string, any>
  ): Promise<AgentResult> {
    const taskId = agent.getId()
    
    // Check if task is already running
    if (this.pool.activeTasks.has(taskId)) {
      return await this.pool.activeTasks.get(taskId)!
    }

    // Create task promise
    const taskPromise = agent.processRequest(request, context)
    this.pool.activeTasks.set(taskId, taskPromise)

    try {
      const result = await taskPromise
      return result
    } finally {
      // Clean up task
      this.pool.activeTasks.delete(taskId)
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(taskId: string): BaseAgent | undefined {
    return this.pool.agents.get(taskId)
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): BaseAgent[] {
    return Array.from(this.pool.agents.values())
  }

  /**
   * Get active tasks count
   */
  getActiveTasksCount(): number {
    return this.pool.activeTasks.size
  }

  /**
   * Shutdown agent
   */
  async shutdownAgent(taskId: string): Promise<void> {
    // Wait for active task to complete
    if (this.pool.activeTasks.has(taskId)) {
      await this.pool.activeTasks.get(taskId)
    }

    // Remove from pool
    this.pool.agents.delete(taskId)
    this.pool.activeTasks.delete(taskId)
  }

  /**
   * Shutdown all agents
   */
  async shutdownAll(): Promise<void> {
    const tasks = Array.from(this.pool.activeTasks.values())
    await Promise.allSettled(tasks)

    this.pool.agents.clear()
    this.pool.activeTasks.clear()
  }

  /**
   * Get agent name from type
   */
  private getAgentName(type: AgentType): string {
    const names: Record<AgentType, string> = {
      'bug-hunter': 'BugHunter Agent',
      'code-smith': 'CodeSmith Agent',
      'migrator': 'Migrator Agent',
      'stage-agent': 'StageAgent'
    }
    return names[type]
  }
}

