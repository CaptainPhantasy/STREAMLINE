'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onReset?: () => void
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Error caught by boundary:', error, errorInfo)
        // In production, send to error tracking service
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined })
        this.props.onReset?.()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                    <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-neutral-800">Something went wrong</h3>
                    <p className="text-sm text-neutral-600 mb-4 max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
                    </p>
                    <Button onClick={this.handleReset} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
