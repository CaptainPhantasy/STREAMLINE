/**
 * Report Template Definitions
 * Agent Swarm 7: Reports & Analytics
 */

import { ReportTemplate, ReportType } from '@/lib/types/reports'

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'revenue',
    name: 'Revenue Report',
    description:
      'Analyze total revenue, revenue by service type, top customers, and monthly trends',
    icon: 'DollarSign',
    defaultChartType: 'line',
    supportsChartTypes: ['line', 'bar', 'pie', 'table'],
    availableFilters: ['dateRange', 'serviceType', 'customer'],
    category: 'financial',
  },
  {
    id: 'job-performance',
    name: 'Job Performance Report',
    description:
      'Track job completion rates, average completion time, jobs by status, and tech performance',
    icon: 'Briefcase',
    defaultChartType: 'bar',
    supportsChartTypes: ['bar', 'pie', 'line', 'table'],
    availableFilters: ['dateRange', 'status', 'tech'],
    category: 'operations',
  },
  {
    id: 'customer',
    name: 'Customer Analytics',
    description:
      'View customer lifetime value, acquisition trends, retention rates, and top customers',
    icon: 'Users',
    defaultChartType: 'pie',
    supportsChartTypes: ['pie', 'bar', 'line', 'table'],
    availableFilters: ['dateRange', 'minRevenue'],
    category: 'sales',
  },
  {
    id: 'tech-performance',
    name: 'Tech Performance Report',
    description:
      'Compare tech productivity, job completion rates, average ratings, and revenue generated',
    icon: 'Wrench',
    defaultChartType: 'bar',
    supportsChartTypes: ['bar', 'line', 'table'],
    availableFilters: ['dateRange', 'tech'],
    requiresFilters: ['tech'],
    category: 'operations',
  },
  {
    id: 'financial',
    name: 'Financial Overview',
    description:
      'Comprehensive financial report with revenue, expenses, profit margins, and invoice aging',
    icon: 'TrendingUp',
    defaultChartType: 'line',
    supportsChartTypes: ['line', 'bar', 'pie', 'table'],
    availableFilters: ['dateRange'],
    category: 'financial',
  },
]

export function getReportTemplate(type: ReportType): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === type)
}

export function getReportTemplatesByCategory(
  category: 'financial' | 'operations' | 'sales' | 'analytics'
): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.category === category)
}
