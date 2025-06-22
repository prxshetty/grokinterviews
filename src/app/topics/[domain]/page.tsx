import React, { Suspense } from 'react';
import TopicPageClient from './TopicPageClient'; // Import the new client component
import { LoadingSpinner } from '@/components/ui';
import { redirect } from 'next/navigation'; // Import redirect

// Define the expected props structure for the Server Component page
interface PageProps {
  params: { domain: string };
}

// Define a simple loading component
function LoadingFallback() {
  return (
    <LoadingSpinner 
      size="xl" 
      color="primary" 
      text="Loading topic..." 
      fullScreen={true}
    />
  );
}

// This is the Server Component - now async
export default async function Page({ params }: PageProps) {
  const { domain } = params; // No need to await params, it's an object

  // If the domain is 'ai', redirect to the main topics page
  if (domain === 'ai') {
    redirect('/topics');
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <TopicPageClient initialDomain={domain} />
    </Suspense>
  );
} 