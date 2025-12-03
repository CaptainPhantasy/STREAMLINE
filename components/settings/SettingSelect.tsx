/**
 * SettingSelect - Reusable select dropdown with label
 */

'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { SettingsSelectProps } from '@/lib/types/settings'

export function SettingSelect({
  label,
  description,
  value,
  onValueChange,
  options,
  disabled = false
}: SettingsSelectProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
      </Label>
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
