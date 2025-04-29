// This is a server component by default in Next.js App Router
/* eslint-disable */
import React from 'react';
import { notFound } from 'next/navigation';

type Props = {
  children: React.ReactNode;
  params: { domain: string };
};

// Page-specific context provider for passing the domain safely
export default async function DomainLayout({ children, params }: Props) {
  // Decode the domain parameter directly from the awaited props
  const domain = decodeURIComponent((await params).domain);
  
  // Domain validation - ensure only valid domains can be accessed
  const validDomains = ['dsa', 'ml', 'webdev', 'ai', 'sdesign'];
  if (!validDomains.includes(domain)) {
    notFound();
  }
  
  return (
    <div data-domain={domain}>
      {children}
    </div>
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