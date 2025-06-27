import { createBrowserClient } from '@supabase/ssr'

const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient> | undefined
}

export const supabase = globalForSupabase.supabase ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
}
