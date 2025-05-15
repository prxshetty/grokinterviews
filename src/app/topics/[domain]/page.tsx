import React, { Suspense } from 'react';
import TopicPageClient from './TopicPageClient'; // Import the new client component

// Define the expected props structure for the Server Component page
interface PageProps {
  params: { domain: string };
}

// Define a simple loading component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading topic...</p>
      </div>
    </div>
  );
}

// This is the Server Component - now async
export default async function Page({ params }: PageProps) {
  const { domain } = await params; // Await params before destructuring

  return (
    <Suspense fallback={<LoadingFallback />}>
      <TopicPageClient initialDomain={domain} />
    </Suspense>
  );
} 