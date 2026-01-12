// This is a server component by default in Next.js App Router

import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { VALID_DOMAINS } from '@/config/domain.constants';

type Props = {
  children: ReactNode;
  params: Promise<{ domain: string }>;
};

// Page-specific context provider for passing the domain safely
export default async function DomainLayout({ children, params }: Props) {
  // Decode the domain parameter directly from the awaited props
  const domain = decodeURIComponent((await params).domain);

  // Domain validation - ensure only valid domains can be accessed
  if (!VALID_DOMAINS.includes(domain)) {
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
  // Generate all valid domains
  return VALID_DOMAINS.map(domain => ({ domain }));
}