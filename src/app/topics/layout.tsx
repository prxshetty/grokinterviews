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
  // Removed domain validation logic - it's handled in the [domain] layout
  // Removed isTopicsLandingPage check as validation is moved

  return (
    // Removed data-domain attribute from this wrapper div
    <div> 
      {children}
    </div>
  );
} 