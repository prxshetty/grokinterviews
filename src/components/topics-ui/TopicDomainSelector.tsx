'use client';

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {Users, BookOpen, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui';
import { DOMAIN_OPTIONS } from '@/config/domain.constants';
import { 
  AIIllustration, 
  MLIllustration, 
  SystemDesignIllustration, 
  DSAIllustration, 
  WebDevIllustration 
} from './DomainIllustrations';

interface TopicDomainSelectorProps {
  className?: string;
}

// Enhanced domain options with illustrations
const ENHANCED_DOMAIN_OPTIONS = DOMAIN_OPTIONS.map(domain => {
  const illustrations = {
    ai: AIIllustration,
    ml: MLIllustration,
    sdesign: SystemDesignIllustration,
    dsa: DSAIllustration,
    webdev: WebDevIllustration
  };
  
  return {
    ...domain,
    illustration: illustrations[domain.id as keyof typeof illustrations]
  };
});

// Helper function to get gradient classes for each domain
function getGradientClasses(domainId: string) {
  const gradients = {
    ai: 'bg-transparent from-purple-500/15 via-purple-500/10 to-purple-500/15 bg-[radial-gradient(circle_at_50%_0%,rgba(147,51,234,0.1),transparent_50%)] dark:from-purple-500/20 dark:via-purple-500/15 dark:to-purple-500/20 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(147,51,234,0.15),transparent_50%)] hover:before:from-purple-400/8 hover:before:via-purple-400/4 hover:before:to-purple-400/8',
    ml: 'bg-transparent from-blue-500/15 via-blue-500/10 to-blue-500/15 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)] dark:from-blue-500/20 dark:via-blue-500/15 dark:to-blue-500/20 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)] hover:before:from-blue-400/8 hover:before:via-blue-400/4 hover:before:to-blue-400/8',
    sdesign: 'bg-transparent from-green-500/15 via-green-500/10 to-green-500/15 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_50%)] dark:from-green-500/20 dark:via-green-500/15 dark:to-green-500/20 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.15),transparent_50%)] hover:before:from-green-400/8 hover:before:via-green-400/4 hover:before:to-green-400/8',
    dsa: 'bg-transparent from-orange-500/15 via-orange-500/10 to-orange-500/15 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.1),transparent_50%)] dark:from-orange-500/20 dark:via-orange-500/15 dark:to-orange-500/20 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_50%)] hover:before:from-orange-400/8 hover:before:via-orange-400/4 hover:before:to-orange-400/8',
    webdev: 'bg-transparent from-indigo-500/15 via-indigo-500/10 to-indigo-500/15 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1),transparent_50%)] dark:from-indigo-500/20 dark:via-indigo-500/15 dark:to-indigo-500/20 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_50%)] hover:before:from-indigo-400/8 hover:before:via-indigo-400/4 hover:before:to-indigo-400/8'
  };
  return gradients[domainId as keyof typeof gradients] || gradients.webdev;
}

export default function TopicDomainSelector({ className }: TopicDomainSelectorProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're already on a domain page
  useEffect(() => {
    const pathSegments = pathname.split('/');
    if (pathSegments.length >= 3 && pathSegments[1] === 'topics') {
      const domain = pathSegments[2];
      if (domain && DOMAIN_OPTIONS.some(opt => opt.id === domain)) {
        setSelectedDomain(domain);
      }
    }
  }, [pathname]);

  const handleDomainSelect = (domain: string) => {
    setIsNavigating(true);
    setSelectedDomain(domain);
    router.push(`/topics/${domain}`);
  };

  // If a domain is already selected, don't show the selector
  if (selectedDomain && !isNavigating) {
    return null;
  }

  // Show loading state during navigation
  if (isNavigating) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto", className)}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner 
            size="lg" 
            color="primary" 
            text="Loading topics..." 
            centered={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto", className)}>
      <div className="text-center mb-12">
        <h1 className="font-editorial text-4xl md:text-5xl font-extralight text-gray-900 dark:text-gray-100 mb-6">
          Choose Your Learning Path
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Select a domain to start exploring topics and practicing interview questions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:justify-center md:place-content-center">
        {ENHANCED_DOMAIN_OPTIONS.map((domain) => {
          const IconComponent = domain.illustration;
          return (
            <div
              key={domain.id}
              onClick={() => handleDomainSelect(domain.id)}
              className={cn(
                "group relative rounded-xl p-4 cursor-pointer transition-all duration-500",
                "bg-gradient-to-br backdrop-blur-2xl border border-white/[0.08] dark:border-white/[0.06]",
                "shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
                "hover:scale-[1.02] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)]",
                "before:absolute before:inset-0 before:rounded-xl before:transition-all before:duration-500",
                "after:absolute after:inset-0 after:rounded-xl after:transition-all after:duration-500",
                getGradientClasses(domain.id)
              )}
            >
                {/* Background overlay effects */}
                <div className="absolute inset-0 bg-white/[0.02] dark:bg-white/[0.05] rounded-2xl backdrop-blur-sm" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] bg-[length:200%_1px] bg-no-repeat opacity-30 rounded-2xl" />
                
                {/* Content container */}
                <div className="relative z-20 h-full flex flex-col">
                  <div className="flex-grow">
                    {/* Illustration */}
                    <div className="relative mb-4 h-20 flex items-center justify-center">
                      <IconComponent className="w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
                    </div>

                    {/* Main content */}
                    <div className="text-center">
                      {/* Difficulty badge */}
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300">
                          {domain.stats.difficulty}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold text-foreground mb-1 leading-tight">
                        {domain.label}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-xs text-muted-foreground/80 mb-3 leading-normal">
                        {domain.description}
                      </p>
                    </div>
                  </div>

                  {/* Stats and CTA */}
                  <div className="mt-auto pt-3 border-t border-border/20">
                    {/* Stats */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Sections</span>
                        </span>
                        <span className="font-semibold text-foreground">
                          {domain.stats.sections.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Topics</span>
                        </span>
                        <span className="font-semibold text-foreground">
                          {domain.stats.topics.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span>Questions</span>
                        </span>
                        <span className="font-semibold text-foreground">
                          {domain.stats.questions.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* Call to action */}
                    <div className="text-center">
                      <span className="text-xs font-medium text-primary group-hover:text-primary/80 transition-colors duration-300">
                        Explore →
                      </span>
                    </div>
                  </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}