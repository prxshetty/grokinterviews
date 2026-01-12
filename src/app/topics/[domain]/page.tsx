import { Suspense } from 'react';
import TopicPageClient from './TopicPageClient'; // Import the new client component
import { LoadingSpinner } from '@/components/ui';
import { TopicDataProvider } from '@/components';

// Define the expected props structure for the Server Component page
interface PageProps {
  params: Promise<{ domain: string }>;
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
  const { domain } = await params;

  // AI domain cleanup completed - duplicate topics removed
  // Users can now access clean AI domain with 538 unique topics

  return (
    <TopicDataProvider>
      <Suspense fallback={<LoadingFallback />}>
        <TopicPageClient initialDomain={domain} />
      </Suspense>
    </TopicDataProvider>
  );
} 