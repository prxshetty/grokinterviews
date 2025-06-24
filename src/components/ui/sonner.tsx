"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ theme: themeFromProps, ...otherProps }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

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
      {...otherProps}
    />
  )
}

export { Toaster }

