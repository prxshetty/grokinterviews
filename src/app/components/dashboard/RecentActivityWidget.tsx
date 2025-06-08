import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, History, Activity, AlertCircle, ArrowRight } from 'lucide-react';

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
        return <CheckCircle2 className="size-4" />;
      case 'question_viewed':
        return <Eye className="size-4" />;
      default:
        return <History className="size-4" />;
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
              <AlertCircle className="size-10 mx-auto text-purple-400 dark:text-purple-500 mb-3" />
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">{activityData.error}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unable to load recent activity</p>
            </div>
        ) : activityData.activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="size-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No activity yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Start learning to track your progress</p>
            <Link 
              href="/topics" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors"
            >
              <ArrowRight className="size-4 mr-1" />
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