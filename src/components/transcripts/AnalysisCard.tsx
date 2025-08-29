'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface AnalysisCardProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  colorClassName: string;
}

export function AnalysisCard({ title, items, colorClassName }: AnalysisCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-background border border-border rounded-3xl p-8 shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          {title}
        </h3>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <ChevronRight className={cn("h-5 w-5 mt-0.5 flex-shrink-0", colorClassName)} />
            <span className="text-base text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
