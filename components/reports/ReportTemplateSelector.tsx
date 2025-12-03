/**
 * ReportTemplateSelector Component
 * Displays a card grid of pre-built report templates
 *
 * Agent Swarm 7: Reports & Analytics
 */

'use client'

import { cn } from '@/lib/utils'
import { ReportTemplate, ReportTemplateSelectorProps } from '@/lib/types/reports'
import { REPORT_TEMPLATES } from '@/lib/reports/templates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  Briefcase,
  Users,
  Wrench,
  TrendingUp,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const ICON_MAP = {
  DollarSign,
  Briefcase,
  Users,
  Wrench,
  TrendingUp,
  FileText,
}

const CATEGORY_COLORS = {
  financial: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  operations: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sales: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  analytics: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const CATEGORY_LABELS = {
  financial: 'Financial',
  operations: 'Operations',
  sales: 'Sales',
  analytics: 'Analytics',
}

/**
 * ReportTemplateSelector - Choose from pre-built report templates
 *
 * @example
 * ```tsx
 * <ReportTemplateSelector
 *   onSelectTemplate={(template) => setSelectedTemplate(template)}
 *   selectedTemplate={selectedTemplate}
 * />
 * ```
 */
export function ReportTemplateSelector({
  onSelectTemplate,
  selectedTemplate,
  className,
}: ReportTemplateSelectorProps) {
  const handleSelectTemplate = (template: ReportTemplate) => {
    onSelectTemplate(template)
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Choose a Report Template</h2>
        <p className="text-muted-foreground mt-1">
          Select from our pre-built reports or create a custom report
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_TEMPLATES.map((template) => {
          const IconComponent = ICON_MAP[template.icon as keyof typeof ICON_MAP]
          const isSelected = selectedTemplate?.id === template.id

          return (
            <Card
              key={template.id}
              className={cn(
                'relative cursor-pointer transition-all hover:shadow-lg hover:border-primary/50',
                isSelected && 'border-primary shadow-md ring-2 ring-primary/20'
              )}
              onClick={() => handleSelectTemplate(template)}
            >
              {isSelected && (
                <div className="absolute right-3 top-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
              )}

              <CardHeader>
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'rounded-lg p-3',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {IconComponent && <IconComponent className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="mt-2">
                      <Badge variant="outline" className={CATEGORY_COLORS[template.category]}>
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {template.description}
                </CardDescription>

                <div className="mt-4 flex flex-wrap gap-2">
                  {template.supportsChartTypes.slice(0, 3).map((chartType) => (
                    <Badge key={chartType} variant="secondary" className="text-xs">
                      {chartType === 'line' && '📈 Line'}
                      {chartType === 'bar' && '📊 Bar'}
                      {chartType === 'pie' && '🥧 Pie'}
                      {chartType === 'area' && '📉 Area'}
                      {chartType === 'table' && '📋 Table'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export type { ReportTemplateSelectorProps }
