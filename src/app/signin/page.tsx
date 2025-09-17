'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { TurnstileComponent } from '@/components/ui/turnstile';
import { useTurnstile } from '@/hooks/useTurnstile';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshAuth, supabase } = useAuth();
  
  // Turnstile state management
  const { token: turnstileToken, isVerified: isTurnstileVerified, error: turnstileError, setToken: setTurnstileToken, setError: setTurnstileError, reset: resetTurnstile } = useTurnstile();

  // CRITICAL: Check for password recovery IMMEDIATELY and SYNCHRONOUSLY
  // This must run before any other effects to prevent race conditions
  useEffect(() => {
    // Check for password recovery mode from both URL hash and query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    if (window.location.hash.includes('type=recovery') || urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery') {
      // Redirect to account settings page with password reset flag
      router.push('/account?tab=password-security&mode=reset');
      return;
    }
  }, [router]); // Empty dependency array - runs only once on mount

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

    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }

    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam));
    }
  }, [searchParams]);

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account?tab=password-security&mode=reset`,
      });

      if (error) {
        console.error('Forgot password error:', error);
      }
      
      setMessage('If your email is in our system, you will receive a password reset link shortly.');

    } catch (error: any) {
      console.error('Forgot password exception:', error);
      setMessage('If your email is in our system, you will receive a password reset link shortly.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    if (!supabase) return;

    try {
      // Validate Turnstile token if enabled
      if (process.env.NEXT_PUBLIC_ENABLE_TURNSTILE === 'true') {
        if (!isTurnstileVerified || !turnstileToken) {
          setError('Please complete the bot protection verification.');
          setLoading(false);
          return;
        }

        // Verify token with server
        const turnstileResponse = await fetch('/api/auth/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: turnstileToken,
            action: isSignUp ? 'signup' : 'signin'
          }),
        });

        if (!turnstileResponse.ok) {
          const turnstileError = await turnstileResponse.json();
          setError(turnstileError.error || 'Bot protection verification failed. Please try again.');
          resetTurnstile();
          setLoading(false);
          return;
        }
      }

      if (isSignUp) {
        // Production-ready check:
        // Layer 1: Check if the user exists in the core auth system at all.
        const { data: userExists, error: existenceCheckError } = await supabase
          .rpc('user_exists', { user_email: email });

        if (existenceCheckError) {
          throw new Error('Could not verify email. Please try again.');
        }

        // Layer 2: If the user exists, check if they have a full profile and which provider they used.
        if (userExists) {
          // Check for a public profile to see if we can give a specific provider message.
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            throw new Error('Error checking user profile.');
          }

          if (existingProfile) {
            // User has a profile, so we can check their specific auth providers (google, github, etc.)
            const { data: identities, error: identityError } = await supabase
              .rpc('get_user_identities', { user_email: email });

            if (!identityError && identities && identities.length > 0) {
              const providers = identities.map((identity: any) => identity.provider);
              if (providers.includes('google')) {
                setError('An account with this email already exists. Please sign in with Google instead.');
                return;
              }
              if (providers.includes('github')) {
                setError('An account with this email already exists. Please sign in with GitHub instead.');
                return;
              }
            }
          }
          
          // If the user exists in auth.users but has no public profile, or if provider check fails,
          // give a generic but accurate error. This catches "stuck" users.
          setError('An account with this email already exists. Please try signing in or use the password reset option.');
          return;
        }

        // If user does not exist in auth.users, proceed with signup.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });

        if (error) throw error;

        if (data?.user && !data.session) {
          setMessage('Please check your email for a confirmation link. You must verify your email before you can sign in.');
          // Clear form to prevent confusion
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
        } else if (data?.session) {
          await refreshAuth();
          // Don't redirect here - let the useEffect handle it after auth state updates
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Check if it's an email not confirmed error
          if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.');
            return;
          }
          throw error;
        }

        if (data?.session) {
          // PRODUCTION FIX: Ensure session is properly set before redirect
          await refreshAuth();
          
          // Add a small delay to ensure session cookies are set in production
          setTimeout(async () => {
            // Verify session is actually set before redirecting
            const { data: verifyData } = await supabase.auth.getUser();
            if (verifyData?.user) {
              // Force a full page navigation instead of client-side routing
              // This ensures the middleware runs with the updated session
              window.location.href = '/topics';
            } else {
              // Fallback: refresh auth and let useEffect handle redirect
              await refreshAuth();
            }
          }, 500); // 500ms delay for production session synchronization
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSignUpMode = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsSignUp(!isSignUp);
    setError(null);
    setMessage(null);
    // Clear form fields when switching modes
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    // Reset Turnstile when switching modes
    resetTurnstile();
  };

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) return;

    try {
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
      {/* Close button (X) */}
      <Link
        href="/"
        className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors z-10 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </Link>
      
      <div className="p-8 flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-gray-600 dark:bg-gray-400"></div>
          </div>
        </div>

        {/* Title that changes based on mode */}
        <h1 className="text-2xl font-normal text-center text-black dark:text-white mb-2 tracking-tight transition-all duration-500">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>

        {/* Toggle text that changes based on mode */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          {isSignUp ? (
            <>Already have an account? <a href="#" onClick={toggleSignUpMode} className="text-black dark:text-white hover:underline">Sign in</a></>
          ) : (
            <>First time here? <a href="#" onClick={toggleSignUpMode} className="text-black dark:text-white hover:underline">Sign up for free</a></>
          )}
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Success message */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-md">
            {message}
          </div>
        )}

        {/* Form that changes based on mode */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className={`transition-all duration-500 ease-in-out ${isSignUp ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  required={isSignUp}
                  disabled={!isSignUp}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  required={isSignUp}
                  disabled={!isSignUp}
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              required
            />
          </div>

          {!isSignUp && (
            <div className="mb-4 text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-black dark:text-white hover:underline focus:outline-none disabled:opacity-50"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Turnstile Bot Protection */}
          <div className="mb-6">
            <TurnstileComponent
              onVerify={setTurnstileToken}
              onError={setTurnstileError}
              onExpire={resetTurnstile}
              action={isSignUp ? 'signup' : 'signin'}
              className="flex justify-center"
            />
            {turnstileError && (
              <p className="text-red-500 text-sm mt-2 text-center">{turnstileError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black rounded-md py-2 font-medium transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              isSignUp ? 'Create account' : 'Sign in'
            )}
          </button>
        </form>

        {/* Terms and Privacy Agreement - only show during signup */}
        {isSignUp && (
          <div className="mt-4 mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              By signing up you agree to our{' '}
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
        )}

        {/* Divider - show only in sign in mode */}
        <div className={`flex items-center w-full my-6 transition-all duration-500 ${isSignUp ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700"></div>
          <span className="px-3 text-sm text-gray-500 dark:text-gray-400">or</span>
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700"></div>
        </div>

        {/* Alternative Sign In Methods - show only in sign in mode */}
        <div className={`transition-all duration-500 ease-in-out w-full ${isSignUp ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-96 opacity-100'}`}>
          <button
            type="button"
            onClick={handleSignInWithGoogle}
            disabled={loading}
            className="w-full mb-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md py-2 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign in with Google
          </button>

          <button
            type="button"
            onClick={handleSignInWithGitHub}
            disabled={loading}
            className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md py-2 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            Sign in with GitHub
          </button>

          {/* Terms and Privacy Agreement - only show during signin */}
          <div className="mt-4">
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
    </div>
  );
}

export default function SignIn() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 bg-transparent">
        <div className="w-full max-w-sm space-y-8">
          <Suspense fallback={
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          }>
            <SignInForm />
          </Suspense>
        </div>
      </div>
  );
}
