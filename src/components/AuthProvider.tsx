'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePathname } from 'next/navigation';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
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

  const pathname = usePathname();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
  }, [supabase]);

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user: fetchedUser }, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (fetchedUser) {
        setUser(fetchedUser);
        const profileData = await fetchUserProfile(fetchedUser.id);
        setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error: any) {
      console.error('Error refreshing auth:', error);
      setError(error.message || 'An error occurred while refreshing authentication');
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchUserProfile]);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      console.log('Sign out successful');
      setUser(null);
      setProfile(null);

      // Use window.location.href to force a full page reload
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message || 'An error occurred while signing out');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('AuthProvider - Checking user');
        const { data: { user: fetchedUser }, error } = await supabase.auth.getUser();

        console.log('AuthProvider - User check result:', {
          hasUser: !!fetchedUser,
          userId: fetchedUser?.id,
          cookies: document.cookie.split(';').map(c => c.trim().split('=')[0])
        });

        if (error) {
          throw error;
        }

        if (fetchedUser) {
          setUser(fetchedUser);
          const profileData = await fetchUserProfile(fetchedUser.id);
          setProfile(profileData);
        }
      } catch (error: any) {
        console.error('Error checking auth:', error);
        setError(error.message || 'An error occurred while checking authentication');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('AuthProvider - Auth state changed:', event, session?.user?.id);
      console.log('AuthProvider - Cookies after state change:', document.cookie.split(';').map(c => c.trim().split('=')[0]));

      if (session?.user) {
        setUser(session.user);
        const profileData = await fetchUserProfile(session.user.id);
        setProfile(profileData);

        if (pathname === '/signin') {
          console.log('AuthProvider - Redirecting from sign-in to dashboard');
          window.location.href = '/dashboard?refresh=true';
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile, pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('refresh') === 'true') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('refresh');
        window.history.replaceState({}, '', newUrl.toString());
        refreshAuth();
      }
    }
  }, [pathname, refreshAuth]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
