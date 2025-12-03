'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle2, XCircle } from 'lucide-react'
import { LLMProviderDialog } from '@/components/admin/llm-provider-dialog'
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'

interface LLMProvider {
  id: string
  name: string
  provider: string
  model: string
  use_case: string[]
  max_tokens: number
  is_active: boolean
  is_default: boolean
  account_id: string | null
  usesEnvVar?: boolean
}

interface ProviderMetrics {
  provider: string
  requests: number
  successRate: string
  avgLatency: string
  totalTokens: string
  totalCost: string
  avgCost: string
  errors: number
}

interface HealthStatus {
  provider: string
  healthy: boolean
  latency: string | null
  lastCheck: string
  error: string | null
}

function LLMProvidersPageContent() {
  const router = useRouter()
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([])
  const [health, setHealth] = useState<HealthStatus[]>([])
  const [metricsLoading, setMetricsLoading] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchMetricsAndHealth()
      const interval = setInterval(fetchMetricsAndHealth, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  async function checkAdminAccess() {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user && (data.user.role === 'admin' || data.user.role === 'owner')) {
          setIsAdmin(true)
          fetchProviders()
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

  async function fetchProviders() {
    try {
      const response = await fetch('/api/llm-providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  async function fetchMetricsAndHealth() {
    setMetricsLoading(true)
    try {
      // Fetch metrics and health in parallel
      const [metricsRes, healthRes] = await Promise.all([
        fetch('/api/llm/metrics'),
        fetch('/api/llm/health'),
      ])

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData.metrics || [])
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setHealth(healthData.providers || [])
      }
    } catch (error) {
      console.error('Error fetching metrics/health:', error)
    } finally {
      setMetricsLoading(false)
    }
  }

  function handleAddProvider() {
    setEditingProvider(null)
    setProviderDialogOpen(true)
  }

  function handleEditProvider(provider: LLMProvider) {
    setEditingProvider(provider)
    setProviderDialogOpen(true)
  }

  async function handleToggleActive(providerId: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/llm-providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        fetchProviders()
      }
    } catch (error) {
      console.error('Error toggling provider status:', error)
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
          <h1 className="text-2xl font-semibold text-neutral-800">LLM Provider Management</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure AI model providers and routing</p>
        </div>
        <Button 
          onClick={handleAddProvider}
          className="bg-[#4B79FF] hover:bg-[#3366FF] text-white shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Metrics and Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Real-Time Metrics</CardTitle>
            <CardDescription>Provider usage statistics (auto-refreshes every 30s)</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading && metrics.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">Loading metrics...</div>
            ) : metrics.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">No metrics yet</div>
            ) : (
              <div className="space-y-3">
                {metrics.map((metric) => (
                  <div key={metric.provider} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm mb-2">{metric.provider}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-neutral-500">Requests:</span> <span className="font-medium">{metric.requests}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Success Rate:</span> <span className="font-medium text-green-600">{metric.successRate}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Avg Latency:</span> <span className="font-medium">{metric.avgLatency}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Total Cost:</span> <span className="font-medium">{metric.totalCost}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Health Status</CardTitle>
            <CardDescription>Provider availability checks (updated every 60s)</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading && health.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">Loading health status...</div>
            ) : health.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">No health data yet</div>
            ) : (
              <div className="space-y-3">
                {health.map((status) => (
                  <div key={status.provider} className="p-3 border rounded-lg flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{status.provider}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Last checked: {new Date(status.lastCheck).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.healthy ? (
                        <>
                          <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Healthy
                          </Badge>
                          {status.latency && (
                            <span className="text-xs text-neutral-500">{status.latency}</span>
                          )}
                        </>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Unhealthy
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>Manage AI model providers and their use cases</CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">No providers configured</div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{provider.name}</span>
                          {provider.is_default && (
                            <Badge className="bg-[#56D470] text-white text-xs">Default</Badge>
                          )}
                          {provider.usesEnvVar && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs" title="Using environment variables">
                              Env Config
                            </Badge>
                          )}
                          <Badge
                            className={`text-xs flex items-center gap-1 ${
                              provider.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {provider.is_active ? (
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
                          {provider.provider} / {provider.model} • Max tokens: {provider.max_tokens}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {provider.use_case?.map((useCase) => (
                            <Badge
                              key={useCase}
                              className="text-xs bg-[#EBF0FF] text-[#4B79FF]"
                            >
                              {useCase}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(provider.id, provider.is_active)}
                      className={provider.is_active ? 'border-red-300 text-red-600' : 'border-green-300 text-green-600'}
                    >
                      {provider.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProvider(provider)}
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

      <LLMProviderDialog
        open={providerDialogOpen}
        onOpenChange={setProviderDialogOpen}
        provider={editingProvider}
        onSuccess={fetchProviders}
      />
    </div>
  )
}


export default function LLMProvidersPage() {
  return (
    <AdminErrorBoundary errorMessage="Failed to load LLM providers page">
      <LLMProvidersPageContent />
    </AdminErrorBoundary>
  )
}
