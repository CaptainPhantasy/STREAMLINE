'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface EstimateVersionsProps {
  estimateId: string
  onVersionCreated?: () => void
}

export function EstimateVersions({ estimateId, onVersionCreated }: EstimateVersionsProps) {
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchVersions()
  }, [estimateId])

  async function fetchVersions() {
    try {
      setLoading(true)
      const response = await fetch(`/api/estimates/${estimateId}/versions`)

      if (!response.ok) {
        throw new Error('Failed to fetch versions')
      }

      const data = await response.json()
      setVersions(data.versions || [])
    } catch (error: any) {
      console.error('Error fetching versions:', error)
      toast.error('Failed to load versions')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateVersion() {
    setCreating(true)

    try {
      const response = await fetch(`/api/estimates/${estimateId}/versions`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create version')
      }

      const { version } = await response.json()
      setVersions([...versions, version])
      onVersionCreated?.()
      toast.success('New version created')
    } catch (error: any) {
      console.error('Error creating version:', error)
      toast.error(error.message || 'Failed to create version')
    } finally {
      setCreating(false)
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
            <CardTitle>Estimate Versions</CardTitle>
            <CardDescription>
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button onClick={handleCreateVersion} disabled={creating} size="sm">
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                New Version
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {versions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No versions yet</p>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">
                      Version {version.version}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(version.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{version.status}</Badge>
                  {version.view_count > 0 && (
                    <span className="text-xs text-gray-500">
                      {version.view_count} view{version.view_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

