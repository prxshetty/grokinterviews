import React, { Suspense } from 'react';
import TopicPageClient from './TopicPageClient'; // Import the new client component
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';

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
  const { domain } = await params; // Await params before destructuring

  return (
    <Suspense fallback={<LoadingFallback />}>
      <TopicPageClient initialDomain={domain} />
    </Suspense>
  );
} 