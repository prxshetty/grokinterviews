'use client';

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {Users, BookOpen, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui';

interface DomainStats {
  sections: number;
  topics: number;
  questions: number;
  difficulty: string;
}

interface DomainOption {
  id: string;
  label: string;
  description: string;
  color: string;
  gradient: string;
  stats: DomainStats;
  illustration: React.ComponentType<{ className?: string }>;
}

// SVG Illustrations
const AIIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="80" r="60" fill="url(#aiGrad)" opacity="0.1" />
    <circle cx="100" cy="80" r="40" fill="url(#aiGrad)" opacity="0.2" />
    <circle cx="100" cy="80" r="20" fill="url(#aiGrad)" opacity="0.4" />
    <path d="M80 70 Q100 50 120 70 Q100 90 80 70" fill="url(#aiGrad)" opacity="0.6" />
    <circle cx="90" cy="75" r="3" fill="#8B5CF6" />
    <circle cx="110" cy="75" r="3" fill="#8B5CF6" />
    <path d="M95 85 Q100 90 105 85" stroke="#8B5CF6" strokeWidth="2" fill="none" />
  </svg>
);

const MLIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="mlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect x="40" y="100" width="8" height="40" fill="url(#mlGrad)" opacity="0.6" />
    <rect x="60" y="80" width="8" height="60" fill="url(#mlGrad)" opacity="0.7" />
    <rect x="80" y="60" width="8" height="80" fill="url(#mlGrad)" opacity="0.8" />
    <rect x="100" y="40" width="8" height="100" fill="url(#mlGrad)" opacity="0.9" />
    <rect x="120" y="70" width="8" height="70" fill="url(#mlGrad)" opacity="0.8" />
    <rect x="140" y="90" width="8" height="50" fill="url(#mlGrad)" opacity="0.7" />
    <path d="M45 105 Q75 45 105 45 Q135 75 145 95" stroke="#3B82F6" strokeWidth="3" fill="none" opacity="0.8" />
  </svg>
);

const SystemDesignIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="sysGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <circle cx="140" cy="60" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <circle cx="100" cy="100" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <circle cx="60" cy="130" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <circle cx="140" cy="130" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <line x1="75" y1="60" x2="125" y2="60" stroke="#10B981" strokeWidth="3" opacity="0.6" />
    <line x1="70" y1="70" x2="90" y2="90" stroke="#10B981" strokeWidth="3" opacity="0.6" />
    <line x1="130" y1="70" x2="110" y2="90" stroke="#10B981" strokeWidth="3" opacity="0.6" />
    <line x1="90" y1="110" x2="70" y2="120" stroke="#10B981" strokeWidth="3" opacity="0.6" />
    <line x1="110" y1="110" x2="130" y2="120" stroke="#10B981" strokeWidth="3" opacity="0.6" />
  </svg>
);

const DSAIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="dsaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect x="50" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" />
    <rect x="80" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" />
    <rect x="110" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" />
    <rect x="50" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" />
    <rect x="80" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.9" />
    <rect x="110" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" />
    <rect x="50" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" />
    <rect x="80" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" />
    <rect x="110" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" />
    <path d="M140 70 L160 50 L180 70 L160 90 Z" fill="url(#dsaGrad)" opacity="0.7" />
  </svg>
);

const WebDevIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="webGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
    </defs>
    <rect x="50" y="40" width="100" height="80" rx="8" fill="url(#webGrad)" opacity="0.1" />
    <rect x="50" y="40" width="100" height="15" rx="8" fill="url(#webGrad)" opacity="0.8" />
    <circle cx="60" cy="47.5" r="2.5" fill="#6366F1" />
    <circle cx="70" cy="47.5" r="2.5" fill="#6366F1" />
    <circle cx="80" cy="47.5" r="2.5" fill="#6366F1" />
    <rect x="60" y="65" width="30" height="8" fill="url(#webGrad)" opacity="0.6" />
    <rect x="60" y="80" width="50" height="4" fill="url(#webGrad)" opacity="0.4" />
    <rect x="60" y="90" width="40" height="4" fill="url(#webGrad)" opacity="0.4" />
    <rect x="120" y="65" width="20" height="25" fill="url(#webGrad)" opacity="0.5" />
  </svg>
);

const DOMAIN_OPTIONS: DomainOption[] = [
  {
    id: 'ai',
    label: 'Artificial Intelligence',
    description: 'AI concepts, algorithms, and applications',
    color: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-purple-600',
    stats: { sections: 13, topics: 434, questions: 18225, difficulty: 'Advanced' },
    illustration: AIIllustration
  },
  {
    id: 'ml',
    label: 'Machine Learning',
    description: 'ML models, training, and data science',
    color: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-blue-600',
    stats: { sections: 26, topics: 384, questions: 7681, difficulty: 'Intermediate' },
    illustration: MLIllustration
  },
  {
    id: 'sdesign',
    label: 'System Design',
    description: 'Scalable systems, architecture, and design patterns',
    color: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-500 to-green-600',
    stats: { sections: 11, topics: 461, questions: 11800, difficulty: 'Advanced' },
    illustration: SystemDesignIllustration
  },
  {
    id: 'dsa',
    label: 'Data Structures & Algorithms',
    description: 'Core CS concepts, coding problems, and optimization',
    color: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-orange-600',
    stats: { sections: 35, topics: 305, questions: 8575, difficulty: 'Intermediate' },
    illustration: DSAIllustration
  },
  {
    id: 'webdev',
    label: 'Web Development',
    description: 'Frontend, backend, and full-stack development',
    color: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-indigo-600',
    stats: { sections: 16, topics: 431, questions: 20080, difficulty: 'Beginner' },
    illustration: WebDevIllustration
  }
];

interface TopicDomainSelectorProps {
  className?: string;
}

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
        {DOMAIN_OPTIONS.map((domain) => {
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