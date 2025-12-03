'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ChartTypesProps {
  data: unknown[]
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'table'
  title?: string
}

export function ChartTypes({ data, chartType, title }: ChartTypesProps) {
  if (chartType === 'table') {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Table>
            <TableHeader>
              {data.length > 0 && typeof data[0] === 'object' && data[0] !== null && (
                <TableRow>
                  {Object.keys(data[0] as Record<string, unknown>).map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {data.map((row: any, idx) => (
                <TableRow key={idx}>
                  {Object.values(row).map((value: any, cellIdx) => (
                    <TableCell key={cellIdx}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  // For other chart types, return a placeholder
  // In production, integrate with a charting library like recharts
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="h-64 flex items-center justify-center border rounded">
          <p className="text-gray-500">
            {chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart visualization
            <br />
            <span className="text-xs">(Chart library integration needed)</span>
          </p>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Data points: {data.length}</p>
          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(data.slice(0, 5), null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

