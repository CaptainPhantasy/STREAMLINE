'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

interface LLMProvider {
  id: string
  name: string
  provider: string
  model: string
  use_case: string[]
  max_tokens: number
  is_active: boolean
  is_default: boolean
}

interface LLMProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: LLMProvider | null
  onSuccess: () => void
}

const USE_CASES = ['draft', 'summary', 'general', 'complex', 'vision']
const PROVIDERS = ['openai', 'anthropic']

export function LLMProviderDialog({ open, onOpenChange, provider, onSuccess }: LLMProviderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    model: '',
    apiKey: '',
    useCases: [] as string[],
    maxTokens: 4000,
    isActive: true,
    isDefault: false,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (provider) {
        setFormData({
          name: provider.name || '',
          provider: provider.provider || 'openai',
          model: provider.model || '',
          apiKey: '', // Don't show existing API key
          useCases: provider.use_case || [],
          maxTokens: provider.max_tokens || 4000,
          isActive: provider.is_active !== false,
          isDefault: provider.is_default || false,
        })
      } else {
        setFormData({
          name: '',
          provider: 'openai',
          model: '',
          apiKey: '',
          useCases: [],
          maxTokens: 4000,
          isActive: true,
          isDefault: false,
        })
      }
      setError(null)
    }
  }, [open, provider])

  function handleToggleUseCase(useCase: string) {
    setFormData(prev => ({
      ...prev,
      useCases: prev.useCases.includes(useCase)
        ? prev.useCases.filter(uc => uc !== useCase)
        : [...prev.useCases, useCase]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name || !formData.provider || !formData.model) {
      setError('Name, provider, and model are required')
      setLoading(false)
      return
    }

    if (formData.useCases.length === 0) {
      setError('At least one use case must be selected')
      setLoading(false)
      return
    }

    try {
      const url = provider ? `/api/llm-providers/${provider.id}` : '/api/llm-providers'
      const method = provider ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          provider: formData.provider,
          model: formData.model,
          apiKey: formData.apiKey || undefined,
          useCases: formData.useCases,
          maxTokens: formData.maxTokens,
          isActive: formData.isActive,
          isDefault: formData.isDefault,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess()
        onOpenChange(false)
      } else {
        setError(data.error || 'Failed to save provider')
      }
    } catch (error) {
      console.error('Error saving provider:', error)
      setError('Failed to save provider. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{provider ? 'Edit LLM Provider' : 'Add LLM Provider'}</DialogTitle>
          <DialogDescription>
            Configure an AI model provider for routing
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., OpenAI GPT-4o"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <select
                  id="provider"
                  className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  required
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                placeholder="e.g., gpt-4o, claude-3-5-sonnet"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key {provider ? '(leave blank to keep existing)' : '*'}</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter API key"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                required={!provider}
              />
              <p className="text-xs text-neutral-500">
                API keys are stored securely. In production, use Supabase secrets or encryption.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Use Cases *</Label>
              <div className="grid grid-cols-3 gap-2">
                {USE_CASES.map(useCase => (
                  <div key={useCase} className="flex items-center space-x-2">
                    <Checkbox
                      id={`useCase-${useCase}`}
                      checked={formData.useCases.includes(useCase)}
                      onCheckedChange={() => handleToggleUseCase(useCase)}
                    />
                    <Label
                      htmlFor={`useCase-${useCase}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {useCase}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="1"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 4000 })}
              />
            </div>

            <div className="flex items-center space-x-4">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
                />
                <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                  Default Provider
                </Label>
              </div>
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
              {loading ? (provider ? 'Updating...' : 'Creating...') : (provider ? 'Update Provider' : 'Create Provider')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

