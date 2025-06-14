import React, { Suspense } from 'react';
import QuizPageClient from './QuizPageClient';
import { LoadingSpinner } from '@/components/ui';

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

const mainTopics = [
  { id: "ml", label: "Machine Learning" },
  { id: "ai", label: "Artificial Intelligence" },
  { id: "webdev", label: "Web Development" },
  { id: "sdesign", label: "System Design" },
  { id: "dsa", label: "Data Structures & Algorithms" },
];

// This is the Server Component
export default async function Page({ params }: PageProps) {
  const { domain } = params;

  // Find the corresponding topic label
  const domainName = mainTopics.find(topic => topic.id === domain)?.label || 'Quiz';

  return (
    <Suspense fallback={<LoadingFallback />}>
      <QuizPageClient initialDomain={domain} domainName={domainName} />
    </Suspense>
  );
}
