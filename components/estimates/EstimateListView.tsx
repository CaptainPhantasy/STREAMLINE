'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEstimates } from '@/lib/hooks/use-estimates'
import type { Estimate } from '@/lib/types/estimates'
import { format, isPast } from 'date-fns'
import { Plus, ChevronRight, Search, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EstimateListViewProps {
  onCreateNew?: () => void
  onSelectEstimate?: (estimate: Estimate) => void
}

export function EstimateListView({ onCreateNew, onSelectEstimate }: EstimateListViewProps) {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { estimates, total, loading, error } = useEstimates({
    initialParams: {
      page,
      limit,
      status: statusFilter === 'all' ? undefined : statusFilter as any,
      search: searchQuery || undefined
    }
  })

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'sent': return 'default'
      case 'viewed': return 'default'
      case 'accepted': return 'success'
      case 'rejected': return 'destructive'
      case 'expired': return 'outline'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estimates</h2>
          <p className="text-muted-foreground">
            Manage your estimates and quotes.
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> Create Estimate
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search estimates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estimate #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && estimates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-destructive">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Failed to load estimates</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : estimates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No estimates found.
                </TableCell>
              </TableRow>
            ) : (
              estimates.map((estimate) => (
                <TableRow
                  key={estimate.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectEstimate?.(estimate)}
                >
                  <TableCell className="font-mono font-medium">
                    {estimate.estimate_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{estimate.contact?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">{estimate.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {estimate.created_at ? format(new Date(estimate.created_at), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {estimate.valid_until ? (
                      <span className={cn(
                        isPast(new Date(estimate.valid_until)) && 'text-destructive font-medium'
                      )}>
                        {format(new Date(estimate.valid_until), 'MMM dd, yyyy')}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(estimate.total_amount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(estimate.status)}>
                      {estimate.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {estimates.length} of {total} estimates
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={estimates.length < limit || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}