import React, { Suspense } from 'react';
import QuizPageClient from './QuizPageClient';
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
      text="Loading quiz..." 
      fullScreen={true}
    />
  );
}

// This is the Server Component
export default async function Page({ params }: PageProps) {
  const { domain } = await params; // Await params before destructuring

  return (
    <Suspense fallback={<LoadingFallback />}>
      <QuizPageClient initialDomain={domain} />
    </Suspense>
  );
}
