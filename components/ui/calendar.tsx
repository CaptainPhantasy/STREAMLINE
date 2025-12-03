"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

export interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  initialFocus?: boolean
}

function Calendar({
  selected,
  onSelect,
  className,
  ...props
}: CalendarProps) {
  const [dateValue, setDateValue] = React.useState(
    selected ? selected.toISOString().split('T')[0] : ''
  )

  React.useEffect(() => {
    if (selected) {
      setDateValue(selected.toISOString().split('T')[0])
    }
  }, [selected])

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setDateValue(value)
    if (value && onSelect) {
      onSelect(new Date(value))
    } else if (!value && onSelect) {
      onSelect(undefined)
    }
  }

  return (
    <div className={className}>
      <Input
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        className="w-full"
        {...props}
      />
    </div>
  )
}

export { Calendar }

