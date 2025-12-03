'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Briefcase, Map, User, Target, Calendar } from 'lucide-react'

interface NavItem {
  href: string
  icon: any
  label: string
  activePattern: RegExp
}

const techNavItems: NavItem[] = [
  { href: '/m/tech/dashboard', icon: Home, label: 'Home', activePattern: /^\/m\/tech\/dashboard/ },
  { href: '/m/tech/dashboard', icon: Briefcase, label: 'Jobs', activePattern: /^\/m\/tech\/(dashboard|job)/ },
  { href: '/m/tech/map', icon: Map, label: 'Map', activePattern: /^\/m\/tech\/map/ },
  { href: '/m/tech/profile', icon: User, label: 'Profile', activePattern: /^\/m\/tech\/profile/ },
]

const salesNavItems: NavItem[] = [
  { href: '/m/sales/dashboard', icon: Home, label: 'Home', activePattern: /^\/m\/sales\/dashboard/ },
  { href: '/m/sales/leads', icon: Target, label: 'Leads', activePattern: /^\/m\/sales\/leads/ },
  { href: '/m/sales/dashboard', icon: Calendar, label: 'Meetings', activePattern: /^\/m\/sales\/(dashboard|meeting)/ },
  { href: '/m/sales/profile', icon: User, label: 'Profile', activePattern: /^\/m\/sales\/profile/ },
]

export function TechBottomNav() {
  return <BottomNav items={techNavItems} />
}

export function SalesBottomNav() {
  return <BottomNav items={salesNavItems} />
}

function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const isActive = item.activePattern.test(pathname)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] active:text-[var(--color-text-primary)]'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
