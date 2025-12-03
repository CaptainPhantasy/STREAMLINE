/**
 * TypeScript Types for Parts/Inventory System
 *
 * Defines all types for parts/materials management and job parts tracking
 */

/**
 * Part Category Types
 */
export type PartCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'hardware'
  | 'materials'
  | 'tools'
  | 'consumables'
  | 'other'

/**
 * Part Unit Types
 */
export type PartUnit =
  | 'each'
  | 'box'
  | 'case'
  | 'ft'
  | 'meter'
  | 'lb'
  | 'kg'
  | 'gallon'
  | 'liter'
  | 'pair'

/**
 * Main Part Interface
 */
export interface Part {
  id: string
  account_id: string
  sku?: string // Stock Keeping Unit
  name: string
  description?: string
  category: PartCategory
  unit: PartUnit
  unit_price: number // In cents
  quantity_in_stock: number
  reorder_threshold: number
  supplier_name?: string
  supplier_sku?: string
  supplier_contact?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
}

/**
 * Job Parts Association
 * (tracks parts used on specific jobs)
 */
export interface JobPart {
  id: string
  account_id: string
  job_id: string
  part_id?: string // Optional - may reference Part or be custom
  name: string // Part name (from Part or custom)
  description?: string
  quantity: number
  unit: PartUnit
  unit_price: number // In cents
  total_price: number // In cents (quantity * unit_price)
  added_by: string
  added_at: string
  notes?: string

  // Joined data (optional)
  part?: Part
  job?: {
    id: string
    title: string
    customer_name: string
  }
}

/**
 * API Request/Response Types
 */

export interface CreatePartRequest {
  sku?: string
  name: string
  description?: string
  category: PartCategory
  unit: PartUnit
  unit_price: number // In cents
  quantity_in_stock: number
  reorder_threshold?: number
  supplier_name?: string
  supplier_sku?: string
  supplier_contact?: string
  notes?: string
}

export interface UpdatePartRequest {
  sku?: string
  name?: string
  description?: string
  category?: PartCategory
  unit?: PartUnit
  unit_price?: number // In cents
  quantity_in_stock?: number
  reorder_threshold?: number
  supplier_name?: string
  supplier_sku?: string
  supplier_contact?: string
  notes?: string
}

export interface GetPartsParams {
  page?: number
  limit?: number
  category?: PartCategory
  search?: string
  low_stock?: boolean // Filter for parts below reorder threshold
  sort?: 'asc' | 'desc'
  sort_by?: 'name' | 'quantity_in_stock' | 'unit_price'
}

export interface GetPartsResponse {
  parts: Part[]
  total: number
  page: number
  limit: number
  low_stock_count?: number
}

export interface AddJobPartRequest {
  part_id?: string // If using existing part from inventory
  name: string
  description?: string
  quantity: number
  unit: PartUnit
  unit_price: number // In cents
  notes?: string
}

export interface GetJobPartsParams {
  job_id: string
}

export interface GetJobPartsResponse {
  parts: JobPart[]
  total_cost: number // In cents
}

/**
 * Component Prop Types
 */

export interface PartsListViewProps {
  parts?: Part[]
  loading?: boolean
  error?: Error | null
  onSelectPart?: (part: Part) => void
  onCreateNew?: () => void
  onEdit?: (part: Part) => void
  className?: string
}

export interface PartsManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  part?: Part // If editing existing
  onSave?: (part: Part) => void
  className?: string
}

export interface JobPartsListProps {
  jobId: string
  parts?: JobPart[]
  loading?: boolean
  onAddPart?: () => void
  onRemovePart?: (partId: string) => void
  editable?: boolean
  className?: string
}

/**
 * Utility Types
 */

export interface PartStats {
  total_parts: number
  total_value: number // In cents (sum of all parts in stock)
  low_stock_count: number
  categories: Record<PartCategory, number> // Count per category
}

export interface LowStockAlert {
  part: Part
  current_stock: number
  reorder_threshold: number
  shortage: number
}

/**
 * Form State Types
 */

export interface PartFormData {
  sku: string
  name: string
  description: string
  category: PartCategory
  unit: PartUnit
  unit_price: number // In dollars (will be converted to cents)
  quantity_in_stock: number
  reorder_threshold: number
  supplier_name: string
  supplier_sku: string
  supplier_contact: string
  notes: string
}

export interface JobPartFormData {
  part_id: string | null
  name: string
  description: string
  quantity: number
  unit: PartUnit
  unit_price: number // In dollars (will be converted to cents)
  notes: string
}

/**
 * Inventory Management Types
 */

export interface InventoryAdjustment {
  part_id: string
  quantity_change: number // Positive for additions, negative for removals
  reason: 'purchase' | 'job_usage' | 'loss' | 'return' | 'adjustment'
  notes?: string
  reference_id?: string // e.g., job_id if used on a job
}

export interface StockMovement {
  id: string
  part_id: string
  quantity_before: number
  quantity_change: number
  quantity_after: number
  reason: string
  notes?: string
  created_by: string
  created_at: string
}
