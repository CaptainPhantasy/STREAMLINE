'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Props for the AdminErrorBoundary component
 */
export interface AdminErrorBoundaryProps {
  /**
   * Child components to render
   */
  children: ReactNode

  /**
   * Optional custom fallback UI to display when an error occurs
   */
  fallback?: ReactNode

  /**
   * Callback function called when an error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void

  /**
   * Custom error message to display
   */
  errorMessage?: string

  /**
   * Whether to show the reload button
   * @default true
   */
  showReload?: boolean

  /**
   * Whether to show error details in development
   * @default true in development, false in production
   */
  showErrorDetails?: boolean
}

/**
 * State for the AdminErrorBoundary component
 */
export interface AdminErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * AdminErrorBoundary - React Error Boundary for admin pages
 *
 * Catches JavaScript errors anywhere in the child component tree and displays
 * a fallback UI with options to retry or reload. Prevents white screen of death.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AdminErrorBoundary>
 *   <YourAdminPage />
 * </AdminErrorBoundary>
 *
 * // With custom error handling
 * <AdminErrorBoundary
 *   onError={(error) => {
 *     // Log to error tracking service
 *     console.error('Admin page error:', error)
 *   }}
 *   errorMessage="Failed to load admin panel"
 * >
 *   <YourAdminPage />
 * </AdminErrorBoundary>
 * ```
 *
 * Features:
 * - Catches and displays React errors gracefully
 * - Shows user-friendly error messages
 * - Provides reload/retry functionality
 * - Displays error details in development mode
 * - Prevents cascading failures
 * - Can be nested for component-level error isolation
 *
 * @component
 */
export class AdminErrorBoundary extends Component<
  AdminErrorBoundaryProps,
  AdminErrorBoundaryState
> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<AdminErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Log error details and call onError callback
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('AdminErrorBoundary caught an error:', error, errorInfo)

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  /**
   * Reset error boundary state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  /**
   * Reload the current page
   */
  handleReload = () => {
    window.location.reload()
  }

  render() {
    const {
      children,
      fallback,
      errorMessage,
      showReload = true,
      showErrorDetails = process.env.NODE_ENV === 'development',
    } = this.props

    if (this.state.hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="max-w-2xl w-full shadow-lg border-red-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-base text-red-700">
                {errorMessage || 'An unexpected error occurred while loading this page.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error details (development only) */}
              {showErrorDetails && this.state.error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">
                    Error Details:
                  </h3>
                  <pre className="text-xs text-red-800 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <h3 className="text-sm font-semibold text-red-900 mt-3 mb-2">
                        Component Stack:
                      </h3>
                      <pre className="text-xs text-red-800 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  onClick={this.resetError}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Try Again
                </Button>
                {showReload && (
                  <Button
                    onClick={this.handleReload}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                )}
              </div>

              {/* Help text */}
              <p className="text-sm text-center text-neutral-600 pt-4">
                If this problem persists, please contact support or try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return <>{children}</>
  }
}

/**
 * Hook-based error boundary wrapper (for function components)
 * Note: This doesn't actually catch errors, it's just a convenience wrapper
 * The actual error catching is done by the class component above
 */
export function withAdminErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<AdminErrorBoundaryProps, 'children'>
) {
  return function WithAdminErrorBoundary(props: P) {
    return (
      <AdminErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </AdminErrorBoundary>
    )
  }
}

/**
 * Export types for external use
 */
export type { AdminErrorBoundaryProps, AdminErrorBoundaryState }
