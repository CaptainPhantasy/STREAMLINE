'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { JobChecklistItem, ChecklistProgress, JobChecklistTemplate } from '@/types/job-checklists'

interface JobChecklistProps {
  jobId: string
}

export function JobChecklist({ jobId }: JobChecklistProps) {
  const [items, setItems] = useState<JobChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [templates, setTemplates] = useState<JobChecklistTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [progress, setProgress] = useState<ChecklistProgress>({
    total: 0,
    completed: 0,
    percentage: 0,
  })

  useEffect(() => {
    fetchChecklist()
    fetchTemplates()
  }, [jobId])

  async function fetchChecklist() {
    try {
      setLoading(true)
      const response = await fetch(`/api/jobs/${jobId}/checklist`)

      if (!response.ok) {
        throw new Error('Failed to fetch checklist')
      }

      const data = await response.json()
      setItems(data.items || [])
      setProgress(data.progress || { total: 0, completed: 0, percentage: 0 })
    } catch (error: any) {
      console.error('Error fetching checklist:', error)
      toast.error('Failed to load checklist')
    } finally {
      setLoading(false)
    }
  }

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/jobs/checklist-templates?active_only=true')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  async function handleAddItem() {
    if (!newItemTitle.trim()) {
      toast.error('Please enter a title')
      return
    }

    setAdding(true)

    try {
      const response = await fetch(`/api/jobs/${jobId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemTitle,
          description: newItemDescription || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add item')
      }

      const { item } = await response.json()
      setItems([...items, item])
      setNewItemTitle('')
      setNewItemDescription('')
      fetchChecklist() // Refresh to get updated progress
      toast.success('Checklist item added')
    } catch (error: any) {
      console.error('Error adding item:', error)
      toast.error(error.message || 'Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggleComplete(itemId: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/jobs/${jobId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      fetchChecklist() // Refresh to get updated progress
    } catch (error: any) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/jobs/${jobId}/checklist/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      setItems(items.filter(i => i.id !== itemId))
      fetchChecklist() // Refresh to get updated progress
      toast.success('Item deleted')
    } catch (error: any) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  async function handleApplyTemplate() {
    if (!selectedTemplate) {
      toast.error('Please select a template')
      return
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/checklist/apply-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selectedTemplate }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to apply template')
      }

      fetchChecklist()
      setSelectedTemplate('')
      toast.success('Template applied successfully')
    } catch (error: any) {
      console.error('Error applying template:', error)
      toast.error(error.message || 'Failed to apply template')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Job Checklist</CardTitle>
            <CardDescription>
              Track progress: {progress.completed} of {progress.total} completed
            </CardDescription>
          </div>
          {templates.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Apply template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate}
                size="sm"
              >
                Apply
              </Button>
            </div>
          )}
        </div>
        {progress.total > 0 && (
          <Progress value={progress.percentage} className="mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checklist Items */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No checklist items yet. Add one below or apply a template.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <Checkbox
                  checked={item.is_completed}
                  onCheckedChange={() => handleToggleComplete(item.id, item.is_completed)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p
                        className={cn(
                          'font-medium',
                          item.is_completed && 'line-through text-gray-500'
                        )}
                      >
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                      {item.completed_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Completed {new Date(item.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Item */}
        <div className="border-t pt-4 space-y-3">
          <div className="space-y-2">
            <Label>Add Checklist Item</Label>
            <Input
              placeholder="Item title..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddItem()
                }
              }}
            />
            <Textarea
              placeholder="Description (optional)..."
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            onClick={handleAddItem}
            disabled={adding || !newItemTitle.trim()}
            size="sm"
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

