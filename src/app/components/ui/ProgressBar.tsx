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

export function ProgressBar({
  progress,
  total,
  completed,
  showText = true,
  height = 'md',
  className = '',
}: ProgressBarProps) {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(Math.max(progress || 0, 0), 100);

  // Log the progress values for debugging
  console.log('ProgressBar props:', { progress, total, completed, safeProgress });

  // Determine height class
  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }[height];

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex-grow bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className="bg-green-500 dark:bg-green-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${safeProgress}%`, height: '100%' }}
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
