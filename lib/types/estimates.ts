/**
 * TypeScript Types for Estimates System
 *
 * Defines all types for estimates/quotes functionality
 * Matches database schema from 20250127_add_estimates_system.sql
 */

/**
 * Estimate Status Types
 */
export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'

/**
 * Estimate Item Types
 */
export type EstimateItemType = 'labor' | 'material' | 'equipment' | 'other'

/**
 * Main Estimate Interface
 */
export interface Estimate {
  id: string
  account_id: string
  contact_id: string
  estimate_number: string
  title?: string
  description?: string
  subtotal: number // In cents
  tax_rate: number // e.g., 0.08 for 8%
  tax_amount: number // In cents
  total_amount: number // In cents
  status: EstimateStatus
  valid_until?: string // ISO date string
  sent_at?: string
  viewed_at?: string
  accepted_at?: string
  rejected_at?: string
  rejection_reason?: string
  notes?: string // Internal notes
  customer_notes?: string // Customer-facing notes
  converted_to_job_id?: string
  created_by: string
  created_at: string
  updated_at: string

  // Joined data (optional)
  contact?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  estimate_items?: EstimateItem[]
}

/**
 * Estimate Line Item Interface
 */
export interface EstimateItem {
  id: string
  account_id: string
  estimate_id: string
  item_type: EstimateItemType
  name: string
  description?: string
  quantity: number
  unit: string // 'each', 'hour', 'ft', 'lb', etc.
  unit_price: number // In cents
  total_price: number // In cents (quantity * unit_price)
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * API Request/Response Types
 */

export interface CreateEstimateRequest {
  contact_id: string
  title?: string
  description?: string
  items: Array<{
    item_type: EstimateItemType
    name: string
    description?: string
    quantity: number
    unit?: string
    unit_price: number // In cents
  }>
  tax_rate?: number
  valid_until?: string
  customer_notes?: string
  notes?: string
}

export interface UpdateEstimateRequest {
  title?: string
  description?: string
  tax_rate?: number
  valid_until?: string
  customer_notes?: string
  notes?: string
  status?: EstimateStatus
}

export interface GetEstimatesParams {
  page?: number
  limit?: number
  status?: EstimateStatus
  contact_id?: string
  search?: string
  sort?: 'asc' | 'desc'
  sort_by?: 'created_at' | 'total_amount' | 'estimate_number'
}

export interface GetEstimatesResponse {
  estimates: Estimate[]
  total: number
  page: number
  limit: number
}

export interface SendEstimateRequest {
  email: string
  subject?: string
  message?: string
  cc?: string[]
}

export interface ConvertEstimateToJobRequest {
  scheduled_date?: string
  assigned_to?: string
  notes?: string
}

/**
 * Component Prop Types
 */

export interface EstimateListViewProps {
  estimates?: Estimate[]
  loading?: boolean
  error?: Error | null
  onSelectEstimate?: (estimate: Estimate) => void
  onCreateNew?: () => void
  className?: string
}

export interface EstimateDetailPanelProps {
  estimate: Estimate
  loading?: boolean
  onEdit?: () => void
  onSend?: () => void
  onConvert?: () => void
  onDelete?: () => void
  onDownloadPDF?: () => void
  className?: string
}

export interface EstimateBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  estimate?: Estimate // If editing existing
  onSave?: (estimate: Estimate) => void
  className?: string
}

/**
 * Utility Types
 */

export interface EstimateStats {
  total_estimates: number
  total_value: number // In cents
  accepted_count: number
  accepted_value: number // In cents
  pending_count: number
  conversion_rate: number // Percentage
}

/**
 * Form State Types
 */

export interface EstimateFormData {
  contact_id: string
  title: string
  description: string
  items: EstimateItemFormData[]
  tax_rate: number
  valid_until?: Date
  customer_notes: string
  notes: string
}

export interface EstimateItemFormData {
  item_type: EstimateItemType
  name: string
  description: string
  quantity: number
  unit: string
  unit_price: number // In dollars (will be converted to cents)
}

/**
 * PDF Generation Types
 */

export interface EstimatePDFOptions {
  include_terms?: boolean
  include_notes?: boolean
  watermark?: string
  logo_url?: string
}
