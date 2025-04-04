'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This would be replaced with actual authentication logic
    console.log('Sign in attempt with:', { email, password });
    // For now, just redirect back to home
    // router.push('/');
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 flex items-center justify-center p-4 font-sans tracking-tight transition-colors duration-300">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link
          href="/"
          className="flex items-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <button
          onClick={toggleDarkMode}
          className="text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-black dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? 'Light' : 'Dark'}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg overflow-hidden text-black dark:text-white shadow-lg">
        <div className="p-8 flex flex-col items-center">
          {/* Logo/Icon */}
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-gray-600 dark:bg-gray-400"></div>
            </div>
          </div>

          {/* Welcome Text */}
          <h1 className="text-2xl font-normal text-center text-black dark:text-white mb-2 tracking-tight">
            Yooo, welcome back!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 text-center">
            First time here? <Link href="/signup" className="text-black dark:text-white hover:underline">Sign up for free</Link>
          </p>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-4">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600"
                required
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gray-900 dark:bg-white border border-transparent text-white dark:text-gray-900 rounded-md py-2 font-normal transition-colors hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center w-full my-6">
            <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700"></div>
            <span className="px-3 text-sm text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700"></div>
          </div>

          {/* Alternative Sign In Methods */}
          <button className="w-full mb-3 bg-transparent border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md py-2 font-normal transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
            Sign in using magic link
          </button>

          <button className="w-full bg-transparent border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md py-2 font-normal transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
            Single sign-on (SSO)
          </button>

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
  );
}
