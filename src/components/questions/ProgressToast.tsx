import React from 'react';

interface ProgressToastProps {
  scrollProgress: number;
}

export function ProgressToast({ scrollProgress }: ProgressToastProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 space-x-2 mb-1">
        <span>Reading Progress</span>
        <span className="font-mono">{scrollProgress}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700/50 h-1 rounded-full overflow-hidden">
        <div
          className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>
    </div>
  );
} 