'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle2, XCircle } from 'lucide-react'
import { AutomationRuleDialog } from '@/components/admin/automation-rule-dialog'
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'
import { fetchWithRetry } from '@/lib/api-retry'
import { toast } from '@/lib/toast'

interface AutomationRule {
  id: string
  name: string
  trigger: string
  trigger_config: any
  action: string
  action_config: any
  is_active: boolean
  account_id: string
}

function AutomationPageContent() {
  const router = useRouter()
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const response = await fetchWithRetry('/api/users/me', { maxRetries: 2 })
      if (!response.ok) throw new Error(`Access check failed: ${response.status}`)
      const data = await response.json()
      if (data.user && (data.user.role === 'admin' || data.user.role === 'owner')) {
        setIsAdmin(true)
        fetchRules()
      } else {
        router.push('/inbox')
      }
    } catch (error: any) {
      console.error('Error checking admin access:', error)
      toast.error('Failed to verify admin access', error.message)
      router.push('/inbox')
    } finally {
      setLoading(false)
    }
  }

  async function fetchRules() {
    try {
      setLoading(true)
      const response = await fetchWithRetry('/api/automation-rules', { maxRetries: 3 })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      const data = await response.json()
      setRules(data.rules || [])
    } catch (error: any) {
      console.error('Error fetching rules:', error)
      toast.error('Failed to load automation rules', error.message)
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  function handleAddRule() {
    setEditingRule(null)
    setRuleDialogOpen(true)
  }

  function handleEditRule(rule: AutomationRule) {
    setEditingRule(rule)
    setRuleDialogOpen(true)
  }

  async function handleToggleActive(ruleId: string, currentStatus: boolean) {
    try {
      const response = await fetchWithRetry(`/api/automation-rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
        maxRetries: 2
      })
      if (!response.ok) throw new Error('Failed to toggle rule status')
      fetchRules()
    } catch (error: any) {
      console.error('Error toggling rule status:', error)
      toast.error('Failed to update rule status', error.message)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-neutral-500">Checking access...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Automation Rules</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure automated workflows and triggers</p>
        </div>
        <Button 
          onClick={handleAddRule}
          className="bg-[#4B79FF] hover:bg-[#3366FF] text-white shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>Automation rules that trigger actions based on conditions</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">No automation rules configured</div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{rule.name || 'Unnamed Rule'}</span>
                          <Badge
                            className={`text-xs flex items-center gap-1 ${
                              rule.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {rule.is_active ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          When: <span className="font-medium capitalize">{rule.trigger}</span> • 
                          Then: <span className="font-medium capitalize">{rule.action}</span>
                        </div>
                        {rule.trigger_config && (
                          <div className="text-xs text-neutral-400 mt-1">
                            Conditions: {JSON.stringify(rule.trigger_config)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(rule.id, rule.is_active)}
                      className={rule.is_active ? 'border-red-300 text-red-600' : 'border-green-300 text-green-600'}
                    >
                      {rule.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                      className="border-[#4B79FF] text-[#4B79FF] hover:bg-[#EBF0FF]"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AutomationRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        rule={editingRule}
        onSuccess={fetchRules}
      />
    </div>
  )
}

export default function AutomationPage() {
  return (
    <AdminErrorBoundary errorMessage="Failed to load automation rules page">
      <AutomationPageContent />
    </AdminErrorBoundary>
  )
}

