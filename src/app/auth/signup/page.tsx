'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to the main signin page with signup mode active
  useEffect(() => {
    // Preserve existing search parameters
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('mode', 'signup');

    router.replace(`/signin?${currentParams.toString()}`);
  }, [router, searchParams]);

  // This component will be replaced by the redirect, so it doesn't need to return anything complex.
  // The loading state will be handled by the Suspense fallback.
  return null;
}

export default function SignUp() {
  // Return a loading state while redirecting
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent">
        <LoadingSpinner size="sm" text="Redirecting to sign up page..." />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
