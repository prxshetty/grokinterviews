// This is a server component by default in Next.js App Router
import React from 'react';

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
  return [
    { domain: 'ml' },
    { domain: 'ai' },
    { domain: 'webdev' },
    { domain: 'sdesign' },
    { domain: 'dsa' },
  ];
} 