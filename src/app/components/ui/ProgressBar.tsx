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
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(Math.max(progress || 0, 0), 100);

  // Log the progress values for debugging
  console.log('ProgressBar props:', { progress, total, completed, safeProgress });

  // Determine height class
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[height];

  // Ensure we always show at least 1% width for visibility, unless progress is actually 0
  const displayWidth = safeProgress === 0 ? 0 : Math.max(safeProgress, 1);

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex-grow bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClass} border border-gray-300 dark:border-gray-600`}>
        <div
          className="bg-black dark:bg-white rounded-full transition-all duration-300 ease-out"
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
