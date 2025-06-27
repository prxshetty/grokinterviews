'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { BackgroundPathsOnly } from '@/components/home/background';

function ConfirmContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const code = searchParams.get('code'); // From Supabase's built-in verification flow
    const next = searchParams.get('next') || '/dashboard';

    console.log('Confirmation page params:', {
      success,
      error,
      code,
      next,
      userSignedIn: !!user,
    });

    // If user is already signed in (from Supabase's verification), show success
    if (user && (success === 'true' || code)) {
      setStatus('success');
      setMessage('Email confirmed successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        console.log('Redirecting to:', next);
        router.push(next);
      }, 2000);
      return;
    }

    // If we have a code parameter but no user yet, wait a moment for auth to complete
    if (code && !user) {
      setStatus('loading');
      setMessage('Completing email verification...');
      // Wait a bit longer for the auth state to update
      setTimeout(() => {
        if (user) {
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to your dashboard...');
          setTimeout(() => {
            router.push(next);
          }, 1000);
        } else {
          setStatus('error');
          setMessage('Email verification completed but session was not created. Please try signing in manually.');
        }
      }, 3000);
      return;
    }

    if (success === 'true') {
      setStatus('success');
      setMessage('Email confirmed successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        console.log('Redirecting to:', next);
        router.push(next);
      }, 2000);
    } else if (error) {
      setStatus('error');
      switch (error) {
        case 'invalid_token':
          setMessage('Invalid or expired confirmation link. Please try signing up again or contact support.');
          break;
        case 'verification_failed':
          setMessage('Email verification failed. Please try again or contact support.');
          break;
        case 'missing_parameters':
          setMessage('Invalid confirmation link. Please check your email and try clicking the link again.');
          break;
        case 'no_session':
          setMessage('Email verification succeeded but session was not created. Please try signing in manually.');
          break;
        default:
          setMessage('An unexpected error occurred during email confirmation. Please try again.');
      }
    } else if (!code) {
      // If no success, error, or code params, this might be a direct visit
      setStatus('error');
      setMessage('No confirmation parameters found. Please check your email and click the confirmation link.');
    }
  }, [searchParams, router, user]);

  return (
    <>
      {status === 'loading' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black dark:text-white mb-4">
            Verifying Your Email
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="text-green-500 mb-6">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black dark:text-white mb-4">
            Email Confirmed!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            {message}
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="text-red-500 mb-6">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black dark:text-white mb-4">
            Confirmation Failed
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            {message}
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" variant="outline">
              <Link href="/signin?mode=signup">Sign Up Again</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </>
      )}
    </>
  );
}

function LoadingState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
      <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black dark:text-white mb-4">
        {title}
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
        {message}
      </p>
    </>
  );
}

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full pt-4 relative font-sans">
      <div className="absolute inset-0 -z-10">
        <BackgroundPathsOnly />
      </div>
      <main className="container mx-auto px-8 md:px-12 py-16 sm:py-24 relative z-10 flex items-center justify-center">
        <div className="max-w-xl w-full text-center">
          <Suspense
            fallback={
              <LoadingState
                title="Loading..."
                message="Please wait while we process your request."
              />
            }
          >
            <ConfirmContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
} 