'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
  category: 'navigation' | 'actions' | 'general'
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts when user is typing in inputs, textareas, or contenteditable
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to close modals even when typing
        if (event.key === 'Escape') {
          const escapeShortcut = shortcuts.find(s => s.key === 'Escape')
          if (escapeShortcut) {
            event.preventDefault()
            escapeShortcut.action()
          }
        }
        return
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, router, pathname])
}

export function getShortcutDisplay(key: string, ctrl?: boolean, meta?: boolean, shift?: boolean, alt?: boolean): string {
  const parts: string[] = []
  
  if (meta) parts.push('⌘')
  if (ctrl) parts.push('Ctrl')
  if (shift) parts.push('Shift')
  if (alt) parts.push('Alt')
  
  // Format key name
  if (key === ' ') {
    parts.push('Space')
  } else if (key.length === 1) {
    parts.push(key.toUpperCase())
  } else {
    parts.push(key)
  }
  
  return parts.join(' + ')
}

