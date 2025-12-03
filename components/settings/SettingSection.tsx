/**
 * SettingSection - Reusable settings section component
 * Groups related settings with a title and description
 */

'use client'

import { cn } from '@/lib/utils'
import type { SettingsSectionProps } from '@/lib/types/settings'

export function SettingSection({
  title,
  description,
  children,
  className
}: SettingsSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
