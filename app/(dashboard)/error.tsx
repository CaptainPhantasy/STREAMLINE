'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center bg-theme-primary">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-theme-primary">Something went wrong!</h2>
            <p className="text-theme-secondary mb-6 max-w-md">
                {error.message || 'An unexpected error occurred while loading this page.'}
            </p>
            <Button
                onClick={reset}
                variant="default"
                className="gap-2"
            >
                <RefreshCw className="h-4 w-4" />
                Try Again
            </Button>
        </div>
    )
}
