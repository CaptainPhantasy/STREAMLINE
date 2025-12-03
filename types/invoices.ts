import { Json } from './index'
import { Job, Contact } from './index'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  account_id: string
  job_id: string | null
  contact_id: string
  invoice_number: string
  amount: number // In cents
  tax_amount: number // In cents
  total_amount: number // In cents
  status: InvoiceStatus
  due_date: string | null
  paid_at: string | null
  stripe_payment_link: string | null
  stripe_payment_intent_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relations
  job?: Job
  contact?: Contact
}

export interface InvoiceCreateRequest {
  jobId?: string
  contactId: string
  amount: number
  taxAmount?: number
  totalAmount: number
  dueDate?: string
  notes?: string
}

export interface InvoiceUpdateRequest {
  amount?: number
  taxAmount?: number
  totalAmount?: number
  status?: InvoiceStatus
  dueDate?: string
  notes?: string
}

export interface InvoiceListResponse {
  invoices: Invoice[]
}

export interface InvoiceDetailResponse {
  invoice: Invoice
}

export interface InvoiceCreateResponse {
  success: true
  invoice: Invoice
}

