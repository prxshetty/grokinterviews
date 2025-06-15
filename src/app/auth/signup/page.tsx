'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();

  // Redirect to the main signin page with signup mode active
  useEffect(() => {
    router.replace('/signin?mode=signup');
  }, [router]);

  // Return a loading state while redirecting
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Redirecting to sign up page...</p>
      </div>
    </div>
  );
}
