"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ConfirmDialogProvider } from '@/lib/confirm'
import { VoiceProviderWrapper } from '@/components/voice-provider-wrapper'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmDialogProvider>
        <VoiceProviderWrapper>
          {children}
        </VoiceProviderWrapper>
      </ConfirmDialogProvider>
    </QueryClientProvider>
  )
}

