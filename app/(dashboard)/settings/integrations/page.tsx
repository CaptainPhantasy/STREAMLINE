'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GmailConnection } from '@/components/integrations/gmail-connection'
import { MicrosoftConnection } from '@/components/integrations/microsoft-connection'
import { CheckCircle2, XCircle } from 'lucide-react'

function IntegrationsPageContent() {
  const searchParams = useSearchParams()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const successParam = searchParams.get('success')
    const errorParam = searchParams.get('error')

    if (successParam === 'gmail_connected') {
      setSuccess('Gmail Workspace connected successfully! You can now send emails from your business account.')
      setTimeout(() => setSuccess(null), 5000)
    }

    if (successParam === 'microsoft_connected') {
      setSuccess('Microsoft 365 connected successfully! You can now send emails from your business account.')
      setTimeout(() => setSuccess(null), 5000)
    }

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_failed: 'Failed to connect Gmail Workspace. Please ensure you have a Workspace account and try again.',
        missing_params: 'Missing required parameters. Please try connecting again.',
      }
      setError(errorMessages[errorParam] || 'An error occurred')
      setTimeout(() => setError(null), 5000)
    }
  }, [searchParams])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">Email Integrations</h1>
        <p className="text-sm text-neutral-500 mt-1">Connect your Gmail Workspace to send emails from your business account</p>
      </div>

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <GmailConnection />
        <MicrosoftConnection />
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Email Integrations</h1>
          <p className="text-sm text-neutral-500 mt-1">Connect your Gmail Workspace to send emails from your business account</p>
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-neutral-100 rounded-lg animate-pulse" />
          <div className="h-32 bg-neutral-100 rounded-lg animate-pulse" />
        </div>
      </div>
    }>
      <IntegrationsPageContent />
    </Suspense>
  )
}

