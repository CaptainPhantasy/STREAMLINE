'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Filter, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface InboxFilters {
  status?: string[]
  assigned_to?: string[]
  date_from?: Date
  date_to?: Date
  channel?: string[]
  sla_status?: string[]
  tags?: string[]
  search?: string
}

interface InboxFiltersProps {
  filters: InboxFilters
  onFiltersChange: (filters: InboxFilters) => void
  onReset: () => void
  availableUsers?: Array<{ id: string; full_name: string | null }>
  availableTags?: Array<{ id: string; name: string }>
}

export function InboxFilters({
  filters,
  onFiltersChange,
  onReset,
  availableUsers = [],
  availableTags = [],
}: InboxFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<InboxFilters>(filters)

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'snoozed', label: 'Snoozed' },
  ]

  const channelOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'call', label: 'Call' },
  ]

  const slaStatusOptions = [
    { value: 'on_track', label: 'On Track' },
    { value: 'at_risk', label: 'At Risk' },
    { value: 'breached', label: 'Breached' },
  ]

  function updateFilter(key: keyof InboxFilters, value: unknown) {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  function handleApply() {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  function handleReset() {
    const emptyFilters: InboxFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
    onReset()
    setIsOpen(false)
  }

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-blue-500">{activeFilterCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filter Conversations</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <Input
              placeholder="Search conversations..."
              value={localFilters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFilters.status?.[0] || ''}
              onValueChange={(value) =>
                updateFilter('status', value ? [value] : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Select
              value={localFilters.assigned_to?.[0] || ''}
              onValueChange={(value) =>
                updateFilter('assigned_to', value ? [value] : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All users</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || 'Unknown User'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select
              value={localFilters.channel?.[0] || ''}
              onValueChange={(value) =>
                updateFilter('channel', value ? [value] : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All channels</SelectItem>
                {channelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SLA Status */}
          <div className="space-y-2">
            <Label>SLA Status</Label>
            <Select
              value={localFilters.sla_status?.[0] || ''}
              onValueChange={(value) =>
                updateFilter('sla_status', value ? [value] : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All SLA statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All SLA statuses</SelectItem>
                {slaStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !localFilters.date_from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.date_from
                      ? format(localFilters.date_from, 'PPP')
                      : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.date_from}
                    onSelect={(date) => updateFilter('date_from', date || undefined)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !localFilters.date_to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.date_to
                      ? format(localFilters.date_to, 'PPP')
                      : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.date_to}
                    onSelect={(date) => updateFilter('date_to', date || undefined)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

