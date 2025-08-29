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

export function AnalysisCard({ title, items, icon, colorClassName }: AnalysisCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-background border border-border rounded-3xl p-8 shadow-lg h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className={cn("flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-muted", colorClassName)}>
          {icon}
        </div>
        <h3 className={cn("text-xl font-semibold", colorClassName)}>
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
