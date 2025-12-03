'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Filter, Calendar } from 'lucide-react'
import { getFilterSummary, type FilterState } from '@/lib/filters'

interface AdvancedFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClear: () => void
  filterConfig: FilterConfig[]
  className?: string
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'date' | 'text' | 'multiselect'
  options?: { value: string; label: string }[]
  placeholder?: string
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClear,
  filterConfig,
  className,
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false)
  const activeCount = Object.values(filters).filter(v => {
    if (Array.isArray(v)) return v.length > 0
    return v !== undefined && v !== null && v !== ''
  }).length

  function updateFilter(key: string, value: string | string[] | undefined) {
    onFiltersChange({ ...filters, [key]: value })
  }

  function removeFilter(key: string) {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          className="border-neutral-300"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeCount}
            </Badge>
          )}
        </Button>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClear()
              setOpen(false)
            }}
          >
            Clear all
          </Button>
        )}
      </div>

      {open && (
        <Card className="mt-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterConfig.map((config) => {
                const value = filters[config.key]

                if (config.type === 'select') {
                  return (
                    <div key={config.key} className="space-y-2">
                      <label className="text-sm font-medium">{config.label}</label>
                      <Select
                        value={Array.isArray(value) ? value[0] : (value as string) || ''}
                        onValueChange={(val) => updateFilter(config.key, val === 'all' ? undefined : val || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={config.placeholder || `Select ${config.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {config.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {value && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(config.key)}
                          className="h-6 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )
                }

                if (config.type === 'date') {
                  return (
                    <div key={config.key} className="space-y-2">
                      <label className="text-sm font-medium">{config.label}</label>
                      <Input
                        type="date"
                        value={(value as string) || ''}
                        onChange={(e) => updateFilter(config.key, e.target.value || undefined)}
                      />
                      {value && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(config.key)}
                          className="h-6 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )
                }

                if (config.type === 'text') {
                  return (
                    <div key={config.key} className="space-y-2">
                      <label className="text-sm font-medium">{config.label}</label>
                      <Input
                        type="text"
                        placeholder={config.placeholder}
                        value={(value as string) || ''}
                        onChange={(e) => updateFilter(config.key, e.target.value || undefined)}
                      />
                      {value && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(config.key)}
                          className="h-6 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )
                }

                return null
              })}
            </div>

            {activeCount > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">
                    {getFilterSummary(filters)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClear()
                      setOpen(false)
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

