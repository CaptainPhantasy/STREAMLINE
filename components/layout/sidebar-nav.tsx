'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Mail,
  Briefcase,
  Users,
  BarChart3,
  DollarSign,
  Settings as SettingsIcon,
  Send,
  FileText,
  Tag,
  Calendar,
  Map,
  UserCog,
  Zap,
  Brain,
  FileCheck,
  PieChart,
  Wrench,
  Handshake,
  Crown,
  Target,
  Headphones,
  Receipt,
  AlertCircle,
  Plus,
  Clock,
  LayoutGrid,
  MessageSquare,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConditionalVoiceWidget } from '@/components/conditional-voice-widget'
import { PermissionGate } from '@/lib/auth/PermissionGate'

const navItems = [
  { label: "Inbox", icon: Mail, href: "/inbox", permission: null },
  { label: "Messages", icon: MessageSquare, href: "/messages", permission: null },
  { label: "My Profile", icon: User, href: "/settings/profile", permission: null },
  { label: "Jobs", icon: Briefcase, href: "/jobs", permission: 'view_all_jobs' as const },
  { label: "Jobs (Kanban)", icon: LayoutGrid, href: "/jobs?view=kanban", permission: 'view_all_jobs' as const },
  { label: "Estimates", icon: FileText, href: "/estimates", permission: 'view_estimates' as const },
  { label: "Parts", icon: Tag, href: "/parts", permission: 'view_parts' as const },
  { label: "Contacts", icon: Users, href: "/contacts", permission: 'view_contacts' as const },
  { label: "Calendar", icon: Calendar, href: "/calendar", permission: null },
  { label: "Dispatch Map", icon: Map, href: "/dispatch/map", permission: 'view_dispatch_map' as const },
  { label: "Analytics", icon: BarChart3, href: "/analytics", permission: 'view_analytics' as const },
  { label: "Reports", icon: PieChart, href: "/reports", permission: 'view_analytics' as const },
  { label: "Finance", icon: DollarSign, href: "/finance/dashboard", permission: 'view_financials' as const },
]

const roleDashboards = [
  { label: "Tech Dashboard", icon: Wrench, href: "/tech/dashboard", permission: null },
  { label: "Sales Dashboard", icon: Handshake, href: "/sales/dashboard", permission: null },
  { label: "Owner Dashboard", icon: Crown, href: "/owner/dashboard", permission: null },
  { label: "CSR Dashboard", icon: Headphones, href: "/csr/dashboard", permission: null },
]

const techItems = [
  { label: "Tech Map", icon: Map, href: "/tech/map", permission: null },
  { label: "Request Job", icon: Plus, href: "/tech/jobs/request", permission: null },
]

const salesItems = [
  { label: "Leads", icon: Target, href: "/sales/leads", permission: 'view_contacts' as const },
  { label: "Pipeline", icon: BarChart3, href: "/sales/pipeline", permission: 'view_contacts' as const },
  { label: "Meetings", icon: Calendar, href: "/sales/meetings", permission: 'view_contacts' as const },
  { label: "Follow-Ups", icon: Clock, href: "/sales/pipeline?tab=follow-ups", permission: 'view_contacts' as const },
]

const dispatchItems = [
  { label: "Unassigned Jobs", icon: AlertCircle, href: "/dispatch/unassigned", permission: 'manage_dispatch' as const },
]

const ownerItems = [
  { label: "Business Reports", icon: PieChart, href: "/owner/reports", permission: 'view_analytics' as const },
]

const marketingItems = [
  { label: "Campaigns", icon: Send, href: "/marketing/campaigns", permission: 'manage_marketing' as const },
  { label: "Templates", icon: FileText, href: "/marketing/email-templates", permission: 'manage_marketing' as const },
  { label: "Tags", icon: Tag, href: "/marketing/tags", permission: 'manage_marketing' as const },
]

const adminItems = [
  { label: "Invoices", icon: Receipt, href: "/admin/invoices", permission: 'view_financials' as const },
  { label: "Settings", icon: SettingsIcon, href: "/admin/settings", permission: 'view_settings' as const },
  { label: "Users", icon: UserCog, href: "/admin/users", permission: 'manage_users' as const },
  { label: "Automation", icon: Zap, href: "/admin/automation", permission: 'view_settings' as const },
  { label: "LLM Providers", icon: Brain, href: "/admin/llm-providers", permission: 'view_settings' as const },
  { label: "Audit Log", icon: FileCheck, href: "/admin/audit", permission: 'view_settings' as const },
]

function isActive(pathname: string, href: string, searchParams: URLSearchParams | null): boolean {
  if (href === '/inbox') {
    return pathname === '/inbox'
  }
  if (href === '/messages') {
    return pathname === '/messages' || pathname.startsWith('/messages/')
  }
  if (href === '/jobs') {
    return pathname === '/jobs' || pathname.startsWith('/jobs/')
  }
  if (href.startsWith('/jobs?view=kanban')) {
    return pathname === '/jobs' && searchParams?.get('view') === 'kanban'
  }
  if (href === '/contacts') {
    return pathname === '/contacts' || pathname.startsWith('/contacts/')
  }
  if (href === '/calendar') {
    return pathname === '/calendar' || pathname.startsWith('/calendar/')
  }
  if (href === '/dispatch/map') {
    return pathname === '/dispatch/map' || pathname.startsWith('/dispatch/')
  }
  if (href === '/analytics') {
    return pathname === '/analytics' || pathname.startsWith('/analytics/')
  }
  if (href === '/reports') {
    return pathname === '/reports' || pathname.startsWith('/reports/')
  }
  if (href === '/finance') {
    return pathname === '/finance' || pathname.startsWith('/finance/')
  }
  if (href === '/estimates') {
    return pathname === '/estimates' || pathname.startsWith('/estimates/')
  }
  if (href === '/parts') {
    return pathname === '/parts' || pathname.startsWith('/parts/')
  }
  // Role dashboard routes
  if (href === '/tech/dashboard') {
    return pathname === '/tech/dashboard'
  }
  if (href === '/tech/map') {
    return pathname === '/tech/map' || pathname.startsWith('/tech/map')
  }
  if (href === '/sales/dashboard') {
    return pathname === '/sales/dashboard'
  }
  if (href === '/sales/leads') {
    return pathname === '/sales/leads' || pathname.startsWith('/sales/leads')
  }
  if (href === '/sales/pipeline') {
    return pathname === '/sales/pipeline' || pathname.startsWith('/sales/pipeline')
  }
  if (href.startsWith('/sales/pipeline?tab=')) {
    const expectedTab = href.split('tab=')[1]
    return pathname === '/sales/pipeline' && searchParams?.get('tab') === expectedTab
  }
  if (href === '/sales/meetings') {
    return pathname === '/sales/meetings' || pathname.startsWith('/sales/meetings')
  }
  if (href === '/owner/dashboard') {
    return pathname === '/owner/dashboard'
  }
  if (href === '/owner/reports') {
    return pathname === '/owner/reports' || pathname.startsWith('/owner/reports')
  }
  if (href === '/csr/dashboard') {
    return pathname === '/csr/dashboard' || pathname.startsWith('/csr/')
  }
  if (href === '/dispatch/unassigned') {
    return pathname === '/dispatch/unassigned' || pathname.startsWith('/dispatch/unassigned')
  }
  if (href === '/tech/jobs/request') {
    return pathname === '/tech/jobs/request' || pathname.startsWith('/tech/jobs/request')
  }
  if (href === '/admin/invoices') {
    return pathname === '/admin/invoices' || pathname.startsWith('/admin/invoices')
  }
  if (href === '/marketing/campaigns') {
    return pathname === '/marketing/campaigns' || pathname.startsWith('/marketing/campaigns')
  }
  if (href === '/marketing/email-templates') {
    return pathname === '/marketing/email-templates'
  }
  if (href === '/marketing/tags') {
    return pathname === '/marketing/tags'
  }
  if (href === '/admin/settings') {
    return pathname === '/admin/settings' || pathname.startsWith('/admin/settings')
  }
  if (href === '/admin/users') {
    return pathname === '/admin/users' || pathname.startsWith('/admin/users')
  }
  if (href === '/admin/automation') {
    return pathname === '/admin/automation' || pathname.startsWith('/admin/automation')
  }
  if (href === '/admin/llm-providers') {
    return pathname === '/admin/llm-providers' || pathname.startsWith('/admin/llm-providers')
  }
  if (href === '/admin/audit') {
    return pathname === '/admin/audit' || pathname.startsWith('/admin/audit')
  }
  if (href === '/settings/profile') {
    return pathname === '/settings/profile' || pathname.startsWith('/settings/profile')
  }
  if (href === '/settings') {
    return pathname === '/settings' || pathname.startsWith('/settings/')
  }
  return false
}

export function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <aside className="w-60 border-r border-theme-border bg-theme-surface flex flex-col h-screen sticky top-0 shadow-lg">
      {/* Logo */}
      <div className="flex items-center px-3 py-4 border-b border-theme-border flex-shrink-0 bg-theme-surface">
        <span className="text-2xl font-bold tracking-tight text-theme-primary">CRM-AI PRO</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Core Section */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-semibold text-theme-primary px-1 opacity-70">Core</p>
          <nav className="space-y-1">
            {navItems.map(item => (
              <PermissionGate
                key={item.label}
                requires={item.permission || undefined}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    isActive(pathname, item.href, searchParams)
                      ? "bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/30 shadow-sm"
                      : "text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </PermissionGate>
            ))}
          </nav>
        </div>

        {/* Role Dashboards Section */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-semibold text-theme-primary px-1 opacity-70">Dashboards</p>
          <nav className="space-y-1">
            {roleDashboards.map(item => (
              <PermissionGate
                key={item.label}
                requires={item.permission || undefined}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    isActive(pathname, item.href, searchParams)
                      ? "bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/30 shadow-sm"
                      : "text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </PermissionGate>
            ))}
          </nav>
        </div>

        {/* Tech Section */}
        <PermissionGate requiresAny={['view_all_jobs', 'view_assigned_jobs']}>
          <div className="space-y-3">
            <p className="text-xs uppercase font-semibold text-theme-primary px-1 opacity-70">Tech</p>
            <nav className="space-y-1">
              {techItems.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    isActive(pathname, item.href, searchParams)
                      ? "bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/30 shadow-sm"
                      : "text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </PermissionGate>

        {/* Dispatch Section */}
        <PermissionGate requires="manage_dispatch">
          <div className="space-y-3">
            <p className="text-xs uppercase font-semibold text-theme-primary px-1 opacity-70">Dispatch</p>
            <nav className="space-y-1">
              {dispatchItems.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    isActive(pathname, item.href, searchParams)
                      ? "bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/30 shadow-sm"
                      : "text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </PermissionGate>

        {/* Sales Section */}
        <PermissionGate requiresAny={['view_contacts', 'manage_marketing']}>
          <div className="space-y-3">
            <p className="text-xs uppercase font-semibold text-theme-primary px-1 opacity-70">Sales</p>
            <nav className="space-y-1">
              {salesItems.map(item => (
                <PermissionGate
                  key={item.label}
                  requires={item.permission || undefined}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                      isActive(pathname, item.href)
                        ? "bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/30 shadow-sm"
                        : "text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </PermissionGate>
              ))}
            </nav>
          </div>
        </PermissionGate>

        {/* Owner Section */}
        <PermissionGate requiresAny={['view_analytics', 'view_reports']}>
          <div className="space-y-3">
            <p className="text-xs uppercase font-semibold text-theme-primary px-1 opacity-70">Owner</p>
            <nav className="space-y-1">
              {ownerItems.map(item => (
                <PermissionGate
                  key={item.label}
                  requires={item.permission || undefined}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                      isActive(pathname, item.href)
                        ? "bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/30 shadow-sm"
                        : "text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </PermissionGate>
              ))}
            </nav>
          </div>
        </PermissionGate>

        {/* Marketing Section */}
        <PermissionGate requires="manage_marketing">
          <div className="space-y-3">
            <p className="text-xs uppercase font-semibold text-theme-primary px-1 opacity-70">Marketing</p>
            <nav className="space-y-1">
              {marketingItems.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    isActive(pathname, item.href, searchParams)
                      ? "bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/30 shadow-sm"
                      : "text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </PermissionGate>

        {/* Admin Section */}
        <PermissionGate requires="view_settings">
          <div className="space-y-3">
            <p className="text-xs uppercase font-semibold text-theme-primary px-1 opacity-70">Admin</p>
            <nav className="space-y-1">
              {adminItems.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    isActive(pathname, item.href, searchParams)
                      ? "bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/30 shadow-sm"
                      : "text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </PermissionGate>
      </div>

      {/* Voice Agent Widget - positioned at bottom */}
      <ConditionalVoiceWidget />
    </aside>
  )
}
