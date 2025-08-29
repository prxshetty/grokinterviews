'use client';

import React from 'react';

interface DetailedFeedbackCardProps {
  title: string;
  feedback: string;
  icon: React.ReactNode;
}

export function DetailedFeedbackCard({ title, feedback }: DetailedFeedbackCardProps) {
  if (!feedback) {
    return null;
  }

  return (
    <div className="bg-background border border-border rounded-3xl p-8 shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          {title}
        </h3>
      </div>
      <p className="text-base text-muted-foreground whitespace-pre-wrap">
        {feedback}
      </p>
    </div>
  );
}
