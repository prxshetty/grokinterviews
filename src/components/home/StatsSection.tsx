'use client';

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

// Grid layout classes for specific cards (defined inline in component)

export default function StatsSection() {
  return (
    <div className="w-full bg-background py-24 font-sans">
       <div className="text-center mb-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl mb-4 sm:mb-6 font-light text-foreground">
          Grok Interviews
        </h2>
        <p className="text-sm sm:text-base font-serif italic text-muted-foreground max-w-2xl mx-auto">
          Curated by AI<br className="hidden md:block" /> Just for You.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 grow h-full gap-4 max-w-screen-xl mx-auto px-8">
        {statsData.map((stat, index) => {
            let className = "";
            if (index === 0) className = "md:col-span-2";
            if (index === 5) className = "md:col-span-3";
          return (
          <div key={index} className={className}>
            <BentoCard
              title={stat.description}
              value={stat.value}
              colors={stat.colors}
              delay={stat.delay}
            />
          </div>
        )})}
      </div>
    </div>
  );
}