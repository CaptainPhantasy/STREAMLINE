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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useParts } from '@/lib/hooks/use-parts'
import type { Part } from '@/lib/types/parts'
import { Plus, Edit, AlertCircle, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import styles from './parts.module.css'

interface PartsListViewProps {
  onCreateNew?: () => void
  onSelectPart?: (part: Part) => void
}

export function PartsListView({ onCreateNew, onSelectPart }: PartsListViewProps) {
  const [page, setPage] = useState(1)
  const [limit] = useState(50) // Increased to show more items
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  const { parts, total, loading, error, lowStockAlerts, refetch } = useParts({
    initialParams: {
      page,
      limit,
      search: searchQuery || undefined,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      // low_stock filtering is typically done server side but our mock might do it client side or simple param
      // We'll pass it if the API supports it, or filter client side if needed.
      // The useParts hook passes params to API.
    }
  })

  
  // Calculate low stock count based on alerts if available, or local derived
  const lowStockCount = lowStockAlerts.length

  const filteredParts = showLowStockOnly
    ? parts.filter(p => p.quantity_in_stock <= p.reorder_threshold)
    : parts

  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parts Inventory</h2>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-muted-foreground">
              Showing {filteredParts.length} of {total} parts {searchQuery && `matching "${searchQuery}"`}
            </p>
            {lowStockCount > 0 && (
              <p className="text-sm text-orange-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {lowStockCount} parts low on stock
              </p>
            )}
          </div>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Part
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-muted/30 p-4 rounded-lg border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="low-stock"
              checked={showLowStockOnly}
              onCheckedChange={(checked) => setShowLowStockOnly(checked === true)}
            />
            <Label htmlFor="low-stock" className="text-sm font-medium cursor-pointer">
              Low stock only
            </Label>
          </div>

          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="tools">Tools</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <Table className={styles.partsTable}>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && parts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-destructive">
                  Failed to load parts
                </TableCell>
              </TableRow>
            ) : filteredParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No parts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part) => {
                const isLowStock = part.quantity_in_stock <= part.reorder_threshold
                const totalValue = part.quantity_in_stock * part.unit_price

                return (
                  <TableRow
                    key={part.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectPart?.(part)}
                  >
                    <TableCell className="font-mono font-medium text-xs">
                      {part.sku || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{part.name}</span>
                        {part.description && (
                          <span className="text-xs truncate max-w-[200px] text-muted-foreground">
                            {part.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{part.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{part.supplier_name || '-'}</div>
                        {part.supplier_sku && (
                          <div className="text-xs text-muted-foreground">{part.supplier_sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "flex items-center justify-end gap-2",
                        isLowStock && "text-orange-600 font-bold"
                      )}>
                        {isLowStock && <AlertCircle className="h-3 w-3" />}
                        <div className="text-right">
                          <div>{part.quantity_in_stock} <span className="font-normal text-xs text-muted-foreground">{part.unit}</span></div>
                          {part.quantity_in_stock > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {Math.round((part.quantity_in_stock / part.reorder_threshold) * 100)}% stocked
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${(part.unit_price / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(totalValue / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {filteredParts.length} of {total} parts
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
            disabled={page * limit >= total || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}