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
import { Eye, EyeOff, Mail, User, Shield, Phone, Building } from 'lucide-react'
import type { CreateUserRequest } from '@/lib/types/admin-user-management'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    full_name: '',
    role: 'tech',
    phone: '',
    department: '',
    send_invite: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'tech',
        phone: '',
        department: '',
        send_invite: false
      })
      setGeneratedPassword('')
    }
  }, [open])

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleGeneratePassword = () => {
    const password = generatePassword()
    setFormData(prev => ({ ...prev, password }))
    setGeneratedPassword(password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
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
        throw new Error(result.error || 'Failed to create user')
      }

      if (result.success) {
        toast.success('User created successfully', {
          description: formData.send_invite
            ? 'Invite email has been sent to the user'
            : result.data.temp_password
              ? 'Password generated. Save it securely.'
              : 'User account has been created'
        })

        // If temporary password was generated, show it
        if (result.data.temp_password) {
          navigator.clipboard.writeText(result.data.temp_password)
          toast.info('Temporary password copied to clipboard')
        }

        onSuccess()
      }
    } catch (error) {
      toast.error('Failed to create user', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.email && formData.role && (formData.send_invite || formData.password)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
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
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Authentication</h3>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send_invite"
                    checked={formData.send_invite}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        send_invite: checked as boolean,
                        password: checked ? '' : prev.password
                      }))
                    }
                  />
                  <Label htmlFor="send_invite">
                    Send email invitation (user will set their own password)
                  </Label>
                </div>
              </div>

              {!formData.send_invite && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGeneratePassword}
                    >
                      Generate Password
                    </Button>
                  </div>

                  {generatedPassword && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Generated Password:</p>
                      <code className="text-sm bg-background px-2 py-1 rounded">
                        {generatedPassword}
                      </code>
                      <p className="text-xs text-muted-foreground mt-1">
                        Copy this password now - it won't be shown again.
                      </p>
                    </div>
                  )}
                </div>
              )}
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
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Creating User...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}