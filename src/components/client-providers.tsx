"use client"

import { PropsWithChildren } from 'react'
import ThemeAnimationProvider from '@/components/theme-animation-provider'
import { AuthProvider } from '@/components/AuthProvider'
import { APIConfigRedirect } from '@/components/api-config-redirect'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { Toaster } from '@/components/ui/sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function ClientProviders({ children }: PropsWithChildren<{}>) {
  return (
    <ThemeAnimationProvider>
      <AuthProvider>
        <APIConfigRedirect />
        <ConditionalLayout>{children}</ConditionalLayout>
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </AuthProvider>
    </ThemeAnimationProvider>
  )
}