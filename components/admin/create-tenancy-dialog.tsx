'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Check, X } from 'lucide-react'
import { generateSecurePassword } from '@/lib/security/password'
import Image from 'next/image'

interface CreateTenancyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTenancyDialog({ open, onOpenChange, onSuccess }: CreateTenancyDialogProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Step 1: Tenancy Details
  const [tenancyData, setTenancyData] = useState({
    name: '',
    slug: '',
    inboundEmailDomain: '',
  })

  // Step 2: Owner Details
  const [ownerData, setOwnerData] = useState({
    email: '',
    fullName: '',
    password: '',
    generatePassword: true,
  })

  // Step 3: Logo Upload
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Step 4: Credentials
  const [createdCredentials, setCreatedCredentials] = useState<{
    accountId: string
    ownerEmail: string
    password: string
  } | null>(null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStep1Next = () => {
    if (!tenancyData.name || !tenancyData.slug) {
      setError('Name and slug are required')
      return
    }
    if (!/^[a-z0-9-]+$/.test(tenancyData.slug)) {
      setError('Slug must contain only lowercase letters, numbers, and hyphens')
      return
    }
    setError(null)
    setStep(2)
  }

  const handleStep2Next = () => {
    if (!ownerData.email || !ownerData.fullName) {
      setError('Email and full name are required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerData.email)) {
      setError('Invalid email address')
      return
    }
    if (!ownerData.generatePassword && ownerData.password.length < 12) {
      setError('Password must be at least 12 characters')
      return
    }
    setError(null)
    setStep(3)
  }

  const handleStep3Next = async () => {
    setError(null)
    setStep(4)
  }

  const handleCreate = async () => {
    setLoading(true)
    setError(null)

    try {
      const password = ownerData.generatePassword ? generateSecurePassword() : ownerData.password
      
      const formData = new FormData()
      formData.append('name', tenancyData.name)
      formData.append('slug', tenancyData.slug)
      formData.append('inboundEmailDomain', tenancyData.inboundEmailDomain || '')
      formData.append('ownerEmail', ownerData.email)
      formData.append('ownerName', ownerData.fullName)
      formData.append('password', password)
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const response = await fetch('/api/admin/tenancies', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create tenancy')
      }

      const data = await response.json()
      setCreatedCredentials({
        accountId: data.accountId,
        ownerEmail: ownerData.email,
        password: password,
      })
      setSuccess(true)
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tenancy')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setStep(1)
      setTenancyData({ name: '', slug: '', inboundEmailDomain: '' })
      setOwnerData({ email: '', fullName: '', password: '', generatePassword: true })
      setLogoFile(null)
      setLogoPreview(null)
      setCreatedCredentials(null)
      setError(null)
      setSuccess(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tenancy</DialogTitle>
          <DialogDescription>
            Set up a new organization with owner account
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        {success && createdCredentials && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">Tenancy Created Successfully!</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Account ID:</strong> {createdCredentials.accountId}</p>
              <p><strong>Owner Email:</strong> {createdCredentials.ownerEmail}</p>
              <p><strong>Password:</strong> {createdCredentials.password}</p>
              <p className="mt-2 text-xs">Please save these credentials securely. The owner will need them to log in.</p>
            </div>
          </div>
        )}

        {/* Step 1: Tenancy Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tenancy Name *</Label>
              <Input
                id="name"
                placeholder="ACME Service Co"
                value={tenancyData.name}
                onChange={(e) => setTenancyData({ ...tenancyData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="acme-service"
                value={tenancyData.slug}
                onChange={(e) => setTenancyData({ ...tenancyData, slug: e.target.value.toLowerCase() })}
                pattern="[a-z0-9-]+"
                required
              />
              <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inboundEmailDomain">Inbound Email Domain</Label>
              <Input
                id="inboundEmailDomain"
                placeholder="reply.acme.com"
                value={tenancyData.inboundEmailDomain}
                onChange={(e) => setTenancyData({ ...tenancyData, inboundEmailDomain: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Owner Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="owner@example.com"
                value={ownerData.email}
                onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Full Name *</Label>
              <Input
                id="ownerName"
                placeholder="John Doe"
                value={ownerData.fullName}
                onChange={(e) => setOwnerData({ ...ownerData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="generatePassword"
                  checked={ownerData.generatePassword}
                  onChange={(e) => setOwnerData({ ...ownerData, generatePassword: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="generatePassword" className="cursor-pointer">
                  Generate secure password automatically
                </Label>
              </div>
              {!ownerData.generatePassword && (
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={ownerData.password}
                  onChange={(e) => setOwnerData({ ...ownerData, password: e.target.value })}
                  required
                />
              )}
            </div>
          </div>
        )}

        {/* Step 3: Logo Upload */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Logo (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {logoPreview ? (
                  <div className="space-y-2">
                    <Image src={logoPreview} alt="Logo preview" width={128} height={128} unoptimized className="max-h-32 w-auto mx-auto" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null)
                        setLogoPreview(null)
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <Label htmlFor="logo" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-800">Click to upload</span> or drag and drop
                    </Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {step === 4 && !success && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <h3 className="font-semibold">Tenancy Details</h3>
              <p><strong>Name:</strong> {tenancyData.name}</p>
              <p><strong>Slug:</strong> {tenancyData.slug}</p>
              {tenancyData.inboundEmailDomain && (
                <p><strong>Email Domain:</strong> {tenancyData.inboundEmailDomain}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <h3 className="font-semibold">Owner Details</h3>
              <p><strong>Email:</strong> {ownerData.email}</p>
              <p><strong>Name:</strong> {ownerData.fullName}</p>
            </div>
            {logoPreview && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Logo</h3>
                <Image src={logoPreview} alt="Logo" width={96} height={96} unoptimized className="max-h-24 w-auto" />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step > 1 && step < 4 && !success && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 && (
            <Button type="button" onClick={() => {
              if (step === 1) handleStep1Next()
              else if (step === 2) handleStep2Next()
            }}>
              Next
            </Button>
          )}
          {step === 3 && (
            <Button type="button" onClick={handleStep3Next}>
              Review
            </Button>
          )}
          {step === 4 && !success && (
            <Button type="button" onClick={handleCreate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Tenancy'
              )}
            </Button>
          )}
          {success && (
            <Button type="button" onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
