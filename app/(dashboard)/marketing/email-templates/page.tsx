'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Eye, Edit, Trash2, Mail, Sparkles, Copy } from 'lucide-react'
import type { EmailTemplate } from '@/types/email-templates'
import { EmailTemplateDialog } from '@/components/marketing/email-template-dialog'
import { AIEmailBuilder } from '@/components/email-templates/AIEmailBuilder'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'
import { confirmDialog } from '@/lib/confirm'

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterActive, setFilterActive] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'library' | 'ai-builder'>('library')

  useEffect(() => {
    if (activeTab === 'library') {
      fetchTemplates()
    }
  }, [filterType, filterActive, activeTab])

  async function fetchTemplates() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterActive !== 'all') params.append('active', filterActive)

      const response = await fetch(`/api/email-templates?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setSelectedTemplate(null)
    setDialogOpen(true)
  }

  async function handleClone(templateId: string) {
    try {
      const response = await fetch(`/api/email-templates/${templateId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        toastSuccess('Template cloned successfully')
        fetchTemplates()
      } else {
        const data = await response.json()
        toastError('Failed to clone template', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error cloning template:', error)
      toastError('Failed to clone template', 'Network error. Please try again.')
    }
  }

  function handleEdit(template: EmailTemplate) {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  async function handleDelete(templateId: string) {
    const confirmed = await confirmDialog({
      title: 'Delete Template',
      description: 'Are you sure you want to delete this template? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/email-templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toastSuccess('Template deleted successfully')
        fetchTemplates()
      } else {
        toastError('Failed to delete template', 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toastError('Failed to delete template', 'Network error. Please try again.')
    }
  }

  function getTypeColor(type: string | null): string {
    switch (type) {
      case 'review_request':
        return 'bg-blue-100 text-blue-700'
      case 'follow_up':
        return 'bg-green-100 text-green-700'
      case 'invoice':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Email Templates</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your email templates for campaigns and communications</p>
        </div>
        {activeTab === 'library' && (
          <Button onClick={handleCreate} className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'ai-builder')}>
        <TabsList>
          <TabsTrigger value="library">Template Library</TabsTrigger>
          <TabsTrigger value="ai-builder">AI Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6 mt-6">
          {/* Filters */}
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-[var(--color-text-primary)]">Template Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-sm bg-[var(--input-bg)] text-[var(--color-text-primary)]"
              >
                <option value="all">All Types</option>
                <option value="review_request">Review Request</option>
                <option value="follow_up">Follow Up</option>
                <option value="invoice">Invoice</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-[var(--color-text-primary)]">Status</label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-sm bg-[var(--input-bg)] text-[var(--color-text-primary)]"
              >
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Templates List */}
          {loading ? (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-[var(--color-text-subtle)] mx-auto mb-4" />
              <p className="text-[var(--color-text-primary)] font-medium mb-2">No templates found</p>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Create your first email template to get started</p>
              <Button onClick={handleCreate} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow bg-[var(--card-bg)] border-[var(--card-border)]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-[var(--color-text-primary)]">{template.name}</CardTitle>
                    <CardDescription className="mt-1">{template.subject}</CardDescription>
                  </div>
                  {template.is_active ? (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {template.template_type && (
                    <Badge className={getTypeColor(template.template_type)}>
                      {template.template_type.replace('_', ' ')}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClone(template.id)}
                      title="Clone template"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
          )}

          <EmailTemplateDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            template={selectedTemplate}
            onSuccess={fetchTemplates}
          />
        </TabsContent>

        <TabsContent value="ai-builder" className="mt-6">
          <AIEmailBuilder
            onTemplateCreated={(template) => {
              setActiveTab('library')
              fetchTemplates()
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

