"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * Hook for managing modal state synchronized with URL query parameters
 * Opens modal when query param is present, closes when removed
 */
export function useModalState(
  paramKey: string,
  options?: {
    onOpen?: (id: string) => void
    onClose?: () => void
  }
): {
  isOpen: boolean
  modalId: string | null
  open: (id: string) => void
  close: () => void
  toggle: (id: string) => void
} {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const modalId = useMemo(() => {
    return searchParams.get(paramKey)
  }, [searchParams, paramKey])

  useEffect(() => {
    const hasParam = searchParams.has(paramKey)
    setIsOpen(hasParam)
    
    if (hasParam && modalId && options?.onOpen) {
      options.onOpen(modalId)
    } else if (!hasParam && options?.onClose) {
      options.onClose()
    }
  }, [searchParams, paramKey, modalId, options])

  const open = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(paramKey, id)
      router.push(`${pathname}?${params.toString()}`)
    },
    [paramKey, pathname, router, searchParams]
  )

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramKey)
    const newURL = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    router.replace(newURL)
  }, [paramKey, pathname, router, searchParams])

  const toggle = useCallback(
    (id: string) => {
      if (modalId === id && isOpen) {
        close()
      } else {
        open(id)
      }
    },
    [modalId, isOpen, open, close]
  )

  return {
    isOpen: isOpen && !!modalId,
    modalId,
    open,
    close,
    toggle,
  }
}

