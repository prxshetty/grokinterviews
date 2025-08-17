"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { useEffect } from "react"
import { useConfetti } from "@/hooks/useConfetti"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ theme: themeFromProps, ...otherProps }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  const { fireStreakConfetti } = useConfetti()

  // Determine the theme to use from the hook, defaulting to "system"
  const effectiveThemeFromHook: "system" | "light" | "dark" =
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? resolvedTheme
      : "system";

  // Determine the final theme to pass to Sonner
  const finalTheme: "system" | "light" | "dark" =
    themeFromProps === "light" || themeFromProps === "dark" || themeFromProps === "system"
      ? themeFromProps
      : effectiveThemeFromHook;

  // Determine if light mode is active
  // const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && !window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Listen for streak toast notifications and trigger confetti
  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { message, description } = event.detail
      
      // Check if this is a streak notification
      const isStreakToast = 
        (message && (message.includes('streak') || message.includes('🔥') || message.includes('🚀'))) ||
        (description && (description.includes('streak') || description.includes('momentum') || description.includes('fire')))
      
      if (isStreakToast) {
        // Small delay to let the toast appear first
        setTimeout(() => {
          fireStreakConfetti()
        }, 100)
      }
    }

    // Listen for toast events
    window.addEventListener('toast-created' as any, handleToast)
    
    return () => {
      window.removeEventListener('toast-created' as any, handleToast)
    }
  }, [fireStreakConfetti])

  return (
    <Sonner
      theme={finalTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "sonner-glassy-toast group toast group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      gap={8}
      visibleToasts={4}
      position="bottom-right"
      {...otherProps}
    />
  )
}

export { Toaster }

