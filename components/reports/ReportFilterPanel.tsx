/**
 * ReportFilterPanel Component
 * Advanced filtering panel for report data
 *
 * Agent Swarm 7: Reports & Analytics
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ReportFilters,
  ReportFilterPanelProps,
  DateRangePreset,
  ReportFilterPreset,
} from '@/lib/types/reports'
import {
  getDateRangeFromPreset,
  formatDateRange,
  updateFiltersDateRange,
} from '@/lib/reports/date-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, Filter, Save, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
]

/**
 * ReportFilterPanel - Advanced filtering controls for reports
 *
 * @example
 * ```tsx
 * <ReportFilterPanel
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   availableFilters={['dateRange', 'tech', 'status']}
 * />
 * ```
 */
export function ReportFilterPanel({
  filters,
  onFiltersChange,
  availableFilters = ['dateRange'],
  presets = [],
  onSavePreset,
  onLoadPreset,
  className,
}: ReportFilterPanelProps) {
  const [presetName, setPresetName] = useState('')
  const [showSavePreset, setShowSavePreset] = useState(false)

  const handleDateRangeChange = (preset: DateRangePreset) => {
    const updatedFilters = updateFiltersDateRange(filters, preset)
    onFiltersChange(updatedFilters)
  }

  const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
    if (!value) return

    const newDate = new Date(value)
    const otherDate =
      field === 'from' ? new Date(filters.dateRange.to) : new Date(filters.dateRange.from)

    const updatedFilters = updateFiltersDateRange(
      filters,
      'custom',
      field === 'from' ? newDate : otherDate,
      field === 'to' ? newDate : otherDate
    )
    onFiltersChange(updatedFilters)
  }

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim())
      setPresetName('')
      setShowSavePreset(false)
    }
  }

  const handleLoadPreset = (preset: ReportFilterPreset) => {
    if (onLoadPreset) {
      onLoadPreset(preset)
    }
  }

  const handleResetFilters = () => {
    const resetFilters: ReportFilters = {
      dateRange: {
        preset: 'last30days',
        from: getDateRangeFromPreset('last30days').from.toISOString(),
        to: getDateRangeFromPreset('last30days').to.toISOString(),
      },
    }
    onFiltersChange(resetFilters)
  }

  const activeFilterCount = Object.keys(filters).filter((key) => {
    if (key === 'dateRange') return false
    return filters[key as keyof ReportFilters] !== undefined
  }).length

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Date Range Filter */}
        {availableFilters.includes('dateRange') && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <Select
              value={filters.dateRange.preset}
              onValueChange={(value) => handleDateRangeChange(value as DateRangePreset)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filters.dateRange.preset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.from.split('T')[0]}
                    onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.to.split('T')[0]}
                    onChange={(e) => handleCustomDateChange('to', e.target.value)}
                    min={filters.dateRange.from.split('T')[0]}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {formatDateRange(filters)}
            </div>
          </div>
        )}

        {/* Tech Filter */}
        {availableFilters.includes('tech') && (
          <div className="space-y-3">
            <Label>Tech</Label>
            <Select
              value={filters.techId || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  techId: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Techs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Techs</SelectItem>
                {/* Tech list would be loaded dynamically */}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status Filter */}
        {availableFilters.includes('status') && (
          <div className="space-y-3">
            <Label>Job Status</Label>
            <Select
              value={(filters.jobStatus?.[0]) || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  jobStatus: value === 'all' ? undefined : [value],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Customer Filter */}
        {availableFilters.includes('customer') && (
          <div className="space-y-3">
            <Label>Customer</Label>
            <Input
              type="text"
              placeholder="Search customer..."
              value={filters.customerId || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  customerId: e.target.value || undefined,
                })
              }
            />
          </div>
        )}

        {/* Min Revenue Filter */}
        {availableFilters.includes('minRevenue') && (
          <div className="space-y-3">
            <Label>Minimum Revenue</Label>
            <Input
              type="number"
              placeholder="$0"
              value={filters.minAmount || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minAmount: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
        )}

        {/* Save/Load Presets */}
        {(onSavePreset || onLoadPreset) && (
          <div className="space-y-3 pt-4 border-t">
            <Label>Filter Presets</Label>

            {presets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadPreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            )}

            {showSavePreset ? (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePreset()
                    if (e.key === 'Escape') setShowSavePreset(false)
                  }}
                />
                <Button size="sm" onClick={handleSavePreset}>
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavePreset(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePreset(true)}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current Filters
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type { ReportFilterPanelProps }
