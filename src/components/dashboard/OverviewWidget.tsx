import React from 'react';

interface ProgressData {
  questionsCompleted: number;
  questionsViewed: number;
  totalQuestions: number;
  completionPercentage: number;
  domainsSolved: number;
  totalDomains: number;
}

interface OverviewWidgetProps {
  progressData: ProgressData;
}

export default function OverviewWidget({ progressData }: OverviewWidgetProps) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overview</h2>
      </div>
      
      <div className="flex items-baseline space-x-2 mb-1">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          {progressData.completionPercentage.toFixed(1)}%
        </span>
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
          Questions Completed
        </span>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {progressData.questionsCompleted} of {progressData.totalQuestions} questions completed
      </p>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(0.5, progressData.completionPercentage || 0)}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{progressData.completionPercentage.toFixed(1)}% completed</span>
        <span>{(100 - (progressData.completionPercentage || 0)).toFixed(1)}% remaining</span>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Domains Solved</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {progressData.domainsSolved} of {progressData.totalDomains}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Questions Viewed</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {progressData.questionsViewed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 