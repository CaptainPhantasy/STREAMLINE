'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Shield,
  Activity,
  FileText,
  Settings,
  Database,
  BarChart3,
  Clock,
  Eye,
  Key
} from 'lucide-react'

interface NavigationItem {
  title: string
  href: string
  icon: React.ReactNode
  description: string
  badge?: string
  active?: boolean
}

export function UserManagementNavigation() {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState('users')

  const navigationItems: NavigationItem[] = [
    {
      title: 'Users',
      href: '/admin/users',
      icon: <Users className="h-4 w-4" />,
      description: 'Manage user accounts and roles',
      active: pathname === '/admin/users'
    },
    {
      title: 'User Activity',
      href: '/admin/users/activity',
      icon: <Activity className="h-4 w-4" />,
      description: 'View user activity logs'
    },
    {
      title: 'Audit Logs',
      href: '/admin/users/audit',
      icon: <FileText className="h-4 w-4" />,
      description: 'Admin action audit trail'
    },
    {
      title: 'Impersonation',
      href: '/admin/users/impersonation',
      icon: <Eye className="h-4 w-4" />,
      description: 'Active impersonation sessions',
      badge: '0'
    },
    {
      title: 'Security',
      href: '/admin/users/security',
      icon: <Shield className="h-4 w-4" />,
      description: 'Security settings and alerts'
    },
    {
      title: 'Statistics',
      href: '/admin/users/statistics',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'User analytics and metrics'
    },
    {
      title: 'Import/Export',
      href: '/admin/users/import',
      icon: <Database className="h-4 w-4" />,
      description: 'Bulk user operations'
    },
    {
      title: 'API Keys',
      href: '/admin/users/api-keys',
      icon: <Key className="h-4 w-4" />,
      description: 'Manage user API credentials'
    },
    {
      title: 'Settings',
      href: '/admin/users/settings',
      icon: <Settings className="h-4 w-4" />,
      description: 'User management preferences'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">User Management</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href ||
                           (item.href === '/admin/users' && pathname.startsWith('/admin/users') && pathname === '/admin/users')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive
                    ? 'bg-accent text-accent-foreground border-l-4 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveSection(item.title.toLowerCase())}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>

                {item.badge && (
                  <Badge
                    variant={item.badge !== '0' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Add New User
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/users/audit">
                <Clock className="h-4 w-4 mr-2" />
                Recent Activity
              </Link>
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium mb-3">System Status</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Users</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Verifications</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Alerts</span>
              <span className="font-medium text-orange-600">-</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function UserManagementBreadcrumb() {
  const pathname = usePathname()

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '/admin' },
    { title: 'Users', href: '/admin/users' }
  ]

  if (pathname !== '/admin/users') {
    const currentSection = pathname.split('/').pop()
    breadcrumbItems.push({
      title: currentSection?.charAt(0).toUpperCase() + currentSection?.slice(1) || '',
      href: pathname
    })
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && <span>/</span>}
          <Link
            href={item.href}
            className={
              index === breadcrumbItems.length - 1
                ? 'text-foreground font-medium'
                : 'hover:text-foreground'
            }
          >
            {item.title}
          </Link>
        </React.Fragment>
      ))}
    </div>
  )
}