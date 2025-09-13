"use client"

import { SpacemanThemeProvider, ThemeAnimationType } from '@space-man/react-theme-animation'
import type { PropsWithChildren } from 'react'

export default function ThemeAnimationProvider({ children }: PropsWithChildren<{}>) {
  return (
    <SpacemanThemeProvider
      defaultTheme="system"
      themes={['light', 'dark', 'system']}
      colorThemes={['default']}
      animationType={ThemeAnimationType.CIRCLE}
      duration={800}
    >
      {children}
    </SpacemanThemeProvider>
  )
}