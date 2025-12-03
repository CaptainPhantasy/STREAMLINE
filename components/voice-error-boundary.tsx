'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Voice Error Boundary
 *
 * Error boundary that gracefully handles voice-related errors
 * and provides fallback UI when voice functionality fails.
 */

interface VoiceErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  showErrorDetails?: boolean
  className?: string
}

interface VoiceErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
  retryCount: number
}

export class VoiceErrorBoundary extends Component<VoiceErrorBoundaryProps, VoiceErrorBoundaryState> {
  private maxRetries = 3

  constructor(props: VoiceErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<VoiceErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `voice_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('[Voice Error Boundary] Error caught')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()

    // Log to monitoring service in production
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          error_id: this.state.errorId,
          component: 'voice_error_boundary'
        }
      })
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorId: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided by parent
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className={cn(
          "w-full p-4 border border-orange-200 bg-orange-50 rounded-lg",
          "dark:border-orange-800 dark:bg-orange-950",
          this.props.className
        )}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Voice Feature Unavailable
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                We're having trouble with the voice features. You can continue using the CRM without voice assistance.
              </p>

              {this.props.showErrorDetails && this.state.error && (
                <details className="mt-2">
                  <summary className="text-xs text-orange-600 dark:text-orange-400 cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="mt-1 text-xs bg-orange-100 dark:bg-orange-900 p-2 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              {this.state.retryCount < this.maxRetries && (
                <div className="mt-3">
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    size="sm"
                    className="text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-900"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                </div>
              )}

              {this.state.retryCount >= this.maxRetries && (
                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                  Maximum retry attempts reached. Voice features will remain disabled for this session.
                </p>
              )}

              {this.state.errorId && (
                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to wrap components with voice error boundary
 */
export function withVoiceErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  showErrorDetails?: boolean
): React.ComponentType<T> {
  const WrappedComponent = (props: T) => (
    <VoiceErrorBoundary fallback={fallback} showErrorDetails={showErrorDetails}>
      <Component {...props} />
    </VoiceErrorBoundary>
  )

  WrappedComponent.displayName = `withVoiceErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}