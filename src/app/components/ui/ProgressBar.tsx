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
  // Convert to number if it's a string
  const numericProgress = typeof progress === 'string' ? parseFloat(progress) : progress;

  // IMPORTANT: Force progress to be at least 1% for visibility unless it's actually 0
  // This ensures the progress bar is visible even with small progress values
  const safeProgress = numericProgress > 0 ?
    Math.min(Math.max(numericProgress || 1, 1), 100) : 0;

  // Determine height class
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[height];

  // Log the progress values for debugging
  console.log('ProgressBar props:', { progress, total, completed, numericProgress, safeProgress, className });

  // Always log progress for debugging
  console.log(`ProgressBar showing ${safeProgress}% progress for ${className || 'unknown'}`);

  // Log the section name for debugging
  if (className) {
    console.log(`ProgressBar for ${className}`);
  }

  // Ensure we always show at least 1% width for visibility, unless progress is actually 0
  const displayWidth = safeProgress === 0 ? 0 : Math.max(safeProgress, 1);

  // Use a more visible color for the progress bar
  const progressColor = safeProgress > 0 ? 'bg-green-500 dark:bg-green-400' : 'bg-black dark:bg-white';

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

      {/* Always show percentage for debugging */}
      {!showText && safeProgress > 0 && (
        <div className="ml-2 text-xs text-green-500 dark:text-green-400 whitespace-nowrap font-bold">
          {Math.round(safeProgress)}%
        </div>
      )}
    </div>
  );
}
