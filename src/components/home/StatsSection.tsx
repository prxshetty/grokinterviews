'use client';

import React from 'react';
import { BentoCard } from "@/components/ui/bento-card";
import { highlightedStats } from './content';
import { useCentralizedIntersection } from '@/hooks/ui/use-centralized-intersection';

// Note: We're using curated stats for the minimalist design
// Original data is available but not currently displayed

const cardColors = [
  ["#3B82F6", "#60A5FA", "#93C5FD"],
  ["#60A5FA", "#34D399", "#93C5FD"],
  ["#F59E0B", "#A78BFA", "#FCD34D"],
  ["#3B82F6", "#A78BFA", "#FBCFE8"],
  ["#EC4899", "#F472B6", "#3B82F6"],
  ["#10B981", "#6EE7B7", "#A7F3D0"],
];

const statsData = highlightedStats.map((stat, index) => ({
    ...stat,
    colors: cardColors[index % cardColors.length] || [],
    delay: (index + 1) * 0.2,
}));

export default function StatsSection() {
  const { ref: sectionRef, isVisible: isInView, mounted } = useCentralizedIntersection({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    once: true
  });

  // Show loading skeleton during SSR
  if (!mounted) {
    return (
      <div className="w-full py-12 sm:py-16 md:py-24 font-sans opacity-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grow h-full gap-0 w-full px-4 sm:px-6 lg:px-8">
          {statsData.map((_, index) => {
            let className = "";
            if (index === 0) className = "sm:col-span-2 lg:col-span-2";
            if (index === 5) className = "sm:col-span-2 lg:col-span-3";
            
            return (
              <div key={index} className={`${className} p-6 sm:p-8 md:p-12 animate-pulse`}>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-4"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={sectionRef}
      className={`w-full py-12 sm:py-16 md:py-24 font-sans transition-all duration-700 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grow h-full gap-0 w-full px-4 sm:px-6 lg:px-8">
        {statsData.map((stat, index) => {
            let className = "";
            // Mobile: all cards span 1 column
            // Tablet: first card spans 2 columns, last card spans 2 columns
            // Desktop: first card spans 2 columns, last card spans 3 columns
            if (index === 0) className = "sm:col-span-2 lg:col-span-2";
            if (index === 5) className = "sm:col-span-2 lg:col-span-3";
          return (
          <div key={index} className={className}>
            <BentoCard
              title={stat.description}
              value={stat.value}
              subtitle={stat.subtitle}
              colors={stat.colors}
              delay={stat.delay}
            />
          </div>
        )})}
      </div>
    </div>
  );
}