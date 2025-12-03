import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
    message?: string
    size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    }

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-[var(--color-accent-primary)] mb-4`} />
            <p className="text-sm text-neutral-600">{message}</p>
        </div>
    )
}

export function PageLoader({ message }: { message?: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner message={message || 'Loading page...'} size="lg" />
        </div>
    )
}

export function InlineLoader({ message }: { message?: string }) {
    return <LoadingSpinner message={message} size="sm" />
}
