/**
 * Notification Preferences Page
 * User can configure notification settings
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'
import { SettingSection } from '@/components/settings/SettingSection'
import { SettingToggle } from '@/components/settings/SettingToggle'
import { SettingInput } from '@/components/settings/SettingInput'
import type { NotificationPreferences } from '@/lib/types/settings'

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    notification_types: {
      job_assigned: true,
      job_completed: true,
      invoice_overdue: true,
      new_message: true,
      tech_offline: true,
      estimate_accepted: true,
      estimate_rejected: true,
      meeting_reminder: true,
    },
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/notifications')

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences')
      }

      const data = await response.json()
      setPreferences(data.preferences || preferences)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to update preferences' }))
        throw new Error(data.error || 'Failed to update preferences')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4B79FF]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Notification Preferences
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Choose how and when you want to be notified
          </p>
        </div>
        <Button
          type="submit"
          form="notifications-form"
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
          Notification preferences updated successfully!
        </div>
      )}

      {/* Notifications Form */}
      <form id="notifications-form" onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Notification Channels */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingToggle
                label="Email Notifications"
                description="Receive notifications via email"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, email_enabled: checked })
                }
              />
              <SettingToggle
                label="SMS Notifications"
                description="Receive notifications via text message"
                checked={preferences.sms_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, sms_enabled: checked })
                }
              />
              <SettingToggle
                label="Push Notifications"
                description="Receive in-app push notifications"
                checked={preferences.push_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, push_enabled: checked })
                }
              />
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingToggle
                label="Job Assigned"
                description="When a job is assigned to you"
                checked={preferences.notification_types.job_assigned}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notification_types: { ...preferences.notification_types, job_assigned: checked },
                  })
                }
              />
              <SettingToggle
                label="Job Completed"
                description="When a job is marked as completed"
                checked={preferences.notification_types.job_completed}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notification_types: { ...preferences.notification_types, job_completed: checked },
                  })
                }
              />
              <SettingToggle
                label="Invoice Overdue"
                description="When an invoice becomes overdue"
                checked={preferences.notification_types.invoice_overdue}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notification_types: { ...preferences.notification_types, invoice_overdue: checked },
                  })
                }
              />
              <SettingToggle
                label="New Message"
                description="When you receive a new message"
                checked={preferences.notification_types.new_message}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notification_types: { ...preferences.notification_types, new_message: checked },
                  })
                }
              />
              <SettingToggle
                label="Tech Offline"
                description="When a technician goes offline (Dispatcher only)"
                checked={preferences.notification_types.tech_offline}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notification_types: { ...preferences.notification_types, tech_offline: checked },
                  })
                }
              />
              <SettingToggle
                label="Estimate Accepted"
                description="When a customer accepts an estimate"
                checked={preferences.notification_types.estimate_accepted}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notification_types: { ...preferences.notification_types, estimate_accepted: checked },
                  })
                }
              />
              <SettingToggle
                label="Estimate Rejected"
                description="When a customer rejects an estimate"
                checked={preferences.notification_types.estimate_rejected}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notification_types: { ...preferences.notification_types, estimate_rejected: checked },
                  })
                }
              />
              <SettingToggle
                label="Meeting Reminder"
                description="Reminder 30 minutes before a scheduled meeting"
                checked={preferences.notification_types.meeting_reminder}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notification_types: { ...preferences.notification_types, meeting_reminder: checked },
                  })
                }
              />
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                Pause non-urgent notifications during specific hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingToggle
                label="Enable Quiet Hours"
                description="Mute non-urgent notifications during quiet hours"
                checked={preferences.quiet_hours.enabled}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    quiet_hours: { ...preferences.quiet_hours, enabled: checked },
                  })
                }
              />
              {preferences.quiet_hours.enabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <SettingInput
                    label="Start Time"
                    type="time"
                    value={preferences.quiet_hours.start}
                    onChange={(value) =>
                      setPreferences({
                        ...preferences,
                        quiet_hours: { ...preferences.quiet_hours, start: value },
                      })
                    }
                  />
                  <SettingInput
                    label="End Time"
                    type="time"
                    value={preferences.quiet_hours.end}
                    onChange={(value) =>
                      setPreferences({
                        ...preferences,
                        quiet_hours: { ...preferences.quiet_hours, end: value },
                      })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
