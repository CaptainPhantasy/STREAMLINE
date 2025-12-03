'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User } from '@/types'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess: () => void
}

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'tech' as 'owner' | 'admin' | 'dispatcher' | 'tech',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (user) {
        // Editing existing user
        setFormData({
          email: '', // Don't show email for existing users
          password: '', // Don't require password for updates
          fullName: user.full_name || '',
          role: (user.role || 'tech') as 'owner' | 'admin' | 'dispatcher' | 'tech',
        })
      } else {
        // Creating new user
        setFormData({
          email: '',
          password: '',
          fullName: '',
          role: 'tech',
        })
      }
      setError(null)
    }
  }, [open, user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (user) {
        // Update existing user
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName || null,
            role: formData.role,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          onSuccess()
          onOpenChange(false)
        } else {
          const data = await response.json().catch(() => ({ error: 'Failed to update user' }))
          setError(data.error || 'Failed to update user')
        }
      } else {
        // Create new user
        if (!formData.email || !formData.password) {
          setError('Email and password are required')
          setLoading(false)
          return
        }

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName || null,
            role: formData.role,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          onSuccess()
          onOpenChange(false)
          setFormData({
            email: '',
            password: '',
            fullName: '',
            role: 'tech',
          })
        } else {
          setError(data.error || 'Failed to create user')
        }
      }
    } catch (error) {
      console.error('Error saving user:', error)
      setError('Failed to save user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user role and information' : 'Create a new user account'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            {!user && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'owner' | 'admin' | 'dispatcher' | 'tech') => 
                  setFormData({ ...formData, role: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="tech">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setError(null)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4B79FF] hover:bg-[#3366FF]">
              {loading ? (user ? 'Updating...' : 'Creating...') : (user ? 'Update User' : 'Create User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

