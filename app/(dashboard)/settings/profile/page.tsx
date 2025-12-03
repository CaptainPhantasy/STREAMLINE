/**
 * Profile Settings Page
 * User can update their personal profile information
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload, User } from 'lucide-react'
import { SettingSection } from '@/components/settings/SettingSection'
import { SettingInput } from '@/components/settings/SettingInput'
import { SettingSelect } from '@/components/settings/SettingSelect'
import { ProfilePhotosManager } from '@/components/profile/ProfilePhotosManager'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ProfileSettings } from '@/lib/types/settings'
import type { UserProfile, UserProfilePhoto } from '@/types/user-profiles'

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
]

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [profile, setProfile] = useState<ProfileSettings>({
    full_name: '',
    email: '',
    phone: null,
    timezone: 'America/New_York',
    language: 'en',
    avatar_url: null,
  })
  const [bio, setBio] = useState<string>('')
  const [profilePhotos, setProfilePhotos] = useState<UserProfilePhoto[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      setLoading(true)
      
      // Fetch basic profile
      const response = await fetch('/api/settings/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data.profile || profile)
      setBio(data.profile?.bio || '')
      setUserId(data.profile?.id || null)

      // Fetch full profile with photos if we have user ID
      if (data.profile?.id) {
        const profileResponse = await fetch(`/api/users/${data.profile.id}/profile`)
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setProfilePhotos(profileData.profile?.profile_photos || [])
          setBio(profileData.profile?.bio || '')
        }
      }
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
      // Update via user profile endpoint if we have userId, otherwise use settings endpoint
      const endpoint = userId 
        ? `/api/users/${userId}/profile`
        : '/api/settings/profile'
      
      const body = userId
        ? {
            full_name: profile.full_name,
            bio: bio,
            phone: profile.phone,
            timezone: profile.timezone,
            language: profile.language,
          }
        : {
            full_name: profile.full_name,
            phone: profile.phone,
            timezone: profile.timezone,
            language: profile.language,
          }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to update profile' }))
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/settings/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      const data = await response.json()
      setProfile({ ...profile, avatar_url: data.avatar_url })
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Profile Settings
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage your personal information and preferences
          </p>
        </div>
        <Button
          type="submit"
          form="profile-form"
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
          Profile updated successfully!
        </div>
      )}

      {/* Profile Form */}
      <form id="profile-form" onSubmit={handleSubmit}>
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and how we communicate with you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 pb-6 border-b border-[var(--card-border)]">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="text-2xl bg-[#EBF0FF] text-[#4B79FF]">
                  {profile.full_name?.[0] || <User className="w-12 h-12" />}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <label
                  htmlFor="avatar-upload"
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
                      Upload Photo
                    </>
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <SettingSection title="Basic Information">
              <SettingInput
                label="Full Name"
                value={profile.full_name}
                onChange={(value) => setProfile({ ...profile, full_name: value })}
                required
                placeholder="John Doe"
              />

              <SettingInput
                label="Email Address"
                value={profile.email}
                onChange={() => {}} // Read-only
                type="email"
                disabled
                description="Email cannot be changed. Contact support if needed."
              />

              <SettingInput
                label="Phone Number"
                value={profile.phone || ''}
                onChange={(value) => setProfile({ ...profile, phone: value || null })}
                type="tel"
                placeholder="+1 (555) 123-4567"
              />

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  A brief description about yourself (optional)
                </p>
              </div>
            </SettingSection>

            {/* Preferences */}
            <SettingSection title="Preferences">
              <SettingSelect
                label="Timezone"
                description="All dates and times will be displayed in this timezone"
                value={profile.timezone}
                onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                options={TIMEZONE_OPTIONS}
              />

              <SettingSelect
                label="Language"
                description="Choose your preferred language for the interface"
                value={profile.language}
                onValueChange={(value) => setProfile({ ...profile, language: value })}
                options={LANGUAGE_OPTIONS}
              />
            </SettingSection>
          </CardContent>
        </Card>

        {/* Profile Photos Section */}
        {userId && (
          <ProfilePhotosManager
            userId={userId}
            photos={profilePhotos}
            onPhotosChange={(photos) => {
              setProfilePhotos(photos)
              // Update primary photo in profile if needed
              const primary = photos.find(p => p.is_primary)
              if (primary) {
                setProfile({ ...profile, avatar_url: primary.photo_url })
              }
            }}
          />
        )}
      </form>
    </div>
  )
}
