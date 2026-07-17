/**
 * Base Agent Class
 * 
 * All specialist agents extend this base class.
 * Provides common functionality and COT framework integration.
 */

import { COTFramework, createCOTExecution } from './cot-framework'
import { MCPClient } from './mcp-client'
import { SupabaseAdminClient } from './supabase-admin'
import { AgentNotificationService } from './notification'

export interface AgentConfig {
  id: string
  name: string
  credentials: {
    serviceRoleKey: string
    resendApiKey: string
    supabaseUrl: string
  }
  userId?: string
}

export interface AgentResult {
  success: boolean
  agentId: string
  phase: string
  data?: any
  error?: string
  cotExecution?: ReturnType<COTFramework['getExecution']>
}

/**
 * Base Agent class that all specialist agents extend
 */
export abstract class BaseAgent {
  protected id: string
  protected name: string
  protected cot: COTFramework | null = null
  protected mcpClient: MCPClient
  protected supabaseAdmin: SupabaseAdminClient
  protected notificationService: AgentNotificationService
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    this.id = config.id
    this.name = config.name
    this.config = config

    // Initialize shared services
    this.mcpClient = new MCPClient({
      serviceRoleKey: config.credentials.serviceRoleKey,
      userId: config.userId
    })

    this.supabaseAdmin = new SupabaseAdminClient({
      serviceRoleKey: config.credentials.serviceRoleKey,
      supabaseUrl: config.credentials.supabaseUrl
    })

    this.notificationService = new AgentNotificationService({
      resendApiKey: config.credentials.resendApiKey
    })
  }

  /**
   * Initialize COT framework for a new request
   */
  protected initializeCOT(request: string): void {
    this.cot = createCOTExecution(request)
  }

  /**
   * Get current COT execution state
   */
  protected getCOTFramework(): COTFramework {
    if (!this.cot) {
      throw new Error('COT framework not initialized. Call initializeCOT() first.')
    }
    return this.cot
  }

  protected getCOTExecution(): ReturnType<COTFramework['getExecution']> {
    return this.getCOTFramework().getExecution()
  }

  /**
   * Check if can proceed to next COT phase
   */
  protected canProceedToPhase(phase: 'analyze' | 'plan' | 'validate' | 'execute' | 'verify'): boolean {
    if (!this.cot) {
      return false
    }
    return this.cot.canProceedToPhase(phase)
  }

  /**
   * Log agent activity
   */
  protected log(message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${this.name.toUpperCase()}] ${message}`, data || '')
  }

  /**
   * Send status update notification
   */
  protected async sendStatusUpdate(recipient: string, phase: string, progress: number, message: string): Promise<void> {
    await this.notificationService.sendStatusUpdate(recipient, {
      agentId: this.id,
      phase,
      progress,
      message
    })
  }

  /**
   * Send error alert
   */
  protected async sendErrorAlert(recipient: string, error: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: Record<string, any>): Promise<void> {
    await this.notificationService.sendErrorAlert(recipient, {
      agentId: this.id,
      error,
      severity,
      context
    })
  }

  /**
   * Abstract method that each agent must implement
   */
  abstract processRequest(request: string, context?: Record<string, any>): Promise<AgentResult>

  /**
   * Get agent ID
   */
  getId(): string {
    return this.id
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.name
  }

  /**
   * Get MCP client
   */
  getMCPClient(): MCPClient {
    return this.mcpClient
  }

  /**
   * Get Supabase admin client
   */
  getSupabaseAdmin(): SupabaseAdminClient {
    return this.supabaseAdmin
  }

  /**
   * Get notification service
   */
  getNotificationService(): AgentNotificationService {
    return this.notificationService
  }
}
