'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';
import { createProfileForUser } from '@/app/actions/user';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  supabase: typeof supabase;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`AuthProvider event: ${event}`, session?.user?.id);
    }

    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    setError(null); // Clear previous errors

    if (currentUser) {
      try {
        // User is authenticated, check for profile
        const { data: existingProfile, error: selectError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching profile:', selectError);
          }
          setError('Failed to fetch user profile.');
          setProfile(null);
        } else if (existingProfile) {
          setProfile(existingProfile);
        } else {
          // No profile exists, let's create it.
          const { data: newProfile, error: createError } = await createProfileForUser(currentUser);
          if (createError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to create profile:', createError.message);
            }
            setError('Failed to create user profile after signup.');
            setProfile(null);
          } else {
            setProfile(newProfile);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth state change error:', err);
        }
        setError('An unexpected error occurred.');
        setProfile(null);
      }
    } else {
      // User is not signed in
      setProfile(null);
    }

    // Set loading to false after handling auth state
    setLoading(false);
  }, []); // Remove loading dependency to prevent infinite loop

  // Store the handler in a ref to access it in useEffect without dependency issues
  const handleAuthStateChangeRef = useRef(handleAuthStateChange);
  handleAuthStateChangeRef.current = handleAuthStateChange;

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // DEV BYPASS: Check for dev-bypass cookie in development on localhost
        const isDev = process.env.NODE_ENV === 'development';
        const isLocalhost = typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        if (isDev && isLocalhost) {
          const devBypass = document.cookie.split('; ').find(row => row.startsWith('dev-bypass='));
          if (devBypass && devBypass.split('=')[1] === 'true') {
            // Create mock user and profile for local development
            const mockUser = {
              id: '00000000-0000-0000-0000-000000000000',
              email: 'admin@admin.com',
              user_metadata: { full_name: 'Local Admin' },
              app_metadata: {},
              aud: 'authenticated',
              role: 'authenticated',
              created_at: new Date().toISOString(),
            } as User;

            const mockProfile: Profile = {
              id: '00000000-0000-0000-0000-000000000000',
              full_name: 'Local Admin',
              email: 'admin@admin.com',
              avatar_url: null,
              bio: null,
              custom_api_key: null,
              preferred_model: null,
              role: 'authenticated',
              specific_model_id: null,
              username: 'local_admin',
              website: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            setUser(mockUser);
            setProfile(mockProfile);
            setSession(null); // No real session, but user is "authenticated"
            setLoading(false);
            console.log('AuthProvider: Dev bypass active - using mock admin user');
            return undefined; // No cleanup needed for dev bypass
          }
        }

        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error('Failed to get initial session.');
        }

        await handleAuthStateChangeRef.current('INITIAL_SESSION', initialSession);

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          handleAuthStateChangeRef.current(event, session);
        });

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (err: any) {
        console.error('Auth initialization error:', err);
        setError(err.message);
        setLoading(false);
        return undefined;
      }
    };

    const cleanup = initializeAuth();

    return () => {
      cleanup.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []); // Empty dependency array - only run once

  const refreshAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setError('Failed to refresh authentication.');
        return;
      }
      await handleAuthStateChange('REFRESH', session);
    } catch {
      setError('An unexpected error occurred during refresh.');
    }
  }, [handleAuthStateChange]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError('Failed to sign out.');
      }
    } catch {
      setError('An unexpected error occurred during sign out.');
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    error,
    refreshAuth,
    signOut,
    supabase
  }), [user, profile, session, loading, error, refreshAuth, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
