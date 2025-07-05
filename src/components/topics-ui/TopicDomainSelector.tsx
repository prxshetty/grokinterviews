'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Brain, Network, Code, Globe, Users, BookOpen, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DomainStats {
  sections: number;
  topics: number;
  questions: number;
  difficulty: string;
}

interface DomainOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
    icon: Brain,
    description: 'AI concepts, algorithms, and applications',
    color: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-purple-600',
    stats: { sections: 13, topics: 434, questions: 18225, difficulty: 'Advanced' },
    illustration: AIIllustration
  },
  {
    id: 'ml',
    label: 'Machine Learning',
    icon: Sparkles,
    description: 'ML models, training, and data science',
    color: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-blue-600',
    stats: { sections: 26, topics: 384, questions: 7681, difficulty: 'Intermediate' },
    illustration: MLIllustration
  },
  {
    id: 'sdesign',
    label: 'System Design',
    icon: Network,
    description: 'Scalable systems, architecture, and design patterns',
    color: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-500 to-green-600',
    stats: { sections: 11, topics: 461, questions: 11800, difficulty: 'Advanced' },
    illustration: SystemDesignIllustration
  },
  {
    id: 'dsa',
    label: 'Data Structures & Algorithms',
    icon: Code,
    description: 'Core CS concepts, coding problems, and optimization',
    color: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-orange-600',
    stats: { sections: 35, topics: 305, questions: 8575, difficulty: 'Intermediate' },
    illustration: DSAIllustration
  },
  {
    id: 'webdev',
    label: 'Web Development',
    icon: Globe,
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

export default function TopicDomainSelector({ className }: TopicDomainSelectorProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
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
    setSelectedDomain(domain);
    router.push(`/topics/${domain}`);
  };

  // If a domain is already selected, don't show the selector
  if (selectedDomain) {
    return null;
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto", className)}>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-gray-100 mb-6">
          Choose Your Learning Path
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Select a domain to start exploring topics and practicing interview questions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {DOMAIN_OPTIONS.map((domain) => {
          const IconComponent = domain.icon;
          const IllustrationComponent = domain.illustration;
          return (
            <div
              key={domain.id}
              onClick={() => handleDomainSelect(domain.id)}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 border border-gray-200 dark:border-gray-700 hover:border-transparent overflow-hidden hover:z-10"
            >
              {/* Gradient Background on Hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                domain.gradient
              )} />
              
              {/* Illustration */}
              <div className="relative mb-6 h-32 flex items-center justify-center">
                <IllustrationComponent className="w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
              </div>

              {/* Content */}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    "p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-gradient-to-br transition-all duration-300",
                    domain.gradient
                  )}>
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-400 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {domain.stats.difficulty}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-gray-800 dark:group-hover:text-white transition-colors duration-300">
                  {domain.label}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors duration-300">
                  {domain.description}
                </p>

                                {/* Stats - Absolutely positioned overlay, hidden by default, shown on hover */}
                <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 bg-white dark:bg-gray-900 rounded-b-2xl border-t border-gray-100 dark:border-gray-800 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <FolderOpen className="w-3 h-3" />
                      Sections
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {domain.stats.sections.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <BookOpen className="w-3 h-3" />
                      Topics
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {domain.stats.topics.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Users className="w-3 h-3" />
                      Questions
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {domain.stats.questions.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Call to Action */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                      Click to explore →
                    </div>
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