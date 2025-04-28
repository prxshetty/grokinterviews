// This is a server component by default in Next.js App Router
import React from 'react';
import { notFound } from 'next/navigation';

// Page-specific context provider for passing the domain safely
export default async function DomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { domain: string };
}) {
  // In Next.js 14, params is a Promise that needs to be awaited
  const unwrappedParams = await params;
  const domain = decodeURIComponent(unwrappedParams.domain);
  
  // Domain validation - ensure only valid domains can be accessed
  const validDomains = ['dsa', 'ml', 'webdev', 'ai', 'sdesign'];
  if (!validDomains.includes(domain)) {
    notFound();
  }
  
  return (
    <>
      {/* Pass the domain as a data attribute that client components can access */}
      <div data-domain={domain}>
        {children}
      </div>
    </>
  );
}

// Generate static paths for common domains
export function generateStaticParams() {
  // Generate all domains except 'ml' to avoid it being the default
  return [
    { domain: 'ai' },
    { domain: 'webdev' },
    { domain: 'sdesign' },
    { domain: 'dsa' },
    { domain: 'ml' }, // ML stays in the list but isn't first
  ];
} 