/**
 * Company Settings Page (Owner/Admin Only)
 * Configure company information, business hours, and financial settings
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Building2, Clock, DollarSign, Upload } from 'lucide-react'
import { SettingSection } from '@/components/settings/SettingSection'
import { SettingInput } from '@/components/settings/SettingInput'
import { SettingSelect } from '@/components/settings/SettingSelect'
import { SettingToggle } from '@/components/settings/SettingToggle'
import type { CompanySettings } from '@/lib/types/settings'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
]

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export default function CompanySettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [settings, setSettings] = useState<CompanySettings>({
    company_name: '',
    logo_url: null,
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
    },
    contact: {
      phone: '',
      email: '',
      website: null,
    },
    business_hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: true },
      sunday: { open: '09:00', close: '17:00', closed: true },
    },
    financial: {
      tax_rate: 0,
      currency: 'USD',
      invoice_terms: 30,
    },
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
          fetchSettings()
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

  async function fetchSettings() {
    try {
      const response = await fetch('/api/settings/company')
      if (!response.ok) throw new Error('Failed to fetch company settings')
      const data = await response.json()
      setSettings(data.settings || settings)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to update settings' }))
        throw new Error(data.error || 'Failed to update settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/settings/company/logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload logo')
      const data = await response.json()
      setSettings({ ...settings, logo_url: data.logo_url })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
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
            Company Settings
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage company information and business operations
          </p>
        </div>
        <Button
          type="submit"
          form="company-form"
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
          Company settings updated successfully!
        </div>
      )}

      {/* Company Form */}
      <form id="company-form" onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Company Information */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company details and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingInput
                label="Company Name"
                value={settings.company_name}
                onChange={(value) => setSettings({ ...settings, company_name: value })}
                required
                placeholder="Acme Corp"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                  Company Logo
                </label>
                {settings.logo_url && (
                  <div className="mb-2">
                    <img
                      src={settings.logo_url}
                      alt="Company Logo"
                      className="h-16 object-contain"
                    />
                  </div>
                )}
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#4B79FF] hover:bg-[#3366FF] rounded cursor-pointer transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Recommended: PNG with transparent background. Max 2MB.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SettingInput
                  label="Street Address"
                  value={settings.address.street}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, street: value },
                    })
                  }
                  placeholder="123 Main St"
                />
                <SettingInput
                  label="City"
                  value={settings.address.city}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, city: value },
                    })
                  }
                  placeholder="New York"
                />
                <SettingInput
                  label="State/Province"
                  value={settings.address.state}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, state: value },
                    })
                  }
                  placeholder="NY"
                />
                <SettingInput
                  label="ZIP/Postal Code"
                  value={settings.address.zip}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, zip: value },
                    })
                  }
                  placeholder="10001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SettingInput
                  label="Phone"
                  type="tel"
                  value={settings.contact.phone}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, phone: value },
                    })
                  }
                  placeholder="+1 (555) 123-4567"
                />
                <SettingInput
                  label="Email"
                  type="email"
                  value={settings.contact.email}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, email: value },
                    })
                  }
                  placeholder="info@company.com"
                />
              </div>

              <SettingInput
                label="Website"
                type="url"
                value={settings.contact.website || ''}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, website: value || null },
                  })
                }
                placeholder="https://company.com"
              />
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Business Hours
              </CardTitle>
              <CardDescription>
                Set your operating hours for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-4 py-2 border-b border-[var(--card-border)] last:border-0"
                >
                  <div className="w-28 capitalize font-medium text-sm">
                    {day}
                  </div>
                  {settings.business_hours[day].closed ? (
                    <div className="flex-1 text-sm text-[var(--color-text-secondary)]">
                      Closed
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="time"
                        value={settings.business_hours[day].open}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            business_hours: {
                              ...settings.business_hours,
                              [day]: {
                                ...settings.business_hours[day],
                                open: e.target.value,
                              },
                            },
                          })
                        }
                        className="px-2 py-1 text-sm border border-[var(--card-border)] rounded"
                      />
                      <span className="text-sm text-[var(--color-text-secondary)]">to</span>
                      <input
                        type="time"
                        value={settings.business_hours[day].close}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            business_hours: {
                              ...settings.business_hours,
                              [day]: {
                                ...settings.business_hours[day],
                                close: e.target.value,
                              },
                            },
                          })
                        }
                        className="px-2 py-1 text-sm border border-[var(--card-border)] rounded"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        business_hours: {
                          ...settings.business_hours,
                          [day]: {
                            ...settings.business_hours[day],
                            closed: !settings.business_hours[day].closed,
                          },
                        },
                      })
                    }
                    className="px-3 py-1 text-xs font-medium text-[#4B79FF] hover:bg-[#EBF0FF] rounded transition-colors"
                  >
                    {settings.business_hours[day].closed ? 'Open' : 'Close'}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Settings
              </CardTitle>
              <CardDescription>
                Configure tax rates, currency, and invoice terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <SettingInput
                  label="Tax Rate (%)"
                  type="number"
                  value={String(settings.financial.tax_rate)}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      financial: {
                        ...settings.financial,
                        tax_rate: parseFloat(value) || 0,
                      },
                    })
                  }
                  placeholder="8.5"
                />

                <SettingSelect
                  label="Currency"
                  value={settings.financial.currency}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      financial: { ...settings.financial, currency: value },
                    })
                  }
                  options={CURRENCY_OPTIONS}
                />

                <SettingInput
                  label="Invoice Terms (Days)"
                  type="number"
                  value={String(settings.financial.invoice_terms)}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      financial: {
                        ...settings.financial,
                        invoice_terms: parseInt(value) || 30,
                      },
                    })
                  }
                  placeholder="30"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
