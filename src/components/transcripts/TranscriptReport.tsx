'use client';

import React from 'react';

interface TranscriptReportProps {
  score: number;
  label?: string;
}

export function TranscriptReport({ score, label = "INTERVIEW SCORE" }: TranscriptReportProps) {
  const normalizedScore = Math.max(0, Math.min(10, Math.round(score)));
  const circumference = 2 * Math.PI * 80;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedScore / 10) * circumference;

  const getPerformanceText = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-background border border-border rounded-3xl p-8 shadow-lg max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          {label}
        </h2>
      </div>

      {/* Circular Progress Score */}
      <div className="relative flex items-center justify-center mb-8">
        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted-foreground/20"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-foreground transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-light text-foreground mb-2">{normalizedScore}</span>
          <span className="text-muted-foreground text-sm font-medium">
            {getPerformanceText(normalizedScore)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>0</span>
          <span>10</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full">
          <div 
            className="absolute left-0 top-0 h-full bg-foreground rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(normalizedScore / 10) * 100}%` }}
          />
          <div 
            className="absolute w-3 h-3 bg-foreground rounded-full border-2 border-background transition-all duration-1000 ease-out"
            style={{ 
              left: `${(normalizedScore / 10) * 100}%`,
              top: '50%',
              transform: 'translateX(-50%) translateY(-50%)'
            }}
          />
        </div>
      </div>

      {/* Score Details */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-foreground rounded-sm"></div>
          <span className="text-muted-foreground">Score: {normalizedScore}/10</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
          <span className="text-muted-foreground">{Math.round((normalizedScore / 10) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}