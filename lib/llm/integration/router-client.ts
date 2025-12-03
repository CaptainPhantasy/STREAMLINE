/**
 * LLM Router Client - Integration Helper
 *
 * Provides a standardized way to call the LLM Router from API routes.
 * Includes fallback support, error handling, and type-safe interfaces.
 *
 * @module lib/llm/integration/router-client
 */

// ================================================================
// Types & Interfaces
// ================================================================

export type UseCase = 'draft' | 'summary' | 'complex' | 'vision' | 'general' | 'voice'

export type ToolFormat =
  | { type: 'function'; function: { name: string; description: string; parameters: any } }
  | { description: string; parameters: any }

export interface RouterCallOptions {
  accountId?: string
  useCase: UseCase
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  modelOverride?: string
  stream?: boolean
  tools?: Record<string, ToolFormat>
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  maxSteps?: number
}

export interface RouterResponse {
  text?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  provider?: string
  model?: string
  cached?: boolean
  error?: string
}

// ================================================================
// Custom Error Classes
// ================================================================

export class LLMRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly context?: Record<string, any>
  ) {
    super(message)
    this.name = 'LLMRouterError'
  }
}

export class LLMRouterTimeoutError extends LLMRouterError {
  constructor(message: string = 'LLM Router request timed out', context?: Record<string, any>) {
    super(message, 408, context)
    this.name = 'LLMRouterTimeoutError'
  }
}

export class LLMRouterAuthError extends LLMRouterError {
  constructor(message: string = 'Unauthorized', context?: Record<string, any>) {
    super(message, 401, context)
    this.name = 'LLMRouterAuthError'
  }
}

// ================================================================
// LLM Router Client
// ================================================================

export class LLMRouterClient {
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(
    baseUrl?: string,
    timeout: number = 60000 // 60 seconds default
  ) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
    this.timeout = timeout
  }

  /**
   * Call the LLM Router with the given options
   *
   * @param options - Router call options
   * @param authToken - Optional authentication token (Bearer token)
   * @returns Router response (streaming or text)
   * @throws LLMRouterError if the request fails
   */
  async call(options: RouterCallOptions, authToken?: string): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseUrl}/api/llm`, {
        method: 'POST',
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)

        if (response.status === 401) {
          throw new LLMRouterAuthError('Authentication failed', { status: response.status })
        }

        throw new LLMRouterError(
          `Router failed: ${errorText}`,
          response.status,
          { useCase: options.useCase, status: response.status }
        )
      }

      return response
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new LLMRouterTimeoutError('Request timed out', {
          timeout: this.timeout,
          useCase: options.useCase
        })
      }

      if (error instanceof LLMRouterError) {
        throw error
      }

      throw new LLMRouterError(
        `Router call failed: ${error.message}`,
        undefined,
        { originalError: error, useCase: options.useCase }
      )
    }
  }

  /**
   * Call the LLM Router with automatic fallback
   *
   * If the router fails, the fallback function is called instead.
   * This ensures zero downtime during migration.
   *
   * @param options - Router call options
   * @param fallbackFn - Function to call if router fails
   * @param authToken - Optional authentication token
   * @returns Router response or fallback result
   */
  async callWithFallback<T>(
    options: RouterCallOptions,
    fallbackFn: () => Promise<T>,
    authToken?: string
  ): Promise<T> {
    try {
      const response = await this.call(options, authToken)

      // If streaming, return the response directly
      if (options.stream) {
        return response as any
      }

      // For non-streaming, parse JSON
      const data = await response.json()
      return data as any
    } catch (error) {
      console.error('LLM Router failed, using fallback:', {
        error: error instanceof Error ? error.message : String(error),
        useCase: options.useCase,
        timestamp: new Date().toISOString(),
      })

      return await fallbackFn()
    }
  }

  /**
   * Call the LLM Router and return JSON response
   *
   * @param options - Router call options
   * @param authToken - Optional authentication token
   * @returns Parsed JSON response
   * @throws LLMRouterError if request fails
   */
  async callJson(options: RouterCallOptions, authToken?: string): Promise<RouterResponse> {
    const response = await this.call(options, authToken)
    return await response.json()
  }

  /**
   * Call the LLM Router and return streaming response
   *
   * @param options - Router call options (stream must be true)
   * @param authToken - Optional authentication token
   * @returns Streaming response
   * @throws LLMRouterError if request fails
   */
  async callStream(options: RouterCallOptions, authToken?: string): Promise<Response> {
    if (!options.stream) {
      options.stream = true
    }
    return await this.call(options, authToken)
  }

  /**
   * Health check - verify router is accessible
   *
   * @param authToken - Optional authentication token
   * @returns True if router is healthy
   */
  async healthCheck(authToken?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/llm/health`, {
        method: 'GET',
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// ================================================================
// Convenience Functions
// ================================================================

/**
 * Create a router client instance
 *
 * @param baseUrl - Optional base URL (defaults to NEXT_PUBLIC_BASE_URL or localhost:3002)
 * @param timeout - Optional timeout in milliseconds (default 60000)
 * @returns LLMRouterClient instance
 */
export function createRouterClient(baseUrl?: string, timeout?: number): LLMRouterClient {
  return new LLMRouterClient(baseUrl, timeout)
}

/**
 * Quick call to LLM Router (non-streaming)
 *
 * @param options - Router call options
 * @param authToken - Optional authentication token
 * @returns RouterResponse
 */
export async function routerCall(
  options: RouterCallOptions,
  authToken?: string
): Promise<RouterResponse> {
  const client = createRouterClient()
  return await client.callJson(options, authToken)
}

/**
 * Quick call to LLM Router (streaming)
 *
 * @param options - Router call options
 * @param authToken - Optional authentication token
 * @returns Streaming Response
 */
export async function routerCallStream(
  options: RouterCallOptions,
  authToken?: string
): Promise<Response> {
  const client = createRouterClient()
  return await client.callStream(options, authToken)
}

// ================================================================
// Exports
// ================================================================

export default LLMRouterClient
