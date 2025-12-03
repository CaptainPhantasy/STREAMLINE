'use client'

import { useState } from 'react'
import { X, Home, Briefcase, Map, User, Target, Calendar, Settings, Users, LogOut, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: any
  label: string
  activePattern?: RegExp
  badge?: string
}

const techNavItems: NavItem[] = [
  { href: '/m/tech/dashboard', icon: Home, label: 'Dashboard', activePattern: /^\/m\/tech\/dashboard/ },
  { href: '/m/tech/jobs', icon: Briefcase, label: 'Jobs', activePattern: /^\/m\/tech\/(jobs|job)/ },
  { href: '/m/tech/map', icon: Map, label: 'Map', activePattern: /^\/m\/tech\/map/ },
  { href: '/m/tech/profile', icon: User, label: 'Profile', activePattern: /^\/m\/tech\/profile/ },
]

const salesNavItems: NavItem[] = [
  { href: '/m/sales/dashboard', icon: Home, label: 'Dashboard', activePattern: /^\/m\/sales\/dashboard/ },
  { href: '/m/sales/leads', icon: Target, label: 'Leads', activePattern: /^\/m\/sales\/leads/ },
  { href: '/m/sales/meetings', icon: Calendar, label: 'Meetings', activePattern: /^\/m\/sales\/(meetings|meeting)/ },
  { href: '/m/sales/profile', icon: User, label: 'Profile', activePattern: /^\/m\/sales\/profile/ },
]

const commonNavItems: NavItem[] = [
  { href: '/m/settings', icon: Settings, label: 'Settings' },
  { href: '/m/team', icon: Users, label: 'Team', badge: 'New' },
]

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  role: 'tech' | 'sales'
}

export function MobileSidebar({ isOpen, onClose, role }: MobileSidebarProps) {
  const pathname = usePathname()
  const roleNavItems = role === 'tech' ? techNavItems : salesNavItems

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-72 bg-[var(--color-bg-secondary)] shadow-elevated z-50',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-surface)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {/* Role-specific navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-2 px-3">
              {role === 'tech' ? 'Technician' : 'Sales'}
            </h3>
            {roleNavItems.map((item) => {
              const isActive = item.activePattern?.test(pathname) || pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                    'hover:bg-[var(--color-bg-surface)]',
                    isActive
                      ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Common navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-2 px-3">
              General
            </h3>
            {commonNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200',
                    'hover:bg-[var(--color-bg-surface)]',
                    isActive
                      ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-[var(--color-accent-primary)] text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            onClick={() => {
              // Handle logout
              onClose()
            }}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-[var(--color-bg-surface)] transition-colors shadow-card"
    >
      <Menu className="w-6 h-6 text-[var(--color-text-primary)]" />
    </button>
  )
}