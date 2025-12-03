'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export function PLReport() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function fetchReport() {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates')
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('start_date', startDate)
      params.append('end_date', endDate)

      const response = await fetch(`/api/analytics/pl?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch P&L report')
      }

      const result = await response.json()
      setData(result)
    } catch (error: any) {
      console.error('Error fetching P&L:', error)
      toast.error(error.message || 'Failed to load P&L report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Profit & Loss Report
        </CardTitle>
        <CardDescription>Financial performance analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={fetchReport} disabled={loading || !startDate || !endDate}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            'Generate Report'
          )}
        </Button>

        {data && (
          <div className="mt-6 space-y-4 border-t pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(data.revenue.total / 100).toFixed(2)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Costs</p>
                <p className="text-2xl font-bold text-red-600">
                  ${(data.costs.total / 100).toFixed(2)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Gross Profit</p>
                <p className="text-2xl font-bold">
                  ${(data.profit.gross / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Margin: {data.profit.margin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

