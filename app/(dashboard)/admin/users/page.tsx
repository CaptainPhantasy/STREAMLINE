'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Activity, AlertTriangle } from 'lucide-react'
import { UserListView } from '@/components/admin/users/UserListView'
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'

function UsersPageContent() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatsSkeleton />}>
          <QuickStatCard
            title="Total Users"
            value="-"
            icon={<Users className="h-4 w-4" />}
            description="Total users across all accounts"
          />
        </Suspense>

        <Suspense fallback={<StatsSkeleton />}>
          <QuickStatCard
            title="Active Sessions"
            value="-"
            icon={<Activity className="h-4 w-4" />}
            description="Currently active users"
          />
        </Suspense>

        <Suspense fallback={<StatsSkeleton />}>
          <QuickStatCard
            title="Admin Accounts"
            value="-"
            icon={<Shield className="h-4 w-4" />}
            description="Administrator and owner accounts"
          />
        </Suspense>

        <Suspense fallback={<StatsSkeleton />}>
          <QuickStatCard
            title="Security Alerts"
            value="-"
            icon={<AlertTriangle className="h-4 w-4" />}
            description="Recent security incidents"
            variant="warning"
          />
        </Suspense>
      </div>

      {/* User Management Interface */}
      <UserListView />
    </div>
  )
}

// Quick Stats Component
async function QuickStatCard({
  title,
  value,
  icon,
  description,
  variant = 'default'
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  description: string
  variant?: 'default' | 'warning' | 'success' | 'danger'
}) {
  try {
    // Fetch real stats based on the title
    let statValue = value

    if (title === 'Total Users') {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/statistics?period=month`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        statValue = data.data?.total_users || 0
      }
    }

    const variantClasses = {
      default: 'border-blue-200 bg-blue-50',
      warning: 'border-orange-200 bg-orange-50',
      success: 'border-green-200 bg-green-50',
      danger: 'border-red-200 bg-red-50'
    }

    return (
      <Card className={variantClasses[variant]}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statValue}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    )
  } catch (error) {
    // Fallback to skeleton if API fails
    return <StatsSkeleton />
  }
}

// Skeleton Component
function StatsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-12 bg-muted rounded animate-pulse mb-2" />
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

export default function UsersPage() {
  return (
    <AdminErrorBoundary errorMessage="Failed to load user management page">
      <UsersPageContent />
    </AdminErrorBoundary>
  )
}

