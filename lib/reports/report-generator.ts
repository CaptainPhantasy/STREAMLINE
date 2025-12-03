/**
 * Report Generator
 * Generates reports from configurations
 */

import { createClient } from '@supabase/supabase-js'

export interface ReportConfiguration {
  data_source: string
  fields: string[]
  filters?: Record<string, unknown>
  chart_type: 'line' | 'bar' | 'pie' | 'area' | 'table'
  group_by?: string
  date_range?: {
    start?: string
    end?: string
  }
}

export interface ReportData {
  data: unknown[]
  chart_data: unknown[]
  summary: {
    total_records: number
  }
}

/**
 * Generate report from configuration
 */
export async function generateReport(
  accountId: string,
  config: ReportConfiguration
): Promise<ReportData> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Build query
  let query = supabase
    .from(config.data_source)
    .select(config.fields.join(','))
    .eq('account_id', accountId)

  // Apply filters
  if (config.filters) {
    Object.entries(config.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else {
          query = query.eq(key, value)
        }
      }
    })
  }

  // Apply date range
  if (config.date_range?.start) {
    query = query.gte('created_at', config.date_range.start)
  }
  if (config.date_range?.end) {
    query = query.lte('created_at', config.date_range.end)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to generate report: ${error.message}`)
  }

  // Process data for chart
  const chartData = processDataForChart(data || [], config.group_by, config.chart_type)

  return {
    data: data || [],
    chart_data: chartData,
    summary: {
      total_records: data?.length || 0,
    },
  }
}

function processDataForChart(
  data: unknown[],
  groupBy?: string,
  chartType?: string
): unknown[] {
  if (!groupBy || chartType === 'table') {
    return data
  }

  // Group data
  const grouped: Record<string, unknown[]> = {}
  data.forEach((item: any) => {
    const key = item[groupBy] || 'Unknown'
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(item)
  })

  // Format for chart
  return Object.entries(grouped).map(([key, values]) => ({
    name: key,
    value: values.length,
    data: values,
  }))
}

