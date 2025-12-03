'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Search, Filter } from 'lucide-react'

interface DataExplorerProps {
  dataSource: string
  onDataSelected?: (data: unknown[]) => void
}

export function DataExplorer({ dataSource, onDataSelected }: DataExplorerProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<unknown[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (dataSource) {
      fetchData()
    }
  }, [dataSource, filters])

  async function fetchData() {
    if (!dataSource) return

    setLoading(true)

    try {
      const response = await fetch('/api/reports/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_source: dataSource,
          fields: ['*'], // Get all fields
          filters: filters,
          chart_type: 'table',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()
      setData(result.data || [])
      onDataSelected?.(result.data || [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = data.filter((item: any) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return Object.values(item).some((value: any) =>
      String(value).toLowerCase().includes(searchLower)
    )
  })

  if (!dataSource) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Select a data source to explore</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Explorer</CardTitle>
        <CardDescription>Explore and filter data from {dataSource}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredData.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No data found</p>
        ) : (
          <div className="border rounded-lg overflow-auto max-h-96">
            <Table>
              <TableHeader>
                {filteredData.length > 0 && typeof filteredData[0] === 'object' && filteredData[0] !== null && (
                  <TableRow>
                    {Object.keys(filteredData[0] as Record<string, unknown>).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 100).map((row: any, idx) => (
                  <TableRow key={idx}>
                    {Object.values(row).map((value: any, cellIdx) => (
                      <TableCell key={cellIdx} className="max-w-xs truncate">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredData.length > 100 && (
          <p className="text-xs text-gray-500 text-center">
            Showing first 100 of {filteredData.length} results
          </p>
        )}
      </CardContent>
    </Card>
  )
}

