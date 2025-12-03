'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, MapPin, DollarSign, User, Briefcase, MessageSquare, Clock, FileText, Save, PenTool } from 'lucide-react'
import { Job } from '@/types'
import { GenerateInvoiceDialog } from './generate-invoice-dialog'
import { SignatureCapture } from './signature-capture'
import { TimeTracker } from '@/components/tech/time-tracker'
import { LocationTracker } from '@/components/tech/location-tracker'
import { MaterialsDialog } from './materials-dialog'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'

interface JobDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string | null
}

export function JobDetailModal({ open, onOpenChange, jobId }: JobDetailModalProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [showSignatureCapture, setShowSignatureCapture] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [savingSignature, setSavingSignature] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false)

  useEffect(() => {
    if (open && jobId) {
      fetchJobDetails()
      fetchCurrentUser()
    }
  }, [open, jobId])

  async function fetchCurrentUser() {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserId(data.user.id)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  useEffect(() => {
    if (job) {
      setNotes(job.notes || '')
    }
  }, [job])

  async function fetchJobDetails() {
    if (!jobId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (response.ok) {
        const data = await response.json()
        setJob(data.job)
        setNotes(data.job.notes || '')
      } else {
        console.error('Failed to fetch job details')
      }

      // Fetch signature if job exists
      const sigResponse = await fetch(`/api/signatures?jobId=${jobId}`)
      if (sigResponse.ok) {
        const sigData = await sigResponse.json()
        if (sigData.signature) {
          setSignature(sigData.signature.signature_data || sigData.signature.signature_url)
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveNotes() {
    if (!jobId) return
    
    setSavingNotes(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      
      if (response.ok) {
        const data = await response.json()
        setJob(data.job)
        toastSuccess('Notes saved successfully')
      } else {
        const error = await response.json()
        toastError('Failed to save notes', error.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      toastError('Failed to save notes', 'Network error. Please try again.')
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleSaveSignature(signatureData: string) {
    if (!jobId || !job?.contact_id) return

    setSavingSignature(true)
    try {
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          contactId: job.contact_id,
          signatureData,
          signedByName: job.contact ? `${job.contact.first_name} ${job.contact.last_name}` : null,
        }),
      })

      if (response.ok) {
        setSignature(signatureData)
        setShowSignatureCapture(false)
        toastSuccess('Signature saved successfully')
      } else {
        const error = await response.json()
        toastError('Failed to save signature', error.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error saving signature:', error)
      toastError('Failed to save signature', 'Network error. Please try again.')
    } finally {
      setSavingSignature(false)
    }
  }

  async function handleLocationCaptured(location: { latitude: number; longitude: number; accuracy: number | null; timestamp: string }) {
    if (!jobId) return

    try {
      const response = await fetch(`/api/jobs/${jobId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save location')
      }
    } catch (error) {
      console.error('Error saving location:', error)
      throw error
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'scheduled': 
        return { bg: '#F0F4FF', text: '#3366FF', border: 'rgba(51, 102, 255, 0.2)' }
      case 'in_progress': 
        return { bg: '#FFF4E8', text: '#FF8D29', border: 'rgba(255, 141, 41, 0.2)' }
      case 'completed': 
        return { bg: '#EAFCF1', text: '#37C856', border: 'rgba(55, 200, 86, 0.2)' }
      case 'en_route':
        return { bg: '#FFFEEC', text: '#FFD92E', border: 'rgba(255, 217, 46, 0.2)' }
      case 'paid':
        return { bg: '#EAFCF1', text: '#37C856', border: 'rgba(55, 200, 86, 0.2)' }
      default: 
        return { bg: '#F2F4F7', text: '#667085', border: 'rgba(102, 112, 133, 0.2)' }
    }
  }

  if (!job) {
    return null
  }

  const statusColors = getStatusColor(job.status || 'lead')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#EBF0FF' }}
            >
              <Briefcase className="w-5 h-5" style={{ color: '#3366FF' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>Job Details</span>
                <Badge 
                  style={{ 
                    backgroundColor: statusColors.bg, 
                    color: statusColors.text,
                    borderColor: statusColors.border,
                    borderWidth: '1px'
                  }}
                >
                  {job.status?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-neutral-500">Loading job details...</div>
        ) : (
          <div className="space-y-6">
            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.description && (
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Description</p>
                    <p className="text-sm text-neutral-700">{job.description}</p>
                  </div>
                )}
                {job.scheduled_start && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">
                      Scheduled: {new Date(job.scheduled_start).toLocaleString()}
                    </span>
                  </div>
                )}
                {job.scheduled_end && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">
                      End: {new Date(job.scheduled_end).toLocaleString()}
                    </span>
                  </div>
                )}
                {job.total_amount && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700 font-semibold">
                      ${(job.total_amount / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                {job.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInvoiceDialogOpen(true)}
                    className="mt-2 border-[#56D470] text-[#37C856] hover:bg-[#EAFCF1]"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Generate Invoice
                  </Button>
                )}
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Job Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this job..."
                  className="min-h-24"
                />
                <Button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {savingNotes ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save Notes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            {job.contact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10" style={{ backgroundColor: '#EBF0FF' }}>
                      <AvatarFallback className="text-[#4B79FF] font-semibold">
                        {job.contact.first_name?.[0]}{job.contact.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {job.contact.first_name} {job.contact.last_name}
                      </p>
                      {job.contact.email && (
                        <p className="text-xs text-neutral-500">{job.contact.email}</p>
                      )}
                    </div>
                  </div>
                  {job.contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <span>Phone: {job.contact.phone}</span>
                    </div>
                  )}
                  {job.contact.address && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      <span>{job.contact.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assigned Technician */}
            {job.tech && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assigned Technician</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10" style={{ backgroundColor: '#EBF0FF' }}>
                      <AvatarFallback className="text-[#4B79FF] font-semibold">
                        {job.tech.full_name?.[0] || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{job.tech.full_name || 'Unnamed Tech'}</p>
                      {job.tech.role && (
                        <p className="text-xs text-neutral-500 capitalize">{job.tech.role}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Conversation */}
            {job.conversation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Related Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {job.conversation.subject || 'No subject'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Last message: {new Date(job.conversation.last_message_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor:
                          job.conversation.status === 'open'
                            ? '#EBF0FF'
                            : job.conversation.status === 'closed'
                            ? '#EAFCF1'
                            : '#FFF4E8',
                        color:
                          job.conversation.status === 'open'
                            ? '#4B79FF'
                            : job.conversation.status === 'closed'
                            ? '#37C856'
                            : '#FFA24D',
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderWidth: '1px',
                      }}
                    >
                      {job.conversation.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Signature */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Customer Signature</span>
                  {!signature && !showSignatureCapture && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSignatureCapture(true)}
                    >
                      <PenTool className="w-4 h-4 mr-1" />
                      Capture Signature
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showSignatureCapture ? (
                  <SignatureCapture
                    jobId={jobId!}
                    contactId={job.contact_id!}
                    onSave={handleSaveSignature}
                    onCancel={() => setShowSignatureCapture(false)}
                  />
                ) : signature ? (
                  <div className="space-y-2">
                    <img
                      src={signature}
                      alt="Customer signature"
                      className="border-2 border-neutral-200 rounded-lg p-2 bg-white max-w-full"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSignatureCapture(true)}
                    >
                      Replace Signature
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No signature captured yet</p>
                )}
              </CardContent>
            </Card>

            {/* Time Tracking */}
            {currentUserId && (
              <TimeTracker jobId={jobId!} userId={currentUserId} />
            )}

            {/* Location Tracking */}
            <LocationTracker
              jobId={jobId!}
              onLocationCaptured={handleLocationCaptured}
            />

            {/* Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Materials</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMaterialsDialogOpen(true)}
                  >
                    Manage Materials
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Materials Dialog */}
        {jobId && (
          <MaterialsDialog
            open={materialsDialogOpen}
            onOpenChange={setMaterialsDialogOpen}
            jobId={jobId}
          />
        )}

        {/* Generate Invoice Dialog */}
        {job && (
          <GenerateInvoiceDialog
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            job={job}
            onSuccess={() => {
              fetchJobDetails() // Refresh job data
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

