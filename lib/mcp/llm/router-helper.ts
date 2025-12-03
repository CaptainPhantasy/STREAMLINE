/**
 * MCP LLM Router Helper
 *
 * Provides a helper class for MCP tools to call the centralized LLM router.
 * This enables AI-powered MCP tools that leverage the LLM routing system.
 */

export interface MCPLLMOptions {
  accountId: string
  useCase: 'draft' | 'summary' | 'complex' | 'general' | 'vision'
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  modelOverride?: string
}

export interface MCPLLMResponse {
  text: string
  model?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Helper class for MCP tools to call the LLM router
 */
export class MCPLLMHelper {
  private readonly baseUrl: string
  private readonly serviceRoleKey: string

  constructor() {
    // MCP server runs in Node.js context, can access env vars
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!this.serviceRoleKey) {
      console.warn('[MCP LLM Helper] SUPABASE_SERVICE_ROLE_KEY not set. LLM router calls will fail.')
    }
  }

  /**
   * Call the LLM router with the given options
   *
   * @param options - Configuration for the LLM call
   * @returns Response text from the LLM
   * @throws Error if the router call fails
   */
  async callRouter(options: MCPLLMOptions): Promise<string> {
    const {
      accountId,
      useCase,
      prompt,
      systemPrompt,
      maxTokens = 500,
      temperature = 0.7,
      modelOverride,
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/api/llm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          useCase,
          prompt,
          systemPrompt,
          maxTokens,
          temperature,
          modelOverride,
          stream: false, // MCP tools use non-streaming
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`LLM Router failed (${response.status}): ${errorText}`)
      }

      const result = await response.json()

      // Handle error response
      if (result.error) {
        throw new Error(`LLM Router error: ${result.error}`)
      }

      return result.text || result.content || ''
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[MCP LLM Helper] Router call failed:', message)
      throw new Error(`Failed to call LLM router: ${message}`)
    }
  }

  /**
   * Call the router with full response (including metadata)
   *
   * @param options - Configuration for the LLM call
   * @returns Full response including text and metadata
   */
  async callRouterFull(options: MCPLLMOptions): Promise<MCPLLMResponse> {
    const {
      accountId,
      useCase,
      prompt,
      systemPrompt,
      maxTokens = 500,
      temperature = 0.7,
      modelOverride,
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/api/llm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          useCase,
          prompt,
          systemPrompt,
          maxTokens,
          temperature,
          modelOverride,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`LLM Router failed (${response.status}): ${errorText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(`LLM Router error: ${result.error}`)
      }

      return {
        text: result.text || result.content || '',
        model: result.model,
        usage: result.usage,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[MCP LLM Helper] Router call failed:', message)
      throw new Error(`Failed to call LLM router: ${message}`)
    }
  }

  /**
   * Validate that the helper is properly configured
   *
   * @returns true if configured, false otherwise
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.serviceRoleKey)
  }

  /**
   * Get configuration status for debugging
   */
  getStatus(): { baseUrl: string; hasServiceKey: boolean } {
    return {
      baseUrl: this.baseUrl,
      hasServiceKey: !!this.serviceRoleKey,
    }
  }
}

/**
 * Singleton instance of the helper
 */
let helperInstance: MCPLLMHelper | null = null

/**
 * Get or create the singleton helper instance
 */
export function getMCPLLMHelper(): MCPLLMHelper {
  if (!helperInstance) {
    helperInstance = new MCPLLMHelper()
  }
  return helperInstance
}
