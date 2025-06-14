'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { LoadingSpinner } from '@/components/ui'
import SignIn from '@/app/signin/page'

interface WithAuthProps {
  children?: React.ReactNode
}

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithAuth: React.FC<P & WithAuthProps> = (props) => {
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      async function fetchUser() {
        const {
          data: { user: fetchedUser },
        } = await supabase.auth.getUser()
        if (fetchedUser) {
          setUser(fetchedUser)
        }
        setLoading(false)
      }
      fetchUser()

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => {
        authListener.subscription.unsubscribe()
      }
    }, [supabase.auth])

    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      )
    }

    if (!user) {
      return (
        <div className="relative flex min-h-screen flex-col items-center justify-center">
          <div className="absolute inset-0 z-0 bg-white bg-grid-black/[0.05] dark:bg-black dark:bg-grid-white/[0.05]" />
          <div className="z-10">
            <SignIn />
          </div>
        </div>
      )
    }

    return <WrappedComponent {...(props as P)} />
  }
  WithAuth.displayName = `WithAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`
  return WithAuth
} 