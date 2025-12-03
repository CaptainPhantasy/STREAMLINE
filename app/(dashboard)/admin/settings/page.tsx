'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AccountSettings } from '@/types/admin'
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'

function SettingsPageContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [formData, setFormData] = useState<AccountSettings>({
    name: '',
    slug: '',
    inboundEmailDomain: null,
    settings: {},
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.user && (data.user.role === 'admin' || data.user.role === 'owner')) {
          setIsAdmin(true)
          fetchSettings()
        } else {
          router.push('/inbox')
        }
      } else if (response.status === 401) {
        // Not authenticated - redirect to login
        router.push('/inbox')
      } else {
        // Other error - don't retry, just redirect
        console.error('Failed to check admin access:', response.status)
        router.push('/inbox')
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      // Don't retry on network errors
      router.push('/inbox')
    } finally {
      setLoading(false)
    }
  }

  async function fetchSettings() {
    try {
      const response = await fetch('/api/account/settings', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setFormData(data.account || formData)
      } else {
        console.error('Failed to fetch settings:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      // Don't retry on network errors
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/account/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await response.json().catch(() => ({ error: 'Failed to update settings' }))
        setError(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
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
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Account Settings</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your account configuration</p>
        </div>
        <Button
          type="submit"
          form="settings-form"
          disabled={saving}
          className="bg-[#4B79FF] hover:bg-[#3366FF] text-white"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {(error || success) && (
        <div className={error ? "p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded" : "p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded"}>
          {error || 'Settings saved successfully!'}
        </div>
      )}

      <form id="settings-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* General Settings - Compact */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[var(--color-text-primary)]">General Settings</CardTitle>
              <CardDescription className="text-xs text-[var(--color-text-secondary)]">Basic account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Account Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  className="h-8 text-sm"
                />
                <p className="text-xs text-[var(--color-text-subtle)]">Used in URLs</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inboundEmailDomain" className="text-xs">Inbound Email Domain</Label>
                <Input
                  id="inboundEmailDomain"
                  placeholder="reply.yourcompany.com"
                  value={formData.inboundEmailDomain || ''}
                  onChange={(e) => setFormData({ ...formData, inboundEmailDomain: e.target.value || null })}
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Hours - Compact, Stacked */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[var(--color-text-primary)]">Business Hours</CardTitle>
              <CardDescription className="text-xs text-[var(--color-text-secondary)]">Operating hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="openTime" className="text-xs">Open Time</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={formData.settings.businessHours?.open || '09:00'}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      businessHours: {
                        ...formData.settings.businessHours,
                        open: e.target.value,
                        close: formData.settings.businessHours?.close || '17:00',
                        timezone: formData.settings.businessHours?.timezone || 'America/New_York',
                      }
                    }
                  })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="closeTime" className="text-xs">Close Time</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={formData.settings.businessHours?.close || '17:00'}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      businessHours: {
                        ...formData.settings.businessHours,
                        open: formData.settings.businessHours?.open || '09:00',
                        close: e.target.value,
                        timezone: formData.settings.businessHours?.timezone || 'America/New_York',
                      }
                    }
                  })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-xs">Timezone</Label>
                <Select
                  value={formData.settings.businessHours?.timezone || 'America/New_York'}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      businessHours: {
                        ...formData.settings.businessHours,
                        open: formData.settings.businessHours?.open || '09:00',
                        close: formData.settings.businessHours?.close || '17:00',
                        timezone: value,
                      }
                    }
                  })}
                >
                  <SelectTrigger id="timezone" className="w-full h-8 text-sm">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                    <SelectItem value="America/Indiana/Indianapolis">Indiana Eastern Time</SelectItem>
                    <SelectItem value="America/Phoenix">Arizona Time (MST)</SelectItem>
                    <SelectItem value="America/Toronto">Toronto (ET)</SelectItem>
                    <SelectItem value="America/Vancouver">Vancouver (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEST/AEDT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Branding - Compact */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[var(--color-text-primary)]">Branding</CardTitle>
              <CardDescription className="text-xs text-[var(--color-text-secondary)]">Brand appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="primaryColor" className="text-xs">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.settings.branding?.primaryColor || '#4B79FF'}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        branding: {
                          ...formData.settings.branding,
                          primaryColor: e.target.value,
                          logo: formData.settings.branding?.logo || '',
                        }
                      }
                    })}
                    className="h-8 w-16 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.settings.branding?.primaryColor || '#4B79FF'}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        branding: {
                          ...formData.settings.branding,
                          primaryColor: e.target.value,
                          logo: formData.settings.branding?.logo || '',
                        }
                      }
                    })}
                    className="h-8 flex-1 text-sm"
                    placeholder="#4B79FF"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="logo" className="text-xs">Logo URL</Label>
                <Input
                  id="logo"
                  placeholder="https://example.com/logo.png"
                  value={formData.settings.branding?.logo || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      branding: {
                        ...formData.settings.branding,
                        primaryColor: formData.settings.branding?.primaryColor || '#4B79FF',
                        logo: e.target.value,
                      }
                    }
                  })}
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}


export default function SettingsPage() {
  return (
    <AdminErrorBoundary errorMessage="Failed to load settings page">
      <SettingsPageContent />
    </AdminErrorBoundary>
  )
}
