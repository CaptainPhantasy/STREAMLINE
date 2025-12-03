'use client'

/**
 * DocumentViewer Component
 *
 * PDF and image viewer with download and delete functionality.
 *
 * @example
 * ```tsx
 * <DocumentViewer
 *   document={selectedDoc}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   showDownload
 *   showDelete
 * />
 * ```
 */

import { Download, Trash2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { DocumentViewerProps, Document, JobPhoto } from '@/lib/types/documents'

export function DocumentViewer({
  document,
  open,
  onOpenChange,
  showDownload = true,
  showDelete = false,
  onDelete,
  className,
}: DocumentViewerProps) {
  const { toast } = useToast()

  /**
   * Check if document is a photo
   */
  const isPhoto = (doc: Document | JobPhoto): doc is JobPhoto => {
    return 'photo_url' in doc
  }

  /**
   * Get document URL
   */
  const getDocumentUrl = (): string => {
    return isPhoto(document) ? document.photo_url : document.public_url
  }

  /**
   * Get document name
   */
  const getDocumentName = (): string => {
    if (isPhoto(document)) {
      return `photo_${document.id}.jpg`
    }
    return document.file_name || `document_${document.id}`
  }

  /**
   * Check if PDF
   */
  const isPdf = (): boolean => {
    if (isPhoto(document)) return false
    return document.file_type === 'application/pdf' || document.type === 'pdf'
  }

  /**
   * Download document
   */
  const handleDownload = async () => {
    try {
      const url = getDocumentUrl()
      const name = getDocumentName()

      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = name
      link.click()

      URL.revokeObjectURL(downloadUrl)

      toast({
        title: 'Download started',
        description: name,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download failed',
        description: 'Failed to download document',
        variant: 'destructive',
      })
    }
  }

  /**
   * Delete document
   */
  const handleDelete = async () => {
    if (!onDelete) return

    const confirmed = window.confirm('Are you sure you want to delete this document?')
    if (!confirmed) return

    onDelete(document.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>{getDocumentName()}</DialogTitle>
            <Button
              onClick={() => onOpenChange(false)}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 pt-0">
          {isPdf() ? (
            <iframe
              src={getDocumentUrl()}
              className="w-full h-[600px] border rounded"
              title={getDocumentName()}
            />
          ) : (
            <img
              src={getDocumentUrl()}
              alt={getDocumentName()}
              className="w-full h-auto rounded"
            />
          )}

          {isPhoto(document) && document.caption && (
            <p className="text-sm text-muted-foreground mt-4">
              {document.caption}
            </p>
          )}
        </div>

        <DialogFooter className="p-6 pt-4">
          {showDownload && (
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
          {showDelete && (
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { DocumentViewerProps }
