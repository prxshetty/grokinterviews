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

// Transition for corner bracket animations
const cornerTransition = {
  type: "spring" as const,
  bounce: 0.2,
  duration: 0.4
};

// Individual Tech Row component with corner brackets
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => onSelect(domain.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center justify-between p-6 cursor-pointer transition-colors duration-300 rounded-sm"
      style={{
        border: isHovered ? '1px solid hsl(var(--foreground))' : '1px solid transparent',
        backgroundColor: isHovered ? 'hsl(var(--background))' : 'transparent',
      }}
    >
      {/* Corner Brackets - Top Left */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: isHovered ? -2 : 8,
          left: isHovered ? -2 : 8,
          width: 16,
          height: 16,
          borderLeft: '2px solid hsl(var(--foreground))',
          borderTop: '2px solid hsl(var(--foreground))',
          opacity: isHovered ? 1 : 0,
        }}
        animate={{
          top: isHovered ? -2 : 8,
          left: isHovered ? -2 : 8,
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.5,
        }}
        transition={cornerTransition}
      />
      {/* Corner Brackets - Top Right */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: isHovered ? -2 : 8,
          right: isHovered ? -2 : 8,
          width: 16,
          height: 16,
          borderRight: '2px solid hsl(var(--foreground))',
          borderTop: '2px solid hsl(var(--foreground))',
          opacity: isHovered ? 1 : 0,
        }}
        animate={{
          top: isHovered ? -2 : 8,
          right: isHovered ? -2 : 8,
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.5,
        }}
        transition={cornerTransition}
      />
      {/* Corner Brackets - Bottom Left */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: isHovered ? -2 : 8,
          left: isHovered ? -2 : 8,
          width: 16,
          height: 16,
          borderLeft: '2px solid hsl(var(--foreground))',
          borderBottom: '2px solid hsl(var(--foreground))',
          opacity: isHovered ? 1 : 0,
        }}
        animate={{
          bottom: isHovered ? -2 : 8,
          left: isHovered ? -2 : 8,
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.5,
        }}
        transition={cornerTransition}
      />
      {/* Corner Brackets - Bottom Right */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: isHovered ? -2 : 8,
          right: isHovered ? -2 : 8,
          width: 16,
          height: 16,
          borderRight: '2px solid hsl(var(--foreground))',
          borderBottom: '2px solid hsl(var(--foreground))',
          opacity: isHovered ? 1 : 0,
        }}
        animate={{
          bottom: isHovered ? -2 : 8,
          right: isHovered ? -2 : 8,
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.5,
        }}
        transition={cornerTransition}
      />

      {/* Domain Name */}
      <div className="flex items-center gap-4">
        <motion.h3
          layoutId={`domain-title-${domain.id}`}
          className="font-editorial font-light text-3xl md:text-4xl text-gray-800 dark:text-gray-200 group-hover:text-foreground transition-colors duration-300"
        >
          {domain.label}
        </motion.h3>
      </div>

      {/* Arrow */}
      <motion.div
        className="text-gray-400 group-hover:text-foreground transition-colors duration-300"
        animate={{
          x: isHovered ? 4 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <ArrowRight className="w-6 h-6" />
      </motion.div>
    </motion.div>
  );
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
          <div className="opacity-0">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-8xl mx-auto px-4", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-editorial text-4xl md:text-5xl font-extralight text-gray-900 dark:text-gray-100 mb-4">
          Choose Your Learning Path
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Select a domain to start learning
        </p>
      </motion.div>

      <div className="flex flex-col space-y-1">
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