'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, Clock, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { AdminUser } from '@/lib/types/admin-user-management'

interface ImpersonationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUser: AdminUser
  onSuccess: () => void
}

export function ImpersonationDialog({ open, onOpenChange, targetUser, onSuccess }: ImpersonationDialogProps) {
  const [duration, setDuration] = useState(1)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [impersonationResult, setImpersonationResult] = useState<any>(null)

  const handleStartImpersonation = async () => {
    if (!reason.trim()) {
      toast.error('Reason is required for impersonation')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/users/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: targetUser.id,
          reason: reason.trim(),
          duration: duration
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start impersonation')
      }

      if (result.success) {
        setImpersonationResult(result.data)
        toast.success('Impersonation session started', {
          description: `You can now impersonate ${targetUser.email} for ${duration} hour(s)`
        })
      }
    } catch (error) {
      toast.error('Failed to start impersonation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getExpirationTime = () => {
    const now = new Date()
    const expires = new Date(now.getTime() + duration * 60 * 60 * 1000)
    return expires.toLocaleString()
  }

  const resetForm = () => {
    setDuration(1)
    setReason('')
    setImpersonationResult(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Impersonate User</DialogTitle>
        </DialogHeader>

        {!impersonationResult ? (
          <div className="space-y-6">
            {/* Target User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Target User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm">{targetUser.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{targetUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <Badge variant="secondary">{targetUser.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge
                      variant={targetUser.status === 'active' ? 'default' : 'secondary'}
                      className={
                        targetUser.status === 'active' ? 'bg-green-100 text-green-800' : ''
                      }
                    >
                      {targetUser.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-sm">{targetUser.department || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account ID</Label>
                    <p className="text-sm font-mono">{targetUser.account_id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Warning */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Security Warning</p>
                    <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
                      <li>You will have full access to this user's account and data</li>
                      <li>All actions performed will be logged and attributed to you</li>
                      <li>The user will be notified of the impersonation session</li>
                      <li>This session will automatically expire after {duration} hour(s)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impersonation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impersonation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (hours)</Label>
                    <Select
                      value={duration.toString()}
                      onValueChange={(value) => setDuration(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Session will expire at {getExpirationTime()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Impersonation *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why you need to impersonate this user..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This reason will be logged for audit purposes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartImpersonation}
                disabled={!reason.trim() || isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? 'Starting...' : 'Start Impersonation'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Impersonation Started</p>
                    <p className="text-sm text-green-800 mt-1">
                      You are now impersonating {targetUser.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Session ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {impersonationResult.session.id.slice(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(impersonationResult.session.id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Expires At</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(impersonationResult.expires_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Impersonation Token</Label>
                  <div className="mt-1">
                    <Textarea
                      value={impersonationResult.impersonation_token}
                      readOnly
                      rows={3}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(impersonationResult.impersonation_token)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Token
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Next Steps</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Save the impersonation token securely</li>
                  <li>Use this token to authenticate as the target user</li>
                  <li>Perform the necessary actions within the session duration</li>
                  <li>End the impersonation session when finished</li>
                  <li>Remember: All actions are logged and auditable</li>
                </ol>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}