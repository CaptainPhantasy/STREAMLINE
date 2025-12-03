"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for monitoring
    console.error("Route error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">Something went wrong</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            An error occurred while loading this page. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-red-100 p-3">
              <p className="text-xs font-mono text-red-900 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-red-700">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={reset}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
            <Button asChild variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <Link href="/inbox">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

