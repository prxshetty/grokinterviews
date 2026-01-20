'use client';

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DOMAIN_OPTIONS } from '@/config/domain.constants';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/components/AuthProvider';

interface TopicDomainSelectorProps {
  className?: string;
}

// Individual Tech Row component with structured borders
function TechRow({
  domain,
  index,
  onSelect
}: {
  domain: { id: string; label: string };
  index: number;
  onSelect: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      key={domain.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSelect(domain.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full cursor-pointer bg-background"
    >
      {/* Main Container border */}
      <div
        className={cn(
          "relative flex items-center justify-between p-4 md:p-5 transition-colors duration-300",
          "border-b border-r border-l border-gray-200 dark:border-gray-800",
          index === 0 && "border-t" // Add top border only for first item
        )}
      >
        {/* Hover Highlight Overlay */}
        <motion.div
          className="absolute inset-0 bg-gray-50 dark:bg-zinc-900/50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Thick Active Border overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-x-0 top-0 h-[2px] bg-foreground origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground origin-right"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 w-[2px] bg-foreground origin-top"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-[2px] bg-foreground origin-bottom"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 mb-1">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <h3 className="font-editorial font-light text-2xl md:text-3xl text-gray-900 dark:text-gray-100 group-hover:translate-x-2 transition-transform duration-300">
              {domain.label}
            </h3>
          </div>
        </div>

        {/* Arrow Action */}
        <div className="relative z-10 flex items-center gap-2 overflow-hidden">
          <span className={cn(
            "hidden md:block text-sm font-medium tracking-wider uppercase transition-all duration-300",
            isHovered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          )}>
            Start Learning
          </span>
          <motion.div
            animate={{ x: isHovered ? 0 : 0 }}
            className="bg-foreground text-background p-2 rounded-none"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TopicDomainSelector({ className }: TopicDomainSelectorProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Client-side auth guard as defense-in-depth
  const { user, loading } = useAuth();

  useEffect(() => {
    const pathSegments = pathname.split('/');
    if (pathSegments.length >= 3 && pathSegments[1] === 'topics') {
      const domain = pathSegments[2];
      if (domain && DOMAIN_OPTIONS.some(opt => opt.id === domain)) {
        setSelectedDomain(domain);
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/signin';
    }
  }, [loading, user]);

  const handleDomainSelect = (domain: string) => {
    setIsNavigating(true);
    setSelectedDomain(domain);
    router.push(`/topics/${domain}`);
  };

  if (loading) {
    return (
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }


  if (selectedDomain && !isNavigating) {
    return null;
  }

  if (isNavigating) {
    return (
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-5xl mx-auto px-4 py-8", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-left mb-8"
      >
        <span className="font-mono text-xs tracking-wider text-gray-500 uppercase mb-2 block">
          Select Domain
        </span>
        <h1 className="font-editorial font-light text-4xl md:text-5xl text-gray-900 dark:text-gray-100 mb-4">
          Choose Your Path
        </h1>
        <div className="h-1 w-24 bg-foreground" />
      </motion.div>

      <div className="flex flex-col">
        {DOMAIN_OPTIONS.map((domain, index) => (
          <TechRow
            key={domain.id}
            domain={domain}
            index={index}
            onSelect={handleDomainSelect}
          />
        ))}
      </div>
    </div>
  );
}