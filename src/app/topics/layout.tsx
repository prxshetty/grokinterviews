import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Topics | Grok Interviews',
  description: 'Explore a wide range of technical interview topics',
};

export default function TopicsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { domain: string };
}) {
  // Check if we're on the main topics page (URL is just /topics)
  const isTopicsLandingPage = params.domain === 'topics' || !params.domain;
  
  // Only validate domains for specific topic pages, not the main topics page
  if (!isTopicsLandingPage) {
    // Domain validation - ensure only valid domains can be accessed
    const validDomains = ['dsa', 'ml', 'webdev', 'ai', 'sdesign', 'topics'];
    if (!validDomains.includes(params.domain)) {
      notFound();
    }
  }

  return (
    <div data-domain={params.domain}>
      {children}
    </div>
  );
} 