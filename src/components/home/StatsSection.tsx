'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BentoCard } from "@/components/ui/bento-card";
import { highlightedStats } from './content';

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
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          // Once animation is triggered, we can disconnect the observer
          observer.disconnect();
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the component is visible
        rootMargin: '0px 0px -50px 0px' // Start animation slightly before fully visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

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