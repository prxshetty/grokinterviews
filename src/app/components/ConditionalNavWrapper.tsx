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
  const isTopicsPage = pathname.startsWith('/topics');

  return (
    <>
      {/* Render TopicNavWrapper on all topics pages */}
      {isTopicsPage ? (
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