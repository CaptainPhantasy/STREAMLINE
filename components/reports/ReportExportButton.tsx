/**
 * ReportExportButton Component
 * Export reports to PDF, Excel, or CSV formats
 *
 * Agent Swarm 7: Reports & Analytics
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ReportExportButtonProps, ExportFormat } from '@/lib/types/reports'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, Table2, FileSpreadsheet, Loader2, Mail, Calendar } from 'lucide-react'
import { toast } from '@/lib/toast'

/**
 * ReportExportButton - Export reports in multiple formats
 *
 * @example
 * ```tsx
 * <ReportExportButton
 *   report={report}
 *   type="revenue"
 *   filters={filters}
 *   onExport={(format) => console.log('Exporting as', format)}
 * />
 * ```
 */
export function ReportExportButton({
  report,
  type,
  filters,
  onExport,
  disabled = false,
  className,
}: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    if (disabled || isExporting) return

    setIsExporting(true)
    setExportingFormat(format)

    try {
      // Call the export API
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report?.id,
          type,
          filters,
          format,
          includeCharts: format === 'pdf',
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${Date.now()}.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export Successful',
        description: `Report exported as ${format.toUpperCase()}`,
      })

      if (onExport) {
        onExport(format)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
    }
  }

  const handleEmailReport = async () => {
    toast({
      title: 'Coming Soon',
      description: 'Email report feature will be available soon.',
    })
  }

  const handleScheduleReport = async () => {
    toast({
      title: 'Coming Soon',
      description: 'Schedule recurring reports feature will be available soon.',
    })
  }

  const isExportingSpecific = (format: ExportFormat) =>
    isExporting && exportingFormat === format

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isExporting}
          className={cn('gap-2', className)}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          {isExportingSpecific('pdf') ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Export as PDF
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          {isExportingSpecific('excel') ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Export as Excel
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          {isExportingSpecific('csv') ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Table2 className="h-4 w-4" />
          )}
          Export as CSV
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleEmailReport}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          <Mail className="h-4 w-4" />
          Email Report
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleScheduleReport}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          <Calendar className="h-4 w-4" />
          Schedule Recurring
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type { ReportExportButtonProps }
