import React, { Suspense } from 'react';
import TopicPageClient from './TopicPageClient'; // Assumes TopicPageClient will be in the same directory

interface PageProps {
  params: {
    domain: string;
    section: string;
    topic: string;
  };
}

// Define a simple loading component (can be reused or enhanced)
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading topic content...</p>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    // Fetch paths from the API endpoint
    // Ensure this URL is correct based on your project structure and deployment environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/static-paths`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to fetch static paths:', response.status, errorData);
      throw new Error(`Failed to fetch static paths: ${response.status} ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.paths || !Array.isArray(data.paths)) {
        console.error('Invalid paths data received from API:', data);
        return [];
    }

    return data.paths.map((path: { domain: string; section: string; topic: string }) => ({
      domain: path.domain,
      section: path.section,
      topic: path.topic,
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return []; // Return empty array on error to prevent build failure, or re-throw if preferred
  }
}

export default async function Page({ params }: PageProps) {
  const { domain, section, topic } = params;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <TopicPageClient
        domainSlug={domain}
        sectionSlug={section}
        topicSlug={topic}
      />
    </Suspense>
  );
} 