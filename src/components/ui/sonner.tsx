"use client"

import { useSpacemanTheme } from "@space-man/react-theme-animation"
import { Toaster as Sonner } from "sonner"
import { useEffect } from "react"
import { useConfetti } from "@/hooks/useConfetti"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ theme: themeFromProps, ...otherProps }: ToasterProps) => {
  const { theme } = useSpacemanTheme()
  const { fireStreakConfetti } = useConfetti()

  const finalTheme: "system" | "light" | "dark" =
    themeFromProps === "light" || themeFromProps === "dark" || themeFromProps === "system"
      ? themeFromProps
      : theme;

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { message, description } = event.detail
      
      const isStreakToast = 
        (message && (message.includes('streak') || message.includes('🔥') || message.includes('🚀'))) ||
        (description && (description.includes('streak') || description.includes('momentum') || description.includes('fire')))
      
      if (isStreakToast) {
        setTimeout(() => {
          fireStreakConfetti()
        }, 100)
      }
    }

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
      gap={12}
      visibleToasts={4}
      position="bottom-right"
      expand={true}
      {...otherProps}
    />
  )
}

export { Toaster }

