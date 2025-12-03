'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Admin Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen p-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-neutral-500 mb-4 text-center max-w-md">
            An error occurred while loading this admin page. Please try refreshing.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#4B79FF] hover:bg-[#3366FF]"
          >
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
