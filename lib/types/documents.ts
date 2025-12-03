/**
 * Document Management Type Definitions
 *
 * Modular, reusable types for document upload, storage, and management.
 * Can be extracted to other projects.
 */

/**
 * Document type classification
 */
export type DocumentType =
  | 'photo'
  | 'pdf'
  | 'estimate'
  | 'invoice'
  | 'contract'
  | 'signature'
  | 'other'

/**
 * Photo category for before/after tracking
 */
export type PhotoCategory = 'before' | 'after' | 'progress' | 'completed'

/**
 * Document entity from database
 */
export interface Document {
  id: string
  account_id: string
  job_id: string
  type: DocumentType
  file_name: string
  file_size: number
  file_type: string // MIME type
  storage_path: string
  public_url: string
  thumbnail_url?: string
  caption?: string
  category?: PhotoCategory
  uploaded_by: string
  created_at: string
  updated_at: string
}

/**
 * Job photo entity (specific to photos)
 */
export interface JobPhoto {
  id: string
  account_id: string
  job_id: string
  photo_url: string
  thumbnail_url?: string
  caption?: string
  category?: PhotoCategory
  taken_by: string
  created_at: string
}

/**
 * Upload queue item for offline support
 */
export interface UploadQueueItem {
  id: string
  jobId: string
  file: File | Blob
  fileName: string
  fileType: string
  caption?: string
  category?: PhotoCategory
  documentType: DocumentType
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  progress: number
  error?: string
  createdAt: number
  retryCount: number
}

/**
 * Compression options for photos
 */
export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0-1
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
  preserveExif?: boolean
}

/**
 * Compressed photo result
 */
export interface CompressedPhoto {
  blob: Blob
  dataUrl: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  width: number
  height: number
}

/**
 * Photo capture result from camera
 */
export interface PhotoCaptureResult {
  file: File
  dataUrl: string
  width: number
  height: number
  timestamp: number
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void

/**
 * Upload options
 */
export interface UploadOptions {
  onProgress?: UploadProgressCallback
  signal?: AbortSignal
  compress?: boolean
  compressionOptions?: CompressionOptions
}

/**
 * API response for document upload
 */
export interface UploadDocumentResponse {
  success: boolean
  document?: Document
  photo?: JobPhoto
  error?: string
}

/**
 * API response for fetching documents
 */
export interface GetDocumentsResponse {
  documents: Document[]
  total: number
}

/**
 * API response for fetching job photos
 */
export interface GetJobPhotosResponse {
  photos: JobPhoto[]
}

/**
 * Props for PhotoCaptureButton component
 */
export interface PhotoCaptureButtonProps {
  jobId: string
  onCapture?: (result: PhotoCaptureResult) => void
  onUploadComplete?: (photo: JobPhoto) => void
  onError?: (error: Error) => void
  autoUpload?: boolean
  compress?: boolean
  compressionOptions?: CompressionOptions
  category?: PhotoCategory
  disabled?: boolean
  className?: string
}

/**
 * Props for PhotoCompressor component (utility)
 */
export interface PhotoCompressorProps {
  file: File | Blob
  options?: CompressionOptions
  onComplete: (result: CompressedPhoto) => void
  onError?: (error: Error) => void
  showProgress?: boolean
}

/**
 * Props for PhotoUploadQueue component
 */
export interface PhotoUploadQueueProps {
  onQueueChange?: (queueLength: number) => void
  onUploadComplete?: (photo: JobPhoto) => void
  onUploadError?: (error: Error, item: UploadQueueItem) => void
  autoSync?: boolean
  maxRetries?: number
  className?: string
}

/**
 * Props for DocumentUploadDialog component
 */
export interface DocumentUploadDialogProps {
  jobId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (documents: Document[]) => void
  allowedTypes?: DocumentType[]
  maxFiles?: number
  maxFileSize?: number // in bytes
  accept?: string // MIME types
}

/**
 * Props for DocumentViewer component
 */
export interface DocumentViewerProps {
  document: Document | JobPhoto
  open: boolean
  onOpenChange: (open: boolean) => void
  showDownload?: boolean
  showDelete?: boolean
  onDelete?: (id: string) => void
  className?: string
}

/**
 * Props for PhotoGallery component
 */
export interface PhotoGalleryProps {
  jobId: string
  photos?: JobPhoto[]
  loading?: boolean
  error?: Error | null
  onPhotoClick?: (photo: JobPhoto) => void
  onPhotoDelete?: (photoId: string) => void
  showBeforeAfterToggle?: boolean
  enableLightbox?: boolean
  columns?: number
  className?: string
}

/**
 * Gallery filter options
 */
export interface GalleryFilterOptions {
  category?: PhotoCategory
  dateFrom?: Date
  dateTo?: Date
  uploadedBy?: string
}
