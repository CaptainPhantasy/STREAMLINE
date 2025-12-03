'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, Building2, Mail, Phone, Globe } from 'lucide-react'
import { toast } from 'sonner'
import type { Supplier } from '@/types/inventory'

export function SupplierManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: '',
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers?active_only=true')

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }

      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (error: any) {
      console.error('Error fetching suppliers:', error)
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Supplier name is required')
      return
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create supplier')
      }

      toast.success('Supplier created successfully')
      setShowForm(false)
      setFormData({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        notes: '',
      })
      fetchSuppliers()
    } catch (error: any) {
      console.error('Error creating supplier:', error)
      toast.error(error.message || 'Failed to create supplier')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Manage your parts suppliers</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ABC Supply Co."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@supplier.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://supplier.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create Supplier</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {suppliers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No suppliers yet</p>
          ) : (
            suppliers.map((supplier) => (
              <div key={supplier.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold">{supplier.name}</h3>
                      {supplier.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    {supplier.contact_name && (
                      <p className="text-sm text-gray-600 mb-1">
                        Contact: {supplier.contact_name}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                      {supplier.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                    {supplier.address && (
                      <p className="text-sm text-gray-500 mt-2">{supplier.address}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

