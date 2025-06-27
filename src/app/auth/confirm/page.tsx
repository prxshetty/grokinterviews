'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const error = searchParams.get('error');

      if (error === 'invalid_link') {
        setStatus('error');
        setMessage('Invalid confirmation link. Please try signing up again.');
        return;
      }

      if (!token_hash || !type) {
        setStatus('error');
        setMessage('Invalid confirmation link. Please try signing up again.');
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email. Please try again.');
          return;
        }

        if (data?.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to dashboard...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Confirming Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Email Confirmed!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Confirmation Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <div className="space-y-2">
              <Link
                href="/signin?mode=signup"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors mr-2"
              >
                Try Again
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 