/**
 * Base Error Class for LLM Router
 *
 * Provides structured error handling with:
 * - Error codes for programmatic handling
 * - Retryability flags for automatic retry logic
 * - HTTP status codes for API responses
 * - Context preservation for debugging
 */

export abstract class LLMError extends Error {
  abstract readonly code: string
  abstract readonly retryable: boolean
  abstract readonly statusCode: number

  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Serializes error to JSON for logging and API responses
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      statusCode: this.statusCode,
      context: this.context,
    }
  }

  /**
   * Returns a sanitized version of the error for client consumption
   * (strips sensitive context fields)
   */
  toClientJSON(): Record<string, any> {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    }
  }
}
