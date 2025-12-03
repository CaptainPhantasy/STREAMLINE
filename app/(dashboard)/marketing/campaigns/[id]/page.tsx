'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Mail,
  Send,
  Pause,
  Play,
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  Calendar,
  FileText,
  Trash2,
  Edit,
} from 'lucide-react'
import type { Campaign, CampaignRecipient } from '@/types/campaigns'
import { CampaignEditorDialog } from '@/components/marketing/campaign-editor-dialog'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'
import { confirmDialog } from '@/lib/confirm'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
      fetchRecipients()
    }
  }, [campaignId])

  async function fetchCampaign() {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecipients() {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/recipients`)
      if (response.ok) {
        const data = await response.json()
        setRecipients(data.recipients || [])
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
    }
  }

  async function handleAction(action: 'send' | 'pause' | 'resume') {
    setActionLoading(action)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchCampaign()
        toastSuccess(`Campaign ${action}ed successfully`)
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
        toastError(`Failed to ${action} campaign`, data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error)
      toastError(`Failed to ${action} campaign`, 'Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete() {
    const confirmed = await confirmDialog({
      title: 'Delete Campaign',
      description: 'Are you sure you want to delete this campaign? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toastSuccess('Campaign deleted successfully')
        router.push('/marketing/campaigns')
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
        toastError('Failed to delete campaign', data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toastError('Failed to delete campaign', 'Network error. Please try again.')
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
      case 'scheduled':
        return 'bg-purple-100 text-purple-700'
      case 'draft':
        return 'bg-neutral-100 text-neutral-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-neutral-500">Loading campaign...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-neutral-600 font-medium mb-2">Campaign not found</p>
          <Button onClick={() => router.push('/marketing/campaigns')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  const openRate = campaign.sent_count
    ? Math.round(((campaign.opened_count || 0) / campaign.sent_count) * 100)
    : 0
  const clickRate = campaign.sent_count
    ? Math.round(((campaign.clicked_count || 0) / campaign.sent_count) * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/marketing/campaigns')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">{campaign.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {campaign.campaign_type === 'email' ? 'Email Campaign' : campaign.campaign_type}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditorOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.sent_count || 0}</div>
            <div className="text-xs text-neutral-500 mt-1">Total emails sent</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.opened_count || 0}</div>
            <div className="text-xs text-neutral-500 mt-1">{openRate}% open rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Clicked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.clicked_count || 0}</div>
            <div className="text-xs text-neutral-500 mt-1">{clickRate}% click rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipients.length}</div>
            <div className="text-xs text-neutral-500 mt-1">Total recipients</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Actions</CardTitle>
          <CardDescription>Control your campaign execution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {campaign.status === 'draft' && (
              <Button
                onClick={() => handleAction('send')}
                disabled={actionLoading !== null}
                className="bg-[#4B79FF] hover:bg-[#3366FF] text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {actionLoading === 'send' ? 'Sending...' : 'Send Campaign'}
              </Button>
            )}
            {campaign.status === 'active' && (
              <Button
                onClick={() => handleAction('pause')}
                disabled={actionLoading !== null}
                variant="outline"
              >
                <Pause className="w-4 h-4 mr-2" />
                {actionLoading === 'pause' ? 'Pausing...' : 'Pause Campaign'}
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button
                onClick={() => handleAction('resume')}
                disabled={actionLoading !== null}
                className="bg-[#4B79FF] hover:bg-[#3366FF] text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                {actionLoading === 'resume' ? 'Resuming...' : 'Resume Campaign'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-neutral-500">Type</div>
              <div className="font-medium">{campaign.campaign_type}</div>
            </div>
            {campaign.email_template && (
              <div>
                <div className="text-sm text-neutral-500">Email Template</div>
                <div className="font-medium">{campaign.email_template.name}</div>
              </div>
            )}
            {campaign.scheduled_start && (
              <div>
                <div className="text-sm text-neutral-500">Scheduled Start</div>
                <div className="font-medium">
                  {new Date(campaign.scheduled_start).toLocaleString()}
                </div>
              </div>
            )}
            {campaign.scheduled_end && (
              <div>
                <div className="text-sm text-neutral-500">Scheduled End</div>
                <div className="font-medium">
                  {new Date(campaign.scheduled_end).toLocaleString()}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-neutral-500">Created</div>
              <div className="font-medium">
                {new Date(campaign.created_at).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">Open Rate</div>
              <div className="font-semibold">{openRate}%</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">Click Rate</div>
              <div className="font-semibold">{clickRate}%</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">Bounce Rate</div>
              <div className="font-semibold">
                {recipients.filter((r) => r.bounced).length}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">Unsubscribed</div>
              <div className="font-semibold">
                {recipients.filter((r) => r.unsubscribed).length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
          <CardDescription>View and manage campaign recipients</CardDescription>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No recipients added to this campaign yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient) => {
                    const contact = (recipient as any).contact
                    return (
                      <TableRow key={recipient.contact_id}>
                        <TableCell>
                          {contact
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
                              'Unknown'
                            : 'Unknown'}
                        </TableCell>
                        <TableCell>{contact?.email || 'N/A'}</TableCell>
                        <TableCell>
                          {recipient.sent_at
                            ? new Date(recipient.sent_at).toLocaleDateString()
                            : 'Not sent'}
                        </TableCell>
                        <TableCell>
                          {recipient.opened_at
                            ? new Date(recipient.opened_at).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {recipient.clicked_at
                            ? new Date(recipient.clicked_at).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {recipient.bounced && (
                            <Badge variant="destructive">Bounced</Badge>
                          )}
                          {recipient.unsubscribed && (
                            <Badge variant="destructive">Unsubscribed</Badge>
                          )}
                          {!recipient.bounced && !recipient.unsubscribed && (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaign={campaign}
        onSuccess={() => {
          fetchCampaign()
        }}
      />
    </div>
  )
}

