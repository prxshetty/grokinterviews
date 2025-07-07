import React from 'react';
import Link from 'next/link';
import { DomainStat } from '@/types/dashboard.types';
import { CircularProgress } from '@/components/ui/circular-progress';
import { DOMAIN_COLORS, getDomainId } from '@/config/domain.constants';
import {
  AIIllustration,
  MLIllustration,
  SystemDesignIllustration,
  DSAIllustration,
  WebDevIllustration,
  SummaryIllustration
} from '@/components/topics-ui';

interface DomainCompletionWidgetProps {
  domainStats: {
    domains: DomainStat[];
    totalDomains: number;
    loading: boolean;
    error: string | null;
  };
}

const DOMAIN_ILLUSTRATIONS = {
  summary: SummaryIllustration,
  ai: AIIllustration,
  ml: MLIllustration,
  sdesign: SystemDesignIllustration,
  dsa: DSAIllustration,
  webdev: WebDevIllustration
} as const;

function DomainProgressCard({ domain, isOverall = false }: { domain: DomainStat, isOverall?: boolean }) {
  const percentage = Math.round(domain.completionPercentage);
  const domainId = isOverall ? 'summary' : getDomainId(domain.domainName);
  const colors = DOMAIN_COLORS[domainId];
  const Illustration = DOMAIN_ILLUSTRATIONS[domainId];
  const labelText = isOverall ? 'Overall Progress' : domain.domainName;
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="group relative bg-background border border-border rounded-full w-full aspect-square hover:border-primary/50 transition-colors duration-300 p-2">
        <CircularProgress
          percentage={percentage}
          size={isOverall ? 100 : 100}
          strokeWidth={isOverall ? 3 : 3}
          progressColor={colors.progressColor}
          gradientClass={colors.gradient}
          illustration={<Illustration className="w-full h-full opacity-20" />}
          label={<span className="text-3xl sm:text-4xl font-normal text-foreground">{percentage}%</span>}
        />
      </div>
      <span className="mt-2 text-sm text-muted-foreground truncate w-full max-w-[140px] text-center" title={domain.domainName}>
        {labelText}
      </span>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-6 w-full">
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-foreground">
          Domain Progress
        </h2>
        {domainStats.totalDomains > domainsToShow.length && (
          <span className="text-sm text-muted-foreground">
            Showing {domainsToShow.length} of {domainStats.totalDomains}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-6 w-full">
        {/* Individual domain cards */}
        {domainsToShow.map(domain => (
          <Link href={`/topics/${domain.domain}`} key={domain.domain} className="w-full">
            <DomainProgressCard domain={domain} />
          </Link>
        ))}
        
        {/* Overall progress card */}
        <DomainProgressCard 
          domain={{
            domain: 'overall',
            domainName: 'Overall Progress',
            completionPercentage: domainsToShow.reduce((acc, domain) => acc + domain.completionPercentage, 0) / domainsToShow.length,
            totalTopics: domainsToShow.reduce((acc, domain) => acc + (domain.totalTopics || 0), 0),
            completedTopics: domainsToShow.reduce((acc, domain) => acc + (domain.completedTopics || 0), 0),
            totalQuestions: domainsToShow.reduce((acc, domain) => acc + (domain.totalQuestions || 0), 0),
            completedQuestions: domainsToShow.reduce((acc, domain) => acc + (domain.completedQuestions || 0), 0)
          }} 
          isOverall={true}
        />
      </div>
    </div>
  );
} 