'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to sign up page...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
