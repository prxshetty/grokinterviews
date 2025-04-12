'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

export default function ConditionalNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if we're on a topic detail page
  const isTopicDetailPage = pathname.startsWith('/topics/') && pathname !== '/topics';

  return (
    <div className={`min-h-screen ${isTopicDetailPage ? 'flex flex-col' : ''}`}>
      {children}
    </div>
  );
}