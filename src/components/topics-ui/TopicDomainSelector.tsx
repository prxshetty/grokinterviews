'use client';

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DOMAIN_OPTIONS } from '@/config/domain.constants';
import { motion } from 'framer-motion';

interface TopicDomainSelectorProps {
  className?: string;
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
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <div className="flex justify-center items-center h-64">
          {/* Placeholder for the transition - keeps the layout stable while loading */}
          <div className="opacity-0">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto px-4", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="font-editorial text-4xl md:text-5xl font-extralight text-gray-900 dark:text-gray-100 mb-6">
          Choose Your Learning Path
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Select a domain to start learning
        </p>
      </motion.div>

      <div className="flex flex-col space-y-2">
        {DOMAIN_OPTIONS.map((domain, index) => (
          <motion.div
            key={domain.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleDomainSelect(domain.id)}
            className="group relative flex items-center justify-between p-6 cursor-pointer border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300 rounded-lg"
          >
            <div className="flex items-center gap-4">
              {/* 
                  layoutId is critical here. It matches the title on the next page.
                  e.g., "domain-title-ai"
               */}
              <motion.h3
                layoutId={`domain-title-${domain.id}`}
                className="font-editorial font-light text-4xl md:text-4xl text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors duration-300"
              >
                {domain.label}
              </motion.h3>
            </div>

            <motion.div
              className="text-gray-400 group-hover:text-primary transform group-hover:translate-x-2 transition-all duration-300"
            >
              <ArrowRight className="w-6 h-6" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}