'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor, Palette, Sparkles } from 'lucide-react'
import { getThemeManager, type Theme } from '@/lib/theme-manager'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ThemeToggleProps {
  className?: string
}

const themes: Array<{ value: Theme; label: string; icon: React.ReactNode; description: string }> = [
  { value: 'light', label: 'Solaris', icon: <Sun className="w-4 h-4" />, description: 'Daybreak Energy ☀️' },
  { value: 'dark', label: 'Opus', icon: <Moon className="w-4 h-4" />, description: 'Literary Warmth 📜' },
  { value: 'warm', label: 'Latte', icon: <Sun className="w-4 h-4" />, description: 'Earthy & Grounded ☕' },
  { value: 'ops', label: 'Ops Pro', icon: <Sparkles className="w-4 h-4" />, description: 'Service Industry 🔧' },
  { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" />, description: 'Auto-detect' },
]

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const manager = getThemeManager()
    setTheme(manager.getTheme())

    const unsubscribe = manager.onThemeChange((newTheme) => {
      setTheme(newTheme)
    })

    return unsubscribe
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    const manager = getThemeManager()
    manager.setTheme(newTheme)
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center w-10 h-10 bg-theme-surface border-2 border-theme rounded-lg",
          className
        )}
        aria-hidden="true"
      />
    )
  }

  const currentTheme = themes.find(t => t.value === theme) || themes[themes.length - 1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative inline-flex items-center justify-center w-10 h-10 bg-theme-surface backdrop-blur-sm border-2 border-theme rounded-lg cursor-pointer transition-all duration-300",
            "hover:border-theme-accent-primary hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2 focus:ring-offset-theme-primary",
            className
          )}
          aria-label="Select theme"
        >
          {currentTheme.icon}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-theme-surface border-theme">
        <DropdownMenuLabel className="text-theme-primary">Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-theme-border" />
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => handleThemeChange(themeOption.value)}
            className={cn(
              "flex items-center gap-3 cursor-pointer text-theme-primary hover:bg-theme-surface hover:text-theme-accent-primary focus:bg-theme-surface",
              theme === themeOption.value && "bg-theme-surface text-theme-accent-primary"
            )}
          >
            <div className={cn(
              "w-4 h-4 flex items-center justify-center",
              theme === themeOption.value && "text-theme-accent-primary"
            )}>
              {themeOption.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium">{themeOption.label}</div>
              <div className="text-xs text-theme-secondary">{themeOption.description}</div>
            </div>
            {theme === themeOption.value && (
              <div className="w-2 h-2 rounded-full bg-theme-accent-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
