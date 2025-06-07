import React from 'react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  activityType: string;
  topicId: string;
  topicName: string;
  categoryId: string;
  categoryName: string;
  questionId: number;
  questionText: string;
  createdAt: string;
  displayText: string;
  timeAgo: string;
}

interface RecentActivityWidgetProps {
  activityData: {
    activities: ActivityItem[];
    loading: boolean;
    error: string | null;
  };
}

export default function RecentActivityWidget({ activityData }: RecentActivityWidgetProps) {
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'question_completed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'question_viewed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'question_completed':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'question_viewed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      default:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    }
  };

  return (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Activity</h2>
      </div>

      <div className="space-y-3">
        {activityData.loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 dark:border-purple-500 border-t-transparent mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading activities...</p>
          </div>
                  ) : activityData.error ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-purple-400 dark:text-purple-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">{activityData.error}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unable to load recent activity</p>
            </div>
        ) : activityData.activities.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No activity yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Start learning to track your progress</p>
            <Link 
              href="/topics" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Start Learning
            </Link>
          </div>
        ) : (
          activityData.activities.map((activity) => (
            <div key={activity.id} className="flex items-start p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${getActivityColor(activity.activityType)}`}>
                {getActivityIcon(activity.activityType)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white font-medium group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                  {activity.displayText}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activity.timeAgo}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 