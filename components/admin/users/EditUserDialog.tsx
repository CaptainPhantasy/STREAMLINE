'use client'

import React, { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { AlertTriangle, User, Shield, Phone, Building } from 'lucide-react'
import type { AdminUser, UpdateUserRequest } from '@/lib/types/admin-user-management'

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser
  onSuccess: () => void
}

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    full_name: '',
    role: 'tech',
    phone: '',
    department: '',
    is_active: true
  })
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with user data
  useEffect(() => {
    if (user && open) {
      setFormData({
        full_name: user.full_name || '',
        role: user.role,
        phone: user.phone || '',
        department: user.department || '',
        is_active: user.status !== 'banned' && user.status !== 'suspended'
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.validation_errors) {
          const errorMessages = result.validation_errors.map((e: any) =>
            `${e.field}: ${e.message}`
          ).join('\n')
          throw new Error(errorMessages)
        }
        throw new Error(result.error || 'Failed to update user')
      }

      if (result.success) {
        toast.success('User updated successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error('Failed to update user', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = () => {
    return (
      formData.full_name !== (user.full_name || '') ||
      formData.role !== user.role ||
      formData.phone !== (user.phone || '') ||
      formData.department !== (user.department || '') ||
      formData.is_active !== (user.status !== 'banned' && user.status !== 'suspended')
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user.email}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                User Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}
                    >
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="dispatcher">Dispatcher</SelectItem>
                        <SelectItem value="tech">Technician</SelectItem>
                        <SelectItem value="sales">Sales Representative</SelectItem>
                        <SelectItem value="csr">Customer Service Representative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="department"
                      placeholder="Operations, Sales, etc."
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Account Status</h3>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, is_active: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_active">
                    Account is active and can log in
                  </Label>
                </div>
              </div>

              {/* Current Status Display */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Current Status:</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{user.status}</span>
                  {user.banned_until && (
                    <span className="text-xs text-muted-foreground">
                      (banned until {new Date(user.banned_until).toLocaleDateString()})
                    </span>
                  )}
                </div>
                {user.ban_reason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Reason: {user.ban_reason}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warning for Role Changes */}
          {formData.role !== user.role && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Role Change Warning</p>
                    <p className="text-sm text-orange-800 mt-1">
                      Changing this user's role from "{user.role}" to "{formData.role}" will modify their
                      permissions and access throughout the system. This action will be logged.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Info Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <span className="font-medium">Account ID:</span>
                  <p className="text-muted-foreground">{user.account_id}</p>
                </div>
                <div>
                  <span className="font-medium">Email Verified:</span>
                  <p className="text-muted-foreground">
                    {user.email_verified ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">2FA Enabled:</span>
                  <p className="text-muted-foreground">
                    {user.two_factor_enabled ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Last Sign In:</span>
                  <p className="text-muted-foreground">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges() || isLoading}
            >
              {isLoading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}