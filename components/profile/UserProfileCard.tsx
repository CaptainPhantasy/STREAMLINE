'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'
import type { UserProfile } from '@/types/user-profiles'

interface UserProfileCardProps {
  profile: UserProfile
  showBio?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function UserProfileCard({
  profile,
  showBio = false,
  size = 'md',
}: UserProfileCardProps) {
  const primaryPhoto = profile.primary_photo || profile.profile_photos?.find(p => p.is_primary)
  const avatarUrl = primaryPhoto?.photo_url || profile.avatar_url

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage
          src={avatarUrl || undefined}
          alt={profile.full_name || 'User'}
          className="object-cover"
        />
        <AvatarFallback className="bg-[#EBF0FF] text-[#4B79FF]">
          {profile.full_name?.[0]?.toUpperCase() || (
            <User className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-900 truncate ${textSizeClasses[size]}`}>
          {profile.full_name || 'Unnamed User'}
        </p>
        {profile.role && (
          <p className={`text-gray-500 truncate ${textSizeClasses[size]}`}>
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </p>
        )}
        {showBio && profile.bio && (
          <p className={`text-gray-600 mt-1 line-clamp-2 ${textSizeClasses[size]}`}>
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Circular Avatar Component
 * Used throughout the platform UI for displaying user avatars
 */
export function CircularAvatar({
  profile,
  size = 'md',
  className = '',
}: {
  profile: UserProfile
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const primaryPhoto = profile.primary_photo || profile.profile_photos?.find(p => p.is_primary)
  const avatarUrl = primaryPhoto?.photo_url || profile.avatar_url

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage
        src={avatarUrl || undefined}
        alt={profile.full_name || 'User'}
        className="object-cover"
      />
      <AvatarFallback className="bg-[#EBF0FF] text-[#4B79FF]">
        {profile.full_name?.[0]?.toUpperCase() || (
          <User className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-8 h-8'} />
        )}
      </AvatarFallback>
    </Avatar>
  )
}

