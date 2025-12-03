/**
 * SettingInput - Reusable input field with label
 */

'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SettingsInputProps } from '@/lib/types/settings'

export function SettingInput({
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  required = false
}: SettingsInputProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full"
      />
    </div>
  )
}
