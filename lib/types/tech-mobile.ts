/**
 * Type definitions for Tech Mobile Components
 * Used across all mobile tech features
 */

/**
 * Tech Job representation
 */
export interface TechJob {
  id: string
  description: string
  status: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'
  scheduledStart: string
  scheduledEnd?: string
  estimatedDuration?: number
  contact: {
    id: string
    firstName: string
    lastName: string
    address: string
    phone: string
    email?: string
  }
  location?: {
    lat: number
    lng: number
  }
  notes?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

/**
 * Job photo with metadata
 */
export interface JobPhoto {
  id: string
  jobId: string
  url: string
  type: 'before' | 'after' | 'progress' | 'signature'
  capturedAt: string
  uploadedAt?: string
  metadata?: {
    width?: number
    height?: number
    fileSize?: number
    location?: {
      lat: number
      lng: number
    }
  }
}

/**
 * Material item for quick add
 */
export interface Material {
  id: string
  name: string
  description?: string
  quantity: number
  unit: 'each' | 'ft' | 'lb' | 'gal' | 'box' | 'roll' | 'bag'
  cost?: number
  barcode?: string
  category?: string
}

/**
 * Voice note recording
 */
export interface VoiceNote {
  id: string
  jobId: string
  transcript: string
  audioUrl?: string
  duration?: number
  createdAt: string
  isTranscribing?: boolean
}

/**
 * Time clock entry
 */
export interface TimeEntry {
  id: string
  userId: string
  jobId?: string
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
  timestamp: string
  location?: {
    lat: number
    lng: number
  }
  notes?: string
}

/**
 * Offline queue item
 */
export interface OfflineQueueItem {
  id: string
  type: 'job_start' | 'job_complete' | 'photo_upload' | 'material_add' | 'time_clock' | 'voice_note'
  jobId?: string
  data: Record<string, any>
  createdAt: string
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced'
  retryCount: number
  lastError?: string
}

/**
 * Job completion wizard step
 */
export interface CompletionStep {
  id: string
  title: string
  description: string
  required: boolean
  completed: boolean
  data?: Record<string, any>
}

/**
 * Component Props Types
 */

export interface TechJobCardProps {
  job: TechJob
  onJobClick?: (job: TechJob) => void
  onCallCustomer?: (phone: string) => void
  onNavigate?: (address: string) => void
  showActions?: boolean
  className?: string
}

export interface JobPhotoGalleryProps {
  photos: JobPhoto[]
  initialIndex?: number
  onClose?: () => void
  onDelete?: (photoId: string) => void
  showDelete?: boolean
  className?: string
}

export interface QuickJobActionsProps {
  jobId: string
  jobStatus: TechJob['status']
  customerPhone: string
  onStartJob?: () => void
  onCompleteJob?: () => void
  onCallCustomer?: () => void
  onAddPhotos?: () => void
  onAddNotes?: () => void
  disabled?: boolean
  className?: string
}

export interface MaterialsQuickAddProps {
  jobId: string
  recentMaterials?: Material[]
  onMaterialAdd?: (material: Partial<Material>) => void
  onBarcodeScanned?: (barcode: string) => void
  enableBarcode?: boolean
  enableVoice?: boolean
  className?: string
}

export interface VoiceNoteRecorderProps {
  jobId: string
  onNoteRecorded?: (note: VoiceNote) => void
  onTranscriptReady?: (transcript: string) => void
  maxDuration?: number
  autoSave?: boolean
  className?: string
}

export interface TimeClockCardProps {
  currentStatus: 'clocked_out' | 'clocked_in' | 'on_break'
  lastEntry?: TimeEntry
  todayHours?: number
  onClockIn?: () => void
  onClockOut?: () => void
  onBreakStart?: () => void
  onBreakEnd?: () => void
  trackLocation?: boolean
  className?: string
}

export interface OfflineQueueIndicatorProps {
  queueItems: OfflineQueueItem[]
  onSync?: () => void
  onViewQueue?: () => void
  autoSync?: boolean
  className?: string
}

export interface JobCompletionWizardProps {
  jobId: string
  job: TechJob
  steps?: CompletionStep[]
  onStepComplete?: (stepId: string, data?: Record<string, any>) => void
  onWizardComplete?: () => void
  onCancel?: () => void
  className?: string
}

/**
 * API Response Types
 */

export interface TechJobsResponse {
  jobs: TechJob[]
  total: number
  page: number
  limit: number
}

export interface MaterialAddResponse {
  material: Material
  jobId: string
  success: boolean
}

export interface TimeClockResponse {
  entry: TimeEntry
  todayHours: number
  status: TimeClockCardProps['currentStatus']
}

export interface OfflineQueueSyncResponse {
  synced: number
  failed: number
  pending: number
  errors?: Array<{ id: string; error: string }>
}
