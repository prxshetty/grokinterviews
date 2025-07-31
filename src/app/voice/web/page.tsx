'use client';

import { Suspense } from 'react';
import WebInterviewPageContent from './WebInterviewPageContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function WebInterviewPageFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <LoadingSpinner 
        size="xl" 
        color="primary" 
        text="Loading interview..." 
        centered={true}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<WebInterviewPageFallback />}>
      <WebInterviewPageContent />
    </Suspense>
  );
}