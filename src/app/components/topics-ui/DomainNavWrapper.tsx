"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import DomainNav from './DomainNav';

export default function DomainNavWrapper() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const pathname = usePathname();

  // Check if we're on the topics page
  const isTopicsPage = pathname === '/topics';

  // Listen for reset navigation events
  useEffect(() => {
    const handleResetNavigation = () => {
      setSelectedDomain(null);
    };

    window.addEventListener('resetNavigation', handleResetNavigation);

    return () => {
      window.removeEventListener('resetNavigation', handleResetNavigation);
    };
  }, []);

  // Get the current domain from the URL path if available
  useEffect(() => {
    const pathParts = pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'topics' && pathParts[2]) {
      const domain = pathParts[2];
      setSelectedDomain(domain);
    }
  }, [pathname]);

  const handleDomainSelect = (domainId: string) => {
    console.log(`DomainNavWrapper - handleDomainSelect called with domainId: ${domainId}`);
    setSelectedDomain(domainId);
    window.dispatchEvent(new CustomEvent('domainChange', { detail: domainId }));
  };

  return (
    <div className={`domain-navigation w-full ${isTopicsPage ? 'sticky top-12 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-0 mt-0' : 'bg-transparent'}`}>
      <div className="w-full">
        <DomainNav onDomainSelect={handleDomainSelect} selectedDomain={selectedDomain} />
      </div>
    </div>
  );
} 