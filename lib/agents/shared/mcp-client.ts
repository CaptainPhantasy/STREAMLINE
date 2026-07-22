/**
 * MCP Client for Agent Operations
 * 
 * Provides a wrapper around the MCP server for agent use.
 * Handles tool execution, discovery, and error handling.
 */

import { handleMCPRequest } from '../../mcp/server'

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}

export interface MCPToolResult {
  success: boolean
  data?: any
  error?: string
  toolName: string
}

export interface MCPClientOptions {
  serviceRoleKey: string
  userId?: string
}

/**
 * MCP Client class for agent operations
 */
export class MCPClient {
  private serviceRoleKey: string
  private userId?: string
  private availableTools: MCPTool[] = []
  private toolCache: Map<string, MCPTool> = new Map()

  constructor(options: MCPClientOptions) {
    this.serviceRoleKey = options.serviceRoleKey
    this.userId = options.userId
  }

  /**
   * Execute an MCP tool
   */
  async executeTool(toolName: string, params: Record<string, any>): Promise<MCPToolResult> {
    try {
      // Validate tool exists
      const tool = await this.getTool(toolName)
      if (!tool) {
        return {
          success: false,
          toolName,
          error: `Tool '${toolName}' not found`
        }
      }

      // Validate parameters against schema
      const validationError = this.validateParams(params, tool.inputSchema)
      if (validationError) {
        return {
          success: false,
          toolName,
          error: `Invalid parameters: ${validationError}`
        }
      }

      // Execute tool via MCP server
      const request = {
        jsonrpc: '2.0' as const,
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      }

      const response = await handleMCPRequest(request, this.userId)

      if ('error' in response) {
        return {
          success: false,
          toolName,
          error: response.error.message || 'Tool execution failed'
        }
      }

      return {
        success: true,
        toolName,
        data: response.result
      }
    } catch (error) {
      return {
        success: false,
        toolName,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Discover all available MCP tools
   */
  async discoverTools(): Promise<MCPTool[]> {
    try {
      const request = {
        jsonrpc: '2.0' as const,
        id: Date.now(),
        method: 'tools/list',
        params: {}
      }

      const response = await handleMCPRequest(request, this.userId)

      if ('error' in response) {
        console.error('[MCPClient] Error discovering tools:', response.error)
        return []
      }

      const payload = response.result as { tools?: MCPTool[] }
      const tools = payload.tools || []
      this.availableTools = tools
      
      // Cache tools
      tools.forEach(tool => {
        this.toolCache.set(tool.name, tool)
      })

      return tools
    } catch (error) {
      console.error('[MCPClient] Error discovering tools:', error)
      return []
    }
  }

  /**
   * Get a specific tool by name
   */
  async getTool(toolName: string): Promise<MCPTool | null> {
    // Check cache first
    if (this.toolCache.has(toolName)) {
      return this.toolCache.get(toolName)!
    }

    // Discover tools if not cached
    if (this.availableTools.length === 0) {
      await this.discoverTools()
    }

    return this.toolCache.get(toolName) || null
  }

  /**
   * List all available tool names
   */
  async listToolNames(): Promise<string[]> {
    if (this.availableTools.length === 0) {
      await this.discoverTools()
    }

    return this.availableTools.map(tool => tool.name)
  }

  /**
   * Check if a tool exists
   */
  async toolExists(toolName: string): Promise<boolean> {
    const tool = await this.getTool(toolName)
    return !!tool
  }

  /**
   * Execute tool with retry logic
   */
  async executeToolWithRetry(
    toolName: string,
    params: Record<string, any>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<MCPToolResult> {
    let lastError: MCPToolResult | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }

      const result = await this.executeTool(toolName, params)
      
      if (result.success) {
        return result
      }

      lastError = result

      // Don't retry on validation errors
      if (result.error?.includes('Invalid parameters') || result.error?.includes('not found')) {
        break
      }
    }

    return lastError || {
      success: false,
      toolName,
      error: 'Max retries exceeded'
    }
  }

  /**
   * Batch execute multiple tools
   */
  async executeToolsBatch(
    tools: Array<{ name: string; params: Record<string, any> }>
  ): Promise<MCPToolResult[]> {
    const results = await Promise.allSettled(
      tools.map(tool => this.executeTool(tool.name, tool.params))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      return {
        success: false,
        toolName: tools[index].name,
        error: result.reason?.message || 'Unknown error'
      }
    })
  }

  /**
   * Validate parameters against tool schema
   */
  private validateParams(params: Record<string, any>, schema: Record<string, any>): string | null {
    // Basic validation - check required fields
    if (schema.properties) {
      const required = schema.required || []
      for (const field of required) {
        if (!(field in params)) {
          return `Missing required field: ${field}`
        }
      }
    }

    return null
  }

  /**
   * Clear tool cache
   */
  clearCache(): void {
    this.toolCache.clear()
    this.availableTools = []
  }
}

/**
 * Factory function to create MCP client
 */
export function createMCPClient(options: MCPClientOptions): MCPClient {
  return new MCPClient(options)
}
