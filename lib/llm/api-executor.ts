/**
 * API Executor - Authenticated Workflow Execution Engine
 *
 * Executes mapped intents with proper authentication, validation, and error handling.
 * Integrates with the existing LLM Router for optimal cost and performance.
 */

import { createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// FIXED: Adjusted import path to point to the correct location
import { getMCPLLMHelper } from '../mcp/llm/router-helper'
import type {
  WorkflowExecution,
  WorkflowStep,
  ExecutionContext,
  StepParameter,
  WorkflowError
} from './types'

// ================================================================
// Execution Configuration
// ================================================================

export interface ExecutionConfig {
  /** Maximum time per step in milliseconds */
  stepTimeoutMs: number
  /** Maximum total workflow time in milliseconds */
  workflowTimeoutMs: number
  /** Whether to continue on non-critical errors */
  continueOnError: boolean
  /** Retry attempts for failed steps */
  maxRetries: number
  /** Delay between retries in milliseconds */
  retryDelayMs: number
}

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  stepTimeoutMs: 30000,      // 30 seconds per step
  workflowTimeoutMs: 300000, // 5 minutes total
  continueOnError: false,
  maxRetries: 3,
  retryDelayMs: 1000
}

// ================================================================
// Step Execution Result
// ================================================================

export interface StepResult {
  /** The step that was executed */
  step: WorkflowStep
  /** Whether the step succeeded */
  success: boolean
  /** Response data from the API */
  data?: any
  /** Error information if failed */
  error?: {
    code: string
    message: string
    details?: any
  }
  /** Execution time in milliseconds */
  executionTime: number
  /** API response metadata */
  metadata?: {
    status: number
    headers?: Record<string, string>
    requestId?: string
  }
}

// ================================================================
// API Executor Class
// ================================================================

export class APIExecutor {
  private config: ExecutionConfig
  private mcpHelper: ReturnType<typeof getMCPLLMHelper>

  constructor(config: Partial<ExecutionConfig> = {}) {
    this.config = { ...DEFAULT_EXECUTION_CONFIG, ...config }
    this.mcpHelper = getMCPLLMHelper()
  }

  /**
   * Execute a complete workflow with all steps
   */
  async executeWorkflow(execution: WorkflowExecution): Promise<{
    success: boolean
    results: StepResult[]
    variables: Record<string, any>
    errors: string[]
  }> {
    const results: StepResult[] = []
    const errors: string[] = []
    const startTime = Date.now()

    try {
      // Check workflow timeout
      if (Date.now() - startTime > this.config.workflowTimeoutMs) {
        throw new WorkflowError('Workflow timeout exceeded', execution.workflow.id)
      }

      // Execute each step in sequence
      for (let i = 0; i < execution.workflow.steps.length; i++) {
        const step = execution.workflow.steps[i]

        try {
          // Resolve step parameters with available variables
          const resolvedParams = await this.resolveStepParameters(step, execution)

          // Execute the step
          const result = await this.executeStep(step, resolvedParams, execution.context)

          results.push(result)

          // Update execution variables with result
          if (result.success && result.data) {
            execution.stepVariables[`step_${step.id}`] = result.data
          }

          // Check if we should continue on error
          if (!result.success && !step.optional && !this.config.continueOnError) {
            errors.push(`Step ${step.id} failed: ${result.error?.message || 'Unknown error'}`)
            break
          }

        } catch (error) {
          const stepError = error as WorkflowError
          errors.push(`Step ${step.id} threw error: ${stepError.message}`)

          // Add failed result
          results.push({
            step,
            success: false,
            error: {
              code: 'STEP_EXECUTION_ERROR',
              message: stepError.message,
              details: stepError
            },
            executionTime: 0
          })

          if (!step.optional && !this.config.continueOnError) {
            break
          }
        }
      }

      // Determine overall success
      const allRequiredSuccessful = results
        .filter(r => !r.step.optional)
        .every(r => r.success)

      return {
        success: allRequiredSuccessful,
        results,
        variables: execution.stepVariables,
        errors
      }

    } catch (error) {
      errors.push(`Workflow execution failed: ${(error as Error).message}`)
      return {
        success: false,
        results,
        variables: execution.stepVariables,
        errors
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    parameters: Record<string, any>,
    context: ExecutionContext
  ): Promise<StepResult> {
    const startTime = Date.now()

    try {
      // Handle client-side vs server-side endpoints
      if (step.endpoint.startsWith('client:')) {
        return await this.executeClientStep(step, parameters, context)
      }

      // Handle MCP server endpoints
      if (step.endpoint.startsWith('mcp:')) {
        return await this.executeMCPStep(step, parameters, context)
      }

      // Handle regular API endpoints
      return await this.executeAPIStep(step, parameters, context)

    } catch (error) {
      return {
        step,
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: (error as Error).message,
          details: error
        },
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Execute regular API endpoints with authentication
   */
  private async executeAPIStep(
    step: WorkflowStep,
    parameters: Record<string, any>,
    context: ExecutionContext
  ): Promise<StepResult> {
    const startTime = Date.now()

    // Build request URL
    let url = step.endpoint
    if (step.endpoint.includes('/[')) {
      // Replace dynamic path parameters
      url = url.replace(/\[([^\]]+)\]/g, (match, param) => {
        const value = parameters[param] || this.extractFromNestedPath(parameters, param)
        if (!value) {
          throw new Error(`Missing required path parameter: ${param}`)
        }
        return encodeURIComponent(value)
      })
    }

    // Prepare request options with proper auth forwarding
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Account-ID': context.accountId,
      'X-User-Role': context.userRole,
      'X-User-ID': context.userId
    }

    // Forward authentication header for RLS compliance
    if (context.authHeader) {
      headers['Authorization'] = context.authHeader
    } else if (context.authToken) {
      headers['Authorization'] = `Bearer ${context.authToken}`
    }

    const requestOptions: RequestInit = {
      method: step.method,
      headers
    }

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(step.method) && Object.keys(parameters).length > 0) {
      // Remove path parameters from body
      const bodyParams = { ...parameters }
      step.endpoint.match(/\[([^\]]+)\]/g)?.forEach(match => {
        const param = match.slice(1, -1)
        delete bodyParams[param]
      })
      requestOptions.body = JSON.stringify(bodyParams)
    }

    // Make the request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.stepTimeoutMs)
    requestOptions.signal = controller.signal

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${url}`, requestOptions)
      clearTimeout(timeoutId)

      // Parse response
      let data: any
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Check for API errors
      if (!response.ok) {
        return {
          step,
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data?.error || data?.message || `HTTP ${response.status}`,
            details: data
          },
          data,
          executionTime: Date.now() - startTime,
          metadata: {
            status: response.status,
            requestId: response.headers.get('x-request-id') || undefined
          }
        }
      }

      return {
        step,
        success: true,
        data,
        executionTime: Date.now() - startTime,
        metadata: {
          status: response.status,
          requestId: response.headers.get('x-request-id') || undefined
        }
      }

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Step timeout after ${this.config.stepTimeoutMs}ms`)
      }

      throw error
    }
  }

  /**
   * Execute MCP server tools
   */
  private async executeMCPStep(
    step: WorkflowStep,
    parameters: Record<string, any>,
    context: ExecutionContext
  ): Promise<StepResult> {
    const startTime = Date.now()

    try {
      // Extract tool name from endpoint (format: mcp:tool_name)
      const toolName = step.endpoint.replace('mcp:', '')

      // Call MCP server via HTTP
      // TARGET: The real Supabase Cloud Edge Function
      const mcpUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mcp-server`
      const mcpHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Account-ID': context.accountId
      }

      // Forward user authentication for RLS compliance in MCP
      if (context.authHeader) {
        mcpHeaders['X-User-Authorization'] = context.authHeader
      } else if (context.authToken) {
        mcpHeaders['X-User-Authorization'] = `Bearer ${context.authToken}`
      }

      // Use service role for server-to-server but include user context
      mcpHeaders['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`

      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: mcpHeaders,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: parameters
          },
          id: Date.now()
        })
      })

      const result = await response.json()

      if (result.error) {
        return {
          step,
          success: false,
          error: {
            code: 'MCP_ERROR',
            message: result.error.message,
            details: result.error
          },
          executionTime: Date.now() - startTime
        }
      }

      return {
        step,
        success: true,
        data: result.result,
        executionTime: Date.now() - startTime
      }

    } catch (error) {
      return {
        step,
        success: false,
        error: {
          code: 'MCP_EXECUTION_ERROR',
          message: (error as Error).message
        },
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Execute client-side actions (navigation, UI triggers)
   */
  private async executeClientStep(
    step: WorkflowStep,
    parameters: Record<string, any>,
    context: ExecutionContext
  ): Promise<StepResult> {
    const startTime = Date.now()

    try {
      // Client steps are handled differently in the voice conversation provider
      // Return a structured response that will be interpreted by the client
      const clientAction = {
        type: step.endpoint.replace('client:', ''),
        parameters,
        context
      }

      return {
        step,
        success: true,
        data: clientAction,
        executionTime: Date.now() - startTime
      }

    } catch (error) {
      return {
        step,
        success: false,
        error: {
          code: 'CLIENT_ACTION_ERROR',
          message: (error as Error).message
        },
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Resolve step parameters from dependencies and input variables
   */
  private async resolveStepParameters(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<Record<string, any>> {
    const resolved: Record<string, any> = {}

    for (const param of step.parameters) {
      // Check if parameter is provided in input variables
      if (execution.inputVariables[param.name] !== undefined) {
        resolved[param.name] = execution.inputVariables[param.name]
        continue
      }

      // Check if parameter is provided in step variables (from previous steps)
      if (execution.stepVariables[param.name] !== undefined) {
        resolved[param.name] = execution.stepVariables[param.name]
        continue
      }

      // Resolve from dependencies
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          const value = this.extractFromNestedPath(execution.stepVariables, dep)
          if (value !== undefined) {
            resolved[param.name] = value
            break
          }
        }
      }

      // Use default value if available
      if (param.defaultValue !== undefined && resolved[param.name] === undefined) {
        resolved[param.name] = param.defaultValue
      }

      // Check if required parameter is missing
      if (param.required && resolved[param.name] === undefined) {
        throw new Error(`Missing required parameter: ${param.name}`)
      }

      // Validate parameter if present
      if (resolved[param.name] !== undefined) {
        this.validateParameter(param, resolved[param.name])
      }
    }

    return resolved
  }

  /**
   * Extract value from nested path like "step_create_contact.id" or "find_customer.results.0.id"
   */
  private extractFromNestedPath(obj: any, path: string): any {
    const parts = path.split('.')
    let current = obj

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }

      // Handle array indices
      if (/^\d+$/.test(part)) {
        current = current[parseInt(part)]
      } else {
        current = current[part]
      }
    }

    return current
  }

  /**
   * Validate a parameter against its schema
   */
  private validateParameter(param: StepParameter, value: any): void {
    // Type validation
    if (param.type === 'string' && typeof value !== 'string') {
      throw new Error(`Parameter ${param.name} must be a string`)
    }

    if (param.type === 'number' && typeof value !== 'number') {
      throw new Error(`Parameter ${param.name} must be a number`)
    }

    if (param.type === 'boolean' && typeof value !== 'boolean') {
      throw new Error(`Parameter ${param.name} must be a boolean`)
    }

    if (param.type === 'array' && !Array.isArray(value)) {
      throw new Error(`Parameter ${param.name} must be an array`)
    }

    // Pattern validation for strings
    if (param.type === 'string' && param.pattern && typeof value === 'string') {
      const regex = new RegExp(param.pattern)
      if (!regex.test(value)) {
        throw new Error(`Parameter ${param.name} does not match required pattern`)
      }
    }

    // Range validation for numbers
    if (param.type === 'number' && typeof value === 'number') {
      if (param.min !== undefined && value < param.min) {
        throw new Error(`Parameter ${param.name} must be at least ${param.min}`)
      }
      if (param.max !== undefined && value > param.max) {
        throw new Error(`Parameter ${param.name} must be at most ${param.max}`)
      }
    }
  }
}

// ================================================================
// WorkflowError Exception Class
// ================================================================

class WorkflowError extends Error {
  constructor(
    message: string,
    public workflowId: string,
    public stepId?: string,
    public recoverable: boolean = false
  ) {
    super(message)
    this.name = 'WorkflowError'
  }
}

// ================================================================
// Export singleton instance
// ================================================================

export const apiExecutor = new APIExecutor()

// Export types for external use
export type {
  ExecutionConfig,
  StepResult
}