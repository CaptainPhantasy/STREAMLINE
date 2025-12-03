'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: string
}

interface NewMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectUser: (userId: string) => void
  currentUserId: string | null
}

export function NewMessageDialog({
  open,
  onOpenChange,
  onSelectUser,
  currentUserId,
}: NewMessageDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  async function fetchUsers() {
    try {
      setLoading(true)
      const response = await fetch('/api/users/teammates')

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      // Filter out current user
      const filteredUsers = (data.users || []).filter(
        (u: User) => u.id !== currentUserId
      )
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Select a teammate to start a conversation
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users List */}
        <ScrollArea className="h-[400px] mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user.id)
                    onOpenChange(false)
                    setSearchQuery('')
                  }}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={user.avatar_url || undefined}
                      alt={user.full_name || user.email}
                    />
                    <AvatarFallback className="bg-[#EBF0FF] text-[#4B79FF]">
                      {user.full_name?.[0]?.toUpperCase() || (
                        <User className="w-5 h-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user.full_name || 'No name'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    {user.role && (
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {user.role}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

