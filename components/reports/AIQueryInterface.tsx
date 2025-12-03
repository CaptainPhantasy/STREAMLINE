'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { ChartTypes } from './ChartTypes'

export function AIQueryInterface() {
  const [query, setQuery] = useState('')
  const [processing, setProcessing] = useState(false)
  const [report, setReport] = useState<any>(null)

  async function handleQuery() {
    if (!query.trim()) {
      toast.error('Please enter a query')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/reports/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to process query')
      }

      const data = await response.json()
      setReport(data.report)
      toast.success('Report generated!')
    } catch (error: any) {
      console.error('Error processing query:', error)
      toast.error(error.message || 'Failed to process query')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Query Interface
        </CardTitle>
        <CardDescription>
          Ask questions in natural language to generate reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show me revenue by tech this month"
            rows={3}
          />
          <p className="text-xs text-gray-500">
            Examples: "Revenue by tech", "New contacts last week", "Job status breakdown"
          </p>
        </div>

        <Button onClick={handleQuery} disabled={processing || !query.trim()} className="w-full">
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>

        {report && (
          <div className="mt-6 border-t pt-6">
            <ChartTypes
              data={report.chart_data}
              chartType={report.chart_type || 'table'}
              title="Generated Report"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

