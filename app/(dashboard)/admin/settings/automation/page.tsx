/**
 * Automation Settings Page (Admin Only)
 * Create and manage automation rules
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, Plus, Edit2, Trash2 } from 'lucide-react'
import { SettingToggle } from '@/components/settings/SettingToggle'
import type { AutomationRule, AutomationRuleTemplate } from '@/lib/types/settings'

const RULE_TEMPLATES: AutomationRuleTemplate[] = [
  {
    name: 'Auto-assign jobs to nearest tech',
    description: 'Automatically assign new jobs to the closest available technician',
    category: 'assignments',
    trigger: {
      type: 'job_created',
      conditions: { status: 'scheduled' },
    },
    action: {
      type: 'assign_job',
      config: { method: 'nearest_available' },
    },
  },
  {
    name: 'Send invoice reminder after X days',
    description: 'Send automated reminder emails for overdue invoices',
    category: 'invoices',
    trigger: {
      type: 'invoice_overdue',
      conditions: { days_overdue: 7 },
    },
    action: {
      type: 'send_email',
      config: { template: 'invoice_reminder' },
    },
  },
  {
    name: 'Send thank you email after job',
    description: 'Automatically send a thank you email when a job is completed',
    category: 'communications',
    trigger: {
      type: 'job_completed',
    },
    action: {
      type: 'send_email',
      config: { template: 'job_completed_thank_you' },
    },
  },
  {
    name: 'Escalate unread messages after X hours',
    description: 'Create notification for dispatcher if messages go unanswered',
    category: 'communications',
    trigger: {
      type: 'message_received',
      conditions: { hours_unread: 4 },
    },
    action: {
      type: 'create_notification',
      config: { role: 'dispatcher', priority: 'high' },
    },
  },
]

export default function AutomationSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user && (data.user.role === 'admin' || data.user.role === 'owner')) {
          setIsAdmin(true)
          fetchRules()
        } else {
          router.push('/inbox')
        }
      } else {
        router.push('/inbox')
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/inbox')
    } finally {
      setLoading(false)
    }
  }

  async function fetchRules() {
    try {
      const response = await fetch('/api/settings/automation/rules')
      if (!response.ok) throw new Error('Failed to fetch automation rules')
      const data = await response.json()
      setRules(data.rules || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleToggleRule(ruleId: string, enabled: boolean) {
    try {
      const response = await fetch(`/api/settings/automation/rules/${ruleId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      if (!response.ok) throw new Error('Failed to toggle rule')
      setSuccess('Rule updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
      fetchRules()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleCreateFromTemplate(template: AutomationRuleTemplate) {
    try {
      const response = await fetch('/api/settings/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          trigger: template.trigger,
          action: template.action,
          enabled: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to create rule')
      setSuccess('Automation rule created successfully!')
      setTimeout(() => setSuccess(null), 3000)
      setShowTemplates(false)
      fetchRules()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!confirm('Are you sure you want to delete this automation rule?')) return

    try {
      const response = await fetch(`/api/settings/automation/rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete rule')
      setSuccess('Rule deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
      fetchRules()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function getCategoryBadge(category: string) {
    const colors: Record<string, string> = {
      jobs: 'bg-blue-100 text-blue-800',
      invoices: 'bg-green-100 text-green-800',
      communications: 'bg-purple-100 text-purple-800',
      assignments: 'bg-orange-100 text-orange-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4B79FF]" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Automation Settings
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Create rules to automate repetitive tasks
          </p>
        </div>
        <Button
          onClick={() => setShowTemplates(!showTemplates)}
          className="bg-[#4B79FF] hover:bg-[#3366FF] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
          {success}
        </div>
      )}

      {/* Rule Templates */}
      {showTemplates && (
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle>Automation Templates</CardTitle>
            <CardDescription>
              Choose from pre-built automation templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {RULE_TEMPLATES.map((template, index) => (
                <div
                  key={index}
                  className="p-4 border border-[var(--card-border)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm">{template.name}</h3>
                        <Badge className={getCategoryBadge(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {template.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template)}
                      className="ml-4 bg-[#4B79FF] hover:bg-[#3366FF] text-white"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Rules */}
      <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Active Automation Rules
          </CardTitle>
          <CardDescription>
            Manage your automation rules and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <Zap className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-subtle)]" />
              <p className="font-medium">No automation rules yet</p>
              <p className="text-sm mt-1">
                Click "Create Rule" to add your first automation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 border border-[var(--card-border)] rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-sm">{rule.name}</h3>
                        {rule.enabled ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                        {rule.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--color-text-subtle)]">
                        <span>
                          <strong>Trigger:</strong> {rule.trigger.type.replace(/_/g, ' ')}
                        </span>
                        <span>
                          <strong>Action:</strong> {rule.action.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <SettingToggle
                        label=""
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => handleToggleRule(rule.id, enabled)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
