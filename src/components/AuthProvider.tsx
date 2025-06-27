'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

interface AuthContextType {
  supabase: SupabaseClient | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  supabase: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching profile:', error);
      return null;
    }
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message || 'An error occurred during sign-out.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    try {
      setLoading(true);
      console.log('AuthProvider - Auth state changed:', event, session?.user?.id);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchUserProfile(currentUser.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error("Error in auth state change handler:", err);
      setError(err.message || "An unexpected error occurred.");
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const refreshAuth = useCallback(async () => {
    console.log("AuthProvider - Refreshing auth state...");
    try {
      const { data: { user: fetchedUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      // Construct a fake session-like object for handler
      const session = fetchedUser ? { user: fetchedUser } : null;
      await handleAuthStateChange('MANUAL_REFRESH' as AuthChangeEvent, session as any);
    } catch (err: any) {
      console.error('Error in refreshAuth:', err);
      setError(err.message || 'Error refreshing authentication');
      setLoading(false);
    }
  }, [handleAuthStateChange]);

  useEffect(() => {
    refreshAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription?.unsubscribe();
    };
  }, [refreshAuth, handleAuthStateChange]);

  return (
    <AuthContext.Provider value={{ supabase, user, profile, loading, error, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
