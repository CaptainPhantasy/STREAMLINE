/**
 * Date Range Utilities for Reports
 * Agent Swarm 7: Reports & Analytics
 */

import { DateRangePreset, ReportFilters } from '@/lib/types/reports'
import {
  startOfDay,
  endOfDay,
  startOfYesterday,
  endOfYesterday,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
  format,
} from 'date-fns'

export interface DateRange {
  from: Date
  to: Date
}

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date()

  switch (preset) {
    case 'today':
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      }

    case 'yesterday':
      return {
        from: startOfYesterday(),
        to: endOfYesterday(),
      }

    case 'last7days':
      return {
        from: startOfDay(subDays(now, 6)),
        to: endOfDay(now),
      }

    case 'last30days':
      return {
        from: startOfDay(subDays(now, 29)),
        to: endOfDay(now),
      }

    case 'thisMonth':
      return {
        from: startOfMonth(now),
        to: endOfDay(now),
      }

    case 'lastMonth':
      const lastMonth = subMonths(now, 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      }

    case 'thisQuarter':
      return {
        from: startOfQuarter(now),
        to: endOfDay(now),
      }

    case 'lastQuarter':
      const lastQuarter = subQuarters(now, 1)
      return {
        from: startOfQuarter(lastQuarter),
        to: endOfQuarter(lastQuarter),
      }

    case 'thisYear':
      return {
        from: startOfYear(now),
        to: endOfDay(now),
      }

    case 'lastYear':
      const lastYear = subYears(now, 1)
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear),
      }

    default:
      // Default to last 30 days
      return {
        from: startOfDay(subDays(now, 29)),
        to: endOfDay(now),
      }
  }
}

export function formatDateRange(filters: ReportFilters): string {
  const { preset, from, to } = filters.dateRange

  if (preset !== 'custom') {
    const presetLabels: Record<DateRangePreset, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      last7days: 'Last 7 Days',
      last30days: 'Last 30 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisQuarter: 'This Quarter',
      lastQuarter: 'Last Quarter',
      thisYear: 'This Year',
      lastYear: 'Last Year',
      custom: 'Custom Range',
    }
    return presetLabels[preset]
  }

  const fromDate = new Date(from)
  const toDate = new Date(to)

  return `${format(fromDate, 'MMM d, yyyy')} - ${format(toDate, 'MMM d, yyyy')}`
}

export function getDefaultFilters(): ReportFilters {
  const range = getDateRangeFromPreset('last30days')

  return {
    dateRange: {
      preset: 'last30days',
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    },
  }
}

export function updateFiltersDateRange(
  filters: ReportFilters,
  preset: DateRangePreset,
  customFrom?: Date,
  customTo?: Date
): ReportFilters {
  if (preset === 'custom' && customFrom && customTo) {
    return {
      ...filters,
      dateRange: {
        preset,
        from: customFrom.toISOString(),
        to: customTo.toISOString(),
      },
    }
  }

  const range = getDateRangeFromPreset(preset)

  return {
    ...filters,
    dateRange: {
      preset,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    },
  }
}
