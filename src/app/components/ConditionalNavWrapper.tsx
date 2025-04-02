'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import TopicNavWrapper from './TopicNavWrapper';
import React from 'react';

export default function ConditionalNavWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnLandingPage = pathname === '/';
  const isOnTopicsPage = pathname === '/topics';

  return (
    <>
      {/* If NOT on landing page or topics page, render nav bars AND the containing main element */}
      {!isOnLandingPage && !isOnTopicsPage ? (
        <>
          <Navbar />
          <TopicNavWrapper />
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </>
      ) : (
        /* If ON landing page or topics page, render only the children (page content) */
        children
      )}
    </>
  );
} 