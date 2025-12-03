/**
 * SettingRow - Reusable settings row component
 * Label on left, control on right
 */

'use client'

import { cn } from '@/lib/utils'
import type { SettingsRowProps } from '@/lib/types/settings'

export function SettingRow({
  label,
  description,
  children,
  className
}: SettingsRowProps) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b border-[var(--card-border)] last:border-0',
      className
    )}>
      <div className="space-y-1 flex-1">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
        {description && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>
      <div className="sm:w-64">
        {children}
      </div>
    </div>
  )
}
