"use client"

import { PropsWithChildren } from 'react'
import ThemeAnimationProvider from '@/components/theme-animation-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/AuthProvider'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { Toaster } from '@/components/ui/sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function ClientProviders({ children }: PropsWithChildren<{}>) {
  return (
    <ThemeAnimationProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster />
          <SpeedInsights />
          <Analytics />
        </AuthProvider>
      </ThemeProvider>
    </ThemeAnimationProvider>
  )
}