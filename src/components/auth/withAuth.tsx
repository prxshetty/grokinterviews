'use client'

import { supabase } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { LoadingSpinner } from '@/components/ui'
import SignIn from '@/app/signin/page'

interface WithAuthProps {
  user: User | null
}

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P & WithAuthProps>
) {
  const WithAuth: React.FC<P> = (props) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('withAuth event', event)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      // Initial check
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setLoading(false)
        }
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }, [])

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

    return <WrappedComponent {...(props as P)} user={user} />
  }
  WithAuth.displayName = `WithAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`
  return WithAuth
} 