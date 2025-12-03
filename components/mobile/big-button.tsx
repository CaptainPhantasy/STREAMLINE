'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BigButtonProps {
  icon?: LucideIcon
  label: string
  sublabel?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  onClick?: () => void
  className?: string
}

const variantStyles = {
  default: 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border-[var(--color-border)]',
  primary: 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)] shadow-glow',
  success: 'bg-[var(--color-accent-secondary)] text-white border-[var(--color-accent-secondary)]',
  warning: 'bg-amber-600 text-white border-amber-500',
  danger: 'bg-red-600 text-white border-red-500',
}

/**
 * BigButton - Mobile-optimized button for field technicians
 *
 * Features:
 * - 44px minimum height for standard touch target
 * - Large touch target (full width)
 * - High contrast colors
 * - Optional icon and sublabel
 */
export function BigButton({
  icon: Icon,
  label,
  sublabel,
  variant = 'default',
  disabled = false,
  onClick,
  className,
}: BigButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full min-h-[44px] px-6 py-4 rounded-xl border',
        'flex items-center justify-center gap-3',
        'font-bold text-lg uppercase tracking-wide',
        'transition-all duration-200 ease-out',
        'shadow-card hover:shadow-card-hover hover:-translate-y-px',
        'active:scale-[0.98] active:shadow-sm',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-sm',
        'relative overflow-hidden',
        // Add subtle top highlight for depth - same as desktop cards
        'before:absolute before:inset-x-0 before:top-0 before:h-px',
        'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="w-6 h-6 flex-shrink-0" />}
      <div className="flex flex-col items-start">
        <span>{label}</span>
        {sublabel && (
          <span className="text-xs font-normal opacity-80 normal-case">
            {sublabel}
          </span>
        )}
      </div>
    </button>
  )
}

/**
 * BigButtonGrid - Grid layout for multiple BigButtons
 */
export function BigButtonGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 1 | 2 }) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 1 ? 'grid-cols-1' : 'grid-cols-2'
    )}>
      {children}
    </div>
  )
}

