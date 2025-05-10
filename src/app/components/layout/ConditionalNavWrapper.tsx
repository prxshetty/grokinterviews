'use client';

import { usePathname } from 'next/navigation';
import { DomainNavWrapper } from '../topics-ui';
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ConditionalNavWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTopicsPage = pathname.startsWith('/topics');

  return (
    <>
      {/* Render DomainNavWrapper on all topics pages */}
      {isTopicsPage ? (
        <>
          <DomainNavWrapper />
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