"use client"

import { SpacemanThemeProvider } from '@space-man/react-theme-animation'
import type { PropsWithChildren } from 'react'

export default function ThemeAnimationProvider({ children }: PropsWithChildren<{}>) {
  return (
    <SpacemanThemeProvider defaultTheme="system">
      {children}
    </SpacemanThemeProvider>
  )
}