/**
 * API Retry Utility
 *
 * Provides automatic retry logic with exponential backoff for failed API requests.
 * Reusable across any project that needs resilient HTTP calls.
 *
 * @module lib/api-retry
 */

export interface FetchWithRetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  delayMs?: number

  /**
   * HTTP status codes that should trigger a retry
   * @default [500, 502, 503, 504]
   */
  retryableStatusCodes?: number[]

  /**
   * Callback function called on each retry attempt
   */
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Fetches a URL with automatic retry logic and exponential backoff.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const response = await fetchWithRetry('/api/users')
 *
 * // With custom options
 * const response = await fetchWithRetry('/api/data', {
 *   maxRetries: 5,
 *   delayMs: 2000,
 *   onRetry: (attempt, error) => {
 *     console.log(`Retry attempt ${attempt}: ${error.message}`)
 *   }
 * })
 * ```
 *
 * @param url - The URL to fetch
 * @param options - Fetch options and retry configuration
 * @returns Promise that resolves to the Response object
 * @throws Error if all retry attempts fail
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    retryableStatusCodes = [500, 502, 503, 504],
    onRetry,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions)

      // Check if response status is retryable
      if (retryableStatusCodes.includes(response.status) && attempt < maxRetries - 1) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, lastError)
        }

        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
        continue
      }

      // Return response (either successful or non-retryable error)
      return response
    } catch (error) {
      lastError = error as Error

      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`)
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      // Wait with exponential backoff before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error(`Max retries exceeded: ${lastError?.message || 'Unknown error'}`)
}

/**
 * Fetches JSON data with automatic retry logic.
 * Convenience wrapper around fetchWithRetry that parses JSON response.
 *
 * @example
 * ```typescript
 * const users = await fetchJSONWithRetry<User[]>('/api/users')
 * ```
 *
 * @param url - The URL to fetch
 * @param options - Fetch options and retry configuration
 * @returns Promise that resolves to the parsed JSON data
 * @throws Error if fetch fails or JSON parsing fails
 */
export async function fetchJSONWithRetry<T = any>(
  url: string,
  options: RequestInit & FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Creates a fetch wrapper with default retry configuration.
 * Useful for creating API clients with consistent retry behavior.
 *
 * @example
 * ```typescript
 * // Create an API client with custom defaults
 * const apiFetch = createRetryFetch({
 *   maxRetries: 5,
 *   delayMs: 2000,
 *   onRetry: (attempt) => console.log(`Retry ${attempt}`)
 * })
 *
 * // Use it like regular fetch
 * const response = await apiFetch('/api/users')
 * ```
 *
 * @param defaultOptions - Default retry configuration
 * @returns Function that fetches with the default retry configuration
 */
export function createRetryFetch(
  defaultOptions: FetchWithRetryOptions = {}
): (url: string, options?: RequestInit & FetchWithRetryOptions) => Promise<Response> {
  return (url: string, options: RequestInit & FetchWithRetryOptions = {}) => {
    return fetchWithRetry(url, { ...defaultOptions, ...options })
  }
}

/**
 * Type guard to check if an error is a fetch-related error
 *
 * @param error - The error to check
 * @returns True if the error is a fetch error
 */
export function isFetchError(error: unknown): error is TypeError {
  return error instanceof TypeError && error.message.includes('fetch')
}

/**
 * Type guard to check if an error is a network timeout error
 *
 * @param error - The error to check
 * @returns True if the error is a timeout error
 */
export function isTimeoutError(error: unknown): error is Error {
  return error instanceof Error && (
    error.message.includes('timeout') ||
    error.message.includes('ETIMEDOUT')
  )
}

/**
 * Type guard to check if an error is retryable
 * Checks if the error is a network error or timeout that should be retried
 *
 * @param error - The error to check
 * @returns True if the error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  return isFetchError(error) || isTimeoutError(error)
}
