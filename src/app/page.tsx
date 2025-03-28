'use client';

import dynamic from 'next/dynamic';

// Import InterviewPrep with no SSR to avoid hydration errors
const DynamicInterviewPrep = dynamic(() => import('./components/InterviewPrep'), {
  ssr: false
});

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      <DynamicInterviewPrep />
    </main>
  );
}
