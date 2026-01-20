'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { TurnstileComponent } from '@/components/ui/turnstile';
import { useTurnstile } from '@/hooks/useTurnstile';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshAuth, supabase } = useAuth();

  // Turnstile state management
  const { token: turnstileToken, isVerified: isTurnstileVerified, error: turnstileError, setToken: setTurnstileToken, setError: setTurnstileError, reset: resetTurnstile } = useTurnstile();

  // Redirect to topics if user exists
  useEffect(() => {
    if (user) {
      // PRODUCTION FIX: Use window.location.href for more reliable redirect
      // This ensures the middleware runs with the updated session
      const timer = setTimeout(() => {
        window.location.href = '/topics';
      }, 100); // Small delay to ensure auth state is fully synchronized

      return () => clearTimeout(timer);
    }
    // Return undefined if user is not present
    return undefined;
  }, [user]);

  useEffect(() => {
    setMounted(true);

    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const verifyTurnstile = async () => {
    // Validate Turnstile token if enabled
    if (process.env.NEXT_PUBLIC_ENABLE_TURNSTILE === 'true') {
      if (!isTurnstileVerified || !turnstileToken) {
        setError('Please complete the bot protection verification.');
        return false;
      }

      try {
        // Verify token with server
        const turnstileResponse = await fetch('/api/auth/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: turnstileToken,
            action: 'signin' // Unified action
          }),
        });

        if (!turnstileResponse.ok) {
          const turnstileErrorRes = await turnstileResponse.json();
          setError(turnstileErrorRes.error || 'Bot protection verification failed. Please try again.');
          resetTurnstile();
          return false;
        }
        return true;
      } catch (err) {
        console.error('Turnstile verification error:', err);
        setError('Bot protection check failed. Please try again.');
        return false;
      }
    }
    return true;
  };

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) return;

    try {
      if (!(await verifyTurnstile())) {
        setLoading(false);
        return;
      }

      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://grokinterviews.org/auth/callback'
        : `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSignInWithGitHub = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) return;

    try {
      if (!(await verifyTurnstile())) {
        setLoading(false);
        return;
      }

      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://grokinterviews.org/auth/callback'
        : `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden text-black dark:text-white bg-white/80 dark:bg-black/80 backdrop-blur-lg border border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="p-8 flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-gray-600 dark:bg-gray-400"></div>
          </div>
        </div>

        <h1 className="text-2xl font-normal text-center text-black dark:text-white mb-2 tracking-tight">
          Welcome
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 text-center">
          Sign in or create an account to continue
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 w-full p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={handleSignInWithGoogle}
            disabled={loading}
            className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md py-2.5 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleSignInWithGitHub}
            disabled={loading}
            className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md py-2.5 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Turnstile Bot Protection */}
        <div className="mt-6 w-full">
          <TurnstileComponent
            onVerify={setTurnstileToken}
            onError={setTurnstileError}
            onExpire={resetTurnstile}
            action={'signin'}
            className="flex justify-center"
          />
          {turnstileError && (
            <p className="text-red-500 text-sm mt-2 text-center">{turnstileError}</p>
          )}
        </div>

        {/* Terms and Privacy Agreement */}
        <div className="mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By signing in you agree to our{' '}
            <Link
              href="/terms"
              className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors"
            >
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link
              href="/privacy"
              className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 bg-transparent">
      <div className="w-full max-w-sm space-y-8">
        <Suspense fallback={
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" text="Loading..." />
          </div>
        }>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
