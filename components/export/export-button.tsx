'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'

interface ExportButtonProps {
  endpoint: 'jobs' | 'contacts' | 'invoices'
  filters?: Record<string, string>
  className?: string
}

export function ExportButton({ endpoint, filters = {}, className }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [format, setFormat] = useState<'csv' | 'json'>('csv')

  async function handleExport(format: 'csv' | 'json') {
    setExporting(true)
    setFormat(format)
    
    try {
      // Build query string with filters
      const params = new URLSearchParams({ format })
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })

      const response = await fetch(`/api/export/${endpoint}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      if (format === 'csv') {
        // Download CSV file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${endpoint}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        // Download JSON file
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${endpoint}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export error:', error)
      toastError('Failed to export', 'Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          className={className}
        >
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={exporting}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} disabled={exporting}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

