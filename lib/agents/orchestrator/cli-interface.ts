/**
 * CLI Interface for Agent Commands
 * 
 * Parses @agent commands and routes to orchestrator
 */

import { getOrchestrator, AgentOrchestrator } from './index'
import { OrchestratorRequest } from './index'

export interface ParsedCommand {
  action: string
  args: string[]
  raw: string
}

export interface CLIResult {
  success: boolean
  message: string
  data?: any
}

/**
 * CLI Interface class
 */
export class CLIInterface {
  private orchestrator: AgentOrchestrator

  constructor() {
    this.orchestrator = getOrchestrator()
  }

  /**
   * Handle command from user
   */
  async handleCommand(command: string): Promise<CLIResult> {
    // Remove @agent prefix if present
    const cleanCommand = command.startsWith('@agent ') ? command.slice(7).trim() : command.trim()

    if (!cleanCommand) {
      return {
        success: false,
        message: 'No command provided'
      }
    }

    // Parse command
    const parsed = this.parseCommand(cleanCommand)

    try {
      switch (parsed.action) {
        case 'create':
          return await this.createTicket(parsed.args.join(' '))
        
        case 'fix':
          return await this.fixTicket(parsed.args[0])
        
        case 'generate':
          return await this.generateCode(parsed.args[0], parsed.args.slice(1))
        
        case 'deploy':
          return await this.deploy(parsed.args[0] || 'staging')
        
        case 'status':
          return await this.getStatus()
        
        case 'logs':
          return await this.getLogs(parsed.args[0])
        
        case 'health':
          return await this.healthCheck()
        
        case 'rollback':
          return await this.rollback(parsed.args[0])
        
        default:
          // Treat as natural language request
          return await this.processNaturalLanguage(cleanCommand)
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: { error }
      }
    }
  }

  /**
   * Parse command into action and args
   */
  private parseCommand(command: string): ParsedCommand {
    const parts = command.split(' ').filter(p => p.length > 0)
    const action = parts[0] || ''
    const args = parts.slice(1)

    return {
      action: action.toLowerCase(),
      args,
      raw: command
    }
  }

  /**
   * Create ticket
   */
  private async createTicket(description: string): Promise<CLIResult> {
    if (!description) {
      return {
        success: false,
        message: 'Ticket description required'
      }
    }

    const result = await this.orchestrator.processRequest({
      request: `Create ticket: ${description}`,
      user: 'you',
      priority: 'medium'
    })

    return {
      success: result.success,
      message: result.success 
        ? `Ticket created: ${result.ticketId}`
        : `Failed to create ticket: ${result.error}`,
      data: result
    }
  }

  /**
   * Fix ticket
   */
  private async fixTicket(ticketId: string): Promise<CLIResult> {
    if (!ticketId) {
      return {
        success: false,
        message: 'Ticket ID required'
      }
    }

    const result = await this.orchestrator.processRequest({
      request: `Fix ticket: ${ticketId}`,
      user: 'you',
      priority: 'high'
    })

    return {
      success: result.success,
      message: result.success
        ? `Ticket ${ticketId} fixed successfully`
        : `Failed to fix ticket: ${result.error}`,
      data: result
    }
  }

  /**
   * Generate code
   */
  private async generateCode(type: string, args: string[]): Promise<CLIResult> {
    if (!type) {
      return {
        success: false,
        message: 'Generation type required (component|api|migration)'
      }
    }

    const description = args.join(' ')
    const result = await this.orchestrator.processRequest({
      request: `Generate ${type}: ${description}`,
      user: 'you',
      priority: 'medium'
    })

    return {
      success: result.success,
      message: result.success
        ? `Generated ${type} successfully`
        : `Failed to generate ${type}: ${result.error}`,
      data: result
    }
  }

  /**
   * Deploy
   */
  private async deploy(environment: string): Promise<CLIResult> {
    const result = await this.orchestrator.processRequest({
      request: `Deploy to ${environment}`,
      user: 'you',
      priority: 'high'
    })

    return {
      success: result.success,
      message: result.success
        ? `Deployed to ${environment} successfully`
        : `Failed to deploy: ${result.error}`,
      data: result
    }
  }

  /**
   * Get status
   */
  private async getStatus(): Promise<CLIResult> {
    const status = this.orchestrator.getStatus()

    return {
      success: true,
      message: `Active agents: ${status.activeAgents}, Active tasks: ${status.activeTasks}, Queue size: ${status.queueSize}`,
      data: status
    }
  }

  /**
   * Get logs
   */
  private async getLogs(agentId?: string): Promise<CLIResult> {
    // For now, return placeholder
    // Full implementation would query log storage
    return {
      success: true,
      message: agentId 
        ? `Logs for agent ${agentId} (not yet implemented)`
        : 'All agent logs (not yet implemented)',
      data: { agentId }
    }
  }

  /**
   * Health check
   */
  private async healthCheck(): Promise<CLIResult> {
    const status = this.orchestrator.getStatus()
    const healthy = status.activeAgents >= 0 && status.activeTasks >= 0

    return {
      success: healthy,
      message: healthy 
        ? 'System healthy'
        : 'System unhealthy',
      data: {
        status,
        healthy
      }
    }
  }

  /**
   * Rollback
   */
  private async rollback(ticketId: string): Promise<CLIResult> {
    if (!ticketId) {
      return {
        success: false,
        message: 'Ticket ID required for rollback'
      }
    }

    const result = await this.orchestrator.processRequest({
      request: `Rollback ticket: ${ticketId}`,
      user: 'you',
      priority: 'critical'
    })

    return {
      success: result.success,
      message: result.success
        ? `Rolled back ticket ${ticketId} successfully`
        : `Failed to rollback: ${result.error}`,
      data: result
    }
  }

  /**
   * Process natural language request
   */
  private async processNaturalLanguage(request: string): Promise<CLIResult> {
    const result = await this.orchestrator.processRequest({
      request,
      user: 'you',
      priority: 'medium'
    })

    return {
      success: result.success,
      message: result.success
        ? `Request processed: ${result.ticketId}`
        : `Failed to process request: ${result.error}`,
      data: result
    }
  }
}

/**
 * Create CLI interface instance
 */
export function createCLIInterface(): CLIInterface {
  return new CLIInterface()
}

