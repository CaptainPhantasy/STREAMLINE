// File: lib/llm/types.ts

/**
 * Type definitions for the LLM intent mapping and workflow execution system
 */

export interface WorkflowStep {
  id?: string        // Added for tracking
  tool: string
  description: string
  // CRITICAL ADDITIONS FOR EXECUTOR:
  endpoint: string   // e.g., "mcp:get_dashboard_stats" or "/api/financials"
  method: string     // "GET" | "POST"
  parameters?: StepParameter[]  // Array of parameters instead of Record
  optional?: boolean // For error handling
  dependencies?: string[]
}

export interface StepParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required?: boolean
  defaultValue?: any
  description?: string
  pattern?: string // For string validation
  min?: number    // For number validation
  max?: number    // For number validation
}

export interface WorkflowDefinition {
  id: string
  description: string
  steps: WorkflowStep[]
}

export interface ExecutionContext {
  userId: string
  accountId: string
  userRole: string
  permissions: string[]
  authHeader?: string
  authToken?: string
}

export interface IntentClassificationResult {
  workflow: WorkflowDefinition
  confidence: number
  variables: Record<string, any>
  missingInfo?: string[]
}

export interface WorkflowExecution {
  workflow: WorkflowDefinition
  context: ExecutionContext
  inputVariables: Record<string, any>
  stepVariables: Record<string, any>
  currentStep: number
  stepResults: any[]
}

export interface WorkflowError extends Error {
  workflowId: string
  stepId?: string
  recoverable?: boolean
}
