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
          <main className="w-full px-8 py-8">
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