/**
 * SettingToggle - Reusable toggle switch with label
 */

'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SettingsToggleProps } from '@/lib/types/settings'

export function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false
}: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--card-border)] last:border-0">
      <div className="space-y-1 flex-1">
        <Label
          htmlFor={label.toLowerCase().replace(/\s+/g, '-')}
          className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer"
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={label.toLowerCase().replace(/\s+/g, '-')}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
