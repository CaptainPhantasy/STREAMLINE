'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Shield,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Copy,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import type { AdminUser, UserActivityLog } from '@/lib/types/admin-user-management'

interface UserDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

interface UserDetailResponse {
  user: AdminUser
  logs: UserActivityLog[]
  stats: any
}

export function UserDetailModal({ open, onOpenChange, userId }: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch user details
  const { data: userDetailData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user details')
      }
      return response.json() as Promise<{ success: boolean; data: AdminUser }>
    },
    enabled: !!userId && open,
    refetchInterval: open ? 30000 : false // Refresh every 30 seconds when open
  })

  // Fetch user activity logs
  const { data: activityData } = useQuery({
    queryKey: ['admin-user-activity', userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/activity?limit=50`)
      if (!response.ok) {
        throw new Error('Failed to fetch user activity')
      }
      return response.json() as Promise<{
        success: boolean;
        data: { logs: UserActivityLog[]; stats: any }
      }>
    },
    enabled: !!userId && open
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>
      case 'suspended':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Suspended</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
      case 'owner':
        return <Badge className="bg-blue-100 text-blue-800">Owner</Badge>
      case 'dispatcher':
        return <Badge className="bg-yellow-100 text-yellow-800">Dispatcher</Badge>
      case 'tech':
        return <Badge className="bg-green-100 text-green-800">Tech</Badge>
      case 'sales':
        return <Badge className="bg-indigo-100 text-indigo-800">Sales</Badge>
      case 'csr':
        return <Badge className="bg-pink-100 text-pink-800">CSR</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'login_failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'password_change':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center text-red-600 p-8">
            <p>Error loading user details: {(error as Error).message}</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const user = userDetailData?.data
  const activityLogs = activityData?.data?.logs || []
  const stats = activityData?.data?.stats

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : user ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* User Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {user.full_name?.charAt(0)?.toUpperCase() ||
                         user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold">{user.full_name || 'N/A'}</h3>
                      <p className="text-muted-foreground">{user.email}</p>
                      <div className="flex gap-2 mt-2">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{user.email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(user.email)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </Label>
                      <p className="text-sm">{user.phone || 'Not provided'}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Department
                      </Label>
                      <p className="text-sm">{user.department || 'Not specified'}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created
                      </Label>
                      <p className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Last Sign In
                      </Label>
                      <p className="text-sm">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Account ID</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {user.account_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(user.account_id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Authentication</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Email Verified</span>
                          {user.email_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">2FA Enabled</span>
                          {user.two_factor_enabled ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Account Health</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Active Status</span>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Banned</span>
                          <Badge variant={user.banned_until ? 'destructive' : 'secondary'}>
                            {user.banned_until ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {user.banned_until && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">Ban Information</p>
                          <p className="text-sm text-orange-800">
                            Banned until: {new Date(user.banned_until).toLocaleString()}
                          </p>
                          {user.ban_reason && (
                            <p className="text-sm text-orange-800 mt-1">
                              Reason: {user.ban_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              {/* Activity Stats */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.login_count}</div>
                        <div className="text-sm text-muted-foreground">Total Logins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.failed_login_count}</div>
                        <div className="text-sm text-muted-foreground">Failed Logins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.activity_this_week}</div>
                        <div className="text-sm text-muted-foreground">Activities This Week</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.profile_updates}</div>
                        <div className="text-sm text-muted-foreground">Profile Updates</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No activity logs found for this user
                    </p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getActivityIcon(log.action)}
                                  <span className="text-sm">
                                    {formatAction(log.action)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {log.resource_type || 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {log.ip_address}
                                </code>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              {/* Security Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Authentication Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Email Verification</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email_confirmed_at
                                ? `Verified on ${new Date(user.email_confirmed_at).toLocaleDateString()}`
                                : 'Not verified'
                              }
                            </p>
                          </div>
                          {user.email_verified ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">
                              {user.two_factor_enabled
                                ? '2FA is enabled for this account'
                                : '2FA is not enabled'
                              }
                            </p>
                          </div>
                          {user.two_factor_enabled ? (
                            <Shield className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Account Security</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Account Status</p>
                            <p className="text-sm text-muted-foreground">
                              {user.is_active ? 'Account is active' : 'Account is inactive'}
                            </p>
                          </div>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Ban Status</p>
                            <p className="text-sm text-muted-foreground">
                              {user.banned_until
                                ? `Banned until ${new Date(user.banned_until).toLocaleDateString()}`
                                : 'Account is not banned'
                              }
                            </p>
                          </div>
                          <Badge variant={user.banned_until ? 'destructive' : 'secondary'}>
                            {user.banned_until ? 'Banned' : 'Clean'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {user.ban_reason && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">Ban Details</h4>
                      <p className="text-sm text-red-800">
                        <strong>Reason:</strong> {user.ban_reason}
                      </p>
                      {user.banned_until && (
                        <p className="text-sm text-red-800 mt-1">
                          <strong>Expires:</strong> {new Date(user.banned_until).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}