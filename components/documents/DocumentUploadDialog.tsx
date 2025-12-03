'use client'

/**
 * DocumentUploadDialog Component
 *
 * Multi-file drag-and-drop upload dialog for job documents.
 * Supports PDFs, images, and other document types.
 *
 * @example
 * ```tsx
 * <DocumentUploadDialog
 *   jobId="123"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onUploadComplete={(docs) => console.log('Uploaded:', docs)}
 *   allowedTypes={['pdf', 'estimate', 'invoice']}
 *   maxFiles={5}
 * />
 * ```
 */

import { useState, useCallback, useRef } from 'react'
import { Upload, X, FileIcon, Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { DocumentUploadDialogProps, Document, DocumentType } from '@/lib/types/documents'
import { cn } from '@/lib/utils'

interface FileWithMetadata {
  file: File
  preview?: string
  type: DocumentType
  uploading: boolean
  uploaded: boolean
  progress: number
  error?: string
}

export function DocumentUploadDialog({
  jobId,
  open,
  onOpenChange,
  onUploadComplete,
  allowedTypes = ['pdf', 'estimate', 'invoice', 'contract', 'signature', 'other'],
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  accept = 'image/*,.pdf,.doc,.docx',
}: DocumentUploadDialogProps) {
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  /**
   * Validate file
   */
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(0)}MB`
    }

    return null
  }

  /**
   * Auto-detect document type from file
   */
  const detectDocumentType = (file: File): DocumentType => {
    const name = file.name.toLowerCase()
    const type = file.type.toLowerCase()

    if (type.startsWith('image/')) return 'photo'
    if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
    if (name.includes('estimate')) return 'estimate'
    if (name.includes('invoice')) return 'invoice'
    if (name.includes('contract')) return 'contract'
    if (name.includes('signature') || name.includes('sign')) return 'signature'

    return 'other'
  }

  /**
   * Add files to upload list
   */
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)

      // Check max files limit
      if (files.length + fileArray.length > maxFiles) {
        toast({
          title: 'Too many files',
          description: `Maximum ${maxFiles} files allowed`,
          variant: 'destructive',
        })
        return
      }

      // Validate and add files
      const validFiles: FileWithMetadata[] = []

      for (const file of fileArray) {
        const error = validateFile(file)

        if (error) {
          toast({
            title: 'Invalid file',
            description: `${file.name}: ${error}`,
            variant: 'destructive',
          })
          continue
        }

        // Create preview for images
        let preview: string | undefined

        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file)
        }

        validFiles.push({
          file,
          preview,
          type: detectDocumentType(file),
          uploading: false,
          uploaded: false,
          progress: 0,
        })
      }

      setFiles((prev) => [...prev, ...validFiles])
    },
    [files.length, maxFiles, maxFileSize, toast]
  )

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles)
    }

    // Reset input
    e.target.value = ''
  }

  /**
   * Update file type
   */
  const updateFileType = (index: number, type: DocumentType) => {
    setFiles((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], type }
      return updated
    })
  }

  /**
   * Remove file from list
   */
  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index]
      // Revoke object URL if exists
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  /**
   * Upload all files
   */
  const uploadFiles = async () => {
    const uploadedDocuments: Document[] = []

    for (let i = 0; i < files.length; i++) {
      const fileWithMetadata = files[i]

      if (fileWithMetadata.uploaded) continue

      // Update status
      setFiles((prev) => {
        const updated = [...prev]
        updated[i] = { ...updated[i], uploading: true, progress: 0 }
        return updated
      })

      try {
        // Create form data
        const formData = new FormData()
        formData.append('file', fileWithMetadata.file)
        formData.append('jobId', jobId)
        formData.append('type', fileWithMetadata.type)

        // Upload
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Upload failed: ${response.status}`)
        }

        const data = await response.json()
        const document: Document = data.document

        uploadedDocuments.push(document)

        // Update status
        setFiles((prev) => {
          const updated = [...prev]
          updated[i] = {
            ...updated[i],
            uploading: false,
            uploaded: true,
            progress: 100,
          }
          return updated
        })
      } catch (error) {
        console.error('Upload error:', error)
        const err = error as Error

        // Update status
        setFiles((prev) => {
          const updated = [...prev]
          updated[i] = {
            ...updated[i],
            uploading: false,
            uploaded: false,
            progress: 0,
            error: err.message,
          }
          return updated
        })
      }
    }

    if (uploadedDocuments.length > 0) {
      toast({
        title: 'Upload complete',
        description: `${uploadedDocuments.length} document(s) uploaded successfully`,
      })

      onUploadComplete?.(uploadedDocuments)

      // Close dialog after short delay
      setTimeout(() => {
        handleClose()
      }, 1000)
    }
  }

  /**
   * Close dialog and cleanup
   */
  const handleClose = () => {
    // Revoke all object URLs
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })

    setFiles([])
    onOpenChange(false)
  }

  const canUpload = files.length > 0 && files.every((f) => !f.uploading)
  const allUploaded = files.length > 0 && files.every((f) => f.uploaded)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload documents related to this job (max {maxFiles} files,{' '}
            {(maxFileSize / 1024 / 1024).toFixed(0)}MB each)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag and drop area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragging
                ? 'border-theme-accent-primary bg-theme-accent-primary/10'
                : 'border-[var(--card-border)] hover:border-theme-accent-primary'
            )}
          >
            <Upload className="mx-auto h-12 w-12 text-[var(--color-text-subtle)] mb-4" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1">
              Supports images, PDFs, and documents
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({files.length})</Label>

              {files.map((fileWithMetadata, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  {/* Preview or icon */}
                  <div className="flex-shrink-0">
                    {fileWithMetadata.preview ? (
                      <img
                        src={fileWithMetadata.preview}
                        alt={fileWithMetadata.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <FileIcon className="w-12 h-12 text-[var(--color-text-subtle)]" />
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileWithMetadata.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(fileWithMetadata.file.size / 1024).toFixed(0)} KB
                    </p>

                    {/* Type selector */}
                    {!fileWithMetadata.uploaded && !fileWithMetadata.uploading && (
                      <Select
                        value={fileWithMetadata.type}
                        onValueChange={(value) =>
                          updateFileType(index, value as DocumentType)
                        }
                      >
                        <SelectTrigger className="w-32 h-7 text-xs mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedTypes.map((type) => (
                            <SelectItem key={type} value={type} className="text-xs">
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Progress bar */}
                    {fileWithMetadata.uploading && (
                      <Progress value={fileWithMetadata.progress} className="h-1 mt-2" />
                    )}

                    {/* Error message */}
                    {fileWithMetadata.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {fileWithMetadata.error}
                      </p>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {fileWithMetadata.uploading && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    )}
                    {fileWithMetadata.uploaded && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {!fileWithMetadata.uploading && !fileWithMetadata.uploaded && (
                      <Button
                        onClick={() => removeFile(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            {allUploaded ? 'Close' : 'Cancel'}
          </Button>
          {!allUploaded && (
            <Button onClick={uploadFiles} disabled={!canUpload}>
              {files.some((f) => f.uploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${files.length} File(s)`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Export types for external use
 */
export type { DocumentUploadDialogProps }
