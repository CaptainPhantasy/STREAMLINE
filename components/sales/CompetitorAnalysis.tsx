'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface CompetitorAnalysisProps {
  contactId?: string
}

export function CompetitorAnalysis({ contactId }: CompetitorAnalysisProps) {
  const [competitors, setCompetitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    notes: '',
  })

  useEffect(() => {
    fetchCompetitors()
  }, [contactId])

  async function fetchCompetitors() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (contactId) params.append('contact_id', contactId)

      const response = await fetch(`/api/sales/competitors?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch competitors')
      }

      const data = await response.json()
      setCompetitors(data.competitors || [])
    } catch (error: any) {
      console.error('Error fetching competitors:', error)
      toast.error('Failed to load competitors')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!formData.name.trim()) {
      toast.error('Competitor name is required')
      return
    }

    try {
      const response = await fetch('/api/sales/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contact_id: contactId || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add competitor')
      }

      toast.success('Competitor added')
      setShowForm(false)
      setFormData({ name: '', website: '', notes: '' })
      fetchCompetitors()
    } catch (error: any) {
      console.error('Error adding competitor:', error)
      toast.error(error.message || 'Failed to add competitor')
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
            <CardTitle>Competitor Analysis</CardTitle>
            <CardDescription>
              {contactId ? 'Competitors for this contact' : 'All competitors'}
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Competitor
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border rounded-lg space-y-3">
            <div className="space-y-2">
              <Label>Competitor Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Competitor name..."
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://competitor.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Competitor notes..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm">
                Add
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {competitors.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No competitors tracked</p>
          ) : (
            competitors.map((competitor) => (
              <div key={competitor.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{competitor.name}</p>
                    </div>
                    {competitor.website && (
                      <a
                        href={competitor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {competitor.website}
                      </a>
                    )}
                    {competitor.notes && (
                      <p className="text-sm text-gray-600 mt-1">{competitor.notes}</p>
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

