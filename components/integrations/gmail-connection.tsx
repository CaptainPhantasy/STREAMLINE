'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle2, XCircle, ExternalLink, RefreshCw, Download, Users, MessageSquare } from 'lucide-react'

interface GmailProvider {
  id: string
  provider_email: string
  is_active: boolean
  is_default: boolean
  created_at: string
  user_id: string | null
}

export function GmailConnection() {
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [providers, setProviders] = useState<GmailProvider[]>([])
  const [error, setError] = useState<string | null>(null)
  const [syncStats, setSyncStats] = useState<{
    messagesProcessed: number
    contactsCreated: number
    contactsUpdated: number
    conversationsCreated: number
    messagesCreated: number
  } | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      setLoading(true)
      const response = await fetch('/api/integrations/gmail/status')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error fetching Gmail status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true)
      setError(null)
      
      const response = await fetch('/api/integrations/gmail/authorize')
      if (response.ok) {
        const data = await response.json()
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to initiate Gmail connection')
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      setError('Failed to connect Gmail. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  async function handleSync() {
    try {
      setSyncing(true)
      setError(null)
      setSyncStats(null)
      
      const response = await fetch('/api/integrations/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxMessages: 100,
          labelIds: ['INBOX', 'SENT'],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSyncStats(data.stats)
        // Refresh status to show updated info
        fetchStatus()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to sync emails')
      }
    } catch (error) {
      console.error('Error syncing Gmail:', error)
      setError('Failed to sync emails. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4 text-neutral-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const isConnected = providers.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Gmail Workspace Integration
            </CardTitle>
            <CardDescription className="mt-1">
              Connect your Gmail Workspace account to send emails directly from your business email
            </CardDescription>
          </div>
          {isConnected && (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {isConnected ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-neutral-700">Connected Accounts:</div>
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {provider.provider_email || 'Gmail Workspace Account'}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Connected {new Date(provider.created_at).toLocaleDateString()}
                      {provider.user_id && ' (User-specific)'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {provider.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                  {provider.is_active ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${connecting ? 'animate-spin' : ''}`} />
              {connecting ? 'Connecting...' : 'Add Another Workspace Account'}
            </Button>
            
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-neutral-700 mb-3">Sync Emails</div>
              <div className="text-xs text-neutral-500 mb-3">
                Sync emails from your Gmail Workspace to automatically create contacts and conversations in your CRM.
              </div>
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="w-full bg-[#4285F4] hover:bg-[#357AE8] text-white"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Sync Emails Now
                  </>
                )}
              </Button>
              
              {syncStats && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm font-medium text-green-800 mb-2">Sync Complete!</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {syncStats.messagesProcessed} messages
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {syncStats.contactsCreated} new contacts
                    </div>
                    {syncStats.contactsUpdated > 0 && (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        {syncStats.contactsUpdated} updated
                      </div>
                    )}
                    {syncStats.conversationsCreated > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {syncStats.conversationsCreated} conversations
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-neutral-600">
              Connect your Gmail Workspace account to send emails directly from your business email address.
              This allows you to:
            </div>
            <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
              <li>Send emails from your business Gmail Workspace address</li>
              <li>Maintain email threading and conversations</li>
              <li>Use your company's email domain and branding</li>
              <li>Access Gmail Workspace sending infrastructure</li>
            </ul>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
              <strong>Note:</strong> This requires a Gmail Workspace account (not personal Gmail). 
              You'll need admin access or permission to authorize the integration.
            </div>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-[#4285F4] hover:bg-[#357AE8] text-white"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Gmail Workspace
                </>
              )}
            </Button>
            <div className="text-xs text-neutral-500 text-center">
              You'll be redirected to Google to authorize access to your Workspace account
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

