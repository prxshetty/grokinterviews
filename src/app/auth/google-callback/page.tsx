'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function GoogleCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        setLoading(true);

        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
          throw new Error('No code provided');
        }

        // Create a Supabase client
        const supabase = createClientComponentClient();

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        // If we already have a session, redirect to dashboard
        if (session) {
          console.log('Already have a session, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Try to sign in with Google using the code
        console.log('Attempting to sign in with Google using code');

        // Use a different approach - create a new session directly
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/dashboard?refresh=true',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (signInError) {
          throw signInError;
        }

        // The user will be redirected to Google for authentication
      } catch (error: any) {
        console.error('Error in Google callback:', error);
        setError(error.message || 'An error occurred during Google sign-in');
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">Authentication Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Signing in with Google</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">Please wait while we complete your sign-in...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
}
