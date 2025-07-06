import React from 'react';
import Link from 'next/link';
import { DomainStat } from '@/types/dashboard.types';

interface DomainCompletionWidgetProps {
  domainStats: {
    domains: DomainStat[];
    totalDomains: number;
    loading: boolean;
    error: string | null;
  };
}

// Function to abbreviate domain names
function abbreviateDomain(domainName: string): string {
  const abbreviations: { [key: string]: string } = {
    'System Design': 'SD',
    'Data Structures': 'DS',
    'Artificial Intelligence': 'AI',
    'Machine Learning': 'ML',
    'Web Development': 'Web'
  };
  
  return abbreviations[domainName] || domainName.substring(0, 4);
}

function DomainProgressCard({ domain }: { domain: DomainStat }) {
  const percentage = Math.round(domain.completionPercentage);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="group relative bg-background border border-border rounded-full w-full aspect-square hover:border-primary/50 transition-colors duration-300 flex items-center justify-center">
      {/* SVG Progress Circle */}
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Background circle */}
        <circle
          className="text-muted-foreground/20"
          strokeWidth="4"
          stroke="currentColor"
          fill="none"
          r="45"
          cx="50"
          cy="50"
        />
        {/* Progress circle */}
        <circle
          className="text-green-400 transition-all duration-300"
          strokeWidth="4"
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          r="45"
          cx="50"
          cy="50"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset
          }}
        />
      </svg>

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center text-center z-10 w-full p-2">
        <span className="font-semibold text-2xl text-foreground mb-0.5" title={`${percentage}% complete`}>
          {percentage}%
        </span>
        <span className="text-xs text-muted-foreground truncate w-full max-w-[120px]" title={domain.domainName}>
          {abbreviateDomain(domain.domainName)}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="group relative bg-background border border-border rounded-full w-full aspect-square hover:border-primary/50 transition-colors duration-300 flex items-center justify-center animate-pulse">
      {/* Circular progress ring placeholder */}
      <div className="absolute inset-2 rounded-full border-4 border-muted/20" />
      <div className="absolute inset-2 rounded-full border-4 border-muted/30 border-t-transparent transform -rotate-90" />
      
      {/* Content placeholder */}
      <div className="relative flex flex-col items-center justify-center text-center z-10 w-full p-2">
        <div className="h-6 w-10 bg-muted rounded mb-0.5" />
        <div className="h-3 w-8 bg-muted rounded" />
      </div>
    </div>
  );
}

export default function DomainCompletionWidget({
  domainStats,
}: DomainCompletionWidgetProps) {
  if (domainStats.loading)
    return (
      <div>
        <h2 className="text-xl font-medium text-foreground mb-4">
          Domain Progress
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-8 w-full">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );

  if (domainStats.error)
    return (
      <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
        <h2 className="text-xl font-medium text-destructive mb-2">
          Error Loading Domains
        </h2>
        <p className="text-sm text-destructive/80">{domainStats.error}</p>
      </div>
    );

  if (domainStats.domains.length === 0)
    return (
      <div>
        <h2 className="text-xl font-medium text-foreground mb-4">
          Domain Progress
        </h2>
        <Link href="/topics">
          <div className="border-2 border-dashed border-border rounded-2xl p-4 flex flex-col items-center justify-center h-48 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-muted-foreground mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <p className="text-base font-semibold text-foreground">
              Explore Domains
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a topic to track your progress
            </p>
          </div>
        </Link>
      </div>
    );

  const domainsToShow = domainStats.domains.slice(0, 8);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-foreground">
          Domain Progress
        </h2>
        {domainStats.totalDomains > domainsToShow.length && (
          <span className="text-sm text-muted-foreground">
            Showing {domainsToShow.length} of {domainStats.totalDomains}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-4 w-full">
        {domainsToShow.map(domain => (
          <Link href={`/topics/${domain.domain}`} key={domain.domain} className="w-full">
            <DomainProgressCard domain={domain} />
          </Link>
        ))}
      </div>
    </div>
  );
} 