/**
 * Centralized API error handling utilities
 * Provides user-friendly error messages and consistent error handling patterns
 */

import { toast, error as toastError, success as toastSuccess } from "@/lib/toast"

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

/**
 * Parse error from API response
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let errorMessage = "An unexpected error occurred"
  let errorDetails: any = null

  try {
    const data = await response.json()
    errorMessage = data.error || data.message || errorMessage
    errorDetails = data.details || data
  } catch {
    // If response is not JSON, use status text
    errorMessage = response.statusText || errorMessage
  }

  return {
    message: errorMessage,
    code: response.status.toString(),
    status: response.status,
    details: errorDetails,
  }
}

/**
 * Get user-friendly error message based on status code
 */
export function getUserFriendlyMessage(error: ApiError): string {
  if (error.status) {
    switch (error.status) {
      case 400:
        return error.message || "Invalid request. Please check your input and try again."
      case 401:
        return "You are not authorized to perform this action. Please sign in again."
      case 403:
        return "You don't have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 409:
        return error.message || "This action conflicts with existing data. Please refresh and try again."
      case 422:
        return error.message || "Validation error. Please check your input."
      case 429:
        return "Too many requests. Please wait a moment and try again."
      case 500:
        return "Server error. Please try again later or contact support."
      case 503:
        return "Service temporarily unavailable. Please try again later."
      default:
        return error.message || "An error occurred. Please try again."
    }
  }

  return error.message || "An unexpected error occurred. Please try again."
}

/**
 * Handle API error with toast notification
 */
export async function handleApiError(
  error: unknown,
  customMessage?: string
): Promise<void> {
  let apiError: ApiError

  if (error instanceof Response) {
    apiError = await parseApiError(error)
  } else if (error instanceof Error) {
    apiError = {
      message: error.message,
    }
  } else if (typeof error === "object" && error !== null && "message" in error) {
    apiError = error as ApiError
  } else {
    apiError = {
      message: "An unexpected error occurred",
    }
  }

  const userMessage = customMessage || getUserFriendlyMessage(apiError)
  
  // Log error for debugging (in development)
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", {
      message: apiError.message,
      code: apiError.code,
      status: apiError.status,
      details: apiError.details,
    })
  }

  toastError("Error", userMessage)
}

/**
 * Wrapper for fetch that handles errors automatically
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit,
  customErrorMessage?: string
): Promise<T> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      await handleApiError(response, customErrorMessage)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTP error")) {
      // Already handled by handleApiError
      throw error
    }

    // Network or other errors
    await handleApiError(error, customErrorMessage || "Network error. Please check your connection.")
    throw error
  }
}

/**
 * Safe API call wrapper that returns null on error instead of throwing
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  customErrorMessage?: string
): Promise<T | null> {
  try {
    return await apiCall()
  } catch (error) {
    await handleApiError(error, customErrorMessage)
    return null
  }
}

