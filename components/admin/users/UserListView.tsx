'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { debounce } from 'lodash'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Search,
  Filter,
  MoreHorizontal,
  Users,
  Shield,
  Ban,
  Trash2,
  Settings,
  RefreshCw,
  UserPlus,
  Eye,
  Edit,
  Copy,
  Key
} from 'lucide-react'
import { hasPermission } from '@/lib/auth/permissions'
import type {
  AdminUser,
  UserSearchParams,
  UserListResponse,
  BulkOperation,
  BulkOperationResult
} from '@/lib/types/admin-user-management'
import { CreateUserDialog } from './CreateUserDialog'
import { EditUserDialog } from './EditUserDialog'
import { UserDetailModal } from './UserDetailModal'
import { ImpersonationDialog } from './ImpersonationDialog'

interface UserListViewProps {
  className?: string
}

export function UserListView({ className }: UserListViewProps) {
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showImpersonationDialog, setShowImpersonationDialog] = useState(false)
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [bulkAction, setBulkAction] = useState<BulkOperation | null>(null)
  const [bulkActionReason, setBulkActionReason] = useState('')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Fetch users
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v))
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json() as Promise<{ success: boolean; data: UserListResponse }>
    },
    keepPreviousData: true
  })

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async (operation: BulkOperation) => {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(operation)
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk operation')
      }

      return response.json() as Promise<{ success: boolean; data: BulkOperationResult }>
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success(`Bulk ${variables.action} completed successfully`, {
          description: `${result.data.processed} users processed, ${result.data.failed} failed`
        })

        if (result.data.errors.length > 0) {
          console.error('Bulk operation errors:', result.data.errors)
        }

        setSelectedUsers([])
        setShowBulkActionDialog(false)
        setBulkAction(null)
        queryClient.invalidateQueries(['admin-users'])
      } else {
        toast.error('Bulk operation failed')
      }
    },
    onError: (error) => {
      toast.error('Bulk operation failed', {
        description: error.message
      })
    }
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      setShowDeleteDialog(false)
      setDeleteUserId(null)
      queryClient.invalidateQueries(['admin-users'])
    },
    onError: (error) => {
      toast.error('Failed to delete user', {
        description: error.message
      })
    }
  })

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchParams(prev => ({ ...prev, q: query || undefined, page: 1 }))
    }, 500),
    []
  )

  // Handle search
  const handleSearch = (query: string) => {
    debouncedSearch(query)
  }

  // Handle filter change
  const handleFilterChange = (key: keyof UserSearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1
    }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  // Handle sort
  const handleSort = (column: keyof AdminUser) => {
    setSearchParams(prev => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Handle bulk action
  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected')
      return
    }

    const operation: BulkOperation = {
      action: action as any,
      userIds: selectedUsers
    }

    if (action === 'ban' || action === 'change_role') {
      operation.payload = {}
      setBulkAction(operation)
      setShowBulkActionDialog(true)
    } else {
      bulkOperationMutation.mutate(operation)
    }
  }

  // Handle user deletion
  const handleDeleteUser = (userId: string) => {
    setDeleteUserId(userId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = () => {
    if (deleteUserId) {
      deleteUserMutation.mutate(deleteUserId)
    }
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
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

  // Get role badge color
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading users: {(error as Error).message}</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across all accounts
          </p>
        </div>

        <div className="flex gap-2">
          {hasPermission('owner', 'manage_users') && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersData?.data?.pagination.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersData?.data?.filters.available.statuses.find(s => s.status === 'active')?.count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersData?.data?.filters.available.statuses.find(s => s.status === 'banned')?.count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usersData?.data?.filters.available.roles.find(r => r.role === 'admin')?.count || 0) +
               (usersData?.data?.filters.available.roles.find(r => r.role === 'owner')?.count || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email..."
                  className="pl-9"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={searchParams.role || 'all'}
                onValueChange={(value) => handleFilterChange('role', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="csr">CSR</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={searchParams.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={searchParams.email_verified?.toString() || 'all'}
                onValueChange={(value) => handleFilterChange('email_verified', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Verified</SelectItem>
                  <SelectItem value="false">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </span>

                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                        <Ban className="h-4 w-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('ban')}>
                        <Ban className="h-4 w-4 mr-2" />
                        Ban Users
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('unban')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Unban Users
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('change_role')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleBulkAction('delete')}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Users
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                  className="ml-auto"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({usersData?.data?.pagination.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === usersData?.data?.users.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(usersData?.data?.users.map(u => u.id) || [])
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email Verified</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      {searchParams.sort_by === 'created_at' && (
                        <span className="ml-1">
                          {searchParams.sort_order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('last_sign_in_at')}
                    >
                      Last Sign In
                      {searchParams.sort_by === 'last_sign_in_at' && (
                        <span className="ml-1">
                          {searchParams.sort_order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.data?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(prev => [...prev, user.id])
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.full_name?.charAt(0)?.toUpperCase() ||
                               user.email?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.full_name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.email_verified ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Verified</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.department || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setCurrentUser(user)
                              setShowDetailModal(true)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setCurrentUser(user)
                              setShowEditDialog(true)
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            {hasPermission('owner', 'impersonate_users') && (
                              <DropdownMenuItem onClick={() => {
                                setCurrentUser(user)
                                setShowImpersonationDialog(true)
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Impersonate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {usersData?.data && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((usersData.data.pagination.page - 1) * usersData.data.pagination.limit) + 1} to{' '}
                {Math.min(usersData.data.pagination.page * usersData.data.pagination.limit, usersData.data.pagination.total)} of{' '}
                {usersData.data.pagination.total} results
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(usersData.data.pagination.page - 1)}
                  disabled={usersData.data.pagination.page <= 1}
                >
                  Previous
                </Button>

                <span className="text-sm">
                  Page {usersData.data.pagination.page} of {usersData.data.pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(usersData.data.pagination.page + 1)}
                  disabled={usersData.data.pagination.page >= usersData.data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateUserDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            queryClient.invalidateQueries(['admin-users'])
            setShowCreateDialog(false)
          }}
        />
      )}

      {showEditDialog && currentUser && (
        <EditUserDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          user={currentUser}
          onSuccess={() => {
            queryClient.invalidateQueries(['admin-users'])
            setShowEditDialog(false)
            setCurrentUser(null)
          }}
        />
      )}

      {showDetailModal && currentUser && (
        <UserDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          userId={currentUser.id}
        />
      )}

      {showImpersonationDialog && currentUser && (
        <ImpersonationDialog
          open={showImpersonationDialog}
          onOpenChange={setShowImpersonationDialog}
          targetUser={currentUser}
          onSuccess={() => {
            setShowImpersonationDialog(false)
            setCurrentUser(null)
          }}
        />
      )}

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm Bulk {bulkAction?.action} ({selectedUsers.length} users)
            </DialogTitle>
          </DialogHeader>

          {bulkAction?.action === 'ban' && (
            <div className="space-y-4">
              <Label htmlFor="reason">Ban Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for banning these users..."
                value={bulkActionReason}
                onChange={(e) => setBulkActionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {bulkAction?.action === 'change_role' && (
            <div className="space-y-4">
              <Label>New Role</Label>
              <Select
                onValueChange={(value) => {
                  if (bulkAction) {
                    setBulkAction({
                      ...bulkAction,
                      payload: { ...bulkAction.payload, role: value as any }
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="csr">CSR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkActionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (bulkAction && bulkActionReason && bulkAction.action === 'ban') {
                  bulkOperationMutation.mutate({
                    ...bulkAction,
                    payload: { ...bulkAction.payload, reason: bulkActionReason }
                  })
                } else if (bulkAction) {
                  bulkOperationMutation.mutate(bulkAction)
                }
              }}
              disabled={bulkOperationMutation.isLoading}
            >
              {bulkOperationMutation.isLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}