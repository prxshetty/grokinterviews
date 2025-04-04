'use client';

import { usePathname } from 'next/navigation';
import TopicNavWrapper from './TopicNavWrapper';
import React from 'react';

export default function ConditionalNavWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTopicDetailPage = pathname.startsWith('/topics/') && pathname !== '/topics';

  return (
    <>
      {/* Only render TopicNavWrapper on topic detail pages */}
      {isTopicDetailPage ? (
        <>
          <TopicNavWrapper />
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </>
      ) : (
        /* For all other pages, render only the children (page content) */
        children
      )}
    </>
  );
}