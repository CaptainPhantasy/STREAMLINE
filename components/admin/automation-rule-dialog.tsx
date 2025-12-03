'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AutomationRule {
  id: string
  name: string
  trigger: string
  trigger_config: any
  action: string
  action_config: any
  is_active: boolean
}

interface AutomationRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: AutomationRule | null
  onSuccess: () => void
}

const TRIGGER_TYPES = ['conversation_created', 'message_received', 'job_status_changed', 'job_created']
const ACTION_TYPES = ['send_email', 'create_job', 'assign_tech', 'update_status', 'send_notification']

export function AutomationRuleDialog({ open, onOpenChange, rule, onSuccess }: AutomationRuleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'conversation_created',
    triggerConditions: '',
    actionType: 'send_email',
    actionConfig: '',
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (rule) {
        setFormData({
          name: rule.name || '',
          triggerType: rule.trigger || 'conversation_created',
          triggerConditions: JSON.stringify(rule.trigger_config || {}, null, 2),
          actionType: rule.action || 'send_email',
          actionConfig: JSON.stringify(rule.action_config || {}, null, 2),
          isActive: rule.is_active !== false,
        })
      } else {
        setFormData({
          name: '',
          triggerType: 'conversation_created',
          triggerConditions: '{}',
          actionType: 'send_email',
          actionConfig: '{}',
          isActive: true,
        })
      }
      setError(null)
    }
  }, [open, rule])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name || !formData.triggerType || !formData.actionType) {
      setError('Name, trigger type, and action type are required')
      setLoading(false)
      return
    }

    let triggerConditions: any = {}
    let actionConfig: any = {}

    try {
      triggerConditions = JSON.parse(formData.triggerConditions || '{}')
    } catch (e) {
      setError('Trigger conditions must be valid JSON')
      setLoading(false)
      return
    }

    try {
      actionConfig = JSON.parse(formData.actionConfig || '{}')
    } catch (e) {
      setError('Action config must be valid JSON')
      setLoading(false)
      return
    }

    try {
      const url = rule ? `/api/automation-rules/${rule.id}` : '/api/automation-rules'
      const method = rule ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          triggerType: formData.triggerType,
          triggerConditions,
          actionType: formData.actionType,
          actionConfig,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess()
        onOpenChange(false)
      } else {
        setError(data.error || 'Failed to save rule')
      }
    } catch (error) {
      console.error('Error saving rule:', error)
      setError('Failed to save rule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Automation Rule' : 'Add Automation Rule'}</DialogTitle>
          <DialogDescription>
            Configure a rule that triggers actions based on conditions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Auto-assign urgent jobs"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type *</Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionType">Action Type *</Label>
                <Select
                  value={formData.actionType}
                  onValueChange={(value) => setFormData({ ...formData, actionType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerConditions">Trigger Conditions (JSON)</Label>
              <Textarea
                id="triggerConditions"
                placeholder='{"status": "urgent", "priority": "high"}'
                value={formData.triggerConditions}
                onChange={(e) => setFormData({ ...formData, triggerConditions: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-xs text-neutral-500">
                JSON object defining when this rule triggers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionConfig">Action Configuration (JSON)</Label>
              <Textarea
                id="actionConfig"
                placeholder='{"email_template": "welcome", "to": "contact"}'
                value={formData.actionConfig}
                onChange={(e) => setFormData({ ...formData, actionConfig: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-xs text-neutral-500">
                JSON object defining what action to take
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
              />
              <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setError(null)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4B79FF] hover:bg-[#3366FF]">
              {loading ? (rule ? 'Updating...' : 'Creating...') : (rule ? 'Update Rule' : 'Create Rule')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

