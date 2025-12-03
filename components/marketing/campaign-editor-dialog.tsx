'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Campaign, CampaignCreateRequest, CampaignUpdateRequest, CampaignType, CampaignStatus } from '@/types/campaigns'
import type { EmailTemplate } from '@/types/email-templates'

interface CampaignEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
  onSuccess: () => void
}

export function CampaignEditorDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: CampaignEditorDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'email' as CampaignType,
    status: 'draft' as CampaignStatus,
    emailTemplateId: '',
    scheduledStart: '',
    scheduledEnd: '',
  })

  useEffect(() => {
    if (open) {
      fetchTemplates()
      if (campaign) {
        setFormData({
          name: campaign.name,
          campaignType: campaign.campaign_type,
          status: campaign.status,
          emailTemplateId: campaign.email_template_id || '',
          scheduledStart: campaign.scheduled_start
            ? new Date(campaign.scheduled_start).toISOString().slice(0, 16)
            : '',
          scheduledEnd: campaign.scheduled_end
            ? new Date(campaign.scheduled_end).toISOString().slice(0, 16)
            : '',
        })
      } else {
        setFormData({
          name: '',
          campaignType: 'email',
          status: 'draft',
          emailTemplateId: '',
          scheduledStart: '',
          scheduledEnd: '',
        })
      }
      setError(null)
    }
  }, [open, campaign])

  async function fetchTemplates() {
    try {
      setLoadingTemplates(true)
      const response = await fetch('/api/email-templates?active=true')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload: CampaignCreateRequest | CampaignUpdateRequest = {
        name: formData.name,
        campaignType: formData.campaignType,
        status: formData.status,
        emailTemplateId: formData.emailTemplateId && formData.emailTemplateId !== 'none' ? formData.emailTemplateId : undefined,
        scheduledStart: formData.scheduledStart || undefined,
        scheduledEnd: formData.scheduledEnd || undefined,
      }

      const url = campaign ? `/api/campaigns/${campaign.id}` : '/api/campaigns'
      const method = campaign ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save campaign')
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
          <DialogDescription>
            {campaign
              ? 'Update your email marketing campaign settings'
              : 'Create a new email marketing campaign'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Summer Sale 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignType">Campaign Type *</Label>
            <Select
              value={formData.campaignType}
              onValueChange={(value) => setFormData({ ...formData, campaignType: value as CampaignType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Campaign</SelectItem>
                <SelectItem value="sms">SMS Campaign</SelectItem>
                <SelectItem value="review_request">Review Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as CampaignStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.campaignType === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="emailTemplateId">Email Template</Label>
              <Select
                value={formData.emailTemplateId}
                onValueChange={(value) => setFormData({ ...formData, emailTemplateId: value })}
                disabled={loadingTemplates}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingTemplates ? 'Loading...' : 'Select a template'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Scheduled Start</Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                value={formData.scheduledStart}
                onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledEnd">Scheduled End</Label>
              <Input
                id="scheduledEnd"
                type="datetime-local"
                value={formData.scheduledEnd}
                onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4B79FF] hover:bg-[#3366FF] text-white">
              {loading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

