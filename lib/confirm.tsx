"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface ConfirmDialogOptions {
  title: string
  description?: string
  variant?: "default" | "destructive"
  confirmText?: string
  cancelText?: string
}

// Global state for confirm dialog
let confirmResolver: ((value: boolean) => void) | null = null
let confirmOptions: ConfirmDialogOptions | null = null
let setConfirmState: ((state: { open: boolean; options: ConfirmDialogOptions | null }) => void) | null = null

export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    confirmOptions = options
    confirmResolver = resolve
    if (setConfirmState) {
      setConfirmState({ open: true, options })
    } else {
      // Fallback: use window.confirm if provider not mounted
      const result = window.confirm(`${options.title}\n\n${options.description || ""}`)
      resolve(result)
    }
  })
}

// Provider component that manages the dialog state
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ open: boolean; options: ConfirmDialogOptions | null }>({
    open: false,
    options: null,
  })

  React.useEffect(() => {
    setConfirmState = setState
    return () => {
      setConfirmState = null
    }
  }, [])

  const handleConfirm = React.useCallback(() => {
    setState({ open: false, options: null })
    if (confirmResolver) {
      confirmResolver(true)
      confirmResolver = null
    }
    confirmOptions = null
  }, [])

  const handleCancel = React.useCallback(() => {
    setState({ open: false, options: null })
    if (confirmResolver) {
      confirmResolver(false)
      confirmResolver = null
    }
    confirmOptions = null
  }, [])

  return (
    <>
      {children}
      {state.open && state.options && (
        <AlertDialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{state.options.title}</AlertDialogTitle>
              {state.options.description && (
                <AlertDialogDescription>{state.options.description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                {state.options.cancelText || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                variant={state.options.variant || "default"}
                onClick={handleConfirm}
                autoFocus={false}
              >
                {state.options.confirmText || "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

