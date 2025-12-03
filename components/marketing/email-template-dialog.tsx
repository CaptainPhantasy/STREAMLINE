'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Save } from 'lucide-react'
import type { EmailTemplate, EmailTemplateType } from '@/types/email-templates'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'

interface EmailTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: EmailTemplate | null
  onSuccess: () => void
}

export function EmailTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: EmailTemplateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    bodyHtml: '',
    bodyText: '',
    templateType: 'custom' as EmailTemplateType,
    isActive: true,
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        bodyHtml: template.body_html || '',
        bodyText: template.body_text || '',
        templateType: (template.template_type as EmailTemplateType) || 'custom',
        isActive: template.is_active,
      })
    } else {
      setFormData({
        name: '',
        subject: '',
        bodyHtml: '',
        bodyText: '',
        templateType: 'custom',
        isActive: true,
      })
    }
  }, [template, open])

  async function handleSubmit() {
    setLoading(true)
    try {
      const url = template ? `/api/email-templates/${template.id}` : '/api/email-templates'
      const method = template ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          subject: formData.subject,
          bodyHtml: formData.bodyHtml,
          bodyText: formData.bodyText,
          templateType: formData.templateType,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toastSuccess(template ? 'Template updated successfully' : 'Template created successfully')
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
        toastError('Failed to save template', error.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toastError('Failed to save template', 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {template ? 'Update your email template' : 'Create a new email template for your campaigns'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Review Request Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Template Type</Label>
              <Select
                value={formData.templateType}
                onValueChange={(value) => setFormData({ ...formData, templateType: value as EmailTemplateType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review_request">Review Request</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject line"
            />
            <p className="text-xs text-neutral-500">
              Use variables like {'{{contact_name}}'}, {'{{job_id}}'}, etc.
            </p>
          </div>

          <Tabs defaultValue="html" className="w-full">
            <TabsList>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Plain Text</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="space-y-2">
              <Label htmlFor="bodyHtml">HTML Body</Label>
              <Textarea
                id="bodyHtml"
                value={formData.bodyHtml}
                onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                placeholder="<html>...</html>"
                className="min-h-[300px] font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="text" className="space-y-2">
              <Label htmlFor="bodyText">Plain Text Body</Label>
              <Textarea
                id="bodyText"
                value={formData.bodyText}
                onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                placeholder="Plain text version..."
                className="min-h-[300px]"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="border rounded-md p-4 bg-white min-h-[300px]">
                <div className="mb-2 text-sm font-medium">Subject: {formData.subject || '(No subject)'}</div>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.bodyHtml || '<p>No content</p>' }}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Template is active
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-[#4B79FF] hover:bg-[#3366FF]">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : template ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

