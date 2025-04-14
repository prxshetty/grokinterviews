'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './signin.module.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // Handle initial setup after mount
  useEffect(() => {
    setMounted(true);

    // Check for dark mode preference
    const isDark = document.documentElement.classList.contains('dark') ||
      (typeof window !== 'undefined' &&
       localStorage.theme === 'dark' ||
       (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));

    setIsDarkMode(isDark);

    // Apply dark mode class if needed
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check if we should show sign-up mode based on URL parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'signup') {
        setIsSignUp(true);
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Real sign-up with Supabase
        console.log('Signing up with:', { firstName, lastName, email, password });

        const fullName = `${firstName} ${lastName}`.trim();
        const username = email.split('@')[0];

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              username,
              full_name: fullName,
              email,
            },
          },
        });

        if (error) {
          console.error('Sign up error:', error);
          throw error;
        }

        console.log('Sign up response:', data);

        // Check if the user was created
        if (!data?.user) {
          throw new Error('No user returned from sign up');
        }

        // Check if email confirmation is required
        if (!data.user.confirmed_at) {
          console.log('Email confirmation required for user:', data.user.id);
          setMessage('Check your email for the confirmation link. You need to confirm your email before you can sign in.');
        } else {
          // If email confirmation is not required, sign in the user
          console.log('Email confirmation not required, signing in user:', data.user.id);
          setMessage('Account created successfully! You can now sign in.');
          setIsSignUp(false);
        }
      } else {
        // Real sign-in with Supabase
        console.log('Signing in with:', { email, password });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Special handling for email not confirmed error
          if (error.message.includes('Email not confirmed')) {
            console.log('Email not confirmed error');
            setError('Your email has not been confirmed. Please check your email for the confirmation link.');
            return;
          }

          // Handle invalid credentials more gracefully
          if (error.message.includes('Invalid login credentials')) {
            console.log('Invalid login credentials');
            setError('Invalid email or password. Please try again.');
            return;
          }

          throw error;
        }

        if (!data.user) {
          throw new Error('No user returned from sign in');
        }

        console.log('User signed in successfully:', data.user.id);

        // Check if the user has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
          console.error('Error checking profile:', profileError);
        }

        // If no profile exists, create one
        if (!profileData) {
          console.log('Creating profile for user:', data.user.id);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                username: data.user.user_metadata?.username || email.split('@')[0],
                full_name: data.user.user_metadata?.full_name || '',
                email: data.user.email,
              },
            ]);

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        }

        // Redirect to dashboard on successful sign in
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSignUpMode = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsSignUp(!isSignUp);
    // Reset form fields and error messages when toggling
    setError(null);
    setMessage(null);

    // Reset form fields when toggling
    if (!isSignUp) {
      setEmail('');
      setPassword('');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
    }
  };

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      console.log('Signing in with Google');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }

      // The user will be redirected to Google for authentication
      // After successful authentication, they will be redirected back to the callback URL
      // The callback handler will exchange the code for a session and redirect to the dashboard
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign in with Google');
      console.error('Google sign in error:', error);
      setLoading(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black flex flex-col font-sans tracking-tight transition-colors duration-300 relative">
      {/* SVG Background */}
      <div className="absolute inset-0 w-full h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-white dark:bg-black">
          {/* Light mode SVG background */}
          <div className="absolute inset-0 block dark:hidden opacity-20">
            <img
              src="/bg/complete-bg.svg"
              alt="Background Pattern"
              className="absolute top-0 left-0 w-full h-full object-contain"
            />
          </div>
          {/* Dark mode SVG background */}
          <div className="absolute inset-0 hidden dark:block opacity-20">
            <img
              src="/bg/complete-bg-dark.svg"
              alt="Background Pattern"
              className="absolute top-0 left-0 w-full h-full object-contain"
            />
          </div>
          {/* Dark mode animated background */}
          <div className="absolute inset-0 hidden dark:block opacity-10">
            <img
              src="/bg/dark.gif"
              alt="Dark Background"
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Navigation Bar - matches MainNavigation style */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-8 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-all duration-300 border-b border-transparent hover:border-gray-200 dark:hover:border-gray-800">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="group">
              <h1 className="text-xl md:text-3xl font-normal tracking-tight text-black dark:text-white transition-all duration-500 relative">
                Grok Interviews
              </h1>
            </Link>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-6">
            {/* Dark Mode Toggle - Simple Button */}
            <button
              onClick={toggleDarkMode}
              className="text-sm text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-black dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div className="h-16"></div>

      {/* Main Content - Centered */}
      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div
          className={`w-full max-w-md mx-auto rounded-2xl overflow-hidden text-black dark:text-white relative ${styles.signInCard} transition-all duration-500 ease-in-out backdrop-blur-lg bg-white/50 dark:bg-black/50 border border-white/20 dark:border-gray-800/30 shadow-xl`}
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isDarkMode
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(255, 255, 255, 0.1) inset'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 25px rgba(255, 255, 255, 0.5) inset'
          }}
        >
          {/* Close button (X) */}
          <Link
            href="/"
            className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors z-10 p-1 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className="p-8 flex flex-col items-center">
            {/* Logo/Icon */}
            <div className="w-16 h-16 bg-gray-200/50 dark:bg-black/30 rounded-full flex items-center justify-center mb-6 border border-white/20 dark:border-gray-800/30 shadow-inner">
              <div className="w-8 h-8 rounded-full bg-gray-400/50 dark:bg-gray-800/50 flex items-center justify-center backdrop-blur-sm">
                <div className="w-4 h-4 rounded-full bg-gray-600/80 dark:bg-gray-600/80"></div>
              </div>
            </div>

            {/* Title that changes based on mode */}
            <h1 className="text-2xl font-normal text-center text-black dark:text-white mb-2 tracking-tight transition-all duration-500">
              {isSignUp ? 'Create your account' : 'Yooo, welcome back!'}
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
              <div
                className={`transition-all duration-500 ease-in-out ${isSignUp ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
                style={{
                  animation: isSignUp ? `${styles.slideIn} 0.5s ease forwards` : `${styles.slideOut} 0.3s ease forwards`
                }}
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300/60 dark:border-gray-600/60 rounded-md bg-white/30 dark:bg-black/30 backdrop-blur-md text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
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
                      className="w-full px-4 py-2 border border-gray-300/60 dark:border-gray-600/60 rounded-md bg-white/30 dark:bg-black/30 backdrop-blur-md text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
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
                  className="w-full px-4 py-2 border border-gray-300/60 dark:border-gray-600/60 rounded-md bg-white/30 dark:bg-black/30 backdrop-blur-md text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300/60 dark:border-gray-600/60 rounded-md bg-white/30 dark:bg-black/30 backdrop-blur-md text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black/80 dark:bg-white/80 border border-gray-300/60 dark:border-gray-600/60 text-white dark:text-gray-900 rounded-md py-2 font-normal transition-all duration-200 hover:bg-black/90 dark:hover:bg-white backdrop-blur-md hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

            {/* Divider - show only in sign in mode */}
            <div className={`flex items-center w-full my-6 transition-all duration-500 ${isSignUp ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex-grow h-px bg-gray-300/50 dark:bg-gray-700/50"></div>
              <span className="px-3 text-sm text-gray-500 dark:text-gray-400">or</span>
              <div className="flex-grow h-px bg-gray-300/50 dark:bg-gray-700/50"></div>
            </div>

            {/* Alternative Sign In Methods - show only in sign in mode */}
            <div className={`transition-all duration-500 ease-in-out w-full ${isSignUp ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-96 opacity-100'}`}>
              <button
                type="button"
                onClick={handleSignInWithGoogle}
                disabled={loading}
                className="w-full mb-3 bg-transparent border border-gray-300/60 dark:border-gray-600/60 text-black dark:text-white rounded-md py-2 font-normal transition-colors hover:bg-white/20 dark:hover:bg-gray-800/50 text-sm backdrop-blur-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full bg-transparent border border-gray-300/60 dark:border-gray-600/60 text-black dark:text-white rounded-md py-2 font-normal transition-colors hover:bg-white/20 dark:hover:bg-gray-800/50 text-sm backdrop-blur-sm"
                onClick={() => setError('Magic link sign-in is coming soon!')}
              >
                Sign in using magic link
              </button>
            </div>

            {/* Terms of Service */}
            <p className="mt-8 text-xs text-gray-500 dark:text-gray-400 text-center">
              You acknowledge that you have read, and agree to our{' '}
              <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
