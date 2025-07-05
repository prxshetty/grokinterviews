import type { Metadata } from "next";
import '../globals.css';
import { type PropsWithChildren } from "react"

export const metadata: Metadata = {
  title: "Sign In - Grok Interviews",
  description: "Sign in to your Grok Interviews account",
};

export default function SignInLayout({
  children,
}: PropsWithChildren) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900">
      {children}
    </main>
  )
}
