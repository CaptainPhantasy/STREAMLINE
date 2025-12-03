/**
 * AI Provider Settings Page (Admin Only)
 * Configure LLM providers, API keys, and model selection
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Brain, Eye, EyeOff, DollarSign, Activity } from 'lucide-react'
import { SettingSelect } from '@/components/settings/SettingSelect'
import { SettingToggle } from '@/components/settings/SettingToggle'
import type { AIProvider, AIProviderConfig } from '@/lib/types/settings'

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'mistral', label: 'Mistral AI' },
]

const MODEL_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  ],
  google: [
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
  ],
  mistral: [
    { value: 'mistral-large', label: 'Mistral Large' },
    { value: 'mistral-medium', label: 'Mistral Medium' },
  ],
}

export default function AIProviderSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})

  const [config, setConfig] = useState<AIProviderConfig>({
    providers: [],
    fallback_enabled: true,
    cost_limit_monthly: null,
    cache_enabled: true,
  })

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
          fetchConfig()
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

  async function fetchConfig() {
    try {
      const response = await fetch('/api/settings/ai/providers')
      if (!response.ok) throw new Error('Failed to fetch AI provider config')
      const data = await response.json()
      setConfig(data.config || config)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/settings/ai/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to update config' }))
        throw new Error(data.error || 'Failed to update config')
      }

      setSuccess('AI provider settings updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleAddProvider() {
    const newProvider: AIProvider = {
      id: `provider-${Date.now()}`,
      name: 'New Provider',
      provider: 'openai',
      api_key_encrypted: '',
      models: [],
      selected_model: '',
      enabled: false,
      priority: config.providers.length + 1,
      rate_limits: {
        requests_per_minute: 60,
        tokens_per_minute: 90000,
      },
      cost_tracking: {
        total_requests: 0,
        total_tokens: 0,
        estimated_cost: 0,
      },
    }
    setConfig({
      ...config,
      providers: [...config.providers, newProvider],
    })
  }

  function handleUpdateProvider(index: number, updates: Partial<AIProvider>) {
    const updatedProviders = [...config.providers]
    updatedProviders[index] = { ...updatedProviders[index], ...updates }
    setConfig({ ...config, providers: updatedProviders })
  }

  function handleRemoveProvider(index: number) {
    if (!confirm('Are you sure you want to remove this provider?')) return
    const updatedProviders = config.providers.filter((_, i) => i !== index)
    setConfig({ ...config, providers: updatedProviders })
  }

  function formatCost(cost: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cost)
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
            AI Provider Settings
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Configure AI models and manage API keys
          </p>
        </div>
        <Button
          type="submit"
          form="ai-form"
          disabled={saving}
          className="bg-[#4B79FF] hover:bg-[#3366FF] text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
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

      {/* AI Form */}
      <form id="ai-form" onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Global Settings */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Global AI Settings
              </CardTitle>
              <CardDescription>
                Configure global AI behavior and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingToggle
                label="Enable Fallback Providers"
                description="Automatically use secondary providers if primary fails"
                checked={config.fallback_enabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, fallback_enabled: checked })
                }
              />
              <SettingToggle
                label="Enable Response Caching"
                description="Cache AI responses for common queries to reduce costs"
                checked={config.cache_enabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, cache_enabled: checked })
                }
              />
              <div className="space-y-2">
                <Label htmlFor="cost-limit">Monthly Cost Limit (USD)</Label>
                <Input
                  id="cost-limit"
                  type="number"
                  value={config.cost_limit_monthly || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cost_limit_monthly: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="No limit"
                />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  AI features will be disabled when limit is reached
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Providers */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Providers
                  </CardTitle>
                  <CardDescription>
                    Configure AI providers and their priority
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddProvider}
                  className="bg-[#4B79FF] hover:bg-[#3366FF] text-white"
                >
                  Add Provider
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {config.providers.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-subtle)]" />
                  <p className="font-medium">No AI providers configured</p>
                  <p className="text-sm mt-1">
                    Click "Add Provider" to configure your first AI provider
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {config.providers.map((provider, index) => (
                    <div
                      key={provider.id}
                      className="p-4 border border-[var(--card-border)] rounded-lg space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={provider.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            Priority {provider.priority}
                          </Badge>
                          {provider.enabled ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveProvider(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <SettingSelect
                          label="Provider"
                          value={provider.provider}
                          onValueChange={(value) =>
                            handleUpdateProvider(index, { provider: value as AIProvider['provider'] })
                          }
                          options={PROVIDER_OPTIONS}
                        />
                        <SettingSelect
                          label="Model"
                          value={provider.selected_model}
                          onValueChange={(value) =>
                            handleUpdateProvider(index, { selected_model: value })
                          }
                          options={MODEL_OPTIONS[provider.provider] || []}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showApiKeys[provider.id] ? 'text' : 'password'}
                            value={provider.api_key_encrypted}
                            onChange={(e) =>
                              handleUpdateProvider(index, { api_key_encrypted: e.target.value })
                            }
                            placeholder="sk-..."
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setShowApiKeys({
                                ...showApiKeys,
                                [provider.id]: !showApiKeys[provider.id],
                              })
                            }
                          >
                            {showApiKeys[provider.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Requests/Minute</Label>
                          <Input
                            type="number"
                            value={provider.rate_limits.requests_per_minute}
                            onChange={(e) =>
                              handleUpdateProvider(index, {
                                rate_limits: {
                                  ...provider.rate_limits,
                                  requests_per_minute: parseInt(e.target.value) || 60,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tokens/Minute</Label>
                          <Input
                            type="number"
                            value={provider.rate_limits.tokens_per_minute}
                            onChange={(e) =>
                              handleUpdateProvider(index, {
                                rate_limits: {
                                  ...provider.rate_limits,
                                  tokens_per_minute: parseInt(e.target.value) || 90000,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Cost Tracking */}
                      <div className="pt-4 border-t border-[var(--card-border)]">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="w-4 h-4 text-[var(--color-text-secondary)]" />
                          <span className="text-sm font-medium">Cost Tracking</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-[var(--color-text-secondary)]">Total Requests</span>
                            <div className="font-medium mt-1">
                              {provider.cost_tracking.total_requests.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-secondary)]">Total Tokens</span>
                            <div className="font-medium mt-1">
                              {provider.cost_tracking.total_tokens.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-secondary)]">Estimated Cost</span>
                            <div className="font-medium mt-1">
                              {formatCost(provider.cost_tracking.estimated_cost)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <SettingToggle
                        label="Enable this provider"
                        checked={provider.enabled}
                        onCheckedChange={(checked) =>
                          handleUpdateProvider(index, { enabled: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
