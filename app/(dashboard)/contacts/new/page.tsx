'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { success as toastSuccess } from '@/lib/toast'

export default function AddContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
  })
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate required fields
    if (!formData.email || !formData.firstName) {
      setError('Email and first name are required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          address: formData.address || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toastSuccess('Contact created successfully')
        router.push('/contacts')
      } else {
        setError(data.error || 'Failed to create contact')
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      setError('Failed to create contact. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-theme-primary p-6">
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <Link 
            href="/contacts" 
            className="inline-flex items-center text-sm text-theme-secondary hover:text-theme-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Link>
          <h1 className="text-2xl font-bold text-theme-primary">Add New Contact</h1>
          <p className="text-theme-secondary">Create a new contact in your database</p>
        </div>

        <Card className="border-theme-border bg-theme-card">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="bg-theme-input border-theme-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-theme-input border-theme-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-theme-input border-theme-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-theme-input border-theme-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <PlacesAutocomplete
                  id="address"
                  placeholder="123 Main St, City, State ZIP"
                  value={formData.address}
                  onChange={(value) => setFormData({ ...formData, address: value })}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="border-theme-border text-theme-primary hover:bg-theme-surface"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Contact'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
