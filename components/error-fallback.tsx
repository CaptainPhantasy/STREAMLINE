"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  context?: string
}

export function ErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  // Context-aware error messages
  const getErrorMessage = () => {
    if (context) {
      switch (context) {
        case "jobs":
          return "Something went wrong while loading jobs. Please try again."
        case "contacts":
          return "Something went wrong while loading contacts. Please try again."
        case "inbox":
          return "Something went wrong while loading conversations. Please try again."
        case "marketing":
          return "Something went wrong in the marketing section. Please try again."
        default:
          return "Something went wrong. Please try again."
      }
    }
    return "An unexpected error occurred. Please try again."
  }

  const getErrorTitle = () => {
    if (context) {
      return `Error in ${context.charAt(0).toUpperCase() + context.slice(1)}`
    }
    return "Something went wrong"
  }

  // Generate error ID for support
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">{getErrorTitle()}</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-red-100 p-3">
              <p className="text-xs font-mono text-red-900 break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-700 cursor-pointer">
                    Stack trace
                  </summary>
                  <pre className="mt-2 text-xs text-red-800 overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-red-600">
              Error ID: {errorId}
            </p>
            <Button
              onClick={resetError}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

