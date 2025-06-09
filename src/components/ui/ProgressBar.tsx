'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  total?: number;
  completed?: number;
  showText?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({
  progress,
  total,
  completed,
  showText = true,
  height = 'md',
  className = '',
}: ProgressBarProps) {
  // Ensure progress is a number and clamped between 0 and 100
  const numericProgress = typeof progress === 'string' ? parseFloat(progress) : progress;
  const safeProgress = Math.max(0, Math.min(numericProgress || 0, 100));

  // Determine height class
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[height];

  // For display, if progress is very small but > 0, set a minimum width to make it visible
  const displayWidth = (safeProgress > 0 && safeProgress < 2) ? 2 : safeProgress;
  
  const progressColor = 'bg-green-500 dark:bg-green-400';

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex-grow bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClass} border border-gray-300 dark:border-gray-600`}>
        <div
          className={`${progressColor} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${displayWidth}%`, height: '100%' }}
        ></div>
      </div>

      {showText && (
        <div className="ml-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {completed !== undefined && total !== undefined ? (
            <span>{completed}/{total}</span>
          ) : (
            <span>{Math.round(safeProgress)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
