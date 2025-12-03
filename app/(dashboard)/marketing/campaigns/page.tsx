'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Mail, Play, Pause, BarChart3, Users, Eye, MousePointerClick } from 'lucide-react'
import type { Campaign } from '@/types/campaigns'
import { useRouter } from 'next/navigation'
import { CampaignEditorDialog } from '@/components/marketing/campaign-editor-dialog'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { usePermissions } from '@/lib/hooks/usePermissions'

function CampaignsPageContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const router = useRouter()
  const { hasPermission, loading: permissionsLoading } = usePermissions()

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('manage_marketing')) {
      router.push('/inbox')
    }
  }, [hasPermission, permissionsLoading, router])

  if (permissionsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!hasPermission('manage_marketing')) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Access Denied</div>
      </div>
    )
  }

  useEffect(() => {
    fetchCampaigns()
  }, [filterStatus])

  async function fetchCampaigns() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }

      const response = await fetch(`/api/campaigns?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'draft':
        return 'bg-neutral-100 text-neutral-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Campaigns</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your email marketing campaigns</p>
        </div>
        <Button
          onClick={() => {
            setEditingCampaign(null)
            setEditorOpen(true)
          }}
          className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-[var(--color-text-primary)]">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-sm bg-[var(--input-bg)] text-[var(--color-text-primary)]"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {loading ? (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-[var(--color-text-subtle)] mx-auto mb-4" />
              <p className="text-[var(--color-text-primary)] font-medium mb-2">No campaigns found</p>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Create your first email campaign</p>
              <Button
                onClick={() => {
                  setEditingCampaign(null)
                  setEditorOpen(true)
                }}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="hover:shadow-md transition-shadow cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)]"
              onClick={() => router.push(`/marketing/campaigns/${campaign.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-[var(--color-text-primary)]">{campaign.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {campaign.campaign_type === 'email' ? 'Email Campaign' : campaign.campaign_type}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[var(--color-text-secondary)] text-xs">Sent</div>
                      <div className="font-semibold text-[var(--color-text-primary)]">{campaign.sent_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-secondary)] text-xs">Opened</div>
                      <div className="font-semibold text-[var(--color-text-primary)]">{campaign.opened_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-secondary)] text-xs">Clicked</div>
                      <div className="font-semibold text-[var(--color-text-primary)]">{campaign.clicked_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-secondary)] text-xs">Rate</div>
                      <div className="font-semibold text-[var(--color-text-primary)]">
                        {campaign.sent_count
                          ? `${Math.round(((campaign.opened_count || 0) / campaign.sent_count) * 100)}%`
                          : '0%'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/marketing/campaigns/${campaign.id}`)
                      }}
                      className="flex-1 mr-2"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCampaign(campaign)
                        setEditorOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CampaignEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaign={editingCampaign}
        onSuccess={() => {
          fetchCampaigns()
          setEditingCampaign(null)
        }}
      />
    </div>
  )
}

export default function CampaignsPage() {
  return (
    <ErrorBoundary>
      <CampaignsPageContent />
    </ErrorBoundary>
  )
}

