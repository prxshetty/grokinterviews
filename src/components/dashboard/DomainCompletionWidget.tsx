import React from 'react';
import Link from 'next/link';

interface DomainStat {
  domain: string;
  domainName: string;
  totalQuestions: number;
  completedQuestions: number;
  completionPercentage: number;
  color: string;
}

interface DomainCompletionWidgetProps {
  domainStats: {
    domains: DomainStat[];
    totalDomains: number;
    loading: boolean;
    error: string | null;
  };
}

export default function DomainCompletionWidget({ domainStats }: DomainCompletionWidgetProps) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Domain Progress</h2>
      </div>

      {domainStats.loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 dark:border-purple-500 border-t-transparent" />
        </div>
              ) : domainStats.error ? (
          <div className="text-center py-4">
            <p className="text-sm text-purple-600 dark:text-purple-400">{domainStats.error}</p>
          </div>
      ) : domainStats.domains.length === 0 ? (
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No domains explored yet</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Start learning to see your progress</p>
          <Link 
            href="/topics" 
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Explore Domains
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Progress across {domainStats.domains.length} of {domainStats.totalDomains} domains
          </p>
          
          <div className="space-y-3">
            {domainStats.domains.slice(0, 5).map((domain) => (
              <div key={domain.domain} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {domain.domainName}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {domain.completionPercentage}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(0.5, domain.completionPercentage)}%`,
                      backgroundColor: domain.color
                    }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{domain.completedQuestions} completed</span>
                  <span>{domain.totalQuestions} total</span>
                </div>
              </div>
            ))}
          </div>

          {domainStats.domains.length > 5 && (
            <div className="text-center mt-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{domainStats.domains.length - 5} more domains
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
} 