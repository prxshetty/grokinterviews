'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
    console.log(`AuthProvider event: ${event}`, session?.user?.id);
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    setError(null); // Clear previous errors

    if (currentUser) {
      // User is authenticated, check for profile
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error fetching profile:', selectError);
        setError('Failed to fetch user profile.');
        setProfile(null);
      } else if (existingProfile) {
        console.log('Profile found, setting profile.');
        setProfile(existingProfile);
      } else {
        // No profile exists, let's create it.
        console.log('No profile found. Attempting to create one.');
        const { data: newProfile, error: createError } = await createProfileForUser(currentUser);
        if (createError) {
          console.error('Failed to create profile:', createError.message);
          setError('Failed to create user profile after signup.');
          setProfile(null); // Couldn't create profile.
        } else {
          console.log('Profile created and set:', newProfile);
          setProfile(newProfile);
        }
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
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await handleAuthStateChange('REFRESH', currentSession);
  }, [handleAuthStateChange]);

  const signOut = async () => {
    try {
      // Don't set loading during sign out to prevent UI flashing
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      // The onAuthStateChange listener will handle setting user/profile to null
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'An error occurred during sign-out.');
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    error,
    refreshAuth,
    signOut,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
