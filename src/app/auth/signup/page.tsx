'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to the main signin page with signup mode active
  useEffect(() => {
    // Preserve existing search parameters
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('mode', 'signup');
    
    router.replace(`/signin?${currentParams.toString()}`);
  }, [router, searchParams]);

  // Return a loading state while redirecting
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to sign up page...</p>
      </div>
    </div>
  );
}
